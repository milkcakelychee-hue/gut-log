// หน้าตั้งค่า (09-settings)
import { html, useState, useRef } from '../vendor/preact-htm.js';
import { Nav, Confirm, cx } from '../ui.js';
import { Icon, CHEVRON_RIGHT } from '../icons.js';
import { dateKey } from '../rules.js';
import { useStore, itemsOf, setSetting, restoreAll, wipeAll } from '../store.js';
import { exportCsv, exportBackup, readBackup } from '../export.js';
import { addDays } from '../stats.js';

export const LIST_TITLES = {
  risk_food: 'อาหารเสี่ยง',
  symptom: 'อาการ (ตอนไม่ได้ถ่าย)',
  bowel_symptom: 'อาการร่วม (ตอนขับถ่าย)',
  factor: 'ปัจจัยรายวัน'
};

export function backupAge(settings) {
  if (!settings.lastBackup) return null;
  return Math.floor((Date.now() - settings.lastBackup) / 86400000);
}

const Row = ({ label, sub, value, onClick, danger, chevron = true }) => html`
  <button type="button" class="set-row" onClick=${onClick}>
    <span class="set-text">
      <span style=${danger ? 'color: #A0553A' : ''}>${label}</span>
      ${sub && html`<span class="set-sub">${sub}</span>`}
    </span>
    ${value && html`<span class="set-value">${value}</span>`}
    ${chevron && html`<${Icon} d=${CHEVRON_RIGHT} size=${18} width=${2.2} color="#6E776F" />`}
  </button>`;

const Group = ({ title, children }) => html`
  <section class="section" style="gap: 8px">
    <h2 class="set-title">${title}</h2>
    <div class="card set-card">${children}</div>
  </section>`;

export function Settings({ toast }) {
  const s = useStore();
  const [dialog, setDialog] = useState(null);
  const fileInput = useRef(null);
  const age = backupAge(s.settings);
  const weekStart = s.settings.weekStart ?? 0;
  const yearCe = s.settings.yearFormat === 'ce';
  const count = (cat) => itemsOf(cat).length;

  const run = async (fn, okText) => {
    try {
      const ok = await fn();
      if (ok && okText) toast(okText);
    } catch (err) {
      toast('ทำไม่สำเร็จ: ' + (err.message || err));
    }
  };

  const onFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const backup = await readBackup(file);
      setDialog({ type: 'restore', backup });
    } catch (err) {
      toast(err.message);
    }
  };

  return html`
    <main class="page has-nav" style="gap: 22px">
      <h1 class="h1-sm">Settings</h1>

      <${Group} title="รายการให้แตะ">
        <${Row} label=${LIST_TITLES.symptom} value=${count('symptom')} onClick=${() => (location.hash = '#/manage/symptom')} />
        <${Row} label=${LIST_TITLES.bowel_symptom} value=${count('bowel_symptom')} onClick=${() => (location.hash = '#/manage/bowel_symptom')} />
        <${Row} label=${LIST_TITLES.risk_food} value=${count('risk_food')} onClick=${() => (location.hash = '#/manage/risk_food')} />
        <${Row} label=${LIST_TITLES.factor} value=${count('factor') + ' แถว'} sub="การนอน ความเครียด ประจำเดือน อาหารเสี่ยง · ซ่อนได้"
          onClick=${() => (location.hash = '#/manage/factor')} />
      <//>

      <${Group} title="ข้อมูล">
        <${Row} label="ส่งออกเป็น CSV" value="ทั้งหมด" sub="เปิดใน Excel หรือ Google Sheets ได้" onClick=${() => run(exportCsv)} />
        <${Row} label="สรุป PDF สำหรับพบแพทย์" value="เลือกช่วง" sub="ปฏิทิน กราฟ และรายการอาการในช่วงที่เลือก" onClick=${() => setDialog({ type: 'pdf' })} />
        <${Row} label="สำรองข้อมูล" sub="บันทึกเป็นไฟล์ไว้ใน Files หรือ iCloud Drive"
          value=${age === null ? 'ยังไม่เคย' : age === 0 ? 'ล่าสุดวันนี้' : 'ล่าสุด ' + age + ' วันก่อน'}
          onClick=${() => run(exportBackup, 'สำรองข้อมูลแล้ว')} />
        <${Row} label="นำเข้าจากไฟล์สำรอง" sub="ใช้ตอนย้ายเครื่องหรือติดตั้งแอปใหม่" onClick=${() => fileInput.current.click()} />
      <//>
      <input ref=${fileInput} type="file" accept=".json,application/json" style="display: none" onChange=${onFile} />

      <${Group} title="การแสดงผล">
        <${Row} label="วันเริ่มต้นสัปดาห์" value=${weekStart === 1 ? 'จันทร์' : 'อาทิตย์'} chevron=${false}
          onClick=${() => setSetting('weekStart', weekStart === 1 ? 0 : 1)} />
        <${Row} label="รูปแบบปี" value=${yearCe ? 'ค.ศ.' : 'พ.ศ.'} chevron=${false}
          onClick=${() => setSetting('yearFormat', yearCe ? 'be' : 'ce')} />
      <//>

      <${Group} title="ความเป็นส่วนตัว">
        <div class="set-note">ข้อมูลทั้งหมดเก็บในเครื่องนี้เท่านั้น ไม่ถูกส่งไปที่ไหน
          ถ้าลบแอปออกจากหน้าโฮม ข้อมูลจะหายไปด้วย ควรกด "สำรองข้อมูล" เป็นประจำ</div>
        <${Row} label="ล้างข้อมูลทั้งหมด" danger chevron=${false} onClick=${() => setDialog({ type: 'wipe' })} />
      <//>
    </main>
    <div class="bottom"><${Nav} active="settings" /></div>

    ${dialog && dialog.type === 'pdf' && html`<${PdfDialog} onCancel=${() => setDialog(null)}
      onGo=${(from, to) => { setDialog(null); location.hash = '#/report/' + from + '/' + to; }} />`}
    ${dialog && dialog.type === 'restore' && html`
      <${Confirm} title="แทนที่ข้อมูลด้วยไฟล์นี้?" message=${dialog.backup.summary + ' — ข้อมูลที่อยู่ในเครื่องตอนนี้จะถูกแทนที่ทั้งหมด'}
        confirmLabel="นำเข้า" danger onCancel=${() => setDialog(null)}
        onConfirm=${async () => { await restoreAll(dialog.backup.data); setDialog(null); toast('นำเข้าข้อมูลแล้ว'); }} />`}
    ${dialog && dialog.type === 'wipe' && html`
      <${Confirm} title="ล้างข้อมูลทั้งหมด?" message="บันทึก ปัจจัย และรายการที่เพิ่มเองจะหายทั้งหมด กู้คืนไม่ได้ ถ้ายังไม่ได้สำรอง ให้กดยกเลิกแล้วสำรองก่อน"
        confirmLabel="ล้างทั้งหมด" danger onCancel=${() => setDialog(null)}
        onConfirm=${async () => { await wipeAll(); setDialog(null); toast('ล้างข้อมูลแล้ว'); }} />`}
  `;
}

function PdfDialog({ onCancel, onGo }) {
  const today = dateKey();
  const [preset, setPreset] = useState(30);
  const [from, setFrom] = useState(addDays(today, -29));
  const [to, setTo] = useState(today);
  const pick = (n) => {
    setPreset(n);
    if (n) { setFrom(addDays(today, -(n - 1))); setTo(today); }
  };
  const valid = from && to && from <= to;
  return html`
    <div class="dialog-layer" onClick=${(e) => e.target === e.currentTarget && onCancel()}>
      <div class="dialog" role="dialog" aria-modal="true" aria-label="เลือกช่วงวันที่">
        <h3>สรุป PDF สำหรับพบแพทย์</h3>
        <div class="chips">
          ${[[7, '7 วัน'], [30, '30 วัน'], [90, '90 วัน'], [0, 'กำหนดเอง']].map(([n, label]) => html`
            <button type="button" class=${cx('chip', preset === n && 'on')} onClick=${() => pick(n)}>${label}</button>`)}
        </div>
        <div class="row" style="align-items: center">
          <label class="date-field"><span>ตั้งแต่</span><input type="date" value=${from} max=${to} onInput=${(e) => { setPreset(0); setFrom(e.target.value); }} /></label>
          <label class="date-field"><span>ถึง</span><input type="date" value=${to} max=${today} onInput=${(e) => { setPreset(0); setTo(e.target.value); }} /></label>
        </div>
        <p style="font-size: 13px">จะเปิดหน้าสรุป แล้วกด "บันทึกเป็น PDF" เพื่อเลือกพิมพ์หรือบันทึกลงไฟล์</p>
        <div class="row">
          <button type="button" class="btn-plain" onClick=${onCancel}>ยกเลิก</button>
          <button type="button" class="btn-solid" disabled=${!valid} onClick=${() => onGo(from, to)}>สร้างสรุป</button>
        </div>
      </div>
    </div>`;
}
