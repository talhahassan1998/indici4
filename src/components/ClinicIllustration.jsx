/* The sign-in illustration.

   It shows what this product actually joins up: the day's clinic list, the
   patient in front of you, and the letter that goes out afterwards. Drawn flat
   and geometric on an 8px grid in the project's own greens with one clay
   accent, and large enough to read from across a reception desk. */
export default function ClinicIllustration() {
  /* time pill, bar width, tone */
  const rows = [
    { y: 104, w: 120, tone: '#CFE3D7' },
    { y: 140, w: 140, tone: '#15803E' },
    { y: 176, w: 104, tone: '#E3EFE7' },
    { y: 212, w: 126, tone: '#E3EFE7' },
    { y: 248, w: 112, tone: '#E3EFE7' },
  ];

  return (
    <svg className="clinic-illo" viewBox="0 0 400 320" role="img"
      aria-label="Illustration: a day's clinic list, the patient record beside it, and the letter that follows the visit">
      {/* ---- the day's list ---- */}
      <g>
        <rect x="20" y="40" width="230" height="250" rx="16" fill="#FFFFFF" />
        <rect x="20" y="40" width="230" height="250" rx="16" fill="none" stroke="#DCE7E0" strokeWidth="2" />
        <path d="M20 56a16 16 0 0 1 16-16h198a16 16 0 0 1 16 16v28H20z" fill="#F1F8F4" />
        <rect x="40" y="55" width="70" height="12" rx="6" fill="#15803E" />
        <circle cx="228" cy="62" r="8" fill="none" stroke="#A3D3B4" strokeWidth="2" />

        {rows.map(r => (
          <g key={r.y}>
            <rect x="40" y={r.y} width="26" height="12" rx="6" fill="#EDF2EE" />
            <rect x="76" y={r.y} width={r.w} height="12" rx="6" fill={r.tone} />
          </g>
        ))}
        {/* the one in progress */}
        <rect x="26" y="136" width="4" height="20" rx="2" fill="#15803E" />
      </g>

      {/* ---- the letter that follows, approved ---- */}
      <g>
        <rect x="216" y="16" width="164" height="120" rx="14" fill="#FFFFFF" />
        <rect x="216" y="16" width="164" height="120" rx="14" fill="none" stroke="#DCE7E0" strokeWidth="2" />
        <rect x="236" y="44" width="90" height="9" rx="4.5" fill="#1C3326" />
        <rect x="236" y="63" width="118" height="7" rx="3.5" fill="#CFE3D7" />
        <rect x="236" y="77" width="100" height="7" rx="3.5" fill="#CFE3D7" />
        <rect x="236" y="91" width="110" height="7" rx="3.5" fill="#CFE3D7" />
        <circle cx="350" cy="112" r="16" fill="#15803E" />
        <path d="M343 112l5 5 10-10" stroke="#FFFFFF" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      {/* ---- the patient in front of you ---- */}
      <g>
        <rect x="176" y="214" width="204" height="88" rx="14" fill="#FFFFFF" />
        <rect x="176" y="214" width="204" height="88" rx="14" fill="none" stroke="#DCE7E0" strokeWidth="2" />
        <circle cx="212" cy="258" r="22" fill="#E3EFE7" />
        <circle cx="212" cy="251" r="6.5" fill="#15803E" />
        <path d="M201 269a11 11 0 0 1 22 0z" fill="#15803E" />
        <rect x="246" y="242" width="92" height="11" rx="5.5" fill="#1C3326" />
        <rect x="246" y="262" width="64" height="9" rx="4.5" fill="#CFE3D7" />
        {/* an allergy flag, the one thing on a record you must not miss */}
        <circle cx="356" cy="238" r="11" fill="#F4E1D3" />
        <path d="M356 232v7" stroke="#B87848" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="356" cy="243.5" r="1.5" fill="#B87848" />
      </g>
    </svg>
  );
}
