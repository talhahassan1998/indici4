/* The sign-in stage: a clay-render clinician mid-stride, a ring behind.

   The figure is SVG rather than a rendered video: it walks, breathes and
   drifts at a few kilobytes, it is sharp at any size, and it still works on a
   clinic PC with no network.

   The rig, so the joints stay joined: hips at y=322 inside the torso, legs
   pivoting from (198,322) and (222,322); shoulders at y=214 inside the torso,
   arms pivoting from (182,214) and (238,214). The bob is on the whole figure,
   never on the torso alone, or the legs part company with the body.

   Everything here stops under `prefers-reduced-motion`. */

import { useState, useEffect, useRef } from 'react';
import { WALK_VIDEO, WALK_POSTER } from '../config/media.js';

const SKIN = '#E8BE9B', SKIN_D = '#D2A17F';
const TOP = '#15803E', TOP_D = '#0F6431';
const LEG_D = '#262D29';
const SHOE = '#FBFCFB';

export default function StageScene() {
  /* A generated clip if one is configured, the drawn figure if not. The clip
     is the only remote asset on the screen, so it is treated as optional:
     if it will not load, `onError` takes it out and the SVG takes over. */
  const [clipOk, setClipOk] = useState(!!WALK_VIDEO);
  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }, []);

  if (WALK_VIDEO && clipOk) return (
    <div className="stage-scene stage-clip" aria-hidden="true">
      <video className="stage-video" src={WALK_VIDEO} poster={WALK_POSTER || undefined}
        autoPlay={!reduced.current} loop muted playsInline preload="metadata"
        onError={() => setClipOk(false)} />
    </div>
  );

  return (
    <div className="stage-scene" aria-hidden="true">
      <svg className="stage-art" viewBox="0 0 420 520" role="presentation">
        <defs>
          <radialGradient id="stg-glow" cx="50%" cy="40%" r="52%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="stg-top" x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#23964F" /><stop offset="100%" stopColor={TOP_D} />
          </linearGradient>
          <linearGradient id="stg-leg" x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#4C564F" /><stop offset="100%" stopColor={LEG_D} />
          </linearGradient>
          <linearGradient id="stg-skin" x1="0.2" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor="#F0CBA9" /><stop offset="100%" stopColor={SKIN_D} />
          </linearGradient>
        </defs>

        <circle cx="210" cy="236" r="152" fill="url(#stg-glow)" />
        <circle className="stg-ring" cx="210" cy="236" r="150" fill="none"
          stroke="#A3D3B4" strokeWidth="2" strokeDasharray="5 11" />
        <ellipse className="stg-shadow" cx="210" cy="470" rx="72" ry="12" fill="#0D4A25" opacity=".14" />

        <g className="stg-figure">
          {/* ---- behind the body ---- */}
          <g className="stg-leg stg-leg-b">
            <rect x="188" y="312" width="24" height="132" rx="12" fill={LEG_D} />
            <path d="M184 436h32a10 10 0 0 1 10 10v8h-52v-8a10 10 0 0 1 10-10z" fill="#DCE2DE" />
          </g>
          <g className="stg-arm stg-arm-b">
            <rect x="173" y="206" width="19" height="74" rx="9.5" fill={TOP_D} />
            <circle cx="182.5" cy="284" r="10.5" fill={SKIN_D} />
          </g>

          {/* ---- front leg ---- */}
          <g className="stg-leg stg-leg-f">
            <rect x="210" y="312" width="25" height="132" rx="12.5" fill="url(#stg-leg)" />
            <path d="M206 436h33a10 10 0 0 1 10 10v8h-53v-8a10 10 0 0 1 10-10z" fill={SHOE} />
          </g>

          {/* ---- torso: shoulders down to the hips, so the legs attach ---- */}
          <g className="stg-body">
            <path d="M175 216c0-19 16-30 35-30s35 11 35 30v92c0 14-10 24-24 24h-22c-14 0-24-10-24-24z"
              fill="url(#stg-top)" />
            {/* collar */}
            <path d="M196 188q14 16 28 0-6 20-14 20t-14-20z" fill={TOP_D} opacity=".55" />
            {/* stethoscope */}
            <path d="M197 190c0 30 7 46 13 46s13-16 13-46" fill="none"
              stroke="#DCE2DE" strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="210" cy="240" r="8.5" fill="#B7C0BA" />
            <circle cx="210" cy="240" r="4" fill="#95A099" />
            {/* chest pocket */}
            <rect x="218" y="262" width="23" height="26" rx="4" fill={TOP_D} opacity=".5" />
            <rect x="223" y="256" width="4" height="14" rx="2" fill="#F4E1D3" />
          </g>

          {/* ---- head ---- */}
          <g className="stg-head">
            <rect x="203" y="168" width="14" height="18" rx="7" fill={SKIN_D} />
            <rect x="191" y="116" width="38" height="52" rx="18" fill="url(#stg-skin)" />
            <path d="M189 134a21 21 0 0 1 42 0v3c-7-11-35-11-42 0z" fill="#222924" />
            <circle cx="203" cy="142" r="2.8" fill="#1F2923" />
            <circle cx="219" cy="142" r="2.8" fill="#1F2923" />
            <path d="M205 153q5 5 10 0" fill="none" stroke="#B4795A" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="198" cy="150" r="3.4" fill="#E8A183" opacity=".5" />
            <circle cx="224" cy="150" r="3.4" fill="#E8A183" opacity=".5" />
          </g>

          {/* ---- front arm, carrying the day's list ---- */}
          <g className="stg-arm stg-arm-f">
            <rect x="229" y="206" width="19" height="72" rx="9.5" fill="#23964F" />
            <circle cx="238.5" cy="282" r="10.5" fill={SKIN} />
            <g className="stg-tablet">
              <rect x="222" y="266" width="46" height="33" rx="6" fill="#FFFFFF" stroke="#C7CFC9" strokeWidth="2" />
              <rect x="229" y="274" width="22" height="4" rx="2" fill={TOP} />
              <rect x="229" y="283" width="32" height="3.5" rx="1.75" fill="#CFE3D7" />
              <rect x="229" y="291" width="18" height="3.5" rx="1.75" fill="#CFE3D7" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
