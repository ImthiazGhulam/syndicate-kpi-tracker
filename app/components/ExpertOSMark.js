export default function ExpertOSMark({ size = 28, glow = false, className = '' }) {
  // The SVG scales proportionally based on the size prop
  // Base viewBox is 48x48, scaled to requested pixel size
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${glow ? 'os-mark-glow' : ''} ${className}`}
      aria-label="Expert OS"
    >
      {/* Circuit trace entering from left */}
      <line x1="0" y1="24" x2="6" y2="24" stroke="#C9A24B" strokeWidth="1" />
      <circle cx="6" cy="24" r="1.5" fill="none" stroke="#C9A24B" strokeWidth="0.8" />

      {/* Chip frame — 1px gold hairline, 3px corner radius */}
      <rect
        x="8"
        y="4"
        width="36"
        height="40"
        rx="3"
        ry="3"
        fill="none"
        stroke="#C9A24B"
        strokeWidth="1"
      />

      {/* "OS" text in Orbitron style — hand-drawn geometric letterforms */}
      {/* Letter O */}
      <path
        d="M15 16h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2z"
        fill="none"
        stroke="#EDEAE3"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Letter S */}
      <path
        d="M30 16h6.5a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H30a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h6.5"
        fill="none"
        stroke="#EDEAE3"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
