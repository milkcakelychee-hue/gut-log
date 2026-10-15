// หน้าประวัติ (05-history): ปฏิทินรายเดือน + การ์ดวันที่เลือก
import { html, useState } from '../vendor/preact-htm.js';
import { Nav } from '../ui.js';
import { Icon, CHEVRON_LEFT, CHEVRON_RIGHT } from '../icons.js';
import {
  GROUP_FILL, TH_DAYS_SHORT, TH_MONTHS, bristolGroup, parseLocal, dateKey, dayRepType, factorTags, summarizeDay, thShortDate, thYear
} from '../rules.js';
import { useStore, entriesOn, dayOf } from '../store.js';

// จำเดือนและวันที่เลือกไว้ เวลากลับมาจากหน้ารายละเอียด
const view = { month: null, selected: null };

export function History() {
  const s = useStore();
  const today = dateKey();
  const now = new Date();
  const [month, setMonthState] = useState(view.month || { y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelectedState] = useState(view.selected || today);
  const setMonth = (v) => { view.month = v; setMonthState(v); };
  const setSelected = (v) => { view.selected = v; setSelectedState(v); };

  const weekStart = s.settings.weekStart ?? 0;
  const first = new Date(month.y, month.m, 1);
  const daysIn = new Date(month.y, month.m + 1, 0).getDate();
  const lead = (first.getDay() - weekStart + 7) % 7;
  const isCurrent = month.y === now.getFullYear() && month.m === now.getMonth();

  const cells = [];
  const sum = { n: 0, c: 0, l: 0 };
  for (let d = 1; d <= daysIn; d++) {
    const date = dateKey(new Date(month.y, month.m, d));
    const entries = entriesOn(date);
    const future = date > today;
    const type = dayRepType(entries);
    const group = bristolGroup(type);
    if (group) sum[group]++;
    const info = summarizeDay(entries);
    const hasRecord = entries.length > 0 || !!dayOf(date).submittedAt;
    cells.push({ d, date, future, type, group, info, hasRecord });
  }

  const shift = (delta) => {
    const d = new Date(month.y, month.m + delta, 1);
    setMonth({ y: d.getFullYear(), m: d.getMonth() });
  };

  const weekdays = Array.from({ length: 7 }, (_, i) => TH_DAYS_SHORT[(i + weekStart) % 7]);

  return html`
    <main class="page has-nav history">
      <div class="history-head">
        <h1 class="h1-sm">History</h1>
        <div class="month-nav">
          <button type="button" class="round-btn" aria-label="เดือนก่อน" onClick=${() => shift(-1)}><${Icon} d=${CHEVRON_LEFT} size=${18} width=${2.2} /></button>
          <div class="month-label">${TH_MONTHS[month.m]} ${thYear(month.y)}</div>
          <button type="button" class="round-btn" aria-label="เดือนถัดไป" disabled=${isCurrent} onClick=${() => shift(1)}><${Icon} d=${CHEVRON_RIGHT} size=${18} width=${2.2} /></button>
        </div>
      </div>

      <div class="card calendar">
        <div class="cal-grid cal-week">${weekdays.map((w) => html`<span>${w}</span>`)}</div>
        <div class="cal-grid">
          ${Array.from({ length: lead }, () => html`<span class="cal-cell blank" aria-hidden="true"></span>`)}
          ${cells.map((c) => html`
            <button type="button" class=${'cal-cell' + (c.date === selected ? ' sel' : c.date === today ? ' today' : '')}
              disabled=${c.future} aria-label=${cellLabel(c)} aria-pressed=${c.date === selected ? 'true' : 'false'}
              onClick=${() => (c.date === selected ? (location.hash = '#/day/' + c.date) : setSelected(c.date))}>
              <span class="cal-num">${c.d}</span>
              ${c.future ? html`<span class="cal-pill"></span>`
                : c.type ? html`<span class="cal-pill filled" style=${'background: ' + GROUP_FILL[c.group]}>${c.type}</span>`
                : c.info.count ? html`<span class="cal-pill filled neutral">?</span>`
                : c.hasRecord ? html`<span class="cal-pill filled neutral">0</span>`
                : html`<span class="cal-pill empty">–</span>`}
              ${c.info.maxPain >= 5 && html`<span class="cal-dot"></span>`}
            </button>`)}
        </div>
        <div class="cal-legend">
          <span><i style="background: #EBCFB2"></i>ผูก 1–2</span>
          <span><i style="background: #C9DFCC"></i>ปกติ 3–4</span>
          <span><i style="background: #CBD6EC"></i>เหลว 5–7</span>
          <span><i class="dot"></i>ปวด 5+</span>
        </div>
      </div>

      <div class="month-sum">
        <div class="card">ปกติ <b>${sum.n}</b> วัน</div>
        <div class="card">ผูก <b>${sum.c}</b> วัน</div>
        <div class="card">เหลว <b>${sum.l}</b> วัน</div>
      </div>

      ${selected.slice(0, 7) === `${month.y}-${String(month.m + 1).padStart(2, '0')}` && html`<${DayCard} date=${selected} />`}
    </main>
    <div class="bottom"><${Nav} active="history" /></div>`;
}

function cellLabel(c) {
  const base = c.d + ' ' + TH_MONTHS[parseLocal(c.date).getMonth()];
  if (c.future) return base;
  if (c.type) return base + ' แบบ ' + c.type + (c.info.maxPain !== null ? ' ปวด ' + c.info.maxPain : '');
  if (c.hasRecord) return base + ' ขับถ่าย ' + c.info.count + ' ครั้ง';
  return base + ' ไม่ได้บันทึก';
}

function DayCard({ date }) {
  const entries = entriesOn(date);
  const info = summarizeDay(entries);
  const day = dayOf(date);
  const parts = [];
  if (entries.length || day.submittedAt) parts.push('ขับถ่าย ' + info.count + ' ครั้ง');
  if (info.types.length) parts.push('แบบ ' + info.types.join(', '));
  if (info.maxPain !== null) parts.push('ปวดสูงสุด ' + info.maxPain);
  const tags = factorTags(day);
  return html`
    <a class="day-card" href=${'#/day/' + date}>
      <span class="day-card-head">
        <span class="day-card-title">${thShortDate(date)}</span>
        <span class="day-card-link">${parts.length ? 'ดูรายละเอียด' : 'เพิ่มบันทึกย้อนหลัง'} <${Icon} d=${CHEVRON_RIGHT} size=${16} width=${2.2} /></span>
      </span>
      <span class="day-card-sub">${parts.length ? parts.join(' · ') : 'ไม่ได้บันทึก'}</span>
      ${(info.symptoms.length > 0 || tags.length > 0) && html`
        <span class="tags">
          ${info.symptoms.map((t) => html`<span class="mini-tag green">${t}</span>`)}
          ${tags.map((t) => html`<span class="mini-tag">${t}</span>`)}
        </span>`}
    </a>`;
}
