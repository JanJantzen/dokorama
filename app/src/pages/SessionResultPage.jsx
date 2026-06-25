// SessionResultPage – Spielstand einer Partie (laufend oder beendet)
//
// Für LAUFENDE Partien: zeigt den aktuellen Spielstand + "Partie weiterschreiben"-Button
//   → Login erforderlich um weiterzuschreiben; ohne Login nur lesen
// Für BEENDETE Partien: zeigt den Endstand + "Details"- und "Partie löschen"-Button
//   → Löschen ebenfalls Login-geschützt

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Trash2, PenLine } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import StandingsList from '@/components/session/StandingsList'
import { loadStandings } from '@/lib/standings'
import { deleteSession, formatSessionDate } from '@/lib/sessions'

export default function SessionResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [session, setSession] = useState(null)
  const [standings, setStandings] = useState(null)
  const [error, setError] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    // Status muss mitgeladen werden um laufende von beendeten Partien zu unterscheiden
    supabase.from('sessions').select('id, date, status, venues(name)').eq('id', id).single()
      .then(({ data }) => setSession(data))
    loadStandings(id).then(setStandings).catch(() => setError(true))
  }, [id])

  async function handleDelete() {
    setWorking(true)
    try {
      await deleteSession(id)
      navigate('/')
    } catch (err) {
      console.error('Fehler beim Löschen:', err)
      setWorking(false)
    }
  }

  // "Partie weiterschreiben" – führt zum Erfassungsscreen, Login erforderlich
  function handleContinue() {
    if (user) {
      navigate(`/partie/${id}`)
    } else {
      navigate('/login', { state: { from: `/partie/${id}`, forced: true } })
    }
  }

  // "Partie löschen" – Login erforderlich
  function handleDeleteClick() {
    if (user) {
      setConfirmDelete(true)
    } else {
      navigate('/login', { state: { from: `/partie/${id}/ergebnis`, forced: true } })
    }
  }

  const isRunning  = session?.status === 'laufend'
  const venueName  = session?.venues?.name
  const title      = session
    ? `${formatSessionDate(session.date)}${venueName ? ` · ${venueName}` : ''}`
    : ''
  const pageTitle  = isRunning ? 'Aktueller Stand' : 'Endstand'

  return (
    <div className="flex flex-col min-h-screen">

      {/* Kopf */}
      <header className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-border">
        <button onClick={() => navigate('/')} className="text-muted-foreground p-1">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <p className="font-semibold text-sm">{pageTitle}</p>
          <p className="text-xs text-muted-foreground truncate">{title}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4">

        <StandingsList standings={standings} error={error} />

        {/* Laufende Partie: "Weiterschreiben"-Button prominent oben */}
        {isRunning && (
          <button
            onClick={handleContinue}
            className="w-full flex items-center justify-between rounded-xl border border-primary bg-primary/5 p-4 active:bg-primary/10"
          >
            <div className="flex items-center gap-2">
              <PenLine size={18} className="text-primary" />
              <span className="text-sm font-semibold text-primary">Partie weiterschreiben</span>
            </div>
            <ChevronRight size={18} className="text-primary" />
          </button>
        )}

        {/* Details (Spielliste) – für laufende und beendete Partien */}
        <button
          onClick={() => navigate(`/partie/${id}/details`)}
          className="w-full flex items-center justify-between rounded-xl border border-border bg-card p-4 active:bg-muted"
        >
          <span className="text-sm font-medium">Details</span>
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>

      </div>

      {/* Löschen – nur bei beendeten Partien sichtbar */}
      {!isRunning && session && (
        <div className="px-4 pt-3 pb-5 border-t border-border">
          <button
            onClick={handleDeleteClick}
            className="w-full h-12 rounded-xl border border-red-200 text-destructive font-semibold flex items-center justify-center gap-2 active:bg-red-50"
          >
            <Trash2 size={18} /> Partie löschen
          </button>
        </div>
      )}

      {/* Lösch-Bestätigung */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6"
          onClick={() => !working && setConfirmDelete(false)}
        >
          <div className="bg-card rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <p className="font-semibold text-base">Partie löschen?</p>
            <p className="text-sm text-muted-foreground mt-1">
              {title} – alle Runden und Spiele werden unwiderruflich gelöscht.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={working}
                className="flex-1 h-11 rounded-xl border border-border font-semibold disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={working}
                className="flex-1 h-11 rounded-xl bg-destructive text-white font-semibold disabled:opacity-50"
              >
                {working ? 'Lösche…' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
