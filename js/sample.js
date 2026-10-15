// ข้อมูลตัวอย่างสำหรับทดลอง (ย้อนหลัง 30 วัน ไม่รวมวันนี้)
import { DEFAULT_LISTS, ZONE_ORDER, dateKey, uid } from './rules.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const some = (arr, max) => arr.filter(() => Math.random() < max / arr.length);
const pad = (n) => String(n).padStart(2, '0');

export function makeSample(daysBack = 30) {
  const entries = [];
  const days = [];
  for (let back = daysBack; back >= 1; back--) {
    if (Math.random() < 0.08) continue; // บางวันไม่ได้บันทึก
    const d = new Date();
    d.setDate(d.getDate() - back);
    const date = dateKey(d);
    const stress = pick(['low', 'mid', 'high', null]);
    const riskMeals = pick([0, 0, 1, 2, 3]);
    const bad = stress === 'high' || riskMeals >= 2;
    const n = pick([0, 1, 1, 1, 2, 2, 3]);
    for (let i = 0; i < n; i++) {
      const hour = 6 + Math.floor(Math.random() * 15);
      const bristol = Math.random() < 0.1 ? null : bad ? pick([4, 5, 6, 6, 7, 2]) : pick([3, 4, 4, 4, 5, 2]);
      const pain = bad ? pick([0, 2, 3, 5, 6, 7]) : pick([0, 0, 0, 1, 2, 3]);
      entries.push({
        id: uid(), kind: 'bowel', datetime: `${date}T${pad(hour)}:${pad(Math.floor(Math.random() * 60))}`, date,
        bristol, when: null, pain, zones: pain ? some(ZONE_ORDER, 1.5) : [],
        symptoms: pain ? some(DEFAULT_LISTS.bowel_symptom, 1.5) : [], note: '', createdAt: Date.now(), updatedAt: Date.now()
      });
    }
    if (Math.random() < (bad ? 0.7 : 0.3)) {
      entries.push({
        id: uid(), kind: 'symptom', datetime: `${date}T${pad(pick([7, 13, 22]))}:15`, date,
        bristol: null, when: pick(['wake', 'after_meal', 'bedtime']), pain: pick([1, 2, 3, 4, 6]), zones: some(ZONE_ORDER, 1.2),
        symptoms: some(DEFAULT_LISTS.symptom, 2).concat(['ท้องอืด']).filter((v, i, a) => a.indexOf(v) === i),
        note: '', createdAt: Date.now(), updatedAt: Date.now()
      });
    }
    days.push({
      date, sleep: pick(['low', 'ok', 'ok', 'good', null]), stress, period: pick(['none', 'none', 'none', 'light', null]),
      riskMeals, riskFoods: riskMeals ? some(DEFAULT_LISTS.risk_food, 1.5) : [], submittedAt: Date.now(), draft: null
    });
  }
  return { entries, days };
}
