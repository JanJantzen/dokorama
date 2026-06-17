// SessionDetailsPage – Block-Ansicht aller Spiele einer Partie
//
// Chronologisch, nach Runde gruppiert (linksbündige, deutliche Rundentrenner).
// Pro Spiel eine Zeile: Spielnummer (innerhalb der Runde) · Re-Team · Kontra-Team.
// Je Team links die Spieler:innen-Zeilen (Avatar + Name + Chips für An-/Absagen und
// Sonderpunkte, gleiche Icons wie am Tisch) und rechts EINE große Team-Punktzahl.
// Sonderspiel (Solo/Hochzeit/Armut) steht klein in Klammern auf der Re-Seite.
// Später wird eine Spielzeile antippbar (Bearbeiten).

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PlayerAvatar from '@/components/ui/PlayerAvatar'
import { supabase } from '@/lib/supabase'
import { formatSessionDate, loadSessionGames } from '@/lib/sessions'

import iconAnnRe from '@/assets/icons/icon-ann-re.png'
import iconAnnKo from '@/assets/icons/icon-ann-ko.png'
import iconAnnK9 from '@/assets/icons/icon-ann-k9.png'
import iconAnnK6 from '@/assets/icons/icon-ann-k6.png'
import iconAnnK3 from '@/assets/icons/icon-ann-k3.png'
import iconAnnSw from '@/assets/icons/icon-ann-sw.png'
import iconFuchsGemacht from '@/assets/icons/icon-fuchs-gemacht.png'
import iconFuchsVerloren from '@/assets/icons/icon-fuchs-verloren.png'
import iconDoppelkopf from '@/assets/icons/icon-doppelkopf.png'
import iconKarlchenGemacht from '@/assets/icons/icon-karlchen-gemacht.png'
import iconKarlchenGefangen from '@/assets/icons/icon-karlchen-gefangen.png'
import iconKarlchenVerloren from '@/assets/icons/icon-karlchen-verloren.png'

const ANN_ICONS = {
  re: iconAnnRe, kontra: iconAnnKo,
  keine_90: iconAnnK9, keine_60: iconAnnK6, keine_30: iconAnnK3, schwarz: iconAnnSw,
}
const EARNED_SP_ICONS = {
  fuchs_gefangen: iconFuchsGemacht, karlchen_gemacht: iconKarlchenGemacht,
  karlchen_gefangen: iconKarlchenGefangen, doppelkopf: iconDoppelkopf,
}
const LOST_SP_ICONS = {
  fuchs_gefangen: iconFuchsVerloren, karlchen_gefangen: iconKarlchenVerloren,
}

const SOLO_LABELS = {
  fleischlos: 'Fleischlos', buben_solo: 'Buben-Solo', damen_solo: 'Damen-Solo', stilles_solo: 'Stilles Solo',
}
const FARBE_LABELS = { karo: 'Karo', herz: 'Herz', pik: 'Pik', kreuz: 'Kreuz' }

// Label für Sonderspiele; Normalspiel → null (wird nicht angezeigt)
function specialLabel(gameType, farbe) {
  if (gameType === 'farb_solo') return `${FARBE_LABELS[farbe] ?? 'Farb'}-Solo`
  if (SOLO_LABELS[gameType]) return SOLO_LABELS[gameType]
  if (gameType === 'hochzeit') return 'Hochzeit'
  if (gameType === 'armut') return 'Armut'
  return null
}

const fmt = (n) => (n > 0 ? `+${n}` : `${n}`)

// Eine Spieler-Zeile: Avatar · Name · Chips (Ansagen + Sonderpunkte). KEINE Punkte
// (die stehen einmal pro Team rechts).
function PlayerLine({ p }) {
  const chips = [
    ...p.anns.map((typ, i) => ({ key: `a${i}`, icon: ANN_ICONS[typ] })),
    ...p.earnedSp.map((s, i) => ({ key: `e${i}`, icon: EARNED_SP_ICONS[s.typ] })),
    ...p.lostSp.map((s, i) => ({ key: `l${i}`, icon: LOST_SP_ICONS[s.typ] })),
  ].filter(c => c.icon)

  return (
    <div className="flex items-center gap-1.5">
      <div className="shrink-0">
        <PlayerAvatar player={{ name: p.name, avatar_url: p.avatarUrl }} size="xs" />
      </div>
      {/* Name, dann Icons – brechen um, bevor sie über die Punktespalte laufen */}
      <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 min-w-0">
        <span className="text-xs">{p.name}</span>
        {chips.map(c => <img key={c.key} src={c.icon} alt="" className="w-4 h-4 object-contain" />)}
      </div>
    </div>
  )
}

// Eine Team-Hälfte: Spielerzeilen links, eine große Punktzahl rechts (über alle Zeilen zentriert).
// hasSpecial reserviert die Label-Zeile in BEIDEN Teams (nur das aktive zeigt Text), damit
// die Spieler bei Hochzeit/Armut auf gleicher Höhe stehen.
function TeamCell({ players, score, special, hasSpecial }) {
  return (
    <div className="flex items-stretch gap-1 flex-1 min-w-0">
      <div className="flex flex-col justify-center gap-0.5 flex-1 min-w-0">
        {hasSpecial && (
          <span className="text-[10px] text-muted-foreground leading-tight min-h-[13px]">
            {special ? `(${special})` : ' '}
          </span>
        )}
        {players.map(p => <PlayerLine key={p.playerId} p={p} />)}
      </div>
      <div className="flex items-center justify-end shrink-0 w-8">
        <span className={`text-base font-bold tabular-nums ${score >= 0 ? 'text-green-700' : 'text-destructive'}`}>
          {fmt(score)}
        </span>
      </div>
    </div>
  )
}

function GameRow({ game }) {
  const reScore = game.re[0]?.points ?? 0
  const koScore = game.kontra[0]?.points ?? 0
  const special = specialLabel(game.gameType, game.farbe)

  return (
    <div className="flex items-stretch gap-2 py-1.5 border-b border-border/40">
      <div className="w-5 shrink-0 flex items-center justify-center text-base text-muted-foreground tabular-nums">
        {game.number}
      </div>
      <TeamCell players={game.re} score={reScore} special={special} hasSpecial={!!special} />
      <div className="w-px bg-border/40 shrink-0" />
      <TeamCell players={game.kontra} score={koScore} special={null} hasSpecial={!!special} />
    </div>
  )
}

export default function SessionDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [rounds, setRounds] = useState(null) // null = lädt noch
  const [error, setError] = useState(false)

  useEffect(() => {
    supabase.from('sessions').select('id, date, venues(name)').eq('id', id).single()
      .then(({ data }) => setSession(data))
    loadSessionGames(id).then(setRounds).catch(() => setError(true))
  }, [id])

  const venueName = session?.venues?.name
  const title = session
    ? `${formatSessionDate(session.date)}${venueName ? ` bei ${venueName}` : ''}`
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

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {error ? (
          <p className="text-sm text-muted-foreground text-center mt-8">Konnte nicht geladen werden.</p>
        ) : rounds === null ? (
          <p className="text-sm text-muted-foreground text-center mt-8">Lädt…</p>
        ) : rounds.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-8">Noch keine Spiele in dieser Partie.</p>
        ) : (
          rounds.map(r => (
            <div key={r.number}>
              {/* Deutlicher, linksbündiger Rundentrenner – dickere, dunkelgraue Linie, Text im selben Grau */}
              <div className="flex items-center gap-2 mt-5 mb-1 first:mt-0">
                <span className="text-sm font-bold text-gray-500">Runde {r.number}</span>
                <div className="h-0.5 bg-gray-500 flex-1 rounded" />
              </div>
              {/* Re/Kontra-Bezug einmal pro Runde */}
              <div className="flex gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground pb-0.5">
                <div className="w-5 shrink-0" />
                <div className="flex-1 text-green-700">Re</div>
                <div className="w-px shrink-0" />
                <div className="flex-1 text-amber-600">Kontra</div>
              </div>
              {r.games.map(g => <GameRow key={g.number} game={g} />)}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
