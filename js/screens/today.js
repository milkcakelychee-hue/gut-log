// หน้าวันนี้ (01-today / 02-today-empty)
import { html, useState } from '../vendor/preact-htm.js';
import { Chip, AddChip, Segmented, AddItemDialog, Nav, toggle } from '../ui.js';
import { Glyph, Icon, PLUS, entryGlyph } from '../icons.js';
import { FACTORS, FACTOR_SPAN, FACTOR_HINT, dateKey, enDate, summarizeDay, dayStatus, entryTitle, entrySub, timeOf } from '../rules.js';
import { exportBackup } from '../export.js';
import { backupAge } from './settings.js';
import { useStore, entriesOn, factorView, editFactors, submitFactors, startEditFactors, cancelEditFactors, itemsOf, addItem } from '../store.js';

const STEPS = [
  ['หลังเข้าห้องน้ำ แตะ "+ ขับถ่าย"', 'เลือกลักษณะ ระดับปวด แล้วกดบันทึก'],
  ['ปวดหรืออืดตอนไม่ได้ถ่าย แตะ "+ อาการ"', 'เช่น ตื่นมาอืดท้อง ก่อนนอนปวดท้อง'],
  ['ก่อนนอน เลือกปัจจัยวันนี้', 'การนอน ความเครียด ประจำเดือน อาหารเสี่ยง']
];

export function Today({ onLog, toast }) {
  const s = useStore();
  const [adding, setAdding] = useState(false);
  const today = dateKey();
  const entries = entriesOn(today).sort((a, b) => b.datetime.localeCompare(a.datetime) || b.createdAt - a.createdAt);
  const sum = summarizeDay(entries);
  const status = dayStatus(entries);
  const firstTime = s.entries.length === 0;
  const backupDue = needsBackup(s);

  return html`
    <main class="page has-actions">
      <div class="today-head">
        <div style="display: flex; flex-direction: column; gap: 4px">
          <div class="date">${enDate(new Date())}</div>
          <h1 class="h1">Today</h1>
        </div>
        ${status && html`<div class=${'status-pill ' + status.tone}>${status.text}</div>`}
      </div>

      ${backupDue !== null && html`
        <div class="backup-banner">
          <span>${backupDue === Infinity ? 'ยังไม่เคยสำรองข้อมูล' : 'ไม่ได้สำรองข้อมูลมา ' + backupDue + ' วัน'}</span>
          <button type="button" onClick=${async () => { try { if (await exportBackup()) toast('สำรองข้อมูลแล้ว'); } catch (e) { toast('สำรองไม่สำเร็จ'); } }}>สำรองตอนนี้</button>
        </div>`}

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
          const v = factorView(today);
          if (item && !v.riskFoods.includes(item.name)) await editFactors(today, { riskFoods: v.riskFoods.concat([item.name]) });
          setAdding(false);
        }} />`}
  `;
}

// ปัจจัยรายวัน: เลือก → กดส่ง (วันละ 1 ชุด) → แก้ไขได้  ใช้ซ้ำในหน้ารายละเอียดวัน
export function Factors({ date, firstTime, onAddFood }) {
  const v = factorView(date);
  const isToday = date === dateKey();
  const rows = itemsOf('factor');
  const showFoods = rows.some((r) => r.key === 'riskFood');
  const foods = itemsOf('risk_food').map((i) => i.name);
  const shownFoods = foods.concat(v.riskFoods.filter((f) => !foods.includes(f)));
  const set = (patch) => editFactors(date, patch);
  const sentAt = v.submittedAt ? new Date(v.submittedAt) : null;
  const sentLabel = sentAt
    ? '✓ ส่งแล้ว ' + (dateKey(sentAt) === date ? String(sentAt.getHours()).padStart(2, '0') + ':' + String(sentAt.getMinutes()).padStart(2, '0') : '')
    : '';

  let tag = null;
  if (v.locked) tag = html`<span class="tag done">${sentLabel.trim()}</span>`;
  else if (v.editing && v.submittedAt) tag = html`<span class="tag">กำลังแก้ไข</span>`;
  else if (v.filled) tag = html`<span class="tag">ยังไม่ส่ง</span>`;
  else if (firstTime) tag = html`<span class="hint">เลือกตอนไหนก็ได้</span>`;

  return html`
    <section class="section">
      <div class="section-head">
        <h2 class="h2">${isToday ? 'ปัจจัยวันนี้' : 'ปัจจัย'}</h2>
        ${tag}
      </div>
      <div class=${'card factors' + (v.locked ? ' locked' : '')}>
        ${rows.map((r) => html`
          <div class="factor-block">
            <div class="factor-row">
              <div class="factor-label">${r.name}<span>${FACTOR_SPAN[r.key]}</span></div>
              ${r.key === 'riskFood'
                ? html`<${MealsInput} value=${v.riskMeals} locked=${v.locked} onChange=${(n) => set({ riskMeals: n })} />`
                : html`<${Segmented} label=${r.name} opts=${FACTORS[r.key].opts} value=${v[r.key]} onChange=${(x) => !v.locked && set({ [r.key]: x })} />`}
            </div>
            ${FACTOR_HINT[r.key] && v[r.key] && html`<div class="factor-hint">${FACTOR_HINT[r.key][v[r.key]]}</div>`}
          </div>`)}
        ${showFoods && (v.locked
          ? html`<div class="risk-foods"><div class="hint">${v.riskFoods.length ? 'กิน: ' + v.riskFoods.join(', ') : 'ไม่ได้ระบุว่ากินอะไร'}</div></div>`
          : html`
          <div class="risk-foods" style=${rows.length ? '' : 'border-top: none; padding-top: 0'}>
            <div class="hint">${isToday ? 'วันนี้' : 'วันนั้น'}กินอะไรไปบ้าง (เลือกได้หลายข้อ รวมทุกมื้อ)</div>
            <div class="chips">
              ${shownFoods.map((f) => html`
                <${Chip} tight on=${v.riskFoods.includes(f)} onClick=${() => set({ riskFoods: toggle(v.riskFoods, f) })}>${f}<//>`)}
              <${AddChip} tight onClick=${onAddFood} />
            </div>
          </div>`)}
        <div class="factor-actions">
          ${v.locked
            ? html`<button type="button" class="btn-plain" onClick=${() => startEditFactors(date)}>แก้ไข</button>`
            : v.editing && v.submittedAt
              ? html`
                <button type="button" class="btn-plain" style="flex: 1" onClick=${() => cancelEditFactors(date)}>ยกเลิก</button>
                <button type="button" class="btn-solid" style="flex: 2" onClick=${() => submitFactors(date)}>บันทึกการแก้ไข</button>`
              : html`<button type="button" class="btn-solid" disabled=${!v.filled} onClick=${() => submitFactors(date)}>${isToday ? 'ส่งปัจจัยวันนี้' : 'บันทึกปัจจัยวันนั้น'}</button>`}
        </div>
      </div>
    </section>`;
}

// อาหารเสี่ยง: "ไม่มี" หรือกรอกจำนวนมื้อเอง
function MealsInput({ value, locked, onChange }) {
  const onInput = (e) => {
    const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 1);
    e.target.value = digits;
    onChange(digits === '' ? null : Number(digits));
  };
  return html`
    <div class="seg two" role="group" aria-label="อาหารเสี่ยง">
      <button type="button" class=${value === 0 ? 'on' : ''} aria-pressed=${value === 0 ? 'true' : 'false'}
        onClick=${() => !locked && onChange(value === 0 ? null : 0)}>ไม่มี</button>
      <label class=${'meals' + (value > 0 ? ' on' : '')}>
        <input type="text" inputmode="numeric" pattern="[0-9]*" placeholder="–" aria-label="จำนวนมื้อที่กินอาหารเสี่ยง"
          value=${value > 0 ? String(value) : ''} disabled=${locked} onInput=${onInput}
          onFocus=${(e) => e.target.select()} />
        <span>มื้อ</span>
      </label>
    </div>`;
}

// เตือนสำรองข้อมูล: มีบันทึกมาแล้ว 7 วันขึ้นไป และไม่ได้สำรองเกิน 7 วัน  คืน null ถ้ายังไม่ต้องเตือน
function needsBackup(s) {
  if (!s.entries.length) return null;
  const first = Math.min(...s.entries.map((e) => e.createdAt || Date.now()));
  if (Date.now() - first < 7 * 86400000) return null;
  const age = backupAge(s.settings);
  if (age === null) return Infinity;
  return age >= 7 ? age : null;
}
