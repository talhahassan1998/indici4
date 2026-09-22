import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('kora.theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kora.theme', theme);
  }, [theme]);
  const toggle = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), []);
  return [theme, toggle];
}

/* normal -> large -> extra large -> back to normal. "Normal" is the
   default and carries no attribute at all, so a fresh visitor's markup
   matches what data-text-size="large" would produce minus the override —
   nothing to clean up if the feature were ever removed. */
const TEXT_SIZES = ['normal', 'large', 'xl'];
export function useTextSize() {
  const [size, setSize] = useState(() => localStorage.getItem('kora.textSize') || 'normal');
  useEffect(() => {
    if (size === 'normal') document.documentElement.removeAttribute('data-text-size');
    else document.documentElement.setAttribute('data-text-size', size);
    localStorage.setItem('kora.textSize', size);
  }, [size]);
  const cycle = useCallback(() => setSize(s => TEXT_SIZES[(TEXT_SIZES.indexOf(s) + 1) % TEXT_SIZES.length]), []);
  return [size, cycle];
}

/* For the one screen (the appointment calendar) that positions things in
   raw pixels computed from real time rather than in CSS driven off --fs-*:
   those pixel maths need the current --text-scale too, or "Extra large
   text" makes a card's own content taller than the fixed-height box the JS
   gave it, and it spills into the next booking. Read the live CSS value —
   set by useTextSize above via data-text-size — via a MutationObserver on
   that attribute rather than duplicating the size state, so the two can
   never drift out of sync. */
export function useTextScale() {
  const read = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--text-scale')) || 1;
  const [scale, setScale] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setScale(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-text-size'] });
    return () => mo.disconnect();
  }, []);
  return scale;
}

export function useLocalState(key, initial) {
  const [v, setV] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw === null ? initial : JSON.parse(raw); }
    catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v]);
  return [v, setV];
}
