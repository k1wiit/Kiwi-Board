/* KIWI BOARD — app.js */

const state = {
  plugins: [],   // { id, name, desc, color, filePath, builtinId? }
  folders: [],   // { id, name, emoji }
  activeTab: 'home',
  selectedColor: '#38bdf8',
  selectedFile: null,
};

const uid = () => Math.random().toString(36).slice(2, 10);
const $  = id => document.getElementById(id);

/* ── BOOT ──────────────────────────── */
window.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  ensureBuiltins();

  setTimeout(() => {
    $('splash').classList.add('out');
    setTimeout(() => {
      $('splash').style.display = 'none';
      $('app').classList.remove('hidden');
      renderAll();
    }, 500);
  }, 2000);
});

/* ── BUILT-INS ─────────────────────── */
function ensureBuiltins() {
  if (!state.plugins.find(p => p.builtinId === 'notes')) {
    state.plugins.unshift({
      id: uid(), builtinId: 'notes',
      name: 'Notes', desc: 'Your personal notebook',
      color: '#facc15', filePath: 'plugins/notes.html',
    });
    saveData();
  }
}

/* ── PERSIST ───────────────────────── */
async function loadData() {
  try {
    const isEl = typeof window.kiwiAPI !== 'undefined';
    const d = isEl ? await window.kiwiAPI.loadData()
                   : JSON.parse(localStorage.getItem('kiwi-data') || '{}');
    state.plugins = Array.isArray(d.plugins) ? d.plugins : [];
    state.folders = Array.isArray(d.folders) ? d.folders : [];
  } catch(e) {
    state.plugins = [];
    state.folders = [];
  }
}

function saveData() {
  const d = { plugins: state.plugins, folders: state.folders };
  try {
    if (typeof window.kiwiAPI !== 'undefined') window.kiwiAPI.saveData(d);
    else localStorage.setItem('kiwi-data', JSON.stringify(d));
  } catch(e) {}
}

/* ── RENDER ────────────────────────── */
function renderAll() {
  renderSidebar();
  renderTabs();
  renderHome();
}

/* ── SIDEBAR ───────────────────────── */
function renderSidebar() {
  const pl = $('plugin-list');
  pl.innerHTML = '';
  if (!state.plugins.length) {
    pl.innerHTML = '<div class="sidebar-empty">No plugins installed</div>';
  } else {
    state.plugins.forEach(p => {
      const el = document.createElement('div');
      el.className = 'sidebar-row' + (state.activeTab === p.id ? ' active' : '');
      el.innerHTML = `<span class="sr-dot" style="background:${p.color}"></span><span class="sr-label">${p.name}</span>`;
      el.addEventListener('click', () => openPlugin(p.id));
      pl.appendChild(el);
    });
  }

  const ft = $('folder-tree');
  ft.innerHTML = '';
  state.folders.forEach(f => {
    const el = document.createElement('div');
    el.className = 'folder-row';
    el.innerHTML = `<span>${f.emoji||'📁'}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.name}</span><button class="fdel">×</button>`;
    el.querySelector('.fdel').addEventListener('click', e => {
      e.stopPropagation();
      state.folders = state.folders.filter(x => x.id !== f.id);
      saveData(); renderSidebar();
    });
    ft.appendChild(el);
  });
}

/* ── TABS ──────────────────────────── */
function renderTabs() {
  const pt = $('plugin-tabs');
  pt.innerHTML = '';
  state.plugins.forEach(p => {
    const tab = document.createElement('div');
    tab.className = 'tab' + (state.activeTab === p.id ? ' active' : '');
    const dot = p.builtinId === 'notes'
      ? `<svg class="tab-icon" viewBox="0 0 14 14" fill="none" width="13" height="13"><path d="M2 11.5V13h1.5L12 5l-1.5-1.5L2 11.5zM13 3.5a1 1 0 000-1.4l-1.1-1.1a1 1 0 00-1.4 0l-1 1L12 4.5l1-1z" fill="currentColor" opacity="0.7"/></svg>`
      : `<span style="width:8px;height:8px;border-radius:50%;background:${p.color};display:inline-flex;flex-shrink:0"></span>`;
    tab.innerHTML = `${dot}<span>${p.name}</span><button class="tab-close">×</button>`;
    tab.addEventListener('click', e => { if (!e.target.classList.contains('tab-close')) openPlugin(p.id); });
    tab.querySelector('.tab-close').addEventListener('click', () => closePlugin(p.id));
    pt.appendChild(tab);
  });

  // sync home tab active state
  $('home-tab').classList.toggle('active', state.activeTab === 'home');
}

/* ── HOME ──────────────────────────── */
function renderHome() {
  const grid  = $('plugin-grid');
  const empty = $('home-empty');
  grid.innerHTML = '';

  if (!state.plugins.length) {
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  state.plugins.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'plugin-card';
    card.style.animationDelay = Math.min(i * 55, 350) + 'ms';
    card.innerHTML = `
      <div class="card-thumb">${p.builtinId === 'notes' ? notesThumbSVG() : genericThumb(p)}</div>
      <button class="card-dots" data-id="${p.id}">···</button>
      <div class="card-info">
        <div class="card-name">${p.name}</div>
        <div class="card-desc">${p.desc || 'No description'}</div>
        <div class="card-footer">
          <span class="card-tag" style="color:${p.color};background:${p.color}18">${p.builtinId ? 'built-in' : 'plugin'}</span>
          <button class="card-open" style="color:${p.color}">Open →</button>
        </div>
      </div>`;
    card.querySelector('.card-open').addEventListener('click', e => { e.stopPropagation(); openPlugin(p.id); });
    card.querySelector('.card-dots').addEventListener('click', e => { e.stopPropagation(); showCtx(e, p.id); });
    card.addEventListener('dblclick', () => openPlugin(p.id));
    grid.appendChild(card);
  });
}

function notesThumbSVG() {
  return `<img src="https://i.pinimg.com/736x/18/6f/c8/186fc81983f0eb5c67c5bef5d8e03d3d.jpg"
    style="width:100%;height:100%;object-fit:cover;object-position:center;display:block"
    onerror="this.style.display='none';this.parentElement.style.background='#facc1514'"
    alt="Notes"/>`;
}

function genericThumb(p) {
  return `<div style="position:absolute;inset:0;background:${p.color}12;display:flex;align-items:center;justify-content:center">
    <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.03)1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03)1px,transparent 1px);background-size:24px 24px"></div>
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 60%,${p.color}22 0%,transparent 65%)"></div>
    <div style="position:relative;z-index:1;width:52px;height:52px;border-radius:13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 8px 24px rgba(0,0,0,0.4)">${p.emoji||'🧩'}</div>
  </div>`;
}

/* ── OPEN PLUGIN ───────────────────── */
function openPlugin(id) {
  state.activeTab = id;

  // hide home
  $('page-home').style.display = 'none';

  // deactivate all frames
  document.querySelectorAll('.plugin-frame').forEach(f => f.classList.remove('active'));

  // create frame if needed
  if (!document.querySelector(`.plugin-frame[data-id="${id}"]`)) {
    const p = state.plugins.find(x => x.id === id);
    if (!p) return;
    const wrap = document.createElement('div');
    wrap.className = 'plugin-frame';
    wrap.dataset.id = id;
    const iframe = document.createElement('iframe');
    iframe.src = p.filePath;
    iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads';
    wrap.appendChild(iframe);
    $('plugin-frames').appendChild(wrap);
  }

  document.querySelector(`.plugin-frame[data-id="${id}"]`).classList.add('active');
  renderTabs();
  renderSidebar();
}

/* ── CLOSE PLUGIN ──────────────────── */
function closePlugin(id) {
  const frame = document.querySelector(`.plugin-frame[data-id="${id}"]`);
  if (frame) frame.remove();
  if (state.activeTab === id) goHome();
  else { renderTabs(); renderSidebar(); }
}

/* ── GO HOME ───────────────────────── */
function goHome() {
  state.activeTab = 'home';
  document.querySelectorAll('.plugin-frame').forEach(f => f.classList.remove('active'));
  $('page-home').style.display = 'block';
  renderAll();
}

/* ── CONTEXT MENU ──────────────────── */
let ctxEl = null;
function showCtx(e, id) {
  removeCtx();
  const isBuiltin = !!state.plugins.find(p => p.id === id)?.builtinId;
  const m = document.createElement('div');
  m.className = 'ctx';
  m.style.left = Math.min(e.clientX, window.innerWidth - 170) + 'px';
  m.style.top  = Math.min(e.clientY, window.innerHeight - 80) + 'px';
  m.innerHTML = `<div class="ctx-item" id="cx-open">Open</div>${!isBuiltin ? '<div class="ctx-sep"></div><div class="ctx-item ctx-danger" id="cx-del">Uninstall</div>' : ''}`;
  m.querySelector('#cx-open').addEventListener('click', () => { openPlugin(id); removeCtx(); });
  if (!isBuiltin) m.querySelector('#cx-del').addEventListener('click', () => { uninstall(id); removeCtx(); });
  document.body.appendChild(m);
  ctxEl = m;
  setTimeout(() => document.addEventListener('click', removeCtx, { once: true }), 10);
}
function removeCtx() { ctxEl?.remove(); ctxEl = null; }

function uninstall(id) {
  const frame = document.querySelector(`.plugin-frame[data-id="${id}"]`);
  if (frame) frame.remove();
  if (state.activeTab === id) state.activeTab = 'home';
  state.plugins = state.plugins.filter(p => p.id !== id);
  saveData(); renderAll();
  if (state.activeTab === 'home') $('page-home').style.display = 'block';
}

/* ── UPLOAD MODAL ──────────────────── */
function openModal()  { $('modal-overlay').style.display = 'flex'; setTimeout(() => $('pm-name').focus(), 80); }
function closeModal() { $('modal-overlay').style.display = 'none'; }

$('btn-upload-plugin').addEventListener('click', openModal);
$('btn-upload-empty').addEventListener('click', openModal);
$('tab-add-btn').addEventListener('click', openModal);
$('um-close').addEventListener('click', closeModal);
$('um-cancel').addEventListener('click', closeModal);
$('modal-overlay').addEventListener('click', e => { if (e.target.id === 'modal-overlay') closeModal(); });

$('btn-browse').addEventListener('click', () => $('file-input').click());
$('file-input').addEventListener('change', e => { if (e.target.files[0]) pickFile(e.target.files[0]); });

const dz = $('drop-zone');
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
dz.addEventListener('dragleave', () => dz.classList.remove('over'));
dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); if (e.dataTransfer.files[0]) pickFile(e.dataTransfer.files[0]); });

function pickFile(file) {
  state.selectedFile = file;
  dz.querySelector('.dz-file')?.remove();
  const b = document.createElement('div'); b.className = 'dz-file'; b.textContent = '📄 ' + file.name;
  dz.appendChild(b);
  if (!$('pm-name').value) $('pm-name').value = file.name.replace(/\.(html|htm)$/i, '');
}

document.querySelectorAll('.cdot').forEach(d => {
  d.addEventListener('click', () => {
    state.selectedColor = d.dataset.c;
    document.querySelectorAll('.cdot').forEach(x => x.classList.toggle('active', x.dataset.c === d.dataset.c));
  });
});

$('um-install').addEventListener('click', () => {
  const name = $('pm-name').value.trim();
  if (!name) { $('pm-name').focus(); return; }
  if (!state.selectedFile) { alert('Select a plugin .html file first.'); return; }
  const reader = new FileReader();
  reader.onload = ev => {
    const blob = new Blob([ev.target.result], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const p = { id: uid(), name, desc: $('pm-desc').value.trim(), color: state.selectedColor, emoji: '🧩', filePath: url };
    state.plugins.push(p);
    saveData();
    // reset form
    state.selectedFile = null;
    $('pm-name').value = ''; $('pm-desc').value = '';
    dz.querySelector('.dz-file')?.remove();
    closeModal();
    renderAll();
    setTimeout(() => openPlugin(p.id), 150);
  };
  reader.readAsText(state.selectedFile);
});

/* ── FOLDER MODAL ──────────────────── */
function openFolderModal()  { $('folder-modal-overlay').style.display = 'flex'; setTimeout(() => $('fm-name').focus(), 80); }
function closeFolderModal() { $('folder-modal-overlay').style.display = 'none'; }

$('btn-new-folder').addEventListener('click', openFolderModal);
$('fm-close').addEventListener('click', closeFolderModal);
$('fm-cancel').addEventListener('click', closeFolderModal);
$('folder-modal-overlay').addEventListener('click', e => { if (e.target.id === 'folder-modal-overlay') closeFolderModal(); });
$('fm-save').addEventListener('click', () => {
  const name = $('fm-name').value.trim();
  if (!name) { $('fm-name').focus(); return; }
  state.folders.push({ id: uid(), name, emoji: $('fm-emoji').value.trim() || '📁' });
  saveData(); closeFolderModal(); renderSidebar();
});

/* ── SIDEBAR TABS ──────────────────── */
document.querySelectorAll('.stab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.stab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $('stab-' + btn.dataset.stab).classList.add('active');
  });
});

$('home-tab').addEventListener('click', goHome);

/* ── WINDOW CONTROLS ───────────────── */
if (typeof window.kiwiAPI !== 'undefined') {
  $('btn-min').addEventListener('click', () => window.kiwiAPI.minimize());
  $('btn-max').addEventListener('click', () => window.kiwiAPI.maximize());
  $('btn-close').addEventListener('click', () => window.kiwiAPI.close());
} else {
  $('traffic-lights').style.display = 'none';
}

/* ── ESC ───────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeFolderModal(); removeCtx(); }
});
