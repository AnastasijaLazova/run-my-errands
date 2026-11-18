// Cartoon for the sign-in hero: one helper with many arms, each hand doing a different favour.
const INK = '#2F4858'
const SKIN = '#E0A57F'
const SHIRT = '#FFD45C'

type Pt = [number, number]

/** Arm bends through `elbow` so the fan of arms looks loose and cartoony. */
function Arm({ from, elbow, to }: { from: Pt; elbow: Pt; to: Pt }) {
  return (
    <g>
      <path d={`M${from[0]} ${from[1]}Q${elbow[0]} ${elbow[1]} ${to[0]} ${to[1]}`} stroke={SHIRT} strokeWidth="7" fill="none" strokeLinecap="round" />
      <circle cx={to[0]} cy={to[1]} r="4.2" fill={SKIN} />
    </g>
  )
}

const Heart = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 3C0-2-7-3-7 2C-7 6 0 10 0 12C0 10 7 6 7 2C7-3 0-2 0 3Z" fill="#FF6F7D" />
)

const Sparkle = ({ x, y, s = 1, c = '#FFFFFF' }: { x: number; y: number; s?: number; c?: string }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0-8Q1-1 8 0Q1 1 0 8Q-1 1-8 0Q-1-1 0-8Z" fill={c} />
)

export default function NeighbourhoodScene({ label, className }: { label: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 760 380" role="img" aria-label={label}>
      <defs>
        <clipPath id="scene-clip"><rect width="760" height="380" rx="28" /></clipPath>
      </defs>
      <g clipPath="url(#scene-clip)" strokeLinecap="round" strokeLinejoin="round">
        {/* sky */}
        <rect width="760" height="380" fill="#DDF3E8" />
        <g stroke="#FFD45C" strokeWidth="5">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1="676" y1="66" x2="676" y2="20" transform={`rotate(${a} 676 66)`} strokeDasharray="0 34 12" />
          ))}
        </g>
        <circle cx="676" cy="66" r="28" fill="#FFD45C" />
        <g className="scene-cloud" fill="#FFFFFF">
          <circle cx="90" cy="64" r="20" /><circle cx="116" cy="56" r="26" /><circle cx="144" cy="66" r="18" /><rect x="80" y="64" width="74" height="20" rx="10" />
        </g>
        <g className="scene-cloud scene-cloud-slow" fill="#FFFFFF">
          <circle cx="520" cy="46" r="16" /><circle cx="542" cy="40" r="21" /><circle cx="564" cy="48" r="14" /><rect x="510" y="46" width="62" height="16" rx="8" />
        </g>
        <path d="M218 82q6-6 12 0q6-6 12 0M590 110q5-5 10 0q5-5 10 0" stroke={INK} strokeWidth="2" fill="none" />
        <path d="M0 256Q170 196 340 244T760 222V380H0Z" fill="#B5E3C9" />

        {/* backdrop: a house and a tree */}
        <rect x="112" y="200" width="14" height="30" fill="#D86F52" />
        <rect x="30" y="232" width="124" height="104" fill="#FFF4DE" />
        <polygon points="20,238 92,180 164,238" fill="#F28C6B" stroke="#F28C6B" strokeWidth="6" />
        <rect x="46" y="254" width="32" height="28" rx="4" fill="#BFE6F7" stroke="#FFFFFF" strokeWidth="3" />
        <path d="M62 254V282M46 268H78" stroke="#FFFFFF" strokeWidth="3" />
        <rect x="100" y="278" width="30" height="58" rx="6" fill="#0F7B55" />
        <circle cx="123" cy="308" r="2.5" fill="#FFD45C" />
        <rect x="655" y="262" width="12" height="76" rx="3" fill="#9A6A45" />
        <circle cx="661" cy="232" r="38" fill="#4FB37F" />
        <circle cx="635" cy="256" r="24" fill="#4FB37F" />
        <circle cx="687" cy="256" r="24" fill="#4FB37F" />
        <circle cx="648" cy="218" r="11" fill="#6CC58F" />

        {/* ground */}
        <rect y="334" width="760" height="46" fill="#8FD07A" />
        <ellipse cx="380" cy="344" rx="120" ry="12" fill="#7BBF68" />
        {[[40, '#FF8FA8'], [190, '#FFD45C'], [560, '#FFFFFF'], [610, '#B79CF2'], [730, '#FF8FA8']].map(([fx, c]) => (
          <g key={fx as number}>
            <line x1={fx as number} y1="370" x2={fx as number} y2="358" stroke="#4FB37F" strokeWidth="2" />
            <circle cx={fx as number} cy="356" r="4.5" fill={c as string} />
          </g>
        ))}

        <Heart x={250} y={116} />
        <Heart x={512} y={140} s={0.8} />
        <Sparkle x={300} y={96} />
        <Sparkle x={470} y={84} s={1.2} />
        <Sparkle x={210} y={190} s={0.8} c="#FFD45C" />
        <Sparkle x={560} y={200} s={0.9} c="#FFD45C" />

        {/* the helper, drawn in local units: feet at 0, head near -118 */}
        <g transform="translate(380 342) scale(1.8)">
          {/* dog on a leash */}
          <path className="scene-tail" d="M-104 -12Q-114 -20 -110 -30" stroke="#E3A869" strokeWidth="3.5" fill="none" />
          <g stroke="#E3A869" strokeWidth="3.5">
            <line x1="-100" y1="-8" x2="-102" y2="-1" /><line x1="-94" y1="-7" x2="-94" y2="-1" />
            <line x1="-84" y1="-7" x2="-84" y2="-1" /><line x1="-78" y1="-8" x2="-76" y2="-1" />
          </g>
          <ellipse cx="-90" cy="-12" rx="16" ry="8" fill="#E3A869" />
          <ellipse cx="-95" cy="-14" rx="5" ry="3.5" fill="#B97A44" />
          <circle cx="-72" cy="-24" r="8" fill="#E3A869" />
          <ellipse cx="-66" cy="-21" rx="4.5" ry="3.5" fill="#F1C79A" />
          <circle cx="-62.5" cy="-22.5" r="1.7" fill={INK} />
          <circle cx="-71" cy="-27" r="1.3" fill={INK} />
          <path d="M-77 -30Q-82 -21 -77 -17Q-74 -23 -74 -30Z" fill="#B97A44" />
          <path d="M-79 -20Q-76 -14 -70 -16" stroke="#E5533D" strokeWidth="2.2" fill="none" />
          <path d="M-46 -50Q-62 -30 -71 -16" stroke={INK} strokeWidth="1.3" fill="none" />

          {/* flower pot being watered */}
          <path d="M80 -14H98L95 0H83Z" fill="#D86F52" />
          <line x1="89" y1="-14" x2="89" y2="-30" stroke="#4FB37F" strokeWidth="2" />
          <path d="M89 -22Q95 -26 96 -20Q91 -18 89 -22Z" fill="#4FB37F" />
          {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx="89" cy="-36" r="3.4" fill="#FF8FA8" transform={`rotate(${a} 89 -32)`} />)}
          <circle cx="89" cy="-32" r="2.6" fill="#FFD45C" />

          {/* body */}
          {[[-6, '#3E7CC9'], [6, '#3E7CC9']].map(([lx, c]) => (
            <g key={lx as number}>
              <line x1={lx as number} y1="-40" x2={(lx as number) * 1.2} y2="-3" stroke={c as string} strokeWidth="9" strokeLinecap="round" />
              <ellipse cx={(lx as number) * 1.2} cy="-1" rx="7" ry="4" fill={INK} />
            </g>
          ))}
          <rect x="-16" y="-87" width="32" height="51" rx="13" fill={SHIRT} />
          <circle cx="0" cy="-58" r="8" fill="#0F7B55" />
          <text x="0" y="-54.5" textAnchor="middle" fontSize="10" fontWeight="800" fill="#FFFFFF" fontFamily="system-ui, sans-serif">R</text>

          {/* left hands: wrench, parcel, leash */}
          <Arm from={[-12, -82]} elbow={[-40, -96]} to={[-50, -124]} />
          <line x1="-52" y1="-128" x2="-60" y2="-140" stroke="#8C99A6" strokeWidth="4" />
          <path d="M-58 -144a5 5 0 1 0 -6 2l3 -4z" fill="none" stroke="#8C99A6" strokeWidth="3.5" />
          <Arm from={[-13, -76]} elbow={[-36, -78]} to={[-56, -90]} />
          <rect x="-82" y="-102" width="28" height="24" rx="2.5" fill="#D49A5B" />
          <rect x="-70" y="-102" width="5" height="24" fill="#F1D3A6" />
          <circle cx="-56" cy="-90" r="4.2" fill={SKIN} />
          <Arm from={[-13, -70]} elbow={[-34, -66]} to={[-46, -50]} />

          {/* right hands: paint roller, groceries, watering can */}
          <Arm from={[12, -82]} elbow={[40, -96]} to={[50, -124]} />
          <path d="M51 -128L55 -140H70" stroke={INK} strokeWidth="2.5" fill="none" />
          <rect x="62" y="-147" width="22" height="9" rx="4" fill="#D9F27A" />
          <path d="M80 -138v5" stroke="#D9F27A" strokeWidth="3" />
          <Arm from={[13, -76]} elbow={[36, -78]} to={[56, -90]} />
          <path d="M50 -84Q56 -96 62 -84" stroke="#9A6A45" strokeWidth="2" fill="none" />
          <rect x="66" y="-92" width="4" height="22" rx="2" fill="#E8B56A" transform="rotate(14 68 -81)" />
          <circle cx="56" cy="-82" r="6" fill="#4FB37F" />
          <circle cx="63" cy="-81" r="4.5" fill="#E5533D" />
          <path d="M46 -82H70L68 -64H48Z" fill="#E8D3A8" />
          <circle cx="56" cy="-90" r="4.2" fill={SKIN} />
          <Arm from={[13, -70]} elbow={[34, -66]} to={[46, -50]} />
          <rect x="48" y="-58" width="20" height="16" rx="3" fill="#6FB7E9" />
          <path d="M66 -50L80 -58" stroke="#6FB7E9" strokeWidth="3.5" />
          <circle cx="46" cy="-50" r="4.2" fill={SKIN} />
          <path d="M83 -54Q84 -51 83 -50Q82 -51 83 -54ZM86 -46Q87 -43 86 -42Q85 -43 86 -46ZM82 -40Q83 -37 82 -36Q81 -37 82 -40Z" fill="#4FA9E0" stroke="#4FA9E0" strokeWidth="1.5" />

          {/* head */}
          <circle cx="0" cy="-101" r="15" fill={SKIN} />
          <circle cx="-5" cy="-103" r="1.9" fill={INK} />
          <circle cx="5" cy="-103" r="1.9" fill={INK} />
          <circle cx="-9" cy="-96" r="2.8" fill="#FF8A8A" opacity=".45" />
          <circle cx="9" cy="-96" r="2.8" fill="#FF8A8A" opacity=".45" />
          <path d="M-6 -96Q0 -87 6 -96Z" fill={INK} />
          <path d="M-3 -92Q0 -90 3 -92" stroke="#FF6F7D" strokeWidth="1.6" fill="none" />
          <path d="M-15 -101Q-16 -119 0 -118Q16 -119 15 -101Q9 -111 0 -110Q-9 -111 -15 -101Z" fill="#7A3E1D" />
          <circle cx="-8" cy="-116" r="5" fill="#7A3E1D" />
          <circle cx="4" cy="-119" r="5.5" fill="#7A3E1D" />
        </g>
      </g>
    </svg>
  )
}
