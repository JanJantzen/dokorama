// AuthContext – wer ist gerade eingeloggt?
//
// Stellt der gesamten App zwei Informationen bereit:
//   • user   – das Supabase-Auth-Objekt (hat .id und .email), oder null wenn niemand eingeloggt
//   • player – die passende Zeile aus der players-Tabelle, oder null
//   • loading – true solange der erste Login-Status-Check beim App-Start noch läuft
//
// Außerdem: signIn() und signOut() als Hilfsfunktionen.
//
// Wichtige Design-Entscheidung:
//   Kein async/await INNERHALB von onAuthStateChange – Supabase empfiehlt das ausdrücklich nicht,
//   weil der Callback mehrfach feuern kann (INITIAL_SESSION, TOKEN_REFRESHED, SIGNED_OUT ...) und
//   ein await darin zu Race Conditions und Endlos-Lade-Zuständen führt.
//
//   Stattdessen zwei getrennte Effekte:
//   1. onAuthStateChange → setzt nur user (synchron, kein await)
//   2. useEffect([user]) → lädt player-Daten wenn user sich ändert (sauber, sequenziell)
//
//   user startet als `undefined` (= "noch nicht geprüft") statt null (= "ausgeloggt").
//   Erst wenn onAuthStateChange das erste Mal feuert, wird user zu null oder einem Objekt.
//   loading ist genau dann true wenn user noch undefined ist.

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = App-Start, Status noch unbekannt; null = ausgeloggt; Objekt = eingeloggt
  const [user, setUser] = useState(undefined)
  // Passende players-Zeile zum eingeloggten Auth-Account (oder null)
  const [player, setPlayer] = useState(null)

  // Effekt 1: onAuthStateChange setzt user – NUR synchron, kein await hier drin.
  // Der Callback feuert beim Start (INITIAL_SESSION) und bei jedem Login/Logout.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Effekt 2: Sobald user bekannt ist (nicht mehr undefined), player-Daten laden.
  // Läuft bei jedem User-Wechsel (Login, Logout, Token-Refresh mit neuem User-Objekt).
  useEffect(() => {
    if (user === undefined) return  // noch nicht initialisiert, abwarten

    if (!user) {
      setPlayer(null)
      return
    }

    // Passende players-Zeile über auth_user_id suchen (Migration 005)
    supabase
      .from('players')
      .select('id, name, avatar_url')
      .eq('auth_user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setPlayer(data ?? null))
      .catch(() => setPlayer(null))
  }, [user])

  // loading ist abgeleitet: true solange user noch undefined (= erster Start-Check läuft).
  const loading = user === undefined

  // E-Mail + Passwort Login. Gibt null zurück bei Erfolg, Fehlerobjekt bei Misserfolg.
  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ?? null
  }

  // Logout – onAuthStateChange feuert danach automatisch → user wird auf null gesetzt.
  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user: user ?? null, player, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// Kurzform für alle Komponenten: const { user, player, loading, signIn, signOut } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}
