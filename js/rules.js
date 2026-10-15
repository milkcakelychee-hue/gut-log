// กติกาและค่าคงที่ของแอป (ตาม SPEC.md ข้อ 5–7)

export const BRISTOL_SHORT = ['แข็ง เป็นเม็ด', 'แท่ง ขรุขระ', 'แท่ง มีรอยแตก', 'นิ่ม ผิวเรียบ', 'ก้อนนิ่ม', 'เละ', 'เป็นน้ำ'];
export const BRISTOL_TITLE = ['แข็ง เป็นเม็ด', 'แท่ง ขรุขระเป็นก้อน', 'แท่ง ผิวมีรอยแตก', 'นิ่ม ผิวเรียบ', 'ก้อนนิ่ม ขอบชัด', 'เละ ขอบไม่ชัด', 'เป็นน้ำ'];

// ปริมาณอุจจาระ (เฉพาะขับถ่าย) เก็บเป็น key, null = ไม่ได้ดู/ข้าม
export const AMOUNTS = [['little', 'น้อย'], ['medium', 'ปานกลาง'], ['lots', 'มาก']];
export const AMOUNT_LABEL = Object.fromEntries(AMOUNTS);

// ซ้ายของจอ = ขวาของเรา
export const ZONES_RIGHT = ['ใต้ซี่โครงขวา', 'ข้างขวา', 'ล่างขวา'];
export const ZONES_LEFT = ['ใต้ซี่โครงซ้าย', 'ข้างซ้าย', 'ล่างซ้าย'];
export const ZONES_MID = ['ลิ้นปี่', 'รอบสะดือ', 'ท้องน้อย'];
export const ZONE_ORDER = ['ใต้ซี่โครงขวา', 'ลิ้นปี่', 'ใต้ซี่โครงซ้าย', 'ข้างขวา', 'รอบสะดือ', 'ข้างซ้าย', 'ล่างขวา', 'ท้องน้อย', 'ล่างซ้าย'];

export const WHEN = [
  { key: 'now', label: 'ตอนนี้' },
  { key: 'wake', label: 'ตื่นนอน', sub: 'เช้า' },
  { key: 'after_meal', label: 'หลังอาหาร', sub: '' },
  { key: 'bedtime', label: 'ก่อนนอน', sub: 'ดึก' }
];
export const WHEN_LABEL = Object.fromEntries(WHEN.map((w) => [w.key, w.label]));

export const FACTORS = {
  sleep: { name: 'การนอน', opts: [['low', 'น้อย'], ['ok', 'พอดี'], ['good', 'ดีมาก']] },
  stress: { name: 'ความเครียด', opts: [['low', 'ต่ำ'], ['mid', 'กลาง'], ['high', 'สูง']] },
  period: { name: 'ประจำเดือน', opts: [['none', 'ไม่มา'], ['light', 'มาน้อย'], ['heavy', 'มามาก']] },
  riskFood: { name: 'อาหารเสี่ยง' }
};
// ประเมินช่วงไหน (แสดงใต้ชื่อแถว)
export const FACTOR_SPAN = { sleep: 'เมื่อคืน', stress: 'ทั้งวัน', period: 'วันนี้', riskFood: 'ทั้งวัน' };
// เกณฑ์ที่แสดงใต้แถวเมื่อเลือกแล้ว
export const FACTOR_HINT = {
  sleep: { low: 'ไม่ถึง 6 ชม. หรือตื่นกลางดึกบ่อย', ok: '6–8 ชม. ตื่นมาพอไหว', good: 'หลับยาว ตื่นมาสดชื่น' },
  stress: { low: 'สบาย ๆ ไม่มีเรื่องกังวล', mid: 'มีเรื่องให้คิด แต่รับมือได้', high: 'กังวลหรือกดดัน จนรู้สึกถึงตัวหรือท้อง' }
};
export const FACTOR_KEYS = ['sleep', 'stress', 'period', 'riskFood'];

export const DEFAULT_LISTS = {
  symptom: ['ท้องอืด', 'แน่นท้อง', 'มีลมมาก', 'ปวดบีบ', 'ปวดจุก', 'คลื่นไส้', 'แสบร้อนกลางอก', 'อยากถ่ายแต่ไม่ออก'],
  bowel_symptom: ['ปวดบีบ', 'ปวดเบ่ง', 'ถ่ายไม่สุด', 'ต้องรีบเข้าห้องน้ำ', 'มีมูก', 'มีเลือด', 'แสบก้น', 'มีลม'],
  risk_food: ['เผ็ด', 'มัน/ทอด', 'หมักดอง', 'แอลกอฮอล์']
};

export function painWord(n) {
  if (n === null || n === undefined) return 'ยังไม่เลือก';
  return n === 0 ? 'ไม่ปวด' : n <= 3 ? 'ปวดเล็กน้อย' : n <= 6 ? 'ปวดปานกลาง' : n <= 9 ? 'ปวดมาก' : 'ปวดมากที่สุด';
}

// 'c' ผูก | 'n' ปกติ | 'l' เหลว
export function bristolGroup(t) {
  if (!t) return null;
  return t <= 2 ? 'c' : t <= 4 ? 'n' : 'l';
}
export const GROUP_FILL = { c: '#EBCFB2', n: '#C9DFCC', l: '#CBD6EC' };

// ---------- วันที่และเวลา (เก็บเป็นเวลาท้องถิ่น "YYYY-MM-DDTHH:mm") ----------
const pad = (n) => String(n).padStart(2, '0');
export function dateKey(d = new Date()) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
export function nowLocal(d = new Date()) {
  return dateKey(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
export function parseLocal(s) {
  const [date, time = '00:00'] = s.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}
export const timeOf = (s) => s.slice(11, 16);

const EN_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const TH_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
export const TH_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
export const TH_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export function enDate(d) {
  return EN_DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + EN_MONTHS[d.getMonth()];
}
// "13 ต.ค. 08:42" ถ้าไม่ใช่วันนี้ ไม่งั้น "08:42"
export function chipTime(s) {
  if (s.slice(0, 10) === dateKey()) return timeOf(s);
  const d = parseLocal(s);
  return d.getDate() + ' ' + TH_MONTHS_SHORT[d.getMonth()] + ' ' + timeOf(s);
}

// ---------- สรุปวัน ----------
export function summarizeDay(entries) {
  const sorted = entries.slice().sort((a, b) => a.datetime.localeCompare(b.datetime));
  const bowel = sorted.filter((e) => e.kind === 'bowel');
  const pains = sorted.map((e) => e.pain).filter((p) => p !== null && p !== undefined);
  const types = [];
  bowel.forEach((e) => { if (e.bristol && !types.includes(e.bristol)) types.push(e.bristol); });
  const symptoms = [];
  sorted.forEach((e) => (e.symptoms || []).forEach((s) => { if (!symptoms.includes(s)) symptoms.push(s); }));
  return {
    count: bowel.length,
    maxPain: pains.length ? Math.max(...pains) : null,
    types,
    symptoms,
    hasEntries: sorted.length > 0
  };
}

// ป้ายสถานะหน้าวันนี้
export function dayStatus(entries) {
  if (!entries.length) return null;
  const s = summarizeDay(entries);
  const p = s.maxPain ?? 0;
  if (p >= 7 || s.types.some((t) => t === 1 || t === 7)) return { text: 'ท้องไม่ค่อยดี', tone: 'meh' };
  if (p >= 4 || s.types.some((t) => t === 2 || t === 5 || t === 6)) return { text: 'ท้องพอใช้', tone: 'meh' };
  if (p === 0 && s.symptoms.length === 0) return { text: 'ท้องดีมาก', tone: 'good' };
  return { text: 'ท้องค่อนข้างดี', tone: 'good' };
}

// ข้อความบรรทัดย่อยของรายการบันทึก
export function entryTitle(e) {
  if (e.kind === 'symptom') return (e.symptoms || []).length ? 'อาการ · ' + e.symptoms.join(', ') : 'อาการ';
  return e.bristol ? 'แบบ ' + e.bristol + ' · ' + BRISTOL_TITLE[e.bristol - 1] : 'ขับถ่าย · ไม่ได้ดูลักษณะ';
}
export function entrySub(e) {
  const parts = [];
  if (e.kind === 'symptom' && e.when && e.when !== 'now') parts.push(WHEN_LABEL[e.when]);
  if (e.kind === 'bowel' && e.amount) parts.push('ปริมาณ' + AMOUNT_LABEL[e.amount]);
  if (e.pain === 0) parts.push('ไม่ปวด');
  else if (e.pain) parts.push('ปวด ' + e.pain);
  if ((e.zones || []).length) parts.push(e.zones.join(', '));
  if (e.kind === 'bowel' && (e.symptoms || []).length) parts.push(e.symptoms.join(', '));
  if (e.kind === 'symptom') parts.push('ไม่ได้ถ่าย');
  if (!parts.length && e.note) parts.push(e.note);
  return parts.join(' · ') || 'ไม่ได้ระบุรายละเอียด';
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- ประวัติ ----------
// Bristol ที่ "ห่างจากปกติมากที่สุด" ของวัน (ใช้กับสีปฏิทิน)
export function dayRepType(entries) {
  let best = null;
  entries.forEach((e) => {
    if (e.kind !== 'bowel' || !e.bristol) return;
    if (best === null || Math.abs(e.bristol - 4) > Math.abs(best - 4)) best = e.bristol;
  });
  return best;
}

export const factorLabel = (key, value) => {
  const opt = (FACTORS[key].opts || []).find(([k]) => k === value);
  return opt ? opt[1] : null;
};

export function mealsText(day) {
  if (day.riskMeals === null || day.riskMeals === undefined) return null;
  return day.riskMeals === 0 ? 'ไม่มี' : day.riskMeals + ' มื้อ';
}

// ป้ายปัจจัยที่น่าสังเกต (การ์ดในหน้าประวัติ)
export function factorTags(day) {
  if (!day || !day.submittedAt) return [];
  const tags = [];
  if (day.sleep === 'low') tags.push('นอนน้อย');
  if (day.stress === 'high') tags.push('เครียดสูง');
  else if (day.stress === 'mid') tags.push('เครียดกลาง');
  if (day.period === 'light') tags.push('ประจำเดือนมาน้อย');
  else if (day.period === 'heavy') tags.push('ประจำเดือนมามาก');
  if ((day.riskFoods || []).length) tags.push('อาหารเสี่ยง: ' + day.riskFoods.join(', '));
  else if (day.riskMeals > 0) tags.push('อาหารเสี่ยง ' + day.riskMeals + ' มื้อ');
  return tags;
}

// ค่าตั้งค่าที่กติกาต้องใช้ (store อัปเดตให้)
export const prefs = { be: true };
export const thYear = (y) => (prefs.be ? y + 543 : y);
export function thLongDate(date) {
  const d = parseLocal(date);
  return TH_DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + TH_MONTHS[d.getMonth()];
}
export function thShortDate(date) {
  const d = parseLocal(date);
  return TH_DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + TH_MONTHS_SHORT[d.getMonth()];
}
