// ส่งออก CSV, สำรองข้อมูลเป็นไฟล์ JSON และอ่านไฟล์สำรอง
import { AMOUNT_LABEL, WHEN_LABEL, dateKey, factorLabel, timeOf } from './rules.js';
import { state, dayOf, snapshot, setSetting } from './store.js';

// ส่งไฟล์ออกทางแผ่นแชร์ของ iPhone (บันทึกลง Files / iCloud Drive ได้) ถ้าไม่มีให้ดาวน์โหลดแทน
// คืนค่า true เมื่อส่งสำเร็จ, false เมื่อผู้ใช้ยกเลิก
export async function shareFile(name, text, type) {
  const file = new File([text], name, { type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return true;
    } catch (err) {
      if (err && err.name === 'AbortError') return false;
      throw err;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}

const cell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

// แถวละ 1 บันทึก + ปัจจัยของวันนั้น (วันที่มีแต่ปัจจัยได้ 1 แถว)
export function buildCsv(from, to) {
  const inRange = (d) => (!from || d >= from) && (!to || d <= to);
  const head = ['วันที่', 'เวลา', 'ประเภท', 'Bristol', 'ปริมาณ', 'ช่วงเวลา', 'ปวด (0-10)', 'ตำแหน่ง', 'อาการ', 'โน้ต',
    'การนอน', 'ความเครียด', 'ประจำเดือน', 'มื้ออาหารเสี่ยง', 'อาหารเสี่ยง', 'ส่งปัจจัยแล้ว'];
  const factorCells = (date) => {
    const d = dayOf(date);
    const sent = !!d.submittedAt;
    return [
      sent ? factorLabel('sleep', d.sleep) : '', sent ? factorLabel('stress', d.stress) : '', sent ? factorLabel('period', d.period) : '',
      sent ? d.riskMeals ?? '' : '', sent ? (d.riskFoods || []).join(', ') : '', sent ? 'ใช่' : ''
    ];
  };
  const rows = [];
  const entries = state.entries.filter((e) => inRange(e.date)).sort((a, b) => a.datetime.localeCompare(b.datetime));
  entries.forEach((e) => rows.push([
    e.date, timeOf(e.datetime), e.kind === 'bowel' ? 'ขับถ่าย' : 'อาการ (ไม่ได้ถ่าย)', e.bristol ?? '', e.amount ? AMOUNT_LABEL[e.amount] : '',
    e.kind === 'symptom' && e.when ? WHEN_LABEL[e.when] : '', e.pain ?? '', (e.zones || []).join(', '),
    (e.symptoms || []).join(', '), e.note || '', ...factorCells(e.date)
  ]));
  const withEntries = new Set(entries.map((e) => e.date));
  Object.values(state.days)
    .filter((d) => d.submittedAt && inRange(d.date) && !withEntries.has(d.date))
    .forEach((d) => rows.push([d.date, '', 'ปัจจัยอย่างเดียว', '', '', '', '', '', '', '', ...factorCells(d.date)]));
  rows.sort((a, b) => (a[0] + a[1]).localeCompare(b[0] + b[1]));
  // ใส่ BOM ให้ Excel อ่านภาษาไทยถูก
  return '﻿' + [head, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
}

export async function exportCsv() {
  return shareFile('gut-log-' + dateKey() + '.csv', buildCsv(), 'text/csv');
}

export async function exportBackup() {
  const ok = await shareFile('gut-log-backup-' + dateKey() + '.json', JSON.stringify(snapshot()), 'application/json');
  if (ok) await setSetting('lastBackup', Date.now());
  return ok;
}

// ตรวจไฟล์สำรอง คืน { data, summary } หรือโยน Error เป็นข้อความภาษาไทย
export async function readBackup(file) {
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error('อ่านไฟล์ไม่ได้ ต้องเป็นไฟล์ .json ที่ได้จากปุ่ม "สำรองข้อมูล"');
  }
  if (!data || data.app !== 'gut-log' || !Array.isArray(data.entries)) {
    throw new Error('ไฟล์นี้ไม่ใช่ไฟล์สำรองของแอป Gut log');
  }
  const when = data.exportedAt ? new Date(data.exportedAt) : null;
  return {
    data,
    summary: `บันทึก ${data.entries.length} รายการ · ปัจจัย ${(data.days || []).filter((d) => d.submittedAt).length} วัน`
      + (when ? ` · สำรองเมื่อ ${dateKey(when)}` : '')
  };
}

