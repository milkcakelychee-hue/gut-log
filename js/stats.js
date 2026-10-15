// คำนวณตัวเลขสำหรับหน้าแนวโน้ม
import { bristolGroup, dateKey, dayRepType, parseLocal, summarizeDay } from './rules.js';
import { state, entriesOn, dayOf } from './store.js';

export const MIN_DAYS = 7;

// ข้อมูลของ 1 วัน
export function dayData(date) {
  const entries = entriesOn(date).sort((a, b) => a.datetime.localeCompare(b.datetime));
  const day = dayOf(date);
  const info = summarizeDay(entries);
  return {
    date, entries, day, info,
    rep: dayRepType(entries),
    recorded: entries.length > 0 || !!day.submittedAt,
    future: date > dateKey()
  };
}

export function datesFrom(start, n) {
  const d = parseLocal(start);
  return Array.from({ length: n }, (_, i) => dateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + i)));
}

export function addDays(date, n) {
  const d = parseLocal(date);
  return dateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
}

// จำนวนวันที่มีบันทึกทั้งหมด (ใช้ปลดล็อกกราฟ)
export function recordedDayCount() {
  const set = new Set(state.entries.map((e) => e.date));
  Object.values(state.days).forEach((d) => d.submittedAt && set.add(d.date));
  return set.size;
}

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
export const fmt1 = (v) => (v === null ? '–' : v.toFixed(1));

// สรุปของช่วงวัน
export function summarize(days) {
  const rec = days.filter((d) => d.recorded);
  const typed = rec.flatMap((d) => d.entries.filter((e) => e.kind === 'bowel' && e.bristol));
  const pains = rec.map((d) => d.info.maxPain).filter((p) => p !== null);
  return {
    recorded: rec.length,
    perDay: rec.length ? rec.reduce((a, d) => a + d.info.count, 0) / rec.length : null,
    normalEntries: typed.filter((e) => bristolGroup(e.bristol) === 'n').length,
    typedEntries: typed.length,
    normalDays: rec.filter((d) => bristolGroup(d.rep) === 'n').length,
    painAvg: avg(pains),
    painHighDays: rec.filter((d) => d.info.maxPain >= 5).length,
    groups: {
      c: rec.filter((d) => bristolGroup(d.rep) === 'c').length,
      n: rec.filter((d) => bristolGroup(d.rep) === 'n').length,
      l: rec.filter((d) => bristolGroup(d.rep) === 'l').length,
      none: rec.filter((d) => !d.rep).length,
      missing: days.filter((d) => !d.recorded && !d.future).length
    }
  };
}

// อาการที่พบบ่อย: by = 'days' (นับวัน) | 'times' (นับครั้ง)
export function topSymptoms(days, by, limit = 4) {
  const count = {};
  days.forEach((d) => {
    if (by === 'days') d.info.symptoms.forEach((s) => { count[s] = (count[s] || 0) + 1; });
    else d.entries.forEach((e) => (e.symptoms || []).forEach((s) => { count[s] = (count[s] || 0) + 1; }));
  });
  return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, limit);
}

// ปัจจัยกับอาการปวด: ปวดสูงสุดเฉลี่ยของวันที่มีปัจจัย เทียบกับวันอื่น (เฉพาะวันที่ส่งปัจจัยแล้ว)
const FACTOR_TESTS = [
  { label: (n) => `อาหารเสี่ยง (${n} วัน) · รวมวันถัดไป`, test: (day) => day.riskMeals > 0, nextDay: true },
  { label: (n) => `ความเครียด "สูง" (${n} วัน)`, test: (day) => day.stress === 'high' },
  { label: (n) => `การนอน "น้อย" (${n} วัน)`, test: (day) => day.sleep === 'low' },
  { label: (n) => `มีประจำเดือน (${n} วัน)`, test: (day) => day.period === 'light' || day.period === 'heavy' }
];

export function factorPain(days) {
  const sent = days.filter((d) => d.day.submittedAt && d.info.maxPain !== null);
  const rows = [];
  FACTOR_TESTS.forEach((f) => {
    const yes = [];
    const no = [];
    sent.forEach((d) => {
      let pain = d.info.maxPain;
      // อาหารมักส่งผลช้า ดูปวดสูงสุดของวันนั้นหรือวันถัดไป
      if (f.nextDay) {
        const next = dayData(addDays(d.date, 1)).info.maxPain;
        if (next !== null) pain = Math.max(pain, next);
      }
      (f.test(d.day) ? yes : no).push(pain);
    });
    if (yes.length && no.length) rows.push({ label: f.label(yes.length), a: avg(yes), b: avg(no) });
  });
  return rows.sort((x, y) => (y.a - y.b) - (x.a - x.b));
}
