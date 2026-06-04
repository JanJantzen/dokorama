// SessionPage – Shell für den Vollbild-Erfassungsscreen
//
// Aufbau:
//   SessionProvider  – Partie-Daten, View-Steuerung
//   └─ GameProvider  – Zustand des aktuellen Spiels
//      └─ Header     – fix oben: Partie-Info + View-Switcher + Trophy + Hamburger
//      └─ ActiveView – TableView | BlockView | EvaluationView
//
// handleConfirm lebt hier weil es beide Contexts braucht (Spiel speichern + Session weiterschalten).

import { useNavigate, useParams } from 'react-router-dom'
import { LayoutGrid, LayoutList, Trophy, Menu, ArrowLeft } from 'lucide-react'
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

// ─── Hamburger-Menü ────────────────────────────────────────────────────────────

function SessionMenu({ onClose, onEndSession }) {
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
        <button onClick={onEndSession} className="w-full px-4 py-3 text-sm text-left text-destructive active:bg-muted">
          Partie beenden
        </button>
      </div>
    </>
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
  const { gameState, resetForNextGame } = useGame()

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

  const dateStr   = formatDate(sessionData?.date)
  const venueName = sessionData?.venues?.name ?? ''

  // Zeigt das Icon der jeweils ANDEREN Erfassungs-Ansicht (Standard-Mobile-Pattern)
  const ViewSwitchIcon = erfassungsView === 'table' ? LayoutList : LayoutGrid

  return (
    // Zentriertes fixed-Layout: respektiert den globalen 500px-Cap aus App.jsx
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
          onEndSession={() => navigate('/')}
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
