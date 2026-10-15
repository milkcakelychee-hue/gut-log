// โหลดข้อมูลทั้งหมดไว้ในหน่วยความจำ (ข้อมูลคนเดียว ขนาดเล็ก) แล้วเขียนลง IndexedDB ทุกครั้งที่แก้
import { useState, useEffect } from './vendor/preact-htm.js';
import * as db from './db.js';
import { DEFAULT_LISTS, FACTORS, FACTOR_KEYS, ZONE_ORDER, prefs, uid } from './rules.js';

export const state = { ready: false, entries: [], days: {}, items: [], settings: {} };
const listeners = new Set();
function emit() { listeners.forEach((f) => f()); }

export function useStore() {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((x) => x + 1);
    listeners.add(f);
    return () => listeners.delete(f);
  }, []);
  return state;
}

function defaultItems() {
  const items = [];
  Object.entries(DEFAULT_LISTS).forEach(([category, names]) =>
    names.forEach((name, order) => items.push({ id: uid() + order, category, name, order, hidden: false })));
  FACTOR_KEYS.forEach((key, order) =>
    items.push({ id: 'factor_' + key, category: 'factor', key, name: FACTORS[key].name, order, hidden: false }));
  return items;
}

export async function init() {
  let items = await db.getAll('items');
  if (!items.length) {
    items = defaultItems();
    await db.putMany('items', items);
  }
  const [entries, days, settings] = await Promise.all([db.getAll('entries'), db.getAll('days'), db.getAll('settings')]);
  state.entries = entries;
  state.days = Object.fromEntries(days.map((d) => [d.date, normalizeDay(d)]));
  state.items = items;
  state.settings = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  applyPrefs();
  state.ready = true;
  emit();
  // ขอให้เบราว์เซอร์ไม่ลบข้อมูลเองเมื่อพื้นที่เหลือน้อย
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}

// ---------- บันทึก ----------
export const entriesOn = (date) => state.entries.filter((e) => e.date === date);

export async function saveEntry(input) {
  const now = Date.now();
  const e = {
    ...input,
    id: input.id || uid(),
    date: input.datetime.slice(0, 10),
    zones: (input.zones || []).slice().sort((a, b) => ZONE_ORDER.indexOf(a) - ZONE_ORDER.indexOf(b)),
    createdAt: input.createdAt || now,
    updatedAt: now
  };
  await db.put('entries', e);
  state.entries = state.entries.filter((x) => x.id !== e.id).concat([e]);
  emit();
  return e;
}

export async function deleteEntry(id) {
  await db.del('entries', id);
  state.entries = state.entries.filter((x) => x.id !== id);
  emit();
}

// ---------- ปัจจัยรายวัน ----------
// ค่าที่ส่งแล้วอยู่ในตัว record (submittedAt) ส่วนที่กำลังเลือก/แก้อยู่ใน draft
// riskMeals: null = ยังไม่เลือก, 0 = ไม่มี, 1+ = จำนวนมื้อ
export const FACTOR_FIELDS = ['sleep', 'stress', 'period', 'riskMeals', 'riskFoods'];
export const emptyDay = (date) => ({ date, sleep: null, stress: null, period: null, riskMeals: null, riskFoods: [], submittedAt: null, draft: null });

// ข้อมูลรุ่นแรก (riskFood ระดับ 3 ขั้น ไม่มีการส่ง) → รูปแบบใหม่
function normalizeDay(d) {
  const day = { ...emptyDay(d.date), ...d };
  if (d.riskFood !== undefined) {
    if (day.riskMeals === null) day.riskMeals = { none: 0, some: 1, lots: 2 }[d.riskFood] ?? null;
    delete day.riskFood;
  }
  if (day.submittedAt === null && !day.draft && pickFactors(day).filled) day.submittedAt = Date.now();
  return day;
}

export function pickFactors(src) {
  const v = {};
  FACTOR_FIELDS.forEach((k) => { v[k] = k === 'riskFoods' ? (src[k] || []).slice() : src[k] ?? null; });
  v.filled = FACTOR_FIELDS.some((k) => (k === 'riskFoods' ? v[k].length > 0 : v[k] !== null));
  return v;
}

export const dayOf = (date) => state.days[date] || emptyDay(date);

// ค่าที่หน้าจอควรแสดง: ร่างถ้ามี ไม่งั้นค่าที่ส่งแล้ว
export function factorView(date) {
  const day = dayOf(date);
  return { ...pickFactors(day.draft || day), submittedAt: day.submittedAt, editing: !!day.draft, locked: !!day.submittedAt && !day.draft };
}

async function putDay(next) {
  await db.put('days', next);
  state.days = { ...state.days, [next.date]: next };
  emit();
}

export async function editFactors(date, patch) {
  const day = dayOf(date);
  const base = pickFactors(day.draft || day);
  delete base.filled;
  await putDay({ ...day, draft: { ...base, ...patch } });
}

export async function submitFactors(date) {
  const day = dayOf(date);
  if (!day.draft) return;
  const v = pickFactors(day.draft);
  delete v.filled;
  await putDay({ ...day, ...v, draft: null, submittedAt: Date.now() });
}

// เริ่มแก้ไขค่าที่ส่งแล้ว / ยกเลิกการแก้ไข
export async function startEditFactors(date) { await editFactors(date, {}); }
export async function cancelEditFactors(date) { await putDay({ ...dayOf(date), draft: null }); }

// ---------- รายการที่ผู้ใช้แก้ได้ ----------
export function itemsOf(category, { includeHidden = false } = {}) {
  return state.items
    .filter((i) => i.category === category && (includeHidden || !i.hidden))
    .sort((a, b) => a.order - b.order);
}

// เพิ่มรายการใหม่ถาวร ถ้ามีชื่อเดิมที่ซ่อนอยู่ให้แสดงกลับมา
export async function addItem(category, rawName) {
  const name = rawName.trim();
  if (!name) return null;
  const existing = state.items.find((i) => i.category === category && i.name === name);
  if (existing) {
    if (existing.hidden) await putItem({ ...existing, hidden: false });
    return existing;
  }
  const order = Math.max(-1, ...itemsOf(category, { includeHidden: true }).map((i) => i.order)) + 1;
  const item = { id: uid(), category, name, order, hidden: false, createdAt: Date.now() };
  await putItem(item);
  return item;
}

export async function putItem(item) {
  await db.put('items', item);
  state.items = state.items.filter((i) => i.id !== item.id).concat([item]);
  emit();
}

export async function deleteItem(id) {
  await db.del('items', id);
  state.items = state.items.filter((i) => i.id !== id);
  emit();
}

// ids = ลำดับใหม่ของรายการที่แสดงอยู่ในหมวดนั้น
export async function reorderItems(ids) {
  const changed = ids.map((id, order) => ({ ...state.items.find((i) => i.id === id), order }));
  await db.putMany('items', changed);
  state.items = state.items.map((i) => changed.find((c) => c.id === i.id) || i);
  emit();
}

// ---------- ตั้งค่า ----------
function applyPrefs() {
  prefs.be = state.settings.yearFormat !== 'ce';
}

export async function setSetting(key, value) {
  await db.put('settings', { key, value });
  state.settings = { ...state.settings, [key]: value };
  applyPrefs();
  emit();
}

// ---------- สำรอง / นำเข้า ----------
export function snapshot() {
  const settings = Object.entries(state.settings).filter(([k]) => k !== 'lastBackup').map(([key, value]) => ({ key, value }));
  return { app: 'gut-log', version: 1, exportedAt: new Date().toISOString(), entries: state.entries, days: Object.values(state.days), items: state.items, settings };
}

// แทนที่ข้อมูลทั้งหมดด้วยไฟล์สำรอง
export async function restoreAll(data) {
  await db.clearAll();
  await db.putMany('entries', data.entries || []);
  await db.putMany('days', data.days || []);
  await db.putMany('items', data.items || []);
  await db.putMany('settings', (data.settings || []).concat([{ key: 'lastBackup', value: Date.now() }]));
  await init();
}

// ---------- ใช้ตอนทดสอบ ----------
export async function wipeAll() {
  await db.clearAll();
  state.entries = []; state.days = {}; state.items = []; state.settings = {};
  await init();
}

export async function replaceData({ entries, days }) {
  await db.putMany('entries', entries);
  await db.putMany('days', days);
  state.entries = state.entries.filter((e) => !entries.some((x) => x.id === e.id)).concat(entries);
  days.forEach((d) => { state.days[d.date] = normalizeDay(d); });
  state.days = { ...state.days };
  emit();
}
