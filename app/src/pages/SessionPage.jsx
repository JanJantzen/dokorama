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

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Ratio, LayoutList, Trophy, Menu, ArrowLeft, X } from 'lucide-react'
import { SessionProvider, useSession } from '@/contexts/SessionContext'
import { GameProvider, useGame, buildCalculationInput } from '@/contexts/GameContext'
import { supabase } from '@/lib/supabase'
import TableView from '@/components/session/TableView'
import BlockView from '@/components/session/BlockView'
import EvaluationView from '@/components/session/EvaluationView'

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

function SessionMenu({ onClose, onEndSession, onResetGame }) {
  const greyItems = ['Hauptmenü', 'Tischordnung', 'Statistiken']
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed top-16 right-4 z-50 bg-card rounded-2xl shadow-xl overflow-hidden min-w-[200px]">
        {greyItems.map((label, i) => (
          <div key={label} className={`px-4 py-3 text-sm text-muted-foreground/40 ${i < greyItems.length - 1 ? 'border-b border-border' : ''}`}>
            {label}
          </div>
        ))}
        <div className="border-t border-border" />
        <button onClick={onResetGame} className="w-full px-4 py-3 text-sm text-left text-amber-600 active:bg-muted border-b border-border">
          Spiel zurücksetzen
        </button>
        <button onClick={onEndSession} className="w-full px-4 py-3 text-sm text-left text-destructive active:bg-muted">
          Partie beenden
        </button>
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

function EndSessionScreen({ sessionData, roundData, gameNumber, onClose }) {
  const navigate = useNavigate()
  const [counts,  setCounts]  = useState(null)  // { prevRoundsCount, prevGamesCount }
  const [working, setWorking] = useState(false)

  // Zähle abgeschlossene Runden und ihre Spiele aus der DB
  useEffect(() => {
    async function fetchCounts() {
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
      setCounts({ prevRoundsCount: prevRoundIds.length, prevGamesCount: prevGames })
    }
    fetchCounts()
  }, [sessionData.id, roundData.id])

  // Spiele die bereits in der laufenden Runde gespeichert wurden (aktuelles Spiel noch nicht gespeichert)
  const currentRoundSaved = gameNumber - 1
  const saveIsGreen = currentRoundSaved === 0

  // Beenden & Speichern: laufende Runde (+ ihre Spiele via CASCADE) löschen, Session abschließen
  async function handleSave() {
    setWorking(true)
    try {
      await supabase.from('rounds').delete().eq('id', roundData.id)
      await supabase.from('sessions').update({ status: 'abgeschlossen' }).eq('id', sessionData.id)
      navigate('/')
    } catch (err) { console.error(err); setWorking(false) }
  }

  // Alles verwerfen: Session löschen → CASCADE löscht alle Runden → alle Spiele
  async function handleAbort() {
    setWorking(true)
    try {
      await supabase.from('sessions').delete().eq('id', sessionData.id)
      navigate('/')
    } catch (err) { console.error(err); setWorking(false) }
  }

  if (!counts) {
    return (
      <div className="bg-background flex items-center justify-center" style={overlayStyle}>
        <p className="text-muted-foreground text-sm">Lade…</p>
      </div>
    )
  }

  const totalRoundsForAbort = counts.prevRoundsCount + (currentRoundSaved > 0 ? 1 : 0)
  const totalGamesForAbort  = counts.prevGamesCount + currentRoundSaved

  return (
    <div className="bg-background flex flex-col" style={overlayStyle}>

      <header className="shrink-0 flex items-center px-4 pt-12 pb-3 border-b border-border">
        <button onClick={onClose} className="p-1.5 text-muted-foreground mr-3">
          <X size={20} />
        </button>
        <p className="font-semibold text-sm">Partie beenden</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

        {/* A: Beenden & Speichern */}
        <div className={`rounded-xl border p-4 ${saveIsGreen ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <button
            onClick={handleSave}
            disabled={working}
            className={`w-full text-left font-semibold text-base mb-2 disabled:opacity-50 ${saveIsGreen ? 'text-green-800' : 'text-destructive'}`}
          >
            Beenden & Speichern
          </button>
          <ul className="text-sm space-y-1">
            {counts.prevRoundsCount > 0 ? (
              <li className="text-green-700">
                ✓ {pl(counts.prevRoundsCount, 'Runde', 'Runden')} ({pl(counts.prevGamesCount, 'Spiel', 'Spiele')}) werden gespeichert
              </li>
            ) : (
              <li className="text-muted-foreground">Keine abgeschlossenen Runden vorhanden</li>
            )}
            {currentRoundSaved > 0 && (
              <li className="text-destructive">
                ✗ Laufende Runde ({pl(currentRoundSaved, 'Spiel', 'Spiele')}) wird gelöscht
              </li>
            )}
          </ul>
        </div>

        {/* B: Alles verwerfen */}
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <button
            onClick={handleAbort}
            disabled={working}
            className="w-full text-left font-semibold text-base text-destructive mb-2 disabled:opacity-50"
          >
            Alles verwerfen
          </button>
          <ul className="text-sm space-y-1">
            {totalGamesForAbort > 0 ? (
              <li className="text-destructive">
                ✗ {pl(totalRoundsForAbort, 'Runde', 'Runden')} und {pl(totalGamesForAbort, 'Spiel', 'Spiele')} werden gelöscht
              </li>
            ) : (
              <li className="text-muted-foreground">Noch keine Spiele erfasst – Partie wird gelöscht</li>
            )}
          </ul>
        </div>

        {/* C: Weiterspielen */}
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <button onClick={onClose} className="w-full text-left font-semibold text-base text-green-800">
            Weiterspielen
          </button>
          <p className="text-sm text-green-700 mt-1">Zurück zur Erfassung</p>
        </div>

      </div>
    </div>
  )
}

// ─── Spiel zurücksetzen – Bestätigungsscreen ───────────────────────────────────
//
// Löscht nur den In-Memory-Zustand von GameContext – keine Datenbankänderung.
// Das aktuelle Spiel ist noch nicht gespeichert (passiert erst nach Bestätigung im EvaluationView).

function ResetGameScreen({ gameNumber, onClose, onConfirm }) {
  return (
    <div className="bg-background flex flex-col" style={overlayStyle}>

      <header className="shrink-0 flex items-center px-4 pt-12 pb-3 border-b border-border">
        <button onClick={onClose} className="p-1.5 text-muted-foreground mr-3">
          <X size={20} />
        </button>
        <p className="font-semibold text-sm">Spiel {gameNumber} zurücksetzen</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

        {/* A: Zurücksetzen */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <button onClick={onConfirm} className="w-full text-left font-semibold text-base text-amber-700 mb-2">
            Zurücksetzen
          </button>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>✗ Partei-Zuordnungen (Re / Kontra)</li>
            <li>✗ Ansagen und Absagen</li>
            <li>✗ Sonderspiele (Solo, Hochzeit, Armut)</li>
            <li>✗ Sonderpunkte</li>
            <li>✗ Augenzahl</li>
          </ul>
        </div>

        {/* B: Weiter eingeben */}
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <button onClick={onClose} className="w-full text-left font-semibold text-base text-green-800">
            Weiter eingeben
          </button>
          <p className="text-sm text-green-700 mt-1">Zurück zur Erfassung</p>
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
    setGameNumber, refreshSeatStatus,
  } = useSession()
  const { gameState, resetForNextGame, resetCurrentGame } = useGame()

  const [showEndScreen,   setShowEndScreen]   = useState(false)
  const [showResetScreen, setShowResetScreen] = useState(false)

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

      const nextNum  = gameNumber + 1
      const rawParts = participants.map(p => ({
        player_id: p.player_id, players: p.players,
        seat_position: p.seat_position, round_id: p.round_id, id: p.id,
      }))
      const newParts = refreshSeatStatus(nextNum, rawParts)
      setGameNumber(nextNum)
      resetForNextGame(newParts)
      backToErfassung()
    } catch (err) {
      console.error('Fehler beim Speichern:', err)
    } finally {
      setSaving(false)
    }
  }

  // GameContext-Zustand auf Initialstand zurücksetzen (keine DB-Änderung)
  function handleResetConfirm() {
    resetCurrentGame()
    if (activeView === 'evaluate') backToErfassung()
    setShowResetScreen(false)
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

        <button onClick={() => navigate(-1)} className="p-1.5 text-muted-foreground w-10">
          <ArrowLeft size={20} />
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
          <button className="p-1.5 text-muted-foreground" title="Spielstand kommt später">
            <Trophy size={18} />
          </button>
          <button className="p-1.5 text-muted-foreground" onClick={() => setShowMenu(true)}>
            <Menu size={18} />
          </button>
        </div>
      </header>

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

      {/* ─── Hamburger-Menü ──────────────────────────────────────────────── */}
      {showMenu && (
        <SessionMenu
          onClose={() => setShowMenu(false)}
          onEndSession={() => { setShowMenu(false); setShowEndScreen(true) }}
          onResetGame={() => { setShowMenu(false); setShowResetScreen(true) }}
        />
      )}

      {/* ─── Overlays ────────────────────────────────────────────────────── */}
      {showEndScreen && (
        <EndSessionScreen
          sessionData={sessionData}
          roundData={roundData}
          gameNumber={gameNumber}
          onClose={() => setShowEndScreen(false)}
        />
      )}

      {showResetScreen && (
        <ResetGameScreen
          gameNumber={gameNumber}
          onClose={() => setShowResetScreen(false)}
          onConfirm={handleResetConfirm}
        />
      )}

    </div>
  )
}

// ─── Ladebrücke – wartet auf Teilnehmer bevor GameProvider gemountet wird ─────

function SessionPageContent() {
  const { loading, participants } = useSession()
  if (loading) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Lade…</div>
  }
  return (
    <GameProvider initialParticipants={participants}>
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
