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

// สรุปปัจจัย: นับจากวันที่ส่งปัจจัยแล้วเท่านั้น
export function factorSummary(days) {
  const sent = days.filter((d) => d.day.submittedAt);
  const tally = (key) => {
    const c = {};
    sent.forEach((d) => { const v = d.day[key]; if (v) c[v] = (c[v] || 0) + 1; });
    return c;
  };
  const periodDates = sent.filter((d) => d.day.period === 'light' || d.day.period === 'heavy').map((d) => d.date);
  const foodDays = sent.filter((d) => d.day.riskMeals > 0);
  const foods = {};
  sent.forEach((d) => (d.day.riskFoods || []).forEach((f) => { foods[f] = (foods[f] || 0) + 1; }));
  return {
    sent: sent.length,
    total: days.filter((d) => !d.future).length,
    sleep: tally('sleep'),
    stress: tally('stress'),
    period: tally('period'),
    periodDates,
    noFood: sent.filter((d) => d.day.riskMeals === 0).length,
    foodDays: foodDays.length,
    meals: foodDays.reduce((a, d) => a + d.day.riskMeals, 0),
    foods: Object.entries(foods).sort((a, b) => b[1] - a[1])
  };
}

// รวมวันที่ติดกันเป็นช่วง เช่น ["2026-10-11","2026-10-12","2026-10-13","2026-10-20"] → [["2026-10-11","2026-10-13"],["2026-10-20","2026-10-20"]]
export function dateRuns(dates) {
  const runs = [];
  dates.slice().sort().forEach((d) => {
    const last = runs[runs.length - 1];
    if (last && addDays(last[1], 1) === d) last[1] = d;
    else runs.push([d, d]);
  });
  return runs;
}
