export default function DenariLogo({ size = 80, glow = true }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      style={{ filter: glow ? `drop-shadow(0 0 ${size * 0.2}px rgba(201,150,58,0.5))` : 'none' }}
    >
      <defs>
        <radialGradient id="dlbg" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#2a1a08"/>
          <stop offset="100%" stopColor="#120d04"/>
        </radialGradient>
        <radialGradient id="dlpG" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f0c84a"/>
          <stop offset="100%" stopColor="#9a6e1a"/>
        </radialGradient>
        <radialGradient id="dlpGr" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#4a8a6a"/>
          <stop offset="100%" stopColor="#1a3a2a"/>
        </radialGradient>
        <radialGradient id="dlcR" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#c9963a"/>
          <stop offset="100%" stopColor="#7a5010"/>
        </radialGradient>
        <radialGradient id="dlfC" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#e8b84b"/>
          <stop offset="100%" stopColor="#c9963a"/>
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill="url(#dlbg)"/>
      {[0,18,36,54,72,90,108,126,144,162,180,198,216,234,252,270,288,306,324,342].map((angle, i) => {
        const rad = (angle - 90) * Math.PI / 180
        return <circle key={i} cx={100 + 95 * Math.cos(rad)} cy={100 + 95 * Math.sin(rad)} r="5" fill="#c9963a" opacity="0.8"/>
      })}
      <circle cx="100" cy="100" r="88" fill="none" stroke="#c9963a" strokeWidth="1.5" opacity="0.5"/>
      {[0,36,72,108,144,180,216,252,288,324].map((angle, i) => (
        <ellipse key={i} cx="100" cy="45" rx="14" ry="22"
          fill={i % 2 === 0 ? 'url(#dlpG)' : 'url(#dlpGr)'}
          transform={`rotate(${angle} 100 100)`} opacity="0.95"/>
      ))}
      <circle cx="100" cy="100" r="34" fill="url(#dlcR)" stroke="#e8b84b" strokeWidth="1.5"/>
      {[0,60,120,180,240,300].map((angle, i) => (
        <ellipse key={i} cx="100" cy="78" rx="8" ry="13"
          fill="url(#dlfC)" transform={`rotate(${angle} 100 100)`} opacity="0.9"/>
      ))}
      <circle cx="100" cy="100" r="10" fill="#2a1a08" stroke="#e8b84b" strokeWidth="1.5"/>
      <circle cx="100" cy="100" r="5" fill="#e8b84b"/>
    </svg>
  )
}