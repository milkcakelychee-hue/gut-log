// ตั้งค่า › จัดการรายการ (10-manage-lists)
import { html, useState, useRef } from '../vendor/preact-htm.js';
import { Confirm, cx } from '../ui.js';
import { Icon, CHEVRON_LEFT } from '../icons.js';
import { useStore, itemsOf, addItem, putItem, deleteItem, reorderItems } from '../store.js';

const CATS = [['risk_food', 'อาหารเสี่ยง'], ['symptom', 'อาการ'], ['bowel_symptom', 'อาการร่วม'], ['factor', 'ปัจจัยรายวัน']];
const PLACEHOLDER = { risk_food: 'เพิ่มรายการใหม่ เช่น ชานม', symptom: 'เพิ่มอาการ เช่น เรอบ่อย', bowel_symptom: 'เพิ่มอาการร่วม เช่น ถ่ายมีเศษอาหาร' };
const WEEK = 7 * 86400000;

const EYE = 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12zM9.2 12a2.8 2.8 0 1 0 5.6 0a2.8 2.8 0 1 0 -5.6 0';
const TRASH = 'M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3';

export function Manage({ category }) {
  useStore();
  const cat = CATS.some(([k]) => k === category) ? category : 'risk_food';
  const isFactor = cat === 'factor';
  const [name, setName] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [drag, setDrag] = useState(null);
  const list = useRef(null);

  const shown = itemsOf(cat);
  const hidden = itemsOf(cat, { includeHidden: true }).filter((i) => i.hidden);
  const ordered = drag ? drag.ids.map((id) => shown.find((i) => i.id === id)).filter(Boolean) : shown;

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addItem(cat, name);
    setName('');
  };

  // ลาก ⋮⋮ เพื่อเรียง
  const startDrag = (e, id) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id, ids: shown.map((i) => i.id) });
  };
  const moveDrag = (e) => {
    if (!drag) return;
    const rows = [...list.current.querySelectorAll('.mg-row')];
    let target = rows.length - 1;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) { target = i; break; }
    }
    const from = drag.ids.indexOf(drag.id);
    if (target === from) return;
    const ids = drag.ids.slice();
    ids.splice(from, 1);
    ids.splice(target, 0, drag.id);
    setDrag({ ...drag, ids });
  };
  const endDrag = async () => {
    if (!drag) return;
    const ids = drag.ids;
    setDrag(null);
    await reorderItems(ids);
  };

  return html`
    <main class="page manage" style="gap: 16px">
      <div style="display: flex; flex-direction: column; gap: 4px">
        <button type="button" class="back-link" onClick=${() => (location.hash = '#/settings')}><${Icon} d=${CHEVRON_LEFT} size=${22} width=${2.2} /> ตั้งค่า</button>
        <h1 class="h1-day">จัดการรายการ</h1>
      </div>

      <div class="cat-scroll">
        ${CATS.map(([k, label]) => html`
          <button type="button" class=${cx('cat-pill', k === cat && 'on')} onClick=${() => location.replace('#/manage/' + k)}>${label}</button>`)}
      </div>

      ${!isFactor && html`
        <form style="display: flex; gap: 8px" onSubmit=${add}>
          <label for="newItem" class="sr-only">เพิ่มรายการใหม่</label>
          <input id="newItem" class="text-input" type="text" maxlength="40" enterkeyhint="done" placeholder=${PLACEHOLDER[cat]}
            value=${name} onInput=${(e) => setName(e.target.value)} />
          <button type="submit" class="btn-solid" style="padding: 0 20px; flex-shrink: 0" disabled=${!name.trim()}>เพิ่ม</button>
        </form>`}

      <section class="section" style="gap: 8px">
        <div class="section-head" style="margin: 0 4px">
          <h2 class="set-title" style="margin: 0">แสดงในหน้า${cat === 'bowel_symptom' || cat === 'symptom' ? 'บันทึก' : 'วันนี้'}</h2>
          <span style="font-size: 12px; color: #5C675F">ลาก ⋮⋮ เพื่อเรียง</span>
        </div>
        <div class="card mg-card" ref=${list}>
          ${ordered.length === 0 && html`<div class="mg-empty">ไม่มีรายการที่แสดงอยู่</div>`}
          ${ordered.map((i) => html`
            <div class=${cx('mg-row', drag && drag.id === i.id && 'dragging')} key=${i.id}>
              <span class="mg-handle" aria-label=${'ลากเพื่อย้าย ' + i.name}
                onPointerDown=${(e) => startDrag(e, i.id)} onPointerMove=${moveDrag} onPointerUp=${endDrag} onPointerCancel=${endDrag}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" /></svg>
              </span>
              <span class="mg-name">${i.name}${i.createdAt && Date.now() - i.createdAt < WEEK && html`<span class="new-badge">ใหม่</span>`}</span>
              <button type="button" class="icon-btn" aria-label=${'ซ่อน ' + i.name} onClick=${() => putItem({ ...i, hidden: true })}><${Icon} d=${EYE} size=${20} /></button>
              ${!isFactor && html`<button type="button" class="icon-btn" style="color: #A0553A" aria-label=${'ลบ ' + i.name} onClick=${() => setConfirm(i)}><${Icon} d=${TRASH} size=${20} /></button>`}
            </div>`)}
        </div>
      </section>

      ${hidden.length > 0 && html`
        <section class="section" style="gap: 8px">
          <h2 class="set-title">ซ่อนอยู่</h2>
          <div class="card mg-card" style="padding: 0 6px 0 16px">
            ${hidden.map((i) => html`
              <div class="mg-row">
                <span class="mg-name" style="color: #6E776F">${i.name}</span>
                <button type="button" class="chip tight" style="font-size: 14px; color: #3B5E44; font-weight: 500" onClick=${() => putItem({ ...i, hidden: false })}>แสดง</button>
                ${!isFactor && html`<button type="button" class="icon-btn" style="color: #A0553A" aria-label=${'ลบ ' + i.name} onClick=${() => setConfirm(i)}><${Icon} d=${TRASH} size=${20} /></button>`}
              </div>`)}
          </div>
        </section>`}

      <p class="hint" style="margin: 0 4px; line-height: 1.55">ซ่อน = ไม่โชว์ให้เลือก แต่ข้อมูลเก่ายังอยู่ในประวัติและกราฟ<br />
        ${isFactor ? 'ปัจจัยรายวันลบไม่ได้ ซ่อนได้อย่างเดียว' : 'ลบ = เอาออกถาวร (จะถามยืนยันก่อน) บันทึกเก่าที่เคยเลือกไว้ยังแสดงชื่อเดิม'}</p>
    </main>

    ${confirm && html`
      <${Confirm} title=${'ลบ "' + confirm.name + '" ถาวร?'} message="จะไม่มีให้เลือกอีก แต่บันทึกเก่าที่เคยเลือกไว้ยังอยู่ ถ้าแค่ไม่อยากเห็น ให้ใช้ซ่อนแทน"
        confirmLabel="ลบ" danger onCancel=${() => setConfirm(null)}
        onConfirm=${async () => { await deleteItem(confirm.id); setConfirm(null); }} />`}
  `;
}
