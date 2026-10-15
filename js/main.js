import { html, render, useState, useEffect } from './vendor/preact-htm.js';
import { init, useStore, replaceData, wipeAll } from './store.js';
import { Nav, Confirm, Toast } from './ui.js';
import { Today } from './screens/today.js';
import { LogSheet } from './screens/log.js';
import { History } from './screens/history.js';
import { Day } from './screens/day.js';
import { makeSample } from './sample.js';

function useRoute() {
  const read = () => (location.hash.replace(/^#\/?/, '') || 'today').split('/');
  const [route, setRoute] = useState(read());
  useEffect(() => {
    const f = () => { setRoute(read()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return route;
}

// เปิดแอปค้างข้ามเที่ยงคืน → วาดใหม่ให้วันที่ถูกต้อง
function useRefreshOnWake() {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => document.visibilityState === 'visible' && force((x) => x + 1);
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, []);
}

function Placeholder({ title, tab, phase }) {
  return html`
    <main class="page has-nav">
      <h1 class="h1-sm">${title}</h1>
      <div class="card placeholder">หน้านี้จะมาในช่วง (${phase})</div>
    </main>
    <div class="bottom"><${Nav} active=${tab} /></div>`;
}

function SettingsTemp({ toast }) {
  const [ask, setAsk] = useState(null);
  return html`
    <main class="page has-nav">
      <h1 class="h1-sm">Settings</h1>
      <div class="card placeholder">หน้าตั้งค่าจะมาในช่วง (ง)</div>
      <section class="section">
        <h2 class="h2" style="font-size: 14px; font-weight: 500; color: #5C675F; margin: 0 4px">สำหรับทดลอง (ช่วงพัฒนา)</h2>
        <div class="dev-tools">
          <button type="button" class="btn-plain" onClick=${() => setAsk('sample')}>ใส่ข้อมูลตัวอย่าง 30 วันย้อนหลัง</button>
          <button type="button" class="btn-plain" style="color: #A0553A" onClick=${() => setAsk('wipe')}>ล้างข้อมูลทั้งหมด</button>
        </div>
      </section>
    </main>
    <div class="bottom"><${Nav} active="settings" /></div>
    ${ask === 'sample' && html`<${Confirm} title="ใส่ข้อมูลตัวอย่าง?" message="จะเพิ่มบันทึกสุ่มย้อนหลัง 30 วัน ไม่แตะวันนี้ จึงยังไม่เห็นในหน้าวันนี้ จะเห็นในหน้าประวัติและแนวโน้ม (ช่วง ข และ ค)"
      confirmLabel="ใส่ข้อมูล" onCancel=${() => setAsk(null)}
      onConfirm=${async () => {
        const data = makeSample();
        await replaceData(data);
        setAsk(null);
        toast('เพิ่มข้อมูล ' + data.days.length + ' วันย้อนหลังแล้ว (' + data.entries.length + ' บันทึก) · จะเห็นในหน้าประวัติ');
      }} />`}
    ${ask === 'wipe' && html`<${Confirm} title="ล้างข้อมูลทั้งหมด?" message="บันทึก ปัจจัย และรายการที่เพิ่มเองจะหายทั้งหมด กู้คืนไม่ได้"
      confirmLabel="ล้างทั้งหมด" danger onCancel=${() => setAsk(null)}
      onConfirm=${async () => { await wipeAll(); setAsk(null); toast('ล้างข้อมูลแล้ว'); }} />`}
  `;
}

function App() {
  const s = useStore();
  const route = useRoute();
  useRefreshOnWake();
  const [log, setLog] = useState(null);
  const [toastText, setToastText] = useState(null);
  const openLog = (o) => setLog({ ...o, _k: Date.now() });
  if (!s.ready) return null;

  let screen;
  switch (route[0]) {
    case 'history': screen = html`<${History} />`; break;
    case 'day': screen = html`<${Day} key=${route[1]} date=${route[1]} onLog=${openLog} />`; break;
    case 'trends': screen = html`<${Placeholder} title="Trends" tab="trends" phase="ค" />`; break;
    case 'settings': screen = html`<${SettingsTemp} toast=${setToastText} />`; break;
    default: screen = html`<${Today} onLog=${openLog} />`;
  }
  return html`
    <div class="app">
      ${screen}
      ${log && html`<${LogSheet} key=${log._k} init=${log} onClose=${() => setLog(null)} />`}
      ${toastText && html`<${Toast} text=${toastText} onDone=${() => setToastText(null)} />`}
    </div>`;
}

init().then(() => render(html`<${App} />`, document.getElementById('app'))).catch((err) => {
  document.getElementById('app').innerHTML =
    '<p style="padding: 40px 20px; font-size: 16px">เปิดฐานข้อมูลไม่ได้ ลองปิดแล้วเปิดแอปใหม่<br><small>' + err + '</small></p>';
});
