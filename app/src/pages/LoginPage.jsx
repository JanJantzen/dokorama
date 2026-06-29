// LoginPage – E-Mail + Passwort Eingabe
//
// Einfaches Formular: E-Mail, Passwort, Login-Button.
// Nach erfolgreichem Login wird zur vorherigen Seite navigiert (oder zur Startseite).
// Fehlermeldungen werden auf Deutsch angezeigt.

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Übersetzt Supabase-Fehlermeldungen ins Deutsche
function translateError(message) {
  if (!message) return 'Unbekannter Fehler.'
  if (message.includes('Invalid login credentials')) return 'E-Mail oder Passwort falsch.'
  if (message.includes('Email not confirmed'))       return 'E-Mail-Adresse noch nicht bestätigt.'
  if (message.includes('Too many requests'))         return 'Zu viele Versuche – bitte kurz warten.'
  return 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.'
}

export default function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { signIn } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  // Nach dem Login: zurück zur Seite von der wir gekommen sind, oder zur Startseite
  // Ziel nach Login: die Seite von der wir kamen, oder die Startseite
  const from    = location.state?.from ?? '/'
  // forced = true wenn der Login erzwungen wurde (z.B. Klick auf Partie ohne eingeloggt zu sein)
  const forced  = location.state?.forced ?? false

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const err = await signIn(email.trim(), password)
    if (err) {
      setError(translateError(err.message))
      setLoading(false)
    } else {
      // pendingTakeover weitergeben (falls der Login durch einen Übernahme-Request ausgelöst wurde)
      const pendingTakeover = location.state?.pendingTakeover
      navigate(from, { replace: true, state: pendingTakeover ? { pendingTakeover } : undefined })
    }
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* Kopfzeile */}
      <header className="px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dokorama</h1>
        <p className="text-muted-foreground text-sm mt-1">Einloggen</p>
        {/* Hinweis wenn der Login durch eine Schreib-Aktion erzwungen wurde */}
        {forced && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
            Für diese Aktion musst Du eingeloggt sein.
          </p>
        )}
      </header>

      {/* Formular */}
      <div className="px-4 flex flex-col gap-4 max-w-sm w-full">

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">E-Mail</label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@beispiel.de"
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">Passwort</label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {/* Fehlermeldung */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" disabled={loading || !email || !password} className="h-12 text-base">
            {loading ? 'Einloggen…' : 'Einloggen'}
          </Button>

        </form>

        {/* Abbrechen – zurück ohne Login */}
        <button
          onClick={() => navigate(from === '/' ? '/' : -1)}
          className="text-sm text-muted-foreground text-center py-2"
        >
          Zurück ohne einzuloggen
        </button>

      </div>
    </div>
  )
}
