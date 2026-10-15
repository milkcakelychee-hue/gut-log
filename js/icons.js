// SVG path จากไฟล์ดีไซน์
import { html } from './vendor/preact-htm.js';

export const BRISTOL_PATHS = [
  'M8 14a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M22 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M14 26a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M26.5 27a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0',
  'M6 21c-1-5 3-8 7-6c2-4 8-4 10-1c3-3 9-1 9 3c4 1 4 7 0 8c-1 4-7 5-9 2c-3 3-8 3-10 0c-4 1-7-2-7-6z',
  'M12 13h16a7 7 0 0 1 0 14h-16a7 7 0 0 1 0-14zM14 13l2 4M22 27l-1-4M27 13l1 3',
  'M10 14h20a6 6 0 0 1 0 12h-20a6 6 0 0 1 0-12z',
  'M5 21a6 4.5 0 1 0 12 0a6 4.5 0 1 0 -12 0M16.5 15a5.5 4 0 1 0 11 0a5.5 4 0 1 0 -11 0M24 26a5 4 0 1 0 10 0a5 4 0 1 0 -10 0',
  'M7 24c0-5 4-6 6-5c1-4 6-5 8-2c3-3 9-1 9 3c4 0 5 6 1 7c-1 3-6 3-8 1c-3 2-8 2-10 0c-4 1-7-1-6-4z',
  'M5 15q5-4 10 0t10 0t10 0M5 22q5-4 10 0t10 0t10 0M5 29q5-4 10 0t10 0t10 0'
];
export const SYMPTOM_PATH = 'M5 20h7l3-7 5 14 3-7h12';
// ขับถ่ายแต่ไม่ได้ดูลักษณะ
export const UNKNOWN_PATH = 'M10 20a10 10 0 1 0 20 0a10 10 0 1 0 -20 0M16.5 17a3.5 3.5 0 1 1 5 3.2c-1 .5-1.5 1.2-1.5 2.3M20 26.5v.2';

export const TAB_PATHS = {
  today: 'M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z',
  history: 'M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 10h16M8 4v4M16 4v4',
  trends: 'M4 19h16M6 16l4-5 3 3 5-7',
  settings: 'M5 7h9M18 7h1M5 17h3M12 17h7M16 5v4M10 15v4'
};

export const PLUS = 'M12 5v14M5 12h14';
export const CHECK = 'M5 12.5l4.5 4.5L19 7.5';
export const CHEVRON_LEFT = 'M15 6l-6 6 6 6';
export const CHEVRON_RIGHT = 'M9 6l6 6-6 6';

export const Glyph = ({ d, size = 34 }) => html`
  <svg width=${size} height=${size} viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${d} /></svg>`;

export const Icon = ({ d, size = 24, width = 1.9, color = 'currentColor' }) => html`
  <svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke=${color} stroke-width=${width} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${d} /></svg>`;

export const entryGlyph = (e) =>
  e.kind === 'symptom' ? SYMPTOM_PATH : e.bristol ? BRISTOL_PATHS[e.bristol - 1] : UNKNOWN_PATH;
