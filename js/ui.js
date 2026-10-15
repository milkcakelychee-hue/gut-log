// ส่วนประกอบที่ใช้ซ้ำ (ตาม SPEC.md ข้อ 4)
import { html, useState, useEffect, useRef, useLayoutEffect } from './vendor/preact-htm.js';
import { BRISTOL_PATHS, Glyph, Icon, TAB_PATHS } from './icons.js';
import { BRISTOL_SHORT, ZONES_LEFT, ZONES_MID, ZONES_RIGHT, painWord } from './rules.js';

const cx = (...a) => a.filter(Boolean).join(' ');
const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : arr.concat([v]));
export { cx, toggle };

export const Chip = ({ on, onClick, tight, children }) => html`
  <button type="button" class=${cx('chip', tight && 'tight', on && 'on')} aria-pressed=${on ? 'true' : 'false'} onClick=${onClick}>${children}</button>`;

export const AddChip = ({ onClick, label = '+ เพิ่ม', tight }) => html`
  <button type="button" class=${cx('chip add', tight && 'tight')} onClick=${onClick}>${label}</button>`;

// ตัวเลือก 3 ระดับ แตะตัวเดิมซ้ำ = ยกเลิก
export const Segmented = ({ opts, value, onChange, label }) => html`
  <div class="seg" role="radiogroup" aria-label=${label}>
    ${opts.map(([key, text]) => html`
      <button type="button" role="radio" aria-checked=${value === key ? 'true' : 'false'} class=${value === key ? 'on' : ''}
        onClick=${() => onChange(value === key ? null : key)}>${text}</button>`)}
  </div>`;

export const PainScale = ({ value, onChange }) => html`
  <div class="log-section">
    <div class="section-head">
      <h2 class="h2-lg">${'ปวดท้องแค่ไหน'}</h2>
      <div class="pain-word">${value === null ? 'ยังไม่เลือก' : value + ' · ' + painWord(value)}</div>
    </div>
    <div class="pain">
      ${Array.from({ length: 11 }, (_, n) => html`
        <button type="button" class=${value === n ? 'on' : ''} aria-pressed=${value === n ? 'true' : 'false'}
          aria-label=${'ปวด ' + n + ' ' + painWord(n)} onClick=${() => onChange(value === n ? null : n)}>${n}</button>`)}
    </div>
    <div class="scale-ends"><span>0 ไม่ปวด</span><span>10 ปวดมากที่สุด</span></div>
  </div>`;

// value: undefined = ยังไม่เลือก, 0 = ข้าม, 1–7
export const BristolGrid = ({ value, onChange }) => html`
  <div class="log-section">
    <div class="section-head">
      <h2 class="h2-lg">ลักษณะอุจจาระ</h2>
      <div class="hint">Bristol 1–7</div>
    </div>
    <div class="bristol">
      ${BRISTOL_PATHS.map((d, i) => html`
        <button type="button" class=${value === i + 1 ? 'on' : ''} aria-pressed=${value === i + 1 ? 'true' : 'false'}
          aria-label=${'แบบ ' + (i + 1) + ' ' + BRISTOL_SHORT[i]} onClick=${() => onChange(value === i + 1 ? undefined : i + 1)}>
          <${Glyph} d=${d} size=${36} />
          <span class="n">แบบ ${i + 1}</span>
          <span class="short">${BRISTOL_SHORT[i]}</span>
        </button>`)}
      <button type="button" class=${cx('skip', value === 0 && 'on')} aria-pressed=${value === 0 ? 'true' : 'false'}
        onClick=${() => onChange(value === 0 ? undefined : 0)}>ไม่ได้ดู /<br />ข้าม</button>
    </div>
    <div class="bristol-legend">
      <div style="border-top: 3px solid #D9B48F">1–2 ท้องผูก</div>
      <div style="border-top: 3px solid #6A9471">3–4 ปกติ</div>
      <div style="border-top: 3px solid #A9B6D3">5–7 ค่อนข้างเหลว</div>
    </div>
  </div>`;

// ภาพท้อง 9 จุด ตำแหน่งตรงตามดีไซน์ (กรอบ 362 × 290) ย่อลงเองถ้าจอแคบกว่า
const ROWS = [90, 174, 245];
export function BellyMap({ title, zones, onChange }) {
  const wrap = useRef(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => wrap.current && setScale(Math.min(1, wrap.current.clientWidth / 362));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  const pick = (z) => onChange(toggle(zones, z));
  const side = (labels, left) => labels.map((z, i) => {
    const on = zones.includes(z);
    const style = `top: ${ROWS[i] - 22}px; left: ${left ? 0 : 215}px`;
    return html`
      <button type="button" class=${cx('zone side', on && 'on')} style=${style} aria-pressed=${on ? 'true' : 'false'} aria-label=${z} onClick=${() => pick(z)}>
        ${left
          ? html`<span class="lab" style="text-align: right">${z}</span><span class="line"></span><span class="dot"></span>`
          : html`<span class="dot"></span><span class="line"></span><span class="lab" style="text-align: left">${z}</span>`}
      </button>`;
  });
  return html`
    <div class="log-section">
      <div class="section-head">
        <h2 class="h2-lg">${title}</h2>
        <div class="hint">แตะได้หลายจุด</div>
      </div>
      <div class="belly-wrap" ref=${wrap} style=${`height: ${290 * scale}px`}>
        <div class="belly" style=${`transform: scale(${scale})`}>
          <div class="side-label" style="left: 0; text-align: right">ขวาของเรา</div>
          <div class="side-label" style="left: 214px">ซ้ายของเรา</div>
          <svg style="position: absolute; left: 51px; top: 30px" width="260" height="250" viewBox="0 0 260 250" fill="none" aria-hidden="true">
            <path d="M36 3C36 28 41 52 41 76C41 130 3 180 3 247M224 3C224 28 219 52 219 76C219 130 257 180 257 247" stroke="#A39A87" stroke-width="3" stroke-linecap="round" />
            <path d="M131 135Q121 144 131 153" stroke="#A39A87" stroke-width="3" stroke-linecap="round" />
          </svg>
          ${side(ZONES_RIGHT, true)}
          ${side(ZONES_LEFT, false)}
          ${ZONES_MID.map((z, i) => {
            const on = zones.includes(z);
            return html`
              <button type="button" class=${cx('zone mid', on && 'on')} style=${`top: ${ROWS[i] - 11}px; left: 131px`}
                aria-pressed=${on ? 'true' : 'false'} aria-label=${z} onClick=${() => pick(z)}>
                <span class="dot"></span><span class="lab" style="text-align: center">${z}</span>
              </button>`;
          })}
        </div>
      </div>
    </div>`;
}

// ---------- แถบเมนูล่าง ----------
const TABS = [
  ['today', 'วันนี้'], ['history', 'ประวัติ'], ['trends', 'แนวโน้ม'], ['settings', 'ตั้งค่า']
];
export const Nav = ({ active }) => html`
  <nav class="nav" aria-label="เมนูหลัก">
    ${TABS.map(([key, label]) => html`
      <a href=${'#/' + key} class=${active === key ? 'on' : ''} aria-current=${active === key ? 'page' : undefined}>
        <${Icon} d=${TAB_PATHS[key]} />
        <span>${label}</span>
      </a>`)}
  </nav>`;

// ---------- กล่องยืนยัน ----------
export const Confirm = ({ title, message, confirmLabel, danger, onConfirm, onCancel }) => html`
  <div class="dialog-layer" onClick=${(e) => e.target === e.currentTarget && onCancel()}>
    <div class="dialog" role="alertdialog" aria-modal="true" aria-label=${title}>
      <h3>${title}</h3>
      ${message && html`<p>${message}</p>`}
      <div class="row">
        <button type="button" class="btn-plain" onClick=${onCancel}>ยกเลิก</button>
        <button type="button" class=${cx('btn-solid', danger && 'danger')} onClick=${onConfirm}>${confirmLabel}</button>
      </div>
    </div>
  </div>`;

// ---------- เพิ่มรายการใหม่ ----------
export function AddItemDialog({ title, placeholder, onAdd, onCancel }) {
  const [name, setName] = useState('');
  const input = useRef(null);
  useEffect(() => { input.current && input.current.focus(); }, []);
  const submit = (e) => { e.preventDefault(); if (name.trim()) onAdd(name.trim()); };
  return html`
    <div class="dialog-layer" onClick=${(e) => e.target === e.currentTarget && onCancel()}>
      <form class="dialog" onSubmit=${submit} aria-label=${title}>
        <h3>${title}</h3>
        <p style="font-size: 13px">เพิ่มแล้วจะอยู่ถาวรทุกวัน และเลือกให้ทันที</p>
        <input ref=${input} class="text-input" type="text" placeholder=${placeholder} value=${name}
          onInput=${(e) => setName(e.target.value)} enterkeyhint="done" maxlength="40" />
        <div class="row">
          <button type="button" class="btn-plain" onClick=${onCancel}>ยกเลิก</button>
          <button type="submit" class="btn-solid" disabled=${!name.trim()}>เพิ่ม</button>
        </div>
      </form>
    </div>`;
}

export function Toast({ text, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 1800); return () => clearTimeout(t); }, [text]);
  return html`<div class="toast" role="status">${text}</div>`;
}
