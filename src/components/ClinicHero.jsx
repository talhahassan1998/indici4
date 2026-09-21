/* The hero panel for the third sign-in design: a consulting room at the end of
   the afternoon, drawn rather than photographed so it ships in the bundle and
   renders the same on every machine. The desk carries the four things the
   product joins up — the day's list, the record, the letter, the invoice. */

export default function ClinicHero() {
  return (
    <svg className="hero-art" viewBox="0 0 640 820" role="img"
      aria-label="Illustration: a consulting room desk at the end of the afternoon, with the day's list, a patient record, a letter and an invoice">
      <defs>
        <linearGradient id="hro-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7E2C8" /><stop offset="55%" stopColor="#EFD3B4" />
          <stop offset="100%" stopColor="#D8C4AE" />
        </linearGradient>
        <linearGradient id="hro-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#123B25" /><stop offset="100%" stopColor="#0B2A1A" />
        </linearGradient>
        <linearGradient id="hro-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C89B6E" /><stop offset="100%" stopColor="#A87B52" />
        </linearGradient>
        <linearGradient id="hro-beam" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFE7C4" stopOpacity=".55" />
          <stop offset="100%" stopColor="#FFE7C4" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="640" height="820" fill="url(#hro-wall)" />

      {/* the window, and the light coming through it */}
      <rect x="72" y="70" width="330" height="330" rx="10" fill="url(#hro-sky)" />
      <circle cx="300" cy="228" r="58" fill="#FFF3E0" opacity=".85" />
      <path d="M96 330h282M96 360h282" stroke="#C9A97F" strokeWidth="2" opacity=".5" />
      <rect x="230" y="70" width="8" height="330" fill="#0B2A1A" opacity=".55" />
      <rect x="72" y="228" width="330" height="8" fill="#0B2A1A" opacity=".55" />
      <rect x="66" y="64" width="342" height="342" rx="12" fill="none" stroke="#0B2A1A" strokeWidth="10" />
      <path d="M402 100 640 300v250L402 400z" fill="url(#hro-beam)" />

      {/* plant */}
      <path d="M470 400c0-46 22-78 44-96-6 34 2 66 14 96z" fill="#1B6B3C" />
      <path d="M528 400c16-30 44-46 70-48-20 20-32 32-38 48z" fill="#22814A" />
      <path d="M462 400h116l-12 92a16 16 0 0 1-16 14h-60a16 16 0 0 1-16-14z" fill="#9A5C31" />

      {/* desk */}
      <rect x="0" y="506" width="640" height="314" fill="url(#hro-desk)" />
      <rect x="0" y="506" width="640" height="10" fill="#E0BE95" />

      {/* the day's list */}
      <g>
        <rect x="46" y="556" width="182" height="218" rx="12" fill="#FFFFFF" />
        <rect x="46" y="556" width="182" height="44" rx="12" fill="#E5EFE7" />
        <rect x="66" y="572" width="74" height="11" rx="5.5" fill="#15803E" />
        {[622, 658, 694, 730].map((y, i) => (
          <g key={y}>
            <rect x="66" y={y} width="26" height="10" rx="5" fill="#EDF1EE" />
            <rect x="102" y={y} width={[108, 86, 96, 74][i]} height="10" rx="5"
              fill={i === 1 ? '#15803E' : '#CFE3D7'} />
          </g>
        ))}
        <rect x="52" y="654" width="5" height="18" rx="2.5" fill="#15803E" />
      </g>

      {/* the record, with the flag you must not miss */}
      <g>
        <rect x="248" y="600" width="210" height="106" rx="12" fill="#FFFFFF" />
        <circle cx="290" cy="648" r="22" fill="#E3EFE7" />
        <circle cx="290" cy="641" r="7" fill="#15803E" />
        <path d="M278 660a12 12 0 0 1 24 0z" fill="#15803E" />
        <rect x="324" y="632" width="92" height="12" rx="6" fill="#1C3326" />
        <rect x="324" y="654" width="64" height="9" rx="4.5" fill="#CFE3D7" />
        <circle cx="434" cy="626" r="12" fill="#F4E1D3" />
        <path d="M434 619v8" stroke="#B87848" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="434" cy="632" r="1.7" fill="#B87848" />
      </g>

      {/* the letter, approved */}
      <g>
        <rect x="392" y="528" width="196" height="120" rx="12" fill="#FFFFFF" transform="rotate(-4 490 588)" />
        <g transform="rotate(-4 490 588)">
          <rect x="414" y="554" width="96" height="10" rx="5" fill="#1C3326" />
          <rect x="414" y="576" width="140" height="8" rx="4" fill="#CFE3D7" />
          <rect x="414" y="592" width="118" height="8" rx="4" fill="#CFE3D7" />
          <circle cx="556" cy="618" r="17" fill="#15803E" />
          <path d="M548 618l6 6 11-12" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      </g>

      {/* the invoice behind it */}
      <g>
        <rect x="256" y="732" width="164" height="60" rx="12" fill="#FFFFFF" />
        <rect x="278" y="754" width="6" height="16" rx="3" fill="#15803E" />
        <rect x="288" y="748" width="6" height="22" rx="3" fill="#15803E" />
        <rect x="298" y="759" width="6" height="11" rx="3" fill="#A3D3B4" />
        <rect x="320" y="752" width="62" height="11" rx="5.5" fill="#15803E" />
        <rect x="320" y="770" width="42" height="8" rx="4" fill="#CFE3D7" />
      </g>

      {/* stethoscope on the desk */}
      <path d="M470 736c40-12 66 4 74 30" fill="none" stroke="#CFD7D2" strokeWidth="7" strokeLinecap="round" />
      <circle cx="550" cy="774" r="15" fill="#B2BCB6" />
      <circle cx="550" cy="774" r="7" fill="#8B978F" />
    </svg>
  );
}
