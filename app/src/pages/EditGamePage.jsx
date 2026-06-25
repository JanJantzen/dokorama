// EditGamePage – ein gespeichertes Spiel bearbeiten
//
// Lädt das Spiel (loadGameForEdit), mountet die normale Erfassungs-UI (Tisch +
// Auswerten + Konsistenz-Engine) vorbefüllt und speichert beim Bestätigen via
// updateGame (statt ein neues Spiel anzulegen). View-unabhängig gebaut: TableView
// braucht aus dem Session-Context nur participants + showEvaluation – die liefert
// hier ein schlanker eigener Context-Wert (Block-Ansicht später identisch nutzbar).
//
// Phase A: nur app-erfasste Spiele (exakte Augen). Historische Range-Importe sind
// nicht editierbar.

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { GameProvider, useGame } from '@/contexts/GameContext'
import { SessionContext } from '@/contexts/SessionContext'
import { useAuth } from '@/contexts/AuthContext'
import TableView from '@/components/session/TableView'
import EvaluationView from '@/components/session/EvaluationView'
import ConsistencyDialog from '@/components/session/ConsistencyDialog'
import { loadGameForEdit, updateGame } from '@/lib/games'

const columnStyle = {
  position: 'fixed', top: 0, bottom: 0,
  left: '50%', transform: 'translateX(-50%)',
  width: '100%', maxWidth: '500px',
}

// Läuft INNERHALB des GameProvider (braucht useGame fürs Speichern).
function EditGameShell({ gameId, loaded }) {
  const navigate = useNavigate()
  const { gameState } = useGame()
  const [activeView, setActiveView] = useState('table') // 'table' | 'evaluate'
  const [evalResult, setEvalResult] = useState(null)
  const [saving, setSaving] = useState(false)

  // TableView ruft showEvaluation(result) beim Tippen auf "Auswerten" → Eval-Screen.
  const showEvaluation = useCallback((result) => {
    setEvalResult(result)
    setActiveView('evaluate')
  }, [])

  // Schlanker Session-Context: TableView liest nur participants + showEvaluation.
  const sessionValue = useMemo(
    () => ({ participants: loaded.participants, showEvaluation }),
    [loaded.participants, showEvaluation],
  )

  async function handleSave() {
    setSaving(true)
    try {
      await updateGame(gameId, { gameState, participants: loaded.participants, perPlayer: evalResult.perPlayer })
      navigate(-1) // zurück zur Details-Ansicht
    } catch (err) {
      console.error('Speichern fehlgeschlagen:', err)
      setSaving(false)
    }
  }

  return (
    <SessionContext.Provider value={sessionValue}>
      <div className="flex flex-col select-none" style={columnStyle}>
        <header className="shrink-0 flex items-center gap-3 px-4 pt-12 pb-3 bg-background border-b border-border z-10">
          <button onClick={() => navigate(-1)} className="p-1.5 text-muted-foreground">
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Spiel bearbeiten</p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Runde {loaded.roundNumber} · Spiel {loaded.gameNumber}
            </p>
          </div>
        </header>

        {activeView === 'table' && <TableView />}
        {activeView === 'evaluate' && (
          <EvaluationView
            result={evalResult}
            activePlayers={loaded.participants.filter(p => !p.isSitting)}
            gameState={gameState}
            gameNumber={loaded.gameNumber}
            roundNumber={loaded.roundNumber}
            onConfirm={handleSave}
            onBack={() => setActiveView('table')}
            saving={saving}
            confirmLabel="Speichern"
          />
        )}

        <ConsistencyDialog />
      </div>
    </SessionContext.Provider>
  )
}

function Fallback({ text, onBack }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 h-screen px-6 text-center">
      <p className="text-muted-foreground text-sm">{text}</p>
      <button onClick={onBack} className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-semibold">
        Zurück
      </button>
    </div>
  )
}

export default function EditGamePage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const [loaded, setLoaded] = useState(null) // null = lädt noch
  const [error, setError] = useState(false)

  // Nicht eingeloggt → Login-Seite, mit aktueller URL als Rücksprung-Ziel
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: location.pathname, forced: true }, replace: true })
    }
  }, [authLoading, user, navigate, location.pathname])

  useEffect(() => {
    loadGameForEdit(gameId).then(setLoaded).catch(() => setError(true))
  }, [gameId])

  if (error) return <Fallback text="Spiel konnte nicht geladen werden." onBack={() => navigate(-1)} />
  if (!loaded) return <div className="flex items-center justify-center h-screen text-muted-foreground">Lade…</div>
  if (loaded.isHistorical) {
    return <Fallback text="Historische Partie (importiert) – hier nicht editierbar. Korrekturen über Re-Import." onBack={() => navigate(-1)} />
  }

  return (
    <GameProvider initialParticipants={loaded.participants} initialGameState={loaded.gameState}>
      <EditGameShell gameId={gameId} loaded={loaded} />
    </GameProvider>
  )
}
