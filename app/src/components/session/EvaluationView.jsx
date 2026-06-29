// EvaluationView – Auswertungs-Screen vor dem Speichern
//
// Aufbau (mit Jan festgelegt, 15. Juni 2026): zwei Spalten – Re links, Kontra rechts.
// Pro Spalte: Team-Name, (bei Sonderspiel) der Spieltyp unter dem aktiven Team,
// Spieler:innen, Augen und ganz unten das Ergebnis (+/−).
//
// Die KOMPLETTE Herleitung steht in der Spalte des GEWINNERTEAMS – inklusive der
// Sonderpunkte beider Teams:
//   Grundpunkte einzeln → Summe → ggf. ×Ansage (mit Angabe welche) → Zwischensumme
//   → eigene Sonderpunkte (+) → Sonderpunkte Gegner (−) → Ergebnis.
// Die Verliererspalte zeigt nur Kopf + Ergebnis (= das Negative; Ausnahme Solo, wo
// der/die Solist:in das Dreifache bekommt – über result.perPlayer korrekt abgebildet).
// Der Begriff „Spielwert" wird bewusst NICHT verwendet (Jan).
//
// Reine Anzeige-Schicht: alle Zahlen kommen fertig aus scoreCalculation.js
// (result.perPlayer / result.breakdown). Hier wird nichts gerechnet außer dem
// Aufteilen der Sonderpunkte auf Gewinner/Verlierer.

import PlayerAvatar from '@/components/ui/PlayerAvatar'
import { ArrowLeft } from 'lucide-react'
import { isSolo, deriveGameType } from '@/lib/scoreCalculation'

// Anzeige-Namen der Sonderpunkt-Typen
const SPECIAL_LABELS = {
  fuchs_gefangen:    'Fuchs',
  karlchen_gemacht:  'Karlchen',
  karlchen_gefangen: 'Karlchen gefangen',
  doppelkopf:        'Doppelkopf',
}

// Anzeige-Namen der Sonderspiel-Typen (für das Label unter dem aktiven Team)
const SOLO_LABELS = {
  fleischlos:                'Fleischlos',
  buben_solo:                'Buben-Solo',
  damen_solo:                'Damen-Solo',
  stilles_solo:              'Stilles Solo',
  solo_hochzeit: 'Solo Hochzeit',
}
const FARBE_LABELS = { karo: 'Karo', herz: 'Herz', pik: 'Pik', kreuz: 'Kreuz' }

function gameTypeLabel(gameType, soloColor) {
  if (gameType === 'farb_solo') return `${FARBE_LABELS[soloColor] ?? 'Farb'}-Solo`
  if (SOLO_LABELS[gameType])    return SOLO_LABELS[gameType]
  if (gameType === 'hochzeit')  return 'Hochzeit'
  if (gameType === 'armut')     return 'Armut'
  return 'Normalspiel'
}

// Fasst die Sonderpunkte EINER Partei zu Zeilen [{ label, count }] zusammen.
function summarizeSpecials(specialPoints, parties, party) {
  const counts = {}
  for (const sp of specialPoints) {
    if (parties[sp.earnerId] !== party) continue
    counts[sp.type] = (counts[sp.type] ?? 0) + 1
  }
  return Object.entries(counts).map(([type, count]) => ({
    label: SPECIAL_LABELS[type] ?? type,
    count,
  }))
}

const fmt = (n) => (n > 0 ? `+${n}` : `${n}`)

// Eine Zeile in der Herleitung (Label links, Wert rechts)
// tone="danger" = blasses Rot für die abgezogenen Gegner-Sonderpunkte
function Row({ label, value, muted, strong, tone }) {
  const labelColor = tone === 'danger' ? 'text-red-400' : muted ? 'text-muted-foreground' : ''
  const valueColor = tone === 'danger' ? 'text-red-400' : ''
  return (
    <div className="flex justify-between gap-2">
      <span className={labelColor}>{label}</span>
      <span className={`tabular-nums ${strong ? 'font-bold' : 'font-medium'} ${valueColor}`}>{value}</span>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-border my-1" />
}

// Überschrift einer Sonderpunkt-Gruppe innerhalb der Herleitung
function SpecialHeading({ children, tone }) {
  const color = tone === 'danger' ? 'text-red-400' : 'text-muted-foreground'
  return (
    <p className={`text-[10px] font-semibold uppercase tracking-wider pt-1 ${color}`}>
      {children}
    </p>
  )
}

// Eine Team-Spalte. Die ganze Herleitung wird nur im Gewinnerteam gerendert,
// beide Teams zeigen Kopf und Ergebnis.
function TeamColumn({
  party, isWinner, players, eyes, points,
  isSpecial, showType, typeLabel, maxPlayers,
  breakdown, basePoints, multiplier, annLabel, solo,
  ownSpecials, oppSpecials,
}) {
  const name   = party === 're' ? 'Re' : 'Kontra'
  const accent = party === 're' ? 'text-green-700' : 'text-amber-600'
  // Leerzeilen, damit beide Spalten gleich viele Spieler-Zeilen haben (Solo 1 vs 3)
  const padRows = Math.max(0, maxPlayers - players.length)

  const hasMult   = multiplier > 1
  const afterMult = basePoints * multiplier
  // Der/die Solist:in sitzt immer auf Re (I10) und bekommt das Dreifache.
  const isSolist  = solo && party === 're'

  // Arbeitszeilen (Grundpunkte/×Ansage/Sonderpunkte) nur zeigen, wenn es etwas zu rechnen gibt
  const showWork  = isWinner && (hasMult || ownSpecials.length > 0 || oppSpecials.length > 0)

  return (
    <div className={`flex flex-col rounded-xl border bg-card overflow-hidden ${isWinner ? 'border-green-300' : 'border-border'}`}>
      {/* Kopf: Team, Spieltyp (aktives Team), Spieler:innen, Augen */}
      <div className="px-3 pt-3 pb-2 border-b border-border">
        <p className={`text-sm font-bold ${accent}`}>{name}</p>
        {/* Bei Sonderspiel in BEIDEN Spalten eine Zeile reservieren (nur aktives Team gefüllt) */}
        {isSpecial && (
          <p className="text-xs text-muted-foreground -mt-0.5 min-h-4">{showType ? typeLabel : ' '}</p>
        )}
        <div className="mt-2 space-y-1">
          {players.map(p => (
            <div key={p.player_id} className="flex items-center gap-2">
              <PlayerAvatar player={p.players} size="xs" />
              <span className="text-xs truncate">{p.players.name}</span>
            </div>
          ))}
          {Array.from({ length: padRows }).map((_, i) => (
            <div key={`pad-${i}`} className="h-7" />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">{eyes} Augen</p>
      </div>

      {/* Herleitung – im Gewinnerteam vollständig; beim verlierenden Solisten nur die ×3 unten */}
      <div className="px-3 py-2 flex-1 flex flex-col text-xs">
        {isWinner && (
          <div className="space-y-1">
            {breakdown.map((item, i) => (
              <Row key={i} label={item.label} value={`+${item.points}`} muted />
            ))}

            {showWork && (
              <>
                <Divider />
                <Row label="Grundpunkte" value={basePoints} />

                {hasMult && (
                  <>
                    <Row label={`Ansage ${annLabel}`} value={`×${multiplier}`} muted />
                    <Divider />
                    <Row label="Zwischensumme" value={afterMult} />
                  </>
                )}

                {ownSpecials.length > 0 && (
                  <>
                    <SpecialHeading>Sonderpunkte</SpecialHeading>
                    {ownSpecials.map((s, i) => (
                      <Row key={i} label={s.count > 1 ? `${s.count}× ${s.label}` : s.label} value={`+${s.count}`} muted />
                    ))}
                  </>
                )}

                {oppSpecials.length > 0 && (
                  <>
                    <SpecialHeading tone="danger">Sonderpunkte Gegner</SpecialHeading>
                    {oppSpecials.map((s, i) => (
                      <Row key={i} label={s.count > 1 ? `${s.count}× ${s.label}` : s.label} value={`−${s.count}`} tone="danger" />
                    ))}
                  </>
                )}

              </>
            )}
          </div>
        )}

        {/* Solo: in BEIDEN Spalten unten "── / Spielwert" – beim Solisten zusätzlich "Solo × 3",
            beim Gegner ein Platzhalter, damit Striche und Werte auf gleicher Höhe stehen.
            Der Spielwert ist beim Solisten der eigene Wertanteil (Ergebnis ÷ 3), beim Gegner
            das Ergebnis selbst (bewusste Dopplung). */}
        {solo && (
          <div className="space-y-1 mt-auto">
            <Divider />
            <Row label="Spielwert" value={isSolist ? points / 3 : points} />
            {isSolist
              ? <Row label="Solo × 3" value="×3" muted />
              : <div className="h-4" aria-hidden />}
          </div>
        )}
      </div>

      {/* Ergebnis (pro Spieler:in des Teams) */}
      <div className={`px-3 py-2 border-t flex items-center justify-between ${isWinner ? 'border-green-200 bg-green-50' : 'border-border'}`}>
        <span className="text-xs font-medium text-muted-foreground">Ergebnis</span>
        <span className={`text-lg font-bold tabular-nums ${points >= 0 ? 'text-green-700' : 'text-destructive'}`}>
          {fmt(points)}
        </span>
      </div>
    </div>
  )
}

export default function EvaluationView({
  result,        // Rückgabe von calculateGameResult
  activePlayers, // alle nicht-aussetzenden Spieler mit { player_id, players }
  gameState,     // für Parteizuordnung, Augen, Ansagen, Sonderpunkte, Spieltyp
  gameNumber,
  roundNumber,
  onConfirm,           // () → void – speichert und nächstes Spiel (nur Schreiber:in)
  onBack,              // () → void – zurück zum Tischscreen
  saving,              // boolean
  confirmLabel = 'Bestätigen – nächstes Spiel', // im Edit-Modus z.B. "Speichern"
  isWriter = true,     // false = Zuschauer:in → Bestätigen öffnet Übergabe-Dialog
  onRequestTakeover,   // () → void – öffnet den Kugelschreiber-Dialog
  currentWriterName,   // string | null – Name des aktiven Schreibers (für Banner)
}) {
  if (!result) return null

  const { winner, isTie, basePoints, multiplier, perPlayer, breakdown } = result
  const parties = gameState.parties

  // Spieltyp ableiten (für Label + Solo-Sonderbehandlung)
  const gameType  = deriveGameType(gameState.specialRoles, gameState.soloType)
  const solo      = isSolo(gameType)
  const typeLabel = gameTypeLabel(gameType, gameState.soloColor)
  const isSpecial = gameType !== 'normal'

  // Welche Ansagen wurden gemacht? (Re-Ansage nur vom Re-Team, Kontra nur vom Kontra-Team)
  const annTypes  = new Set(Object.values(gameState.announcements).flat())
  const reAnn     = annTypes.has('re')
  const kontraAnn = annTypes.has('kontra')
  const annLabel  = reAnn && kontraAnn ? 'Re + Kontra' : reAnn ? 'Re' : kontraAnn ? 'Kontra' : ''

  // Augen je Partei (gespeichert wird immer Re; Kontra = 240 − Re)
  const eyesNum = parseInt(gameState.eyesInput)
  const reEyes  = gameState.eyesFor === 're' ? eyesNum : 240 - eyesNum
  const eyes    = { re: reEyes, kontra: 240 - reEyes }

  // Spieler:innen & Punkte je Partei
  const players = {
    re:     activePlayers.filter(p => parties[p.player_id] === 're'),
    kontra: activePlayers.filter(p => parties[p.player_id] === 'kontra'),
  }
  // Innerhalb eines Teams bekommen alle dieselben Punkte → der erste reicht
  const points = {
    re:     players.re.length     ? (perPlayer[players.re[0].player_id]     ?? 0) : 0,
    kontra: players.kontra.length ? (perPlayer[players.kontra[0].player_id] ?? 0) : 0,
  }

  // Sonderpunkte: eigene (Gewinner) und gegnerische (Verlierer) – beide in die
  // Herleitung des Gewinnerteams
  const loserParty     = winner === 're' ? 'kontra' : 're'
  const winnerSpecials = summarizeSpecials(gameState.specialPoints, parties, winner)
  const loserSpecials  = summarizeSpecials(gameState.specialPoints, parties, loserParty)

  // Größere Teamgröße – beide Spalten reservieren so viele Spieler-Zeilen (Solo 1 vs 3)
  const maxPlayers = Math.max(players.re.length, players.kontra.length)

  const headline = isTie ? 'Gespaltener Arsch' : winner === 're' ? 'Re gewinnt' : 'Kontra gewinnt'

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-border">
        <button onClick={onBack} className="text-muted-foreground p-1">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="font-semibold text-sm">Runde {roundNumber} · Spiel {gameNumber}</p>
          <p className="text-xs text-muted-foreground">Auswertung</p>
        </div>
      </div>

      {/* Zuschauer-Banner */}
      {!isWriter && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-amber-800">
            {currentWriterName ? `${currentWriterName} schreibt – du schaust zu` : 'Zuschauer-Modus'}
          </span>
          <button
            onClick={onRequestTakeover}
            className="text-xs font-medium text-amber-800 border border-amber-400 rounded-lg px-2.5 py-1 active:bg-amber-100 shrink-0 ml-3"
          >
            Übernehmen
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {/* Ergebnis-Überschrift (Normalspiel als Bildunterschrift, Sonderspiel steht am Team) */}
        <div className="text-center">
          <p className="text-2xl font-bold">{headline}</p>
          {!isSpecial && <p className="text-sm text-muted-foreground mt-1">Normalspiel</p>}
        </div>

        {/* Zwei-Spalten-Tabelle: Re links, Kontra rechts */}
        <div className="grid grid-cols-2 gap-3 items-stretch">
          {['re', 'kontra'].map(party => (
            <TeamColumn
              key={party}
              party={party}
              isWinner={party === winner}
              players={players[party]}
              eyes={eyes[party]}
              points={points[party]}
              isSpecial={isSpecial}
              // Sonderspiel-Label nur unter dem aktiven Team (= immer Re, siehe I10)
              showType={isSpecial && party === 're'}
              typeLabel={typeLabel}
              maxPlayers={maxPlayers}
              breakdown={breakdown}
              basePoints={basePoints}
              multiplier={multiplier}
              annLabel={annLabel}
              // Solo: der/die Solist:in (immer Re) bekommt das Dreifache; die Spalte zeigt die ×3 selbst
              solo={solo}
              ownSpecials={party === winner ? winnerSpecials : []}
              oppSpecials={party === winner ? loserSpecials : []}
            />
          ))}
        </div>
      </div>

      {/* Bestätigen-Button: Schreiber:in speichert, Zuschauer:in öffnet Übergabe-Dialog.
          Label bleibt identisch – der Klick entscheidet was passiert. */}
      <div className="px-4 pt-3 pb-5 border-t border-border">
        <button
          onClick={isWriter ? onConfirm : onRequestTakeover}
          disabled={saving}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-50"
        >
          {saving ? 'Wird gespeichert…' : confirmLabel}
        </button>
      </div>
    </div>
  )
}
