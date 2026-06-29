// SessionPage – Shell für den Vollbild-Erfassungsscreen
//
// Aufbau:
//   SessionProvider  – Partie-Daten, View-Steuerung
//   └─ GameProvider  – Zustand des aktuellen Spiels
//      └─ Header     – fix oben: Partie-Info + View-Switcher + Trophy + Hamburger
//      └─ ActiveView – TableView | BlockView | EvaluationView
//      └─ EndSessionScreen  – Overlay z-50: Partie beenden (3 Optionen)
//      └─ ResetGameScreen   – Overlay z-50: Spiel zurücksetzen (2 Optionen)
//
// handleConfirm lebt hier weil es beide Contexts braucht (Spiel speichern + Session weiterschalten).

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Ratio, LayoutList, Trophy, Menu, X } from 'lucide-react'
import { SessionProvider, useSession } from '@/contexts/SessionContext'
import { GameProvider, useGame, buildCalculationInput } from '@/contexts/GameContext'
import { calculateGameResult } from '@/lib/scoreCalculation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import TableView from '@/components/session/TableView'
import BlockView from '@/components/session/BlockView'
import EvaluationView from '@/components/session/EvaluationView'
import Scoreboard from '@/components/session/Scoreboard'
import RoundEndView from '@/components/session/RoundEndView'
import ConsistencyDialog from '@/components/session/ConsistencyDialog'
import { loadRoundProgress } from '@/lib/rounds'
import { saveDraft, clearDraft } from '@/lib/draft'
import { useWakeLock } from '@/hooks/useWakeLock'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

// Plural-Helfer: pl(3, 'Spiel', 'Spiele') → '3 Spiele'
function pl(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`
}

// Gleiche fixed-Zentrierung wie der äußere SessionPage-Container
const overlayStyle = {
  position: 'fixed', top: 0, bottom: 0,
  left: '50%', transform: 'translateX(-50%)',
  width: '100%', maxWidth: '500px', zIndex: 50,
}

// ─── Hamburger-Menü ────────────────────────────────────────────────────────────

function SessionMenu({ onClose, onMainMenu, onScoreboard, onEditGames, onResetGame, onEndSession }) {
  const sectionCls = 'px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70'
  const itemCls    = 'w-full px-4 py-3 text-sm text-left active:bg-muted'
  const greyCls    = 'px-4 py-3 text-sm text-muted-foreground/40'   // noch ohne Funktion
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed top-16 right-4 z-50 bg-card rounded-2xl shadow-xl overflow-hidden min-w-[220px] divide-y divide-border">
        <div>
          <button onClick={onMainMenu} className={itemCls}>zum Hauptmenü</button>
          <div className={greyCls}>Statistiken</div>
        </div>
        <div>
          <div className={sectionCls}>Aktuelles Spiel</div>
          <button onClick={onResetGame} className={itemCls}>Spiel zurücksetzen</button>
        </div>
        <div>
          <div className={sectionCls}>Aktuelle Partie</div>
          <button onClick={onScoreboard} className={itemCls}>Aktueller Spielstand</button>
          <div className={greyCls}>Tischordnung</div>
          <button onClick={onEditGames} className={itemCls}>Vorherige Spiele bearbeiten</button>
          <button onClick={onEndSession} className={itemCls}>Partie beenden</button>
        </div>
      </div>
    </>
  )
}

// ─── Partie beenden – Entscheidungsscreen ──────────────────────────────────────
//
// Drei Optionen:
//   A) Beenden & Speichern  – vollständige Runden bleiben, laufende Runde wird gelöscht
//   B) Alles verwerfen      – gesamte Partie inkl. aller Runden und Spiele aus der DB löschen
//   C) Weiterspielen        – zurück zur Erfassung
//
// Farbe von A: grün wenn keine Spiele verloren gehen (laufende Runde leer), sonst rot.

function EndSessionScreen({ sessionData, roundData, participantCount, onClose }) {
  const navigate = useNavigate()
  const [info,    setInfo]    = useState(null)  // { prevRoundsCount, prevGamesCount, currentPlayed, currentComplete }
  const [working, setWorking] = useState(false)

  // Abgeschlossene Runden + Spiele UND den Stand der aktuellen Runde aus der DB holen
  useEffect(() => {
    async function fetchInfo() {
      // Alle Runden dieser Partie außer der aktuellen
      const { data: prevRounds } = await supabase
        .from('rounds').select('id')
        .eq('session_id', sessionData.id).neq('id', roundData.id)
      const prevRoundIds = prevRounds?.map(r => r.id) ?? []

      let prevGames = 0
      if (prevRoundIds.length > 0) {
        const { count } = await supabase
          .from('games').select('id', { count: 'exact', head: true })
          .in('round_id', prevRoundIds)
        prevGames = count ?? 0
      }

      // Ist die aktuelle Runde komplett? (z.B. beim Beenden direkt aus dem Rundenende)
      const progress = await loadRoundProgress(roundData.id, participantCount)

      setInfo({
        prevRoundsCount: prevRoundIds.length,
        prevGamesCount:  prevGames,
        currentPlayed:   progress.played,
        currentComplete: progress.isComplete,
      })
    }
    fetchInfo()
  }, [sessionData.id, roundData.id, participantCount])

  // Beenden & Speichern: vollständige aktuelle Runde behalten (nur als abgeschlossen
  // markieren), unfertige laufende Runde (+ ihre Spiele via CASCADE) löschen.
  async function handleSave() {
    setWorking(true)
    try {
      if (info.currentComplete) {
        await supabase.from('rounds').update({ status: 'abgeschlossen' }).eq('id', roundData.id)
      } else {
        await supabase.from('rounds').delete().eq('id', roundData.id)
      }
      await supabase.from('sessions').update({ status: 'abgeschlossen' }).eq('id', sessionData.id)
      clearDraft(sessionData.id)
      navigate('/')
    } catch (err) { console.error(err); setWorking(false) }
  }

  // Alles verwerfen: Session löschen → CASCADE löscht alle Runden → alle Spiele
  async function handleAbort() {
    setWorking(true)
    try {
      await supabase.from('sessions').delete().eq('id', sessionData.id)
      clearDraft(sessionData.id)
      navigate('/')
    } catch (err) { console.error(err); setWorking(false) }
  }

  if (!info) {
    return (
      <div className="bg-background flex items-center justify-center" style={overlayStyle}>
        <p className="text-muted-foreground text-sm">Lade…</p>
      </div>
    )
  }

  const { prevRoundsCount, prevGamesCount, currentPlayed, currentComplete } = info

  // Solange die Runde nicht komplett ist, läuft ein noch nicht gespeichertes Spiel –
  // das geht beim Beenden ebenfalls verloren und wird mitgezählt.
  const inProgress  = currentComplete ? 0 : 1
  const currentLost = currentPlayed + inProgress

  // Vollständige aktuelle Runde wird gespeichert; sonst geht die laufende Runde verloren.
  const currentDeleted = !currentComplete
  const saveIsGreen    = !currentDeleted
  const savedRounds    = prevRoundsCount + (currentComplete ? 1 : 0)
  const savedGames     = prevGamesCount  + (currentComplete ? currentPlayed : 0)

  const totalRoundsForAbort = prevRoundsCount + (currentLost > 0 ? 1 : 0)
  const totalGamesForAbort  = prevGamesCount + currentLost

  return (
    <div className="bg-background flex flex-col" style={overlayStyle}>

      <header className="shrink-0 flex items-center px-4 pt-12 pb-3 border-b border-border">
        <button onClick={onClose} className="p-1.5 text-muted-foreground mr-3">
          <X size={20} />
        </button>
        <p className="font-semibold text-sm">Partie beenden</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

        {/* A: Beenden & Speichern – nur anbieten, wenn es überhaupt etwas zu speichern gibt.
            Sonst (keine abgeschlossene Runde) würde Speichern nur eine leere abgeschlossene
            Partie-Hülle hinterlassen → dann bleibt nur Verwerfen oder Weiterspielen. */}
        {savedRounds > 0 && (
        <button
          onClick={handleSave}
          disabled={working}
          className={`w-full text-left rounded-xl border p-4 disabled:opacity-50 ${saveIsGreen ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
        >
          <span className={`block font-semibold text-base mb-2 ${saveIsGreen ? 'text-green-800' : 'text-destructive'}`}>
            Beenden & Speichern
          </span>
          <span className="block text-sm space-y-1">
            {savedRounds > 0 ? (
              <span className="block text-green-700">
                ✓ {pl(savedRounds, 'Runde', 'Runden')} ({pl(savedGames, 'Spiel', 'Spiele')}) werden gespeichert
              </span>
            ) : (
              <span className="block text-muted-foreground">Keine abgeschlossenen Runden vorhanden</span>
            )}
            {currentDeleted && (
              <span className="block text-destructive">
                ✗ Laufende Runde ({pl(currentLost, 'Spiel', 'Spiele')}) wird gelöscht
              </span>
            )}
          </span>
        </button>
        )}

        {/* B: Alles verwerfen – ganze Karte klickbar */}
        <button
          onClick={handleAbort}
          disabled={working}
          className="w-full text-left rounded-xl border border-red-200 bg-red-50 p-4 disabled:opacity-50"
        >
          <span className="block font-semibold text-base text-destructive mb-2">Alles verwerfen</span>
          <span className="block text-sm">
            {totalGamesForAbort > 0 ? (
              <span className="block text-destructive">
                ✗ {pl(totalRoundsForAbort, 'Runde', 'Runden')} und {pl(totalGamesForAbort, 'Spiel', 'Spiele')} werden gelöscht
              </span>
            ) : (
              <span className="block text-muted-foreground">Noch keine Spiele erfasst – Partie wird gelöscht</span>
            )}
          </span>
        </button>

        {/* C: Weiterspielen – ganze Karte klickbar */}
        <button
          onClick={onClose}
          className="w-full text-left rounded-xl border border-green-200 bg-green-50 p-4"
        >
          <span className="block font-semibold text-base text-green-800">Weiterspielen</span>
          <span className="block text-sm text-green-700 mt-1">Zurück zur Erfassung</span>
        </button>

      </div>
    </div>
  )
}

// ─── Spiel zurücksetzen – Bestätigungsscreen ───────────────────────────────────
//
// Löscht nur den In-Memory-Zustand von GameContext – keine Datenbankänderung.
// Das aktuelle Spiel ist noch nicht gespeichert (passiert erst nach Bestätigung im EvaluationView).
// Zeigt eine Liste der TATSÄCHLICH erfassten Eingaben; ist nichts erfasst, ist der
// Zurücksetzen-Button ausgegraut.

// Anzeige-Texte für An-/Absagen und Sonderpunkte (nur für diesen Screen)
const ANN_TEXT = {
  re: 'Re', kontra: 'Kontra',
  keine_90: 'Keine 90', keine_60: 'Keine 60', keine_30: 'Keine 30', schwarz: 'Schwarz',
}
const SP_TEXT = {
  fuchs_gefangen:    'Fuchs gefangen',
  karlchen_gemacht:  'Karlchen gemacht',
  karlchen_gefangen: 'Karlchen gefangen',
  doppelkopf:        'Doppelkopf',
}
const SOLO_TEXT = {
  fleischlos: 'Fleischlos', buben_solo: 'Buben-Solo', damen_solo: 'Damen-Solo',
  farb_solo: 'Farb-Solo', stilles_solo: 'Stilles Solo',
  solo_hochzeit: 'Solo Hochzeit',
}
const FARB_TEXT = { karo: '♦', herz: '♥', pik: '♠', kreuz: '♣' }

// Baut aus dem gameState die Liste der tatsächlich erfassten Eingaben.
// Gibt ein Array von Abschnitten { title, lines[] } zurück – nur nicht-leere Abschnitte.
function describeGameState(gameState, participants) {
  const active = participants.filter(p => !p.isSitting)
  const nameOf = id => active.find(p => p.player_id === id)?.players.name ?? '?'
  const sections = []

  // Parteien (Re/Kontra-Zuordnungen)
  const parteien = active
    .filter(p => gameState.parties[p.player_id] === 're' || gameState.parties[p.player_id] === 'kontra')
    .map(p => `${p.players.name}: ${gameState.parties[p.player_id] === 're' ? 'Re' : 'Kontra'}`)
  if (parteien.length) sections.push({ title: 'Parteien', lines: parteien })

  // Ansagen (Re/Kontra) und Absagen (Keine 90/60/30, Schwarz) getrennt
  const ansagen = [], absagen = []
  for (const p of active) {
    for (const t of gameState.announcements[p.player_id] ?? []) {
      const line = `${p.players.name}: ${ANN_TEXT[t]}`
      if (t === 're' || t === 'kontra') ansagen.push(line)
      else absagen.push(line)
    }
  }
  if (ansagen.length) sections.push({ title: 'Ansagen', lines: ansagen })
  if (absagen.length) sections.push({ title: 'Absagen', lines: absagen })

  // Sonderspiel (höchstens eines) – an der auslösenden Person erkennen
  const soloId     = active.find(p => gameState.specialRoles[p.player_id] === 'solist')?.player_id
  const hochzeitId = active.find(p => gameState.specialRoles[p.player_id] === 'hochzeit')?.player_id
  const armId      = active.find(p => gameState.specialRoles[p.player_id] === 'arm')?.player_id
  if (soloId) {
    const farb = gameState.soloColor ? ` ${FARB_TEXT[gameState.soloColor] ?? ''}` : ''
    sections.push({ title: 'Sonderspiel', lines: [`${SOLO_TEXT[gameState.soloType] ?? 'Solo'}${farb} (${nameOf(soloId)})`] })
  } else if (hochzeitId) {
    const partnerId = active.find(p => gameState.specialRoles[p.player_id] === 'eingeheiratet')?.player_id
    const partner   = partnerId ? ` & ${nameOf(partnerId)}` : ''
    sections.push({ title: 'Sonderspiel', lines: [`Hochzeit (${nameOf(hochzeitId)}${partner})`] })
  } else if (armId) {
    const partnerId = active.find(p => gameState.specialRoles[p.player_id] === 'reich')?.player_id
    const partner   = partnerId ? `, reich: ${nameOf(partnerId)}` : ''
    sections.push({ title: 'Sonderspiel', lines: [`Armut (arm: ${nameOf(armId)}${partner})`] })
  }

  // Sonderpunkte
  const sonderpunkte = gameState.specialPoints.map(sp => {
    const von = sp.loserId ? ` (von ${nameOf(sp.loserId)})` : ''
    return `${nameOf(sp.earnerId)}: ${SP_TEXT[sp.type] ?? sp.type}${von}`
  })
  if (sonderpunkte.length) sections.push({ title: 'Sonderpunkte', lines: sonderpunkte })

  // Augenzahl
  if (gameState.eyesInput !== '' && gameState.eyesFor) {
    sections.push({ title: 'Augen', lines: [`${gameState.eyesInput} für ${gameState.eyesFor === 're' ? 'Re' : 'Kontra'}`] })
  }

  return sections
}

function ResetGameScreen({ gameNumber, gameState, participants, onClose, onConfirm }) {
  const sections   = describeGameState(gameState, participants)
  const hasContent = sections.length > 0

  return (
    <div className="bg-background flex flex-col" style={overlayStyle}>

      <header className="shrink-0 flex items-center px-4 pt-12 pb-3 border-b border-border">
        <button onClick={onClose} className="p-1.5 text-muted-foreground mr-3">
          <X size={20} />
        </button>
        <p className="font-semibold text-sm">Spiel {gameNumber} zurücksetzen</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

        {/* Liste der tatsächlich erfassten Eingaben – oder Hinweis, dass nichts da ist */}
        {hasContent ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800 mb-3">
              Folgende Eingaben werden gelöscht:
            </p>
            <div className="space-y-3">
              {sections.map(sec => (
                <div key={sec.title}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">
                    {sec.title}
                  </p>
                  <ul className="text-sm text-amber-800 space-y-0.5">
                    {sec.lines.map((line, i) => <li key={i}>{line}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">
              Aktuell noch keine Notizen zum Spiel vorhanden.
            </p>
          </div>
        )}

        {/* Aktions-Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={!hasContent}
            className={`w-full h-12 rounded-xl font-semibold text-base ${
              hasContent
                ? 'bg-amber-500 text-white active:bg-amber-600'
                : 'bg-muted text-muted-foreground/50 cursor-not-allowed'
            }`}
          >
            Zurücksetzen
          </button>
          <button
            onClick={onClose}
            className="w-full h-12 rounded-xl font-semibold text-base bg-primary text-primary-foreground active:opacity-90"
          >
            Weiter eingeben
          </button>
        </div>

      </div>
    </div>
  )
}

// ─── Innere Komponente (hat Zugriff auf beide Contexts) ────────────────────────

function SessionPageInner() {
  const navigate = useNavigate()
  const {
    sessionData, roundData, participants, gameNumber,
    erfassungsView, activeView,
    switchErfassungsView, showEvaluation, backToErfassung,
    evalResult, saving, setSaving,
    showMenu, setShowMenu,
    setGameNumber, refreshSeatStatus, advanceToNextRound,
    isWriter, currentWriterName,
    showTakeoverDialog, requestTakeover, dismissTakeover, updateCurrentWriter,
  } = useSession()
  const { gameState, resetForNextGame, resetCurrentGame, setGameStateFromDraft } = useGame()
  const { player } = useAuth()

  // Ref auf isWriter – ermöglicht es, in Supabase-Callbacks den aktuellen Wert zu lesen
  // ohne stale-closure-Probleme (Callbacks schließen über die Ref, nicht über isWriter selbst).
  const isWriterRef = useRef(isWriter)
  useEffect(() => { isWriterRef.current = isWriter })

  // Bildschirm-Sperre unterdrücken solange die Erfassung aktiv ist
  useWakeLock()

  // Broadcast-Kanal für Live-Updates.
  // Alle hören auf 'writer-changed' (Kugelschreiber-Übergabe) und 'game-saved'
  // (Scoreboard im Zuschauer-Modus aktuell halten).
  const broadcastRef = useRef(null)
  useEffect(() => {
    if (!sessionData?.id) return
    const ch = supabase.channel(`session-${sessionData.id}`)
      .on('broadcast', { event: 'writer-changed' }, (payload) => {
        updateCurrentWriter(payload.payload.writerId)
      })
      .on('broadcast', { event: 'game-saved' }, () => {
        setScoreboardRefresh(n => n + 1)
      })
      // Runde ist komplett: Zuschauer:in wird zum Runden-Abschlussscreen mitgenommen.
      // Schreiber:in empfängt diesen Event auch von sich selbst (no-op, State ist schon gesetzt).
      .on('broadcast', { event: 'round-complete' }, () => {
        setShowRoundEnd(true)
      })
      // Nächste Runde gestartet: Zuschauer:in verlässt den Runden-Abschlussscreen.
      .on('broadcast', { event: 'next-round' }, () => {
        setShowRoundEnd(false)
      })
    ch.subscribe()
    broadcastRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [sessionData?.id])

  // Kugelschreiber in die DB eintragen – aber nur wenn noch niemand anderes schreibt.
  // Ohne diese Prüfung würde jeder neu eingeloggte User den bisherigen Schreiber stumm überschreiben.
  // Das .is('current_writer_id', null) auf DB-Ebene schützt zusätzlich gegen Race Conditions.
  useEffect(() => {
    if (!sessionData?.id || !player?.id) return
    if (sessionData.current_writer_id) return
    async function setWriter() {
      await supabase.from('sessions')
        .update({ current_writer_id: player.id })
        .eq('id', sessionData.id)
        .is('current_writer_id', null)
    }
    setWriter()
  }, [sessionData?.id, player?.id])

  // Live-Draft: aktuellen Spielerfassungs-Zustand in die DB schreiben (debounced).
  // Mitschauer:innen lesen diesen Stand über Supabase Realtime.
  // activeView mitschicken damit Zuschauer automatisch auf den Auswertungs-Screen folgen.
  useEffect(() => {
    if (!sessionData?.id || !isWriter) return
    const timer = setTimeout(async () => {
      await supabase.from('sessions')
        .update({ live_draft: { gameNumber, gameState, activeView } })
        .eq('id', sessionData.id)
    }, 500)
    return () => clearTimeout(timer)
  }, [gameState, gameNumber, activeView, sessionData?.id, isWriter])

  // Realtime-Subscription für Zuschauer:innen: live_draft-Änderungen aus der DB empfangen
  // und den lokalen Spielzustand synchronisieren.
  useEffect(() => {
    if (!sessionData?.id || isWriter) return
    const ch = supabase
      .channel(`live-draft-${sessionData.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'sessions',
        filter: `id=eq.${sessionData.id}`,
      }, (payload) => {
        // Sicherheitsventil: falls isWriter in der Zwischenzeit true wurde (Timing-
        // Fenster beim Auth-Laden), den Handler ignorieren. Verhindert dass die
        // Zuschauer-Logik versehentlich auf dem Schreiber-Gerät ausgeführt wird.
        if (isWriterRef.current) return
        const draft = payload.new?.live_draft
        if (!draft) {
          // Spiel wurde bestätigt → GameState leeren, Auswertungs-Screen schließen
          setGameStateFromDraft(null)
          backToErfassung()
          return
        }
        setGameStateFromDraft(draft.gameState)
        if (draft.gameNumber && draft.gameNumber !== gameNumber) {
          setGameNumber(draft.gameNumber)
        }
        // Schreiber wechselt auf Auswertungs-Screen → Zuschauer folgt
        if (draft.activeView === 'evaluate' && activeView !== 'evaluate') {
          const input = buildCalculationInput(draft.gameState, participants)
          showEvaluation(calculateGameResult(input))
        }
        // Schreiber verlässt Auswertungs-Screen → Zuschauer auch zurück
        if (draft.activeView !== 'evaluate' && activeView === 'evaluate') {
          backToErfassung()
        }
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [sessionData?.id, isWriter])

  const [showEndScreen,      setShowEndScreen]      = useState(false)
  const [showResetScreen,    setShowResetScreen]    = useState(false)
  const [showScoreboard,     setShowScoreboard]     = useState(false)
  const [showRoundEnd,       setShowRoundEnd]       = useState(false)
  const [advancing,          setAdvancing]          = useState(false)
  const [scoreboardRefresh,  setScoreboardRefresh]  = useState(0)

  // Laufendes (noch nicht bestätigtes) Spiel lokal sichern – überlebt Navigation
  // (Bearbeiten, Hauptmenü) und Seiten-Reload. Erst beim Bestätigen geht's in die DB.
  useEffect(() => {
    if (sessionData?.id) saveDraft(sessionData.id, gameNumber, gameState)
  }, [gameState, gameNumber, sessionData])

  // Spiel in DB speichern, GameState zurücksetzen, nächstes Spiel starten
  async function handleConfirm() {
    setSaving(true)
    try {
      const input = buildCalculationInput(gameState, participants)

      const { data: game } = await supabase.from('games').insert({
        round_id:  roundData.id,
        number:    gameNumber,
        game_type: input.gameType,
        farbe:     gameState.soloColor ?? null,
        augen_re:  input.reEyes,
      }).select().single()

      await supabase.from('game_results').insert(
        participants.map(p => ({
          game_id:      game.id,
          player_id:    p.player_id,
          partei:       gameState.parties[p.player_id] ?? 'ausgesetzt',
          sonderrolle:  gameState.specialRoles[p.player_id] ?? null,
          zaehlopunkte: evalResult.perPlayer[p.player_id] ?? 0,
        }))
      )

      const announcementsInsert = []
      for (const [playerId, types] of Object.entries(gameState.announcements))
        for (const type of types)
          announcementsInsert.push({ game_id: game.id, player_id: playerId, typ: type })
      if (announcementsInsert.length > 0)
        await supabase.from('announcements').insert(announcementsInsert)

      const spInsert = gameState.specialPoints.map(sp => ({
        game_id: game.id, player_id: sp.earnerId, typ: sp.type, loser_id: sp.loserId ?? null,
      }))
      if (spInsert.length > 0)
        await supabase.from('special_points').insert(spInsert)

      // Runde fertig? (Ziel = Teilnehmerzahl + angesagte Solos) → Übergangs-Screen
      // statt direkt das nächste Spiel. Das Spiel ist gespeichert; wie es weitergeht
      // (nächste Runde / Partie beenden) entscheidet der/die Nutzer:in.
      const { isComplete, announcedSolos } = await loadRoundProgress(roundData.id, participants.length)
      clearDraft(sessionData.id)
      // Live-Draft leeren – das Spiel ist jetzt in der DB, kein halbfertiger Stand mehr
      await supabase.from('sessions').update({ live_draft: null }).eq('id', sessionData.id)
      // Mitschauer:innen informieren dass ein neues Spiel gespeichert wurde;
      // lokal Scoreboard-Refresh auslösen (Zuschauer bekommen es via Broadcast).
      broadcastRef.current?.send({ type: 'broadcast', event: 'game-saved', payload: {} })
      setScoreboardRefresh(n => n + 1)
      if (isComplete) {
        // Auswertungs-Screen verlassen (sonst bliebe er aktiv im Hintergrund) und
        // den Runden-Übergang zeigen. Das Spiel ist bereits gespeichert.
        // round-complete bringt Zuschauer:innen zum selben Zwischenstand-Screen.
        broadcastRef.current?.send({ type: 'broadcast', event: 'round-complete', payload: {} })
        backToErfassung()
        setShowRoundEnd(true)
        return
      }

      // Geber fürs nächste Spiel: angesagte Solos der Runde halten die Rotation an.
      // announcedSolos zählt alle bisher gespeicherten Solos inkl. des gerade gespeicherten.
      const nextNum  = gameNumber + 1
      const rawParts = participants.map(p => ({
        player_id: p.player_id, players: p.players,
        seat_position: p.seat_position, round_id: p.round_id, id: p.id,
      }))
      const newParts = refreshSeatStatus(nextNum, rawParts, announcedSolos)
      setGameNumber(nextNum)
      resetForNextGame(newParts)
      backToErfassung()
    } catch (err) {
      console.error('Fehler beim Speichern:', err)
    } finally {
      setSaving(false)
    }
  }

  // Nächste Runde: DB-Übergang (Runde abschließen + neue anlegen), GameContext
  // zurücksetzen, zurück zur Erfassung.
  async function handleNextRound() {
    setAdvancing(true)
    try {
      const seated = await advanceToNextRound()
      clearDraft(sessionData.id)
      resetForNextGame(seated)
      // Zuschauer:innen vom Runden-Abschlussscreen wegführen
      broadcastRef.current?.send({ type: 'broadcast', event: 'next-round', payload: {} })
      setShowRoundEnd(false)
      backToErfassung()
    } catch (err) {
      console.error('Fehler beim Rundenwechsel:', err)
    } finally {
      setAdvancing(false)
    }
  }

  // Partie beenden aus dem Rundenende heraus. RoundEndView bleibt darunter offen,
  // damit "Zurück" im Beenden-Screen wieder zum Rundenende führt (nicht zur Erfassung).
  function handleEndFromRound() {
    setShowEndScreen(true)
  }

  // GameContext-Zustand auf Initialstand zurücksetzen (keine DB-Änderung)
  function handleResetConfirm() {
    clearDraft(sessionData.id)
    resetCurrentGame()
    if (activeView === 'evaluate') backToErfassung()
    setShowResetScreen(false)
  }

  // Kugelschreiber übernehmen: current_writer_id in DB setzen, lokal aktualisieren,
  // alten Schreiber per Broadcast informieren.
  async function handleTakeoverConfirm() {
    if (!player?.id) return
    await supabase.from('sessions').update({ current_writer_id: player.id }).eq('id', sessionData.id)
    updateCurrentWriter(player.id)
    broadcastRef.current?.send({ type: 'broadcast', event: 'writer-changed', payload: { writerId: player.id } })
    dismissTakeover()
  }

  const dateStr   = formatDate(sessionData?.date)
  const venueName = sessionData?.venues?.name ?? ''

  // Zeigt das Icon der jeweils ANDEREN Erfassungs-Ansicht (Standard-Mobile-Pattern)
  const ViewSwitchIcon = erfassungsView === 'table' ? LayoutList : Ratio

  return (
    <div
      className="flex flex-col select-none"
      style={{ position: 'fixed', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '500px' }}
    >

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-4 pt-12 pb-3 bg-background border-b border-border z-10">

        <button onClick={() => navigate('/')} className="p-1.5 text-muted-foreground w-10" title="Erfassung schließen">
          <X size={20} />
        </button>

        <div className="text-center flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground leading-tight">
            {[dateStr, venueName].filter(Boolean).join(' · ')}
          </p>
          <p className="text-sm font-semibold leading-tight">
            Spiel {gameNumber} · Runde {roundData?.number}
          </p>
        </div>

        {/* Rechts: View-Switcher + Trophy + Hamburger */}
        <div className="flex items-center gap-0.5 justify-end">
          <button
            onClick={activeView !== 'evaluate' ? switchErfassungsView : undefined}
            className={`p-1.5 transition-opacity ${activeView === 'evaluate' ? 'opacity-20' : 'text-muted-foreground'}`}
            title="Ansicht wechseln"
          >
            <ViewSwitchIcon size={18} />
          </button>
          <button
            className="p-1.5 text-muted-foreground"
            title="Spielstand"
            onClick={() => setShowScoreboard(true)}
          >
            <Trophy size={18} />
          </button>
          <button className="p-1.5 text-muted-foreground" onClick={() => setShowMenu(true)}>
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* ─── Zuschauer-Banner ────────────────────────────────────────────── */}
      {!isWriter && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-amber-800">
            {currentWriterName ? `${currentWriterName} schreibt – du schaust zu` : 'Zuschauer-Modus'}
          </span>
          <button
            onClick={requestTakeover}
            className="text-xs font-medium text-amber-800 border border-amber-400 rounded-lg px-2.5 py-1 active:bg-amber-100 shrink-0 ml-3"
          >
            Übernehmen
          </button>
        </div>
      )}

      {/* ─── Aktive View ─────────────────────────────────────────────────── */}
      {activeView === 'table'    && <TableView />}
      {activeView === 'block'    && <BlockView />}
      {activeView === 'evaluate' && (
        <EvaluationView
          result={evalResult}
          activePlayers={participants.filter(p => !p.isSitting)}
          gameState={gameState}
          gameNumber={gameNumber}
          roundNumber={roundData?.number}
          onConfirm={handleConfirm}
          onBack={backToErfassung}
          saving={saving}
        />
      )}

      {/* ─── Spielstand-Overlay (Trophy) ─────────────────────────────────── */}
      {showScoreboard && (
        <Scoreboard
          sessionId={sessionData?.id}
          roundNumber={roundData?.number}
          gameNumber={gameNumber}
          date={dateStr}
          venue={venueName}
          onClose={() => setShowScoreboard(false)}
          refreshKey={scoreboardRefresh}
        />
      )}

      {/* ─── Runden-Übergang ─────────────────────────────────────────────── */}
      {showRoundEnd && (
        <RoundEndView
          sessionId={sessionData?.id}
          roundNumber={roundData?.number}
          onNextRound={handleNextRound}
          onEndSession={handleEndFromRound}
          busy={advancing}
          isWriter={isWriter}
        />
      )}

      {/* ─── Hamburger-Menü ──────────────────────────────────────────────── */}
      {showMenu && (
        <SessionMenu
          onClose={() => setShowMenu(false)}
          onMainMenu={() => { setShowMenu(false); navigate('/') }}
          onScoreboard={() => { setShowMenu(false); setShowScoreboard(true) }}
          onEditGames={() => { setShowMenu(false); navigate(`/partie/${sessionData.id}/details`) }}
          onResetGame={() => { setShowMenu(false); setShowResetScreen(true) }}
          onEndSession={() => { setShowMenu(false); setShowEndScreen(true) }}
        />
      )}

      {/* ─── Overlays ────────────────────────────────────────────────────── */}
      {showEndScreen && (
        <EndSessionScreen
          sessionData={sessionData}
          roundData={roundData}
          participantCount={participants.length}
          onClose={() => setShowEndScreen(false)}
        />
      )}

      {showResetScreen && (
        <ResetGameScreen
          gameNumber={gameNumber}
          gameState={gameState}
          participants={participants}
          onClose={() => setShowResetScreen(false)}
          onConfirm={handleResetConfirm}
        />
      )}

      {/* Zentraler Auflösungs-Dialog der Konsistenz-Engine (Tisch- wie Block-Ansicht) */}
      <ConsistencyDialog />

      {/* ─── Kugelschreiber-Übergabe-Dialog ──────────────────────────────── */}
      {showTakeoverDialog && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6"
          onClick={dismissTakeover}
        >
          <div className="bg-card rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            {!player ? (
              // Nicht eingeloggt → Login anbieten
              <>
                <p className="font-semibold text-base">Einloggen zum Schreiben</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Um das Schreiben zu übernehmen, musst du eingeloggt sein.
                </p>
                <div className="flex gap-2">
                  <button onClick={dismissTakeover}
                    className="flex-1 h-10 rounded-xl border border-border text-sm font-medium">
                    Abbrechen
                  </button>
                  <button onClick={() => { dismissTakeover(); navigate('/login') }}
                    className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
                    Einloggen
                  </button>
                </div>
              </>
            ) : (
              // Eingeloggt → Übernahme bestätigen
              <>
                <p className="font-semibold text-base">Kugelschreiber übernehmen?</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  {currentWriterName
                    ? `${currentWriterName} schreibt gerade. Möchtest du übernehmen?`
                    : 'Möchtest du das Schreiben übernehmen?'}
                </p>
                <div className="flex gap-2">
                  <button onClick={dismissTakeover}
                    className="flex-1 h-10 rounded-xl border border-border text-sm font-medium">
                    Abbrechen
                  </button>
                  <button onClick={handleTakeoverConfirm}
                    className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
                    Übernehmen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Ladebrücke – wartet auf Teilnehmer bevor GameProvider gemountet wird ─────

function SessionPageContent() {
  const navigate = useNavigate()
  const { loading, participants, noActiveRound, initialGameState } = useSession()

  // Kein Login-Redirect mehr – Zuschauer:innen können die Partie ohne Login beobachten.
  // Die Unterscheidung Schreiber vs. Zuschauer läuft über isWriter in SessionContext.
  if (loading) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Lade…</div>
  }
  if (noActiveRound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-screen px-6 text-center">
        <p className="text-muted-foreground text-sm">Diese Partie hat keine laufende Runde und kann nicht fortgesetzt werden.</p>
        <button onClick={() => navigate('/')} className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-semibold">
          Zur Startseite
        </button>
      </div>
    )
  }
  return (
    <GameProvider initialParticipants={participants} initialGameState={initialGameState}>
      <SessionPageInner />
    </GameProvider>
  )
}

// ─── Einstiegspunkt ───────────────────────────────────────────────────────────

export default function SessionPage() {
  const { id: sessionId } = useParams()
  return (
    <SessionProvider sessionId={sessionId}>
      <SessionPageContent />
    </SessionProvider>
  )
}
