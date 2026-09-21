/* The sign-in illustration.

   It shows the four things this product joins up, in the order a visit
   happens: the day's clinic list, the patient in front of you, the letter that
   goes out afterwards, and the invoice behind it.

   Flat geometry on an 8px grid in the project's own greens with one clay
   accent. Each card in front carries a tinted halo, because white cards
   overlapping white cards otherwise merge into one shape. */

const CARD = '#FFFFFF';
const HALO = '#BCD6C6';   /* the edge that keeps overlapping cards apart */

function Card({ x, y, w, h, r, children }) {
  return (
    <g>
      <rect x={x - 5} y={y - 5} width={w + 10} height={h + 10} rx={r + 5} fill={HALO} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={CARD} />
      {children}
    </g>
  );
}

export default function ClinicIllustration() {
  /* widths stop short of the cards in front, so no bar is cut in half */
  const rows = [
    { y: 112, w: 126, tone: '#CFE3D7' },
    { y: 152, w: 138, tone: '#15803E' },
    { y: 192, w: 110, tone: '#E3EFE7' },
    { y: 232, w: 96,  tone: '#E3EFE7' },
    { y: 272, w: 88,  tone: '#E3EFE7' },
  ];

  return (
    <svg className="clinic-illo" viewBox="0 0 440 360" role="img"
      aria-label="Illustration: the day's clinic list, the patient record with an allergy flag, the letter that follows the visit, and the invoice behind it">

      {/* ---------------------------------------------- the day's list */}
      <rect x="16" y="52" width="228" height="268" rx="18" fill={CARD} />
      <path d="M16 70a18 18 0 0 1 18-18h192a18 18 0 0 1 18 18v30H16z" fill="#F1F8F4" />
      <rect x="38" y="69" width="76" height="13" rx="6.5" fill="#15803E" />
      <circle cx="206" cy="76" r="9" fill="none" stroke="#A3D3B4" strokeWidth="2.5" />
      {rows.map(r => (
        <g key={r.y}>
          <rect x="38" y={r.y} width="28" height="13" rx="6.5" fill="#EDF2EE" />
          <rect x="78" y={r.y} width={r.w} height="13" rx="6.5" fill={r.tone} />
        </g>
      ))}
      {/* the one in progress */}
      <rect x="22" y="148" width="5" height="21" rx="2.5" fill="#15803E" />

      {/* ------------------------------------ the letter, approved and out */}
      <Card x={222} y={16} w={202} h={134} r={16}>
        <rect x="246" y="46" width="104" height="10" rx="5" fill="#1C3326" />
        <rect x="246" y="68" width="146" height="8" rx="4" fill="#CFE3D7" />
        <rect x="246" y="84" width="124" height="8" rx="4" fill="#CFE3D7" />
        <rect x="246" y="100" width="136" height="8" rx="4" fill="#CFE3D7" />
        <circle cx="392" cy="124" r="18" fill="#15803E" />
        <path d="M384 124l6 6 11-12" stroke="#FFFFFF" strokeWidth="3.4"
          strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Card>

      {/* ------------------------------------ the invoice that follows it */}
      <Card x={28} y={284} w={150} h={58} r={14}>
        <rect x="50" y="305" width="6" height="16" rx="3" fill="#15803E" />
        <rect x="60" y="299" width="6" height="22" rx="3" fill="#15803E" />
        <rect x="70" y="310" width="6" height="11" rx="3" fill="#A3D3B4" />
        <rect x="92" y="303" width="62" height="11" rx="5.5" fill="#15803E" />
        <rect x="92" y="321" width="42" height="8" rx="4" fill="#CFE3D7" />
      </Card>

      {/* ------------------------------------- the patient in front of you */}
      <Card x={190} y={212} w={234} h={104} r={16}>
        <circle cx="232" cy="264" r="25" fill="#E3EFE7" />
        <circle cx="232" cy="256" r="7.5" fill="#15803E" />
        <path d="M219 276a13 13 0 0 1 26 0z" fill="#15803E" />
        <rect x="272" y="246" width="104" height="12" rx="6" fill="#1C3326" />
        <rect x="272" y="268" width="72" height="10" rx="5" fill="#CFE3D7" />
        {/* an allergy flag, the one thing on a record you must not miss */}
        <circle cx="396" cy="240" r="12" fill="#F4E1D3" />
        <path d="M396 233v8" stroke="#B87848" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="396" cy="246" r="1.7" fill="#B87848" />
      </Card>
    </svg>
  );
}
