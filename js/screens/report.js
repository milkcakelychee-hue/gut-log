// สรุปสำหรับพบแพทย์: แสดงบนจอ แล้วพิมพ์/บันทึกเป็น PDF ผ่านหน้าพิมพ์ของ iPhone
import { html } from '../vendor/preact-htm.js';
import {
  AMOUNT_LABEL, GROUP_FILL, TH_DAYS_SHORT, TH_MONTHS, TH_MONTHS_SHORT, WHEN_LABEL, bristolGroup, dateKey, parseLocal, thYear, timeOf
} from '../rules.js';
import { useStore } from '../store.js';
import { datesFrom, dayData, fmt1, summarize, topSymptoms } from '../stats.js';
import { FactorSummary } from './trends.js';

const thDate = (d) => { const x = parseLocal(d); return x.getDate() + ' ' + TH_MONTHS_SHORT[x.getMonth()] + ' ' + thYear(x.getFullYear()); };

export function Report({ from, to }) {
  const s = useStore();
  const n = Math.round((parseLocal(to) - parseLocal(from)) / 86400000) + 1;
  const days = datesFrom(from, n).map(dayData);
  const sum = summarize(days);
  const g = sum.groups;
  const symTimes = topSymptoms(days, 'times', 8);
  const entries = days.flatMap((d) => d.entries);
  const weekStart = s.settings.weekStart ?? 0;

  // เดือนที่อยู่ในช่วง
  const months = [];
  const start = parseLocal(from);
  for (let y = start.getFullYear(), m = start.getMonth(); dateKey(new Date(y, m, 1)) <= to; m++) {
    if (m === 12) { m = 0; y++; }
    months.push({ y, m });
  }

  return html`
    <div class="report-bar no-print">
      <button type="button" class="link-btn" onClick=${() => (location.hash = '#/settings')}>ปิด</button>
      <button type="button" class="btn-solid" style="padding: 0 18px; height: 44px" onClick=${() => window.print()}>บันทึกเป็น PDF</button>
    </div>
    <main class="report">
      <header class="rp-head">
        <h1>สรุปบันทึกระบบทางเดินอาหาร</h1>
        <div>${thDate(from)} – ${thDate(to)} (${n} วัน) · สร้างเมื่อ ${thDate(dateKey())}</div>
      </header>

      <section class="rp-sec">
        <div class="rp-stats">
          <div><span>วันที่มีบันทึก</span><b>${sum.recorded}/${days.filter((d) => !d.future).length}</b></div>
          <div><span>ขับถ่ายเฉลี่ย</span><b>${fmt1(sum.perDay)} ครั้ง/วัน</b></div>
          <div><span>วันที่ลักษณะปกติ (แบบ 3–4)</span><b>${sum.normalDays}/${sum.recorded} วัน</b></div>
          <div><span>วันที่ปวด 5 ขึ้นไป</span><b>${sum.painHighDays} วัน</b></div>
          <div><span>ปวดสูงสุดเฉลี่ยต่อวัน</span><b>${fmt1(sum.painAvg)}/10</b></div>
        </div>
        <div style="display: flex; height: 12px; border-radius: 6px; overflow: hidden; margin-top: 10px">
          <span style=${`flex: ${g.c}; background: #EBCFB2`}></span><span style=${`flex: ${g.n}; background: #C9DFCC`}></span>
          <span style=${`flex: ${g.l}; background: #CBD6EC`}></span><span style=${`flex: ${g.none}; background: #EFEAE0`}></span>
          <span style=${`flex: ${g.missing}; background: #E6E0D3`}></span>
        </div>
        <div class="rp-small">ผูก (แบบ 1–2) ${g.c} วัน · ปกติ (3–4) ${g.n} วัน · เหลว (5–7) ${g.l} วัน${g.none ? ' · ไม่ได้ถ่าย/ไม่ระบุ ' + g.none + ' วัน' : ''} · ไม่ได้บันทึก ${g.missing} วัน
          <br />สีของวัน = ลักษณะที่ห่างจากปกติที่สุดของวันนั้น</div>
      </section>

      <section class="rp-sec">
        <h2>ปฏิทิน</h2>
        <div class="rp-months">
          ${months.map(({ y, m }) => {
            const daysIn = new Date(y, m + 1, 0).getDate();
            const lead = (new Date(y, m, 1).getDay() - weekStart + 7) % 7;
            return html`
              <div class="rp-month">
                <div class="rp-mtitle">${TH_MONTHS[m]} ${thYear(y)}</div>
                <div class="rp-cal">
                  ${Array.from({ length: 7 }, (_, i) => html`<span class="wd">${TH_DAYS_SHORT[(i + weekStart) % 7]}</span>`)}
                  ${Array.from({ length: lead }, () => html`<span></span>`)}
                  ${Array.from({ length: daysIn }, (_, i) => {
                    const date = dateKey(new Date(y, m, i + 1));
                    if (date < from || date > to) return html`<span class="rc out">${i + 1}</span>`;
                    const d = dayData(date);
                    const bg = d.rep ? GROUP_FILL[bristolGroup(d.rep)] : d.recorded ? '#EFEAE0' : '#FFFFFF';
                    return html`<span class="rc" style=${'background: ' + bg}>
                      <i>${i + 1}</i><b>${d.rep || (d.recorded ? d.info.count : '')}</b>${d.info.maxPain >= 5 && html`<em></em>`}</span>`;
                  })}
                </div>
              </div>`;
          })}
        </div>
        <div class="rp-small">ตัวเลขในช่อง = แบบ Bristol (ถ้าไม่มี = จำนวนครั้งที่ขับถ่าย) · จุดแดง = ปวด 5 ขึ้นไป</div>
      </section>

      ${n <= 92 && html`
        <section class="rp-sec">
          <h2>ปวดท้องสูงสุดรายวัน (0–10)</h2>
          <div class="rp-pain" style=${`grid-template-columns: repeat(${n}, minmax(0, 1fr))`}>
            ${days.map((d) => { const v = d.info.maxPain; return html`<span style=${`height: ${v === null ? 0 : Math.max(v * 7, 2)}px; background: ${v >= 5 ? '#B86A45' : '#6A9471'}`}></span>`; })}
          </div>
          <div class="rp-small" style="display: flex; justify-content: space-between"><span>${thDate(from)}</span><span>${thDate(to)}</span></div>
        </section>`}

      <section class="rp-sec">
        <h2>อาการที่พบบ่อย</h2>
        ${symTimes.length ? html`<div class="rp-small" style="font-size: 13px">${symTimes.map(([k, v]) => k + ' ' + v + ' ครั้ง').join(' · ')}</div>`
          : html`<div class="rp-small">ไม่มีอาการที่บันทึกไว้</div>`}
      </section>

      <section class="rp-sec rp-factors"><${FactorSummary} days=${days} /></section>

      <section class="rp-sec">
        <h2>รายการบันทึกทั้งหมด (${entries.length})</h2>
        <table class="rp-table">
          <thead><tr><th>วันที่ เวลา</th><th>ประเภท</th><th>ปวด</th><th>ตำแหน่ง</th><th>อาการ</th><th>โน้ต</th></tr></thead>
          <tbody>
            ${entries.map((e) => html`<tr>
              <td>${thDate(e.date).replace(/ \d{4}$/, '')} ${timeOf(e.datetime)}</td>
              <td>${e.kind === 'bowel' ? ((e.bristol ? 'ขับถ่าย แบบ ' + e.bristol : 'ขับถ่าย') + (e.amount ? ' · ' + AMOUNT_LABEL[e.amount] : '')) : 'อาการ' + (e.when && e.when !== 'now' ? ' (' + WHEN_LABEL[e.when] + ')' : '')}</td>
              <td>${e.pain ?? '–'}</td>
              <td>${(e.zones || []).join(', ')}</td>
              <td>${(e.symptoms || []).join(', ')}</td>
              <td>${e.note || ''}</td>
            </tr>`)}
          </tbody>
        </table>
      </section>

      <p class="rp-small">ข้อมูลบันทึกเองโดยผู้ป่วย ใช้ประกอบการพูดคุยกับแพทย์ ไม่ใช่การวินิจฉัย · ตำแหน่ง "ขวา/ซ้าย" คือด้านของผู้ป่วยเอง</p>
    </main>`;
}
