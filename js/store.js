// โหลดข้อมูลทั้งหมดไว้ในหน่วยความจำ (ข้อมูลคนเดียว ขนาดเล็ก) แล้วเขียนลง IndexedDB ทุกครั้งที่แก้
import { useState, useEffect } from './vendor/preact-htm.js';
import * as db from './db.js';
import { DEFAULT_LISTS, FACTORS, FACTOR_KEYS, ZONE_ORDER, uid } from './rules.js';

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
  state.days = Object.fromEntries(days.map((d) => [d.date, d]));
  state.items = items;
  state.settings = Object.fromEntries(settings.map((s) => [s.key, s.value]));
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
export const emptyDay = (date) => ({ date, sleep: null, stress: null, period: null, riskFood: null, riskFoods: [] });
export const dayOf = (date) => state.days[date] || emptyDay(date);

export async function updateDay(date, patch) {
  const next = { ...dayOf(date), ...patch };
  await db.put('days', next);
  state.days = { ...state.days, [date]: next };
  emit();
}

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
  const item = { id: uid(), category, name, order, hidden: false, isNew: true };
  await putItem(item);
  return item;
}

export async function putItem(item) {
  await db.put('items', item);
  state.items = state.items.filter((i) => i.id !== item.id).concat([item]);
  emit();
}

// ---------- ตั้งค่า ----------
export async function setSetting(key, value) {
  await db.put('settings', { key, value });
  state.settings = { ...state.settings, [key]: value };
  emit();
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
  days.forEach((d) => { state.days[d.date] = d; });
  state.days = { ...state.days };
  emit();
}
