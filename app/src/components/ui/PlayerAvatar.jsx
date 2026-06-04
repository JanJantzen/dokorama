// PlayerAvatar – wiederverwendbare Avatar-Komponente
// Zeigt das echte Profilbild wenn vorhanden, sonst einen farbigen Kreis mit Anfangsbuchstabe.
// Die Farbe ist per Name deterministisch – Robert hat immer dieselbe Farbe, egal wo.

const AVATAR_COLORS = [
  '#1a5c38', // Waldgrün
  '#1e40af', // Blau
  '#7c3aed', // Violett
  '#b45309', // Orange
  '#be185d', // Pink
  '#0f766e', // Türkis
  '#9f1239', // Dunkelrot
  '#4338ca', // Indigo
]

// Weist einem Namen per Hash eine feste Farbe zu
export function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// size: 'sm' | 'md' | 'lg' | 'xl'
// style: optionales Inline-Style-Objekt um die Größe zu überschreiben (für fluid scaling)
export default function PlayerAvatar({ player, size = 'md', style }) {
  const sizeClass = {
    sm: 'w-10 h-10 text-base',
    md: 'w-14 h-14 text-xl',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-20 h-20 text-3xl',
  }[size]

  if (player.avatar_url) {
    return (
      <img
        src={player.avatar_url}
        alt={player.name}
        className={`${sizeClass} rounded-full object-cover`}
        style={style}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: getAvatarColor(player.name), ...style }}
    >
      {player.name[0].toUpperCase()}
    </div>
  )
}
