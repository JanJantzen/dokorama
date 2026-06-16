// SessionDetailsPage – Detail-Ansicht einer Partie (hinter "Details" im Endstand)
//
// Platzhalter: hier kommen später die Rundenübersicht und "Stats of the Party" rein.
// Zurück führt zum Endstand-Screen.

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatSessionDate } from '@/lib/sessions'

export default function SessionDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.from('sessions').select('id, date, venues(name)').eq('id', id).single()
      .then(({ data }) => setSession(data))
  }, [id])

  const venueName = session?.venues?.name
  const title = session
    ? `${formatSessionDate(session.date)}${venueName ? ` · ${venueName}` : ''}`
    : ''

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="text-muted-foreground p-1">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <p className="font-semibold text-sm">Details</p>
          <p className="text-xs text-muted-foreground truncate">{title}</p>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-4">
        Details folgen (Rundenübersicht, Statistiken der Partie)
      </div>
    </div>
  )
}
