// หน้าวันนี้ (01-today / 02-today-empty)
import { html, useState } from '../vendor/preact-htm.js';
import { Chip, AddChip, Segmented, AddItemDialog, Nav, toggle } from '../ui.js';
import { Glyph, Icon, PLUS, entryGlyph } from '../icons.js';
import { FACTORS, dateKey, enDate, summarizeDay, dayStatus, entryTitle, entrySub, timeOf } from '../rules.js';
import { useStore, entriesOn, dayOf, updateDay, itemsOf, addItem } from '../store.js';

const STEPS = [
  ['หลังเข้าห้องน้ำ แตะ "+ ขับถ่าย"', 'เลือกลักษณะ ระดับปวด แล้วกดบันทึก'],
  ['ปวดหรืออืดตอนไม่ได้ถ่าย แตะ "+ อาการ"', 'เช่น ตื่นมาอืดท้อง ก่อนนอนปวดท้อง'],
  ['ก่อนนอน เลือกปัจจัยวันนี้', 'การนอน ความเครียด ประจำเดือน อาหารเสี่ยง']
];

export function Today({ onLog }) {
  const s = useStore();
  const [adding, setAdding] = useState(false);
  const today = dateKey();
  const entries = entriesOn(today).sort((a, b) => b.datetime.localeCompare(a.datetime) || b.createdAt - a.createdAt);
  const sum = summarizeDay(entries);
  const status = dayStatus(entries);
  const firstTime = s.entries.length === 0;

  return html`
    <main class="page has-actions">
      <div class="today-head">
        <div style="display: flex; flex-direction: column; gap: 4px">
          <div class="date">${enDate(new Date())}</div>
          <h1 class="h1">Today</h1>
        </div>
        ${status && html`<div class=${'status-pill ' + status.tone}>${status.text}</div>`}
      </div>

      ${firstTime ? html`
        <section class="card onboard">
          <div style="display: flex; flex-direction: column; gap: 4px">
            <h2>เริ่มบันทึกวันแรก</h2>
            <p>แตะอย่างเดียว ครั้งละไม่ถึงนาที</p>
          </div>
          ${STEPS.map(([title, sub], i) => html`
            <div class="step">
              <span class="step-n">${i + 1}</span>
              <span class="step-text"><span class="step-title">${title}</span><span class="step-sub">${sub}</span></span>
            </div>`)}
          <div class="foot">กราฟแนวโน้มจะเริ่มแสดงเมื่อบันทึกครบ 7 วัน ไม่ต้องบันทึกทุกช่อง ข้ามได้เสมอ</div>
        </section>
      ` : html`
        <div class="stats">
          <div class="card stat"><div class="label">ขับถ่าย</div><div class="value">${sum.count} <span class="unit">ครั้ง</span></div></div>
          <div class="card stat"><div class="label">ปวดสูงสุด</div><div class="value">${sum.maxPain ?? '–'} <span class="unit">/10</span></div></div>
          <div class="card stat"><div class="label">ลักษณะ</div><div class="value">${sum.types.length ? sum.types.join(', ') : '–'}</div></div>
        </div>
      `}

      <section class="section">
        <h2 class="h2">บันทึกวันนี้</h2>
        ${entries.length === 0
          ? html`<div class="empty-box">ยังไม่มีบันทึก · กดปุ่มด้านล่างเพื่อเริ่ม</div>`
          : entries.map((e) => html`
            <button type="button" class="card entry-row" onClick=${() => onLog({ entry: e })}>
              <div class="entry-icon" style=${'background: ' + (e.kind === 'symptom' ? '#F3EDE2' : '#E3ECE2')}>
                <${Glyph} d=${entryGlyph(e)} />
              </div>
              <div class="entry-text">
                <div class="entry-title">${entryTitle(e)}</div>
                <div class="entry-sub">${entrySub(e)}</div>
              </div>
              <div class="entry-time">${timeOf(e.datetime)}</div>
            </button>`)}
      </section>

      <${Factors} date=${today} firstTime=${firstTime} onAddFood=${() => setAdding(true)} />
    </main>

    <div class="bottom with-actions">
      <div class="actions">
        <button type="button" class="btn-primary" style="flex: 3" onClick=${() => onLog({ mode: 'bowel' })}>
          <${Icon} d=${PLUS} size=${22} width=${2.4} /> ขับถ่าย
        </button>
        <button type="button" class="btn-secondary" style="flex: 2" onClick=${() => onLog({ mode: 'symptom' })}>
          <${Icon} d=${PLUS} size=${20} width=${2.4} /> อาการ
        </button>
      </div>
      <${Nav} active="today" />
    </div>

    ${adding && html`
      <${AddItemDialog} title="เพิ่มอาหารเสี่ยง" placeholder="เช่น ชานม" onCancel=${() => setAdding(false)}
        onAdd=${async (name) => {
          const item = await addItem('risk_food', name);
          const day = dayOf(today);
          if (item && !day.riskFoods.includes(item.name)) await updateDay(today, { riskFoods: day.riskFoods.concat([item.name]) });
          setAdding(false);
        }} />`}
  `;
}

// ปัจจัยรายวัน ใช้ซ้ำในหน้ารายละเอียดวันได้
export function Factors({ date, firstTime, onAddFood }) {
  const day = dayOf(date);
  const rows = itemsOf('factor');
  const showFoods = rows.some((r) => r.key === 'riskFood');
  const foods = itemsOf('risk_food').map((i) => i.name);
  const shownFoods = foods.concat(day.riskFoods.filter((f) => !foods.includes(f)));
  return html`
    <section class="section">
      <div class="section-head">
        <h2 class="h2">${date === dateKey() ? 'ปัจจัยวันนี้' : 'ปัจจัย'}</h2>
        ${firstTime && html`<span class="hint">เลือกตอนไหนก็ได้</span>`}
      </div>
      <div class="card factors">
        ${rows.map((r) => html`
          <div class="factor-row">
            <div class="factor-label">${r.name}</div>
            <${Segmented} label=${r.name} opts=${FACTORS[r.key].opts} value=${day[r.key]} onChange=${(v) => updateDay(date, { [r.key]: v })} />
          </div>`)}
        ${showFoods && html`
          <div class="risk-foods" style=${rows.length ? '' : 'border-top: none; padding-top: 0'}>
            <div class="hint">มีอะไรบ้าง (ไม่บังคับ)</div>
            <div class="chips">
              ${shownFoods.map((f) => html`
                <${Chip} tight on=${day.riskFoods.includes(f)} onClick=${() => updateDay(date, { riskFoods: toggle(day.riskFoods, f) })}>${f}<//>`)}
              <${AddChip} tight onClick=${onAddFood} />
            </div>
          </div>`}
      </div>
    </section>`;
}
