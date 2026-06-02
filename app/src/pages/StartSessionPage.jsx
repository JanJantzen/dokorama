// StartSessionPage – Partie starten
// Zweistufiger Flow: 1) Spieler:innen auswählen → 2) Übersicht bestätigen (Reihenfolge, Ort, Datum)
// Nach Bestätigung wird die Partie in Supabase angelegt und zur Erfassung weitergeleitet.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import PlayerSelector from '@/components/session/PlayerSelector'
import SeatingConfirm from '@/components/session/SeatingConfirm'

export default function StartSessionPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [allPlayers, setAllPlayers] = useState([])
  const [allVenues, setAllVenues] = useState([])
  const [selectedPlayers, setSelectedPlayers] = useState([]) // geordnete Auswahl
  const [venue, setVenue] = useState(null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]) // heute
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Spieler:innen und Orte beim Laden der Seite aus Supabase holen
  // Spieler:innen werden nach Anzahl gespielter Partien sortiert (Stammspieler:innen zuerst)
  useEffect(() => {
    async function loadData() {
      const [{ data: playersRaw }, { data: venues }] = await Promise.all([
        supabase.from('players').select('id, name, avatar_url, game_results(count)'),
        supabase.from('venues').select('*').order('name'),
      ])

      // Spielanzahl aus dem verschachtelten Supabase-Result lesen und sortieren
      const players = (playersRaw || [])
        .map(p => ({ ...p, gameCount: p.game_results?.[0]?.count ?? 0 }))
        .sort((a, b) => b.gameCount - a.gameCount || a.name.localeCompare(b.name, 'de'))

      setAllPlayers(players)
      setAllVenues(venues || [])
      setLoading(false)
    }
    loadData()
  }, [])

  // Spieler:in antippen: hinzufügen wenn nicht dabei, entfernen wenn schon dabei
  function handleToggle(player) {
    setSelectedPlayers(prev =>
      prev.find(p => p.id === player.id)
        ? prev.filter(p => p.id !== player.id)
        : [...prev, player]
    )
  }

  // Abend in Supabase anlegen und zur Erfassung navigieren
  async function handleStart() {
    setSaving(true)
    try {
      // Gruppen-ID holen (hardcoded auf 'Dokorama' für V1)
      const { data: group } = await supabase
        .from('groups')
        .select('id')
        .eq('name', 'Dokorama')
        .single()

      // Abend anlegen
      const { data: session } = await supabase
        .from('sessions')
        .insert({ group_id: group.id, venue_id: venue?.id || null, date, status: 'laufend' })
        .select()
        .single()

      // Erste Runde anlegen
      const { data: round } = await supabase
        .from('rounds')
        .insert({ session_id: session.id, number: 1, status: 'laufend' })
        .select()
        .single()

      // Sitzpositionen für alle Spieler:innen anlegen
      await supabase.from('round_participations').insert(
        selectedPlayers.map((player, index) => ({
          round_id: round.id,
          player_id: player.id,
          seat_position: index + 1,
        }))
      )

      // Zur Erfassung weiterleiten
      navigate(`/abend/${session.id}`)
    } catch (error) {
      console.error('Fehler beim Starten des Abends:', error)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Lade...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {step === 1 && (
        <PlayerSelector
          players={allPlayers}
          selected={selectedPlayers}
          onToggle={handleToggle}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <SeatingConfirm
          players={selectedPlayers}
          venues={allVenues}
          venue={venue}
          date={date}
          onReorder={setSelectedPlayers}
          onVenueChange={setVenue}
          onDateChange={setDate}
          onBack={() => setStep(1)}
          onConfirm={handleStart}
          saving={saving}
        />
      )}
    </div>
  )
}
