// หน้าแนวโน้ม (07-trends-week / 08-trends-month)
import { html, useState } from '../vendor/preact-htm.js';
import { Nav } from '../ui.js';
import { Icon, CHEVRON_LEFT, CHEVRON_RIGHT } from '../icons.js';
import { FACTORS, GROUP_FILL, TH_DAYS_SHORT, TH_MONTHS, TH_MONTHS_SHORT, bristolGroup, dateKey, parseLocal, thYear } from '../rules.js';
import { useStore, itemsOf } from '../store.js';
import { MIN_DAYS, addDays, dateRuns, datesFrom, dayData, factorSummary, fmt1, recordedDayCount, summarize, topSymptoms } from '../stats.js';

const view = { mode: 'week', weekOffset: 0, month: null };
const DOT_FILL = { c: '#C9935F', n: '#47704F', l: '#6B82B8' };
const DISCLAIMER = 'สรุปจากที่บันทึกเอง ใช้ดูแนวโน้มเท่านั้น ไม่ใช่การวินิจฉัย ยิ่งบันทึกนาน (3–4 สัปดาห์ขึ้นไป) ยิ่งเห็นรูปแบบชัดขึ้น';

export function Trends() {
  useStore();
  const [, force] = useState(0);
  const set = (patch) => { Object.assign(view, patch); force((x) => x + 1); };
  const recorded = recordedDayCount();

  return html`
    <main class="page has-nav trends">
      <h1 class="h1-sm">Trends</h1>
      ${recorded < MIN_DAYS ? html`<${Locked} n=${recorded} />` : html`
        <div class="tabs" style="margin-top: 0; border-radius: 14px">
          <button type="button" class=${view.mode === 'week' ? 'on' : ''} style="height: 44px; border-radius: 11px; font-size: 15px" onClick=${() => set({ mode: 'week' })}>สัปดาห์</button>
          <button type="button" class=${view.mode === 'month' ? 'on' : ''} style="height: 44px; border-radius: 11px; font-size: 15px" onClick=${() => set({ mode: 'month' })}>เดือน</button>
        </div>
        ${view.mode === 'week'
          ? html`<${Week} offset=${view.weekOffset} setOffset=${(o) => set({ weekOffset: o })} />`
          : html`<${Month} month=${view.month} setMonth=${(m) => set({ month: m })} />`}
      `}
    </main>
    <div class="bottom"><${Nav} active="trends" /></div>`;
}

function Locked({ n }) {
  return html`
    <section class="card trend-card" style="gap: 14px">
      <h2 class="h2">กราฟจะเริ่มแสดงเมื่อบันทึกครบ ${MIN_DAYS} วัน</h2>
      <div style="display: flex; flex-direction: column; gap: 6px">
        <div style="display: flex; justify-content: space-between; font-size: 14px"><span class="hint" style="font-size: 14px">บันทึกแล้ว</span><b>${n}/${MIN_DAYS} วัน</b></div>
        <div class="bar-track" style="height: 12px"><span style=${`width: ${(n / MIN_DAYS) * 100}%; background: #6A9471`}></span></div>
      </div>
      <p class="hint" style="line-height: 1.5">ไม่ต้องติดกัน วันไหนที่มีบันทึกการขับถ่าย อาการ หรือส่งปัจจัยแล้ว นับเป็น 1 วัน</p>
    </section>`;
}

const RangeNav = ({ label, sub, onPrev, onNext, canNext }) => html`
  <div style="display: flex; justify-content: space-between; align-items: center">
    <button type="button" class="round-btn" aria-label="ช่วงก่อนหน้า" onClick=${onPrev}><${Icon} d=${CHEVRON_LEFT} size=${18} width=${2.2} /></button>
    <div style="display: flex; flex-direction: column; align-items: center">
      <span style="font-size: 16px; font-weight: 500">${label}</span>
      ${sub && html`<span style="font-size: 12px; color: #5C675F">${sub}</span>`}
    </div>
    <button type="button" class="round-btn" aria-label="ช่วงถัดไป" disabled=${!canNext} onClick=${onNext}><${Icon} d=${CHEVRON_RIGHT} size=${18} width=${2.2} /></button>
  </div>`;

const Stat = ({ label, value, unit }) => html`
  <div class="card stat"><span class="label">${label}</span><span class="value">${value}${unit && html`<span class="unit">${unit}</span>`}</span></div>`;

function rangeLabel(start, end) {
  const a = parseLocal(start);
  const b = parseLocal(end);
  const left = a.getMonth() === b.getMonth() ? a.getDate() : a.getDate() + ' ' + TH_MONTHS_SHORT[a.getMonth()];
  return left + ' – ' + b.getDate() + ' ' + TH_MONTHS_SHORT[b.getMonth()] + ' ' + thYear(b.getFullYear());
}

// ---------- รายสัปดาห์ ----------
function Week({ offset, setOffset }) {
  const end = addDays(dateKey(), -7 * offset);
  const start = addDays(end, -6);
  const days = datesFrom(start, 7).map(dayData);
  const s = summarize(days);
  const empty = s.recorded === 0;

  return html`
    <${RangeNav} label=${rangeLabel(start, end)} onPrev=${() => setOffset(offset + 1)} onNext=${() => setOffset(offset - 1)} canNext=${offset > 0} />
    <div class="stats">
      <${Stat} label="ครั้ง/วัน" value=${fmt1(s.perDay)} />
      <${Stat} label="ลักษณะปกติ" value=${s.typedEntries ? s.normalEntries : '–'} unit=${s.typedEntries ? '/' + s.typedEntries + ' ครั้ง' : ''} />
      <${Stat} label="ปวดเฉลี่ย" value=${fmt1(s.painAvg)} unit=${s.painAvg === null ? '' : '/10'} />
    </div>
    ${empty ? html`<div class="empty-box">ช่วงนี้ไม่มีบันทึก</div>` : html`
      <${BristolDots} days=${days} />
      <${PainWeek} days=${days} />
      <${SymptomBars} title="อาการท้องที่พบบ่อย" rows=${topSymptoms(days, 'days')} max=${7} unit=${(v) => v + '/7 วัน'} />
      <${FactorSummary} days=${days} />
      <p class="hint" style="line-height: 1.5; margin: 0 4px">${DISCLAIMER}</p>
    `}`;
}

function BristolDots({ days }) {
  const top = 14;
  const step = 28;
  const yOf = (t) => top + (7 - t) * step;
  const dots = [];
  days.forEach((d, col) => {
    const types = d.entries.filter((e) => e.kind === 'bowel' && e.bristol).map((e) => e.bristol);
    const gap = types.length > 3 ? 8 : 12;
    types.forEach((t, k) => {
      const off = (k - (types.length - 1) / 2) * gap;
      dots.push(html`<span class="b-dot" style=${`background: ${DOT_FILL[bristolGroup(t)]}; top: ${yOf(t) - 8}px; left: calc(${((col + 0.5) / 7) * 100}% - 8px + ${off}px)`}></span>`);
    });
  });
  return html`
    <section class="card trend-card">
      <div style="display: flex; flex-direction: column; gap: 2px">
        <h2 class="h2">ลักษณะอุจจาระ</h2>
        <span class="hint">1 จุด = 1 ครั้ง · แถบเขียว = ช่วงปกติ (แบบ 3–4)</span>
      </div>
      <div style="display: flex; gap: 6px">
        <div style="width: 24px; position: relative; height: 196px; font-size: 11px; color: #5C675F">
          ${[1, 2, 3, 4, 5, 6, 7].map((t) => html`<span style=${`position: absolute; right: 0; top: ${yOf(t) - 8}px; line-height: 16px`}>${t}</span>`)}
        </div>
        <div role="img" aria-label="กราฟลักษณะอุจจาระรายวัน" style="flex: 1; position: relative; height: 196px">
          <div style="position: absolute; left: 0; right: 0; top: 84px; height: 56px; background: #E3ECE2; border-radius: 8px"></div>
          <div style="position: absolute; right: 0; top: 0; font-size: 11px; color: #5C675F">เหลว ↑</div>
          <div style="position: absolute; right: 0; bottom: 0; font-size: 11px; color: #5C675F">ผูก ↓</div>
          ${dots}
        </div>
      </div>
      <div style="display: flex; gap: 6px">
        <div style="width: 24px"></div>
        <div class="week-axis">
          ${days.map((d) => {
            const dt = parseLocal(d.date);
            return html`<span style="display: flex; flex-direction: column; line-height: 1.35"><span>${TH_DAYS_SHORT[dt.getDay()]}</span><span style="color: #27332C">${dt.getDate()}</span></span>`;
          })}
        </div>
      </div>
    </section>`;
}

const painColor = (v) => (v >= 5 ? '#B86A45' : v === 0 ? '#E6E0D3' : '#6A9471');

function PainWeek({ days }) {
  return html`
    <section class="card trend-card">
      <div style="display: flex; flex-direction: column; gap: 2px">
        <h2 class="h2">ปวดท้องสูงสุดรายวัน</h2>
        <span class="hint">0–10</span>
      </div>
      <div role="img" aria-label="กราฟแท่งระดับปวดสูงสุดรายวัน" class="pain-week">
        ${days.map((d) => {
          const v = d.info.maxPain;
          return html`
            <span class="pw-col">
              <span style="font-size: 12px; font-weight: 600">${v === null ? '–' : v}</span>
              ${v !== null && html`<span class="pw-bar" style=${`height: ${Math.max(v * 9, 3)}px; background: ${painColor(v)}`}></span>`}
            </span>`;
        })}
      </div>
      <div class="pain-week-axis">${days.map((d) => html`<span>${TH_DAYS_SHORT[parseLocal(d.date).getDay()]}</span>`)}</div>
    </section>`;
}

function SymptomBars({ title, rows, max, unit }) {
  return html`
    <section class="card trend-card">
      <h2 class="h2">${title}</h2>
      ${rows.length === 0 ? html`<div class="hint" style="font-size: 14px">ไม่มีอาการที่บันทึกไว้</div>` : rows.map(([label, v]) => html`
        <div style="display: flex; align-items: center; gap: 10px; font-size: 14px">
          <span style="width: 84px; flex-shrink: 0">${label}</span>
          <span class="bar-track"><span style=${`width: ${(v / max) * 100}%; background: #6A9471`}></span></span>
          <span style="min-width: 52px; text-align: right; color: #5C675F">${unit(v)}</span>
        </div>`)}
    </section>`;
}

const LEVEL_COLOR = {
  sleep: { good: '#A9CBB0', ok: '#C9DFCC', low: '#EBC2AC' },
  stress: { low: '#C9DFCC', mid: '#F1E3C8', high: '#EBC2AC' }
};

function FactorSummary({ days }) {
  const f = factorSummary(days);
  const rows = itemsOf('factor').map((r) => r.key);
  const dist = (key) => {
    const opts = FACTORS[key].opts;
    const counted = opts.filter(([k]) => f[key][k]);
    if (!counted.length) return html`<span class="hint">ไม่ได้บันทึก</span>`;
    return html`
      <div class="dist-bar">${counted.map(([k]) => html`<span style=${`flex: ${f[key][k]}; background: ${LEVEL_COLOR[key][k]}`}></span>`)}</div>
      <span class="hint">${counted.map(([k, label]) => label + ' ' + f[key][k]).join(' · ')} วัน</span>`;
  };
  const runText = (runs) => runs.map(([a, b]) => {
    const da = parseLocal(a);
    const db = parseLocal(b);
    const m = TH_MONTHS_SHORT[db.getMonth()];
    return a === b ? db.getDate() + ' ' + m : da.getDate() + '–' + db.getDate() + ' ' + m;
  }).join(', ');

  return html`
    <section class="card trend-card" style="gap: 14px">
      <div style="display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap">
        <h2 class="h2">สรุปปัจจัย</h2>
        <span class="hint">· ส่งแล้ว ${f.sent}/${f.total} วัน</span>
      </div>
      ${f.sent === 0 ? html`<div class="hint" style="font-size: 14px">ช่วงนี้ยังไม่ได้ส่งปัจจัย</div>` : rows.map((key) => html`
        <div class="fs-row">
          <b>${FACTORS[key].name}</b>
          ${key === 'sleep' || key === 'stress' ? dist(key)
            : key === 'period' ? html`<span class="hint">${f.periodDates.length
                ? 'มา ' + f.periodDates.length + ' วัน (' + runText(dateRuns(f.periodDates)) + ')' + (f.period.heavy ? ' · มามาก ' + f.period.heavy + ' วัน' : '')
                : f.period.none ? 'ไม่มา' : 'ไม่ได้บันทึก'}</span>`
            : html`
              <span class="hint">${f.foodDays
                ? f.foodDays + ' วัน รวม ' + f.meals + ' มื้อ' + (f.noFood ? ' · ไม่มี ' + f.noFood + ' วัน' : '')
                : f.noFood ? 'ไม่มีวันที่กินอาหารเสี่ยง' : 'ไม่ได้บันทึก'}</span>
              ${f.foods.length > 0 && html`<div class="tags">${f.foods.map(([name, n]) => html`<span class="mini-tag">${name} ${n} วัน</span>`)}</div>`}`}
        </div>`)}
    </section>`;
}

// ---------- รายเดือน ----------
function Month({ month, setMonth }) {
  const now = new Date();
  const m = month || { y: now.getFullYear(), m: now.getMonth() };
  const daysIn = new Date(m.y, m.m + 1, 0).getDate();
  const first = dateKey(new Date(m.y, m.m, 1));
  const days = datesFrom(first, daysIn).map(dayData);
  const s = summarize(days);
  const isCurrent = m.y === now.getFullYear() && m.m === now.getMonth();
  const elapsed = days.filter((d) => !d.future).length;
  const shift = (delta) => { const d = new Date(m.y, m.m + delta, 1); setMonth({ y: d.getFullYear(), m: d.getMonth() }); };

  const weeks = [];
  for (let startDay = 1; startDay <= daysIn; startDay += 7) {
    const slice = days.slice(startDay - 1, Math.min(startDay + 6, daysIn));
    const ws = summarize(slice);
    const label = startDay + '–' + Math.min(startDay + 6, daysIn) + ' ' + TH_MONTHS_SHORT[m.m];
    weeks.push({ label, ws });
  }
  const syms = topSymptoms(days, 'times');
  const g = s.groups;

  return html`
    <${RangeNav} label=${TH_MONTHS[m.m] + ' ' + thYear(m.y)} sub=${'บันทึกแล้ว ' + s.recorded + ' จาก ' + elapsed + ' วัน'}
      onPrev=${() => shift(-1)} onNext=${() => shift(1)} canNext=${!isCurrent} />
    <div class="stats">
      <${Stat} label="ครั้ง/วัน" value=${fmt1(s.perDay)} />
      <${Stat} label="วันปกติ" value=${s.recorded ? s.normalDays : '–'} unit=${s.recorded ? '/' + s.recorded + ' วัน' : ''} />
      <${Stat} label="ปวด 5+" value=${s.painHighDays} unit=" วัน" />
    </div>

    <section class="card trend-card">
      <h2 class="h2">ลักษณะรายวัน</h2>
      <div role="img" aria-label="แถบสีลักษณะอุจจาระรายวันทั้งเดือน" class="strip">
        ${days.map((d, i) => html`
          <span class=${'strip-cell' + (d.future ? ' future' : !d.recorded ? ' missing' : '')}
            style=${d.rep ? 'background: ' + GROUP_FILL[bristolGroup(d.rep)] : d.recorded ? 'background: #EFEAE0' : ''}>${i + 1}</span>`)}
      </div>
      <div style="display: flex; height: 14px; border-radius: 7px; overflow: hidden">
        <span style=${`flex: ${g.c}; background: #EBCFB2`}></span>
        <span style=${`flex: ${g.n}; background: #C9DFCC`}></span>
        <span style=${`flex: ${g.l}; background: #CBD6EC`}></span>
        <span style=${`flex: ${g.none}; background: #EFEAE0`}></span>
        <span style=${`flex: ${g.missing}; background: #E6E0D3`}></span>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 13px; color: #5C675F">
        <span>ผูก <b style="color: #27332C">${g.c}</b></span>
        <span>ปกติ <b style="color: #27332C">${g.n}</b></span>
        <span>เหลว <b style="color: #27332C">${g.l}</b></span>
        ${g.none > 0 && html`<span>ไม่ได้ถ่าย/ไม่ระบุ <b style="color: #27332C">${g.none}</b></span>`}
        <span>ไม่ได้บันทึก <b style="color: #27332C">${g.missing}</b> วัน</span>
      </div>
    </section>

    <section class="card trend-card">
      <div style="display: flex; flex-direction: column; gap: 2px">
        <h2 class="h2">ปวดท้องสูงสุดรายวัน</h2>
        <span class="hint">0–10 · แท่งสีอิฐ = ปวด 5 ขึ้นไป</span>
      </div>
      <div role="img" aria-label="กราฟแท่งระดับปวดรายวันทั้งเดือน" class="pain-month" style=${`grid-template-columns: repeat(${daysIn}, minmax(0, 1fr))`}>
        ${days.map((d) => {
          const v = d.info.maxPain;
          return html`<span style=${`border-radius: 2px 2px 0 0; height: ${v === null ? 0 : Math.max(v * 8, 2)}px; background: ${v >= 5 ? '#B86A45' : '#6A9471'}`}></span>`;
        })}
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: #5C675F">
        <span>1</span><span>8</span><span>15</span><span>22</span><span>${daysIn}</span>
      </div>
    </section>

    <section class="card trend-card" style="padding: 16px 16px 6px; gap: 4px">
      <h2 class="h2" style="margin-bottom: 6px">เทียบรายสัปดาห์</h2>
      <div class="wk-row head"><span>สัปดาห์</span><span>ครั้ง/วัน</span><span>วันปกติ</span><span>ปวดเฉลี่ย</span></div>
      ${weeks.map(({ label, ws }, i) => html`
        <div class=${'wk-row' + (ws.recorded ? '' : ' muted') + (i ? ' line' : '')}>
          <span>${label}</span>
          <span>${fmt1(ws.perDay)}</span>
          <span>${ws.recorded ? ws.normalDays + '/' + ws.recorded : '–'}</span>
          <span style="font-weight: 600">${fmt1(ws.painAvg)}</span>
        </div>`)}
    </section>

    <${SymptomBars} title="อาการที่พบบ่อยเดือนนี้" rows=${syms} max=${syms.length ? syms[0][1] : 1} unit=${(v) => v + ' ครั้ง'} />
    <${FactorSummary} days=${days} />
    <p class="hint" style="line-height: 1.5; margin: 0 4px">${DISCLAIMER}</p>`;
}
