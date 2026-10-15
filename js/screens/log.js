// หน้าบันทึกใหม่ / แก้ไขบันทึก (ขับถ่าย | มีอาการ)
import { html, useState, useRef, useEffect } from '../vendor/preact-htm.js';
import { BristolGrid, PainScale, BellyMap, Chip, AddChip, Confirm, AddItemDialog, cx, toggle } from '../ui.js';
import { Icon, CHECK } from '../icons.js';
import { WHEN, chipTime, dateKey, nowLocal, timeOf } from '../rules.js';
import { useStore, itemsOf, addItem, saveEntry, deleteEntry } from '../store.js';

// init: { mode: 'bowel' | 'symptom', entry?, date? }
export function LogSheet({ init, onClose }) {
  useStore();
  const entry = init.entry;
  const startTime = entry ? entry.datetime
    : init.date && init.date !== dateKey() ? init.date + 'T' + timeOf(nowLocal()) : nowLocal();

  const [kind, setKind] = useState(entry ? entry.kind : init.mode);
  const [datetime, setDatetime] = useState(startTime);
  const [bristol, setBristol] = useState(entry && entry.kind === 'bowel' ? (entry.bristol ?? 0) : undefined);
  const [pain, setPain] = useState(entry ? entry.pain ?? null : null);
  const [zones, setZones] = useState(entry ? entry.zones || [] : []);
  const [symB, setSymB] = useState(entry && entry.kind === 'bowel' ? entry.symptoms || [] : []);
  const [symS, setSymS] = useState(entry && entry.kind === 'symptom' ? entry.symptoms || [] : []);
  const [when, setWhen] = useState(entry && entry.when ? entry.when : 'now');
  const [note, setNote] = useState(entry ? entry.note || '' : '');
  const [savedId, setSavedId] = useState(entry ? entry.id : null);
  const [createdAt, setCreatedAt] = useState(entry ? entry.createdAt : null);
  const [dialog, setDialog] = useState(null);
  const [closing, setClosing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const form = { kind, datetime, bristol, pain, zones, symB, symS, when, note: note.trim() };
  const key = JSON.stringify(form);
  const [savedKey, setSavedKey] = useState(entry ? key : null);
  const dirty = key !== savedKey;
  const isSaved = savedId && !dirty;
  const showDone = isSaved && justSaved;

  const hasContent = kind === 'bowel'
    ? bristol !== undefined || pain !== null || zones.length || symB.length || note.trim()
    : pain !== null || zones.length || symS.length || note.trim();
  const canSave = dirty && hasContent;

  const sheet = useRef(null);
  const scroller = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 220);
  };
  const requestClose = () => {
    if (dirty && hasContent) {
      setDialog({ type: 'discard' });
    } else close();
  };

  const save = async () => {
    const e = await saveEntry({
      id: savedId || undefined,
      createdAt: createdAt || undefined,
      kind,
      datetime,
      bristol: kind === 'bowel' && bristol ? bristol : null,
      when: kind === 'symptom' ? when : null,
      pain,
      zones,
      symptoms: kind === 'bowel' ? symB : symS,
      note: note.trim()
    });
    setSavedId(e.id);
    setCreatedAt(e.createdAt);
    setSavedKey(key);
    setJustSaved(true);
  };

  // ปัดลงเพื่อปิด
  const onTouchStart = (e) => {
    if (scroller.current.scrollTop <= 0) drag.current = { y: e.touches[0].clientY, dy: 0 };
  };
  const onTouchMove = (e) => {
    if (!drag.current) return;
    const dy = e.touches[0].clientY - drag.current.y;
    if (dy < 0 && drag.current.dy === 0) { drag.current = null; return; }
    drag.current.dy = Math.max(0, dy);
    sheet.current.style.transition = 'none';
    sheet.current.style.transform = `translateY(${drag.current.dy}px)`;
  };
  const onTouchEnd = () => {
    if (!drag.current) return;
    const far = drag.current.dy > 110;
    drag.current = null;
    sheet.current.style.transition = 'transform .2s ease';
    sheet.current.style.transform = '';
    if (far) requestClose();
  };

  const symList = kind === 'bowel' ? symB : symS;
  const setSymList = kind === 'bowel' ? setSymB : setSymS;
  const category = kind === 'bowel' ? 'bowel_symptom' : 'symptom';
  const visible = itemsOf(category).map((i) => i.name);
  const shown = visible.concat(symList.filter((s) => !visible.includes(s)));

  return html`
    <div class="sheet-backdrop"></div>
    <div ref=${sheet} class=${cx('sheet', closing && 'closing')} role="dialog" aria-modal="true" aria-label=${entry ? 'แก้ไขบันทึก' : 'บันทึกใหม่'}
      onTouchStart=${onTouchStart} onTouchMove=${onTouchMove} onTouchEnd=${onTouchEnd}>
      <div class="sheet-scroll" ref=${scroller}>
        <div class="sheet-inner">
          <div class="grabber" aria-hidden="true"></div>
          <div class="sheet-head">
            <button type="button" class="link-btn" onClick=${requestClose}>${showDone ? 'ปิด' : 'ยกเลิก'}</button>
            <div class="title">${entry ? 'แก้ไขบันทึก' : 'บันทึกใหม่'}</div>
            <label class="time-chip" aria-label="เวลาที่บันทึก">
              ${chipTime(datetime)}
              <input type="datetime-local" value=${datetime} max=${nowLocal()} onInput=${(e) => e.target.value && setDatetime(e.target.value)} />
            </label>
          </div>

          <div class="tabs" role="tablist" aria-label="ประเภทบันทึก">
            <button type="button" role="tab" aria-selected=${kind === 'bowel' ? 'true' : 'false'} class=${kind === 'bowel' ? 'on' : ''} onClick=${() => setKind('bowel')}>ขับถ่าย</button>
            <button type="button" role="tab" aria-selected=${kind === 'symptom' ? 'true' : 'false'} class=${kind === 'symptom' ? 'on' : ''} onClick=${() => setKind('symptom')}>มีอาการ (ไม่ได้ถ่าย)</button>
          </div>

          ${kind === 'bowel' ? html`
            <${BristolGrid} value=${bristol} onChange=${setBristol} />
            <${PainScale} value=${pain} onChange=${setPain} />
            <${BellyMap} title="ปวดตรงไหน" zones=${zones} onChange=${setZones} />
            ${symptomSection('อาการร่วม')}
          ` : html`
            <section class="log-section">
              <h2 class="h2-lg">เป็นตอนไหน</h2>
              <div class="when">
                ${WHEN.map((w) => html`
                  <button type="button" class=${when === w.key ? 'on' : ''} aria-pressed=${when === w.key ? 'true' : 'false'}
                    onClick=${() => setWhen(when === w.key ? null : w.key)}>
                    <span class="w-label">${w.label}</span>
                    <span class="w-sub">${w.key === 'now' ? timeOf(datetime) : w.sub}</span>
                  </button>`)}
              </div>
            </section>
            ${symptomSection('อาการตอนนี้')}
            <${PainScale} value=${pain} onChange=${setPain} />
            <${BellyMap} title="ตรงไหน" zones=${zones} onChange=${setZones} />
          `}

          <section class="log-section" style="gap: 10px">
            <label for="note" class="note-label">โน้ตสั้น ๆ <span>(ไม่บังคับ)</span></label>
            <input id="note" class="text-input" type="text" value=${note} onInput=${(e) => setNote(e.target.value)} enterkeyhint="done"
              placeholder=${kind === 'bowel' ? 'เช่น กินส้มตำเมื่อวานเย็น' : 'เช่น ตื่นมาแน่นท้อง กินข้าวดึก'} />
          </section>

          ${savedId && html`
            <button type="button" class="danger-btn" onClick=${() => setDialog({ type: 'delete' })}>ลบบันทึกนี้</button>`}
        </div>
      </div>

      <div class="sheet-bottom">
        ${showDone
          ? html`<button type="button" class="btn-primary btn-done" style="width: 100%" onClick=${close}>
              <${Icon} d=${CHECK} size=${22} width=${2.6} color="#3B5E44" /> ${init.backLabel || 'บันทึกแล้ว · กลับหน้าวันนี้'}</button>`
          : html`<button type="button" class="btn-primary" style="width: 100%" disabled=${!canSave} onClick=${save}>
              ${entry || savedId ? 'บันทึกการแก้ไข' : kind === 'bowel' ? 'บันทึก' : 'บันทึกอาการ'}</button>`}
      </div>
    </div>

    ${dialog && dialog.type === 'discard' && html`
      <${Confirm} title="ทิ้งบันทึกนี้?" message="ข้อมูลที่เลือกไว้ยังไม่ได้บันทึก" confirmLabel="ทิ้ง" danger
        onCancel=${() => setDialog(null)} onConfirm=${() => { setDialog(null); close(); }} />`}
    ${dialog && dialog.type === 'delete' && html`
      <${Confirm} title="ลบบันทึกนี้?" message="ลบแล้วกู้คืนไม่ได้" confirmLabel="ลบ" danger
        onCancel=${() => setDialog(null)} onConfirm=${async () => { await deleteEntry(savedId); setDialog(null); close(); }} />`}
    ${dialog && dialog.type === 'add' && html`
      <${AddItemDialog} title=${kind === 'bowel' ? 'เพิ่มอาการร่วม' : 'เพิ่มอาการ'} placeholder="ชื่ออาการ"
        onCancel=${() => setDialog(null)}
        onAdd=${async (name) => {
          const item = await addItem(category, name);
          if (item && !symList.includes(item.name)) setSymList(symList.concat([item.name]));
          setDialog(null);
        }} />`}
  `;

  function symptomSection(title) {
    return html`
      <section class="log-section">
        <div class="section-head">
          <h2 class="h2-lg">${title}</h2>
          <div class="hint">แตะได้หลายข้อ</div>
        </div>
        <div class="chips">
          ${shown.map((s) => html`<${Chip} on=${symList.includes(s)} onClick=${() => setSymList(toggle(symList, s))}>${s}<//>`)}
          <${AddChip} label="+ เพิ่มเอง" onClick=${() => setDialog({ type: 'add' })} />
        </div>
      </section>`;
  }
}
