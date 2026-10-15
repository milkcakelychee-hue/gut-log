// หน้ารายละเอียดวัน (06-day-detail)
import { html, useState } from '../vendor/preact-htm.js';
import { AddItemDialog } from '../ui.js';
import { Glyph, Icon, CHEVRON_LEFT, entryGlyph } from '../icons.js';
import {
  GROUP_FILL, WHEN_LABEL, bristolGroup, dateKey, entryTitle, factorLabel, mealsText, summarizeDay, thLongDate, timeOf
} from '../rules.js';
import { useStore, entriesOn, dayOf, factorView, editFactors, startEditFactors, itemsOf, addItem } from '../store.js';
import { Factors } from './today.js';

export function Day({ date, onLog }) {
  useStore();
  const [adding, setAdding] = useState(false);
  const entries = entriesOn(date).sort((a, b) => a.datetime.localeCompare(b.datetime));
  const info = summarizeDay(entries);
  const day = dayOf(date);
  const isToday = date === dateKey();
  const showTable = day.submittedAt && !day.draft;
  const back = () => (history.length > 1 ? history.back() : (location.hash = '#/history'));
  const log = (mode, entry) => onLog({ mode, entry, date, backLabel: 'บันทึกแล้ว · กลับ' });

  const sub = [];
  if (entries.length || day.submittedAt) sub.push('ขับถ่าย ' + info.count + ' ครั้ง');
  if (info.maxPain !== null) sub.push('ปวดสูงสุด ' + info.maxPain + '/10');

  return html`
    <main class="page day-page">
      <div style="display: flex; flex-direction: column; gap: 6px">
        <button type="button" class="back-link" onClick=${back}><${Icon} d=${CHEVRON_LEFT} size=${22} width=${2.2} /> ประวัติ</button>
        <h1 class="h1-day">${thLongDate(date)}</h1>
        <div class="sub">${sub.length ? sub.join(' · ') : 'ยังไม่มีบันทึก'}</div>
      </div>

      ${entries.length > 0 && html`
        <section class="section">
          <div class="section-head">
            <h2 class="h2">อาการวันนั้น</h2>
            <span class="hint">รวมจากที่บันทึกไว้</span>
          </div>
          ${info.symptoms.length
            ? html`<div class="chips">${info.symptoms.map((s) => html`<span class="sym-pill">${s}</span>`)}</div>`
            : html`<div class="hint" style="font-size: 15px">ไม่มีอาการ</div>`}
        </section>`}

      ${showTable ? html`
        <section class="section">
          <div class="section-head" style="align-items: center">
            <h2 class="h2">ปัจจัย</h2>
            <button type="button" class="text-btn" onClick=${() => startEditFactors(date)}>แก้ไข</button>
          </div>
          <div class="card factor-table">
            ${itemsOf('factor').map((r) => html`
              <div class="ft-row">
                <span class="ft-label">${r.name}</span>
                <span class="ft-value">${factorValue(r.key, day)}</span>
              </div>`)}
          </div>
        </section>
      ` : html`<${Factors} date=${date} onAddFood=${() => setAdding(true)} />`}

      <section class="section" style="gap: 12px">
        <h2 class="h2">บันทึกของวันนั้น</h2>
        ${entries.length === 0 && html`<div class="empty-box">ยังไม่มีบันทึกในวันนี้</div>`}
        ${entries.map((e) => html`<${EntryCard} entry=${e} onEdit=${() => log(e.kind, e)} />`)}
      </section>

      <div class="add-back">
        <button type="button" class="dash-btn" style="flex: 3" onClick=${() => log('bowel')}>+ ขับถ่าย${isToday ? '' : 'ย้อนหลัง'}</button>
        <button type="button" class="dash-btn" style="flex: 2" onClick=${() => log('symptom')}>+ อาการ</button>
      </div>
    </main>

    ${adding && html`
      <${AddItemDialog} title="เพิ่มอาหารเสี่ยง" placeholder="เช่น ชานม" onCancel=${() => setAdding(false)}
        onAdd=${async (name) => {
          const item = await addItem('risk_food', name);
          const v = factorView(date);
          if (item && !v.riskFoods.includes(item.name)) await editFactors(date, { riskFoods: v.riskFoods.concat([item.name]) });
          setAdding(false);
        }} />`}
  `;
}

function factorValue(key, day) {
  if (key === 'riskFood') {
    const meals = mealsText(day);
    const foods = (day.riskFoods || []).join(', ');
    return [meals, foods].filter(Boolean).join(' · ') || '–';
  }
  return factorLabel(key, day[key]) || '–';
}

function EntryCard({ entry: e, onEdit }) {
  const tint = e.kind === 'symptom' ? '#F3EDE2' : e.bristol ? GROUP_FILL[bristolGroup(e.bristol)] : '#EFEAE0';
  const time = timeOf(e.datetime) + (e.kind === 'symptom' && e.when && e.when !== 'now' ? ' · ' + WHEN_LABEL[e.when] : '');
  const details = [
    e.zones && e.zones.length ? ['ตำแหน่ง', e.zones.join(', ')] : null,
    e.kind === 'bowel' && e.symptoms && e.symptoms.length ? ['อาการร่วม', e.symptoms.join(', ')] : null,
    e.note ? ['โน้ต', e.note] : null
  ].filter(Boolean);
  return html`
    <article class="card entry-card">
      <div class="entry-card-head">
        <div class="entry-icon big" style=${'background: ' + tint + '; color: #27332C'}><${Glyph} d=${entryGlyph(e)} size=${36} /></div>
        <div style="flex: 1; display: flex; flex-direction: column; min-width: 0">
          <span class="entry-card-title">${entryTitle(e)}</span>
          <span class="entry-sub">${time}</span>
        </div>
        <button type="button" class="round-btn" aria-label="แก้ไขรายการนี้" onClick=${onEdit}>
          <${Icon} d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" size=${18} width=${2} />
        </button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px">
        <div style="display: flex; justify-content: space-between; font-size: 14px">
          <span style="color: #5C675F">ปวดท้อง</span>
          <span style="font-weight: 600">${e.pain === null || e.pain === undefined ? 'ไม่ได้ระบุ' : e.pain + '/10'}</span>
        </div>
        <div class="pain-bar">
          ${Array.from({ length: 10 }, (_, i) => html`<span style=${'background: ' + (i < (e.pain || 0) ? (e.pain >= 5 ? '#B86A45' : '#47704F') : '#ECE7DC')}></span>`)}
        </div>
      </div>
      ${details.length > 0 && html`
        <div class="entry-more">
          ${details.map(([k, v]) => html`<div><span>${k}</span><span>${v}</span></div>`)}
        </div>`}
    </article>`;
}
