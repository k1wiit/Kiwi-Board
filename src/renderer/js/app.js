/* ══════════════════════════════════════
   KIWI BOARD — app.js  (v2 browser)
   ══════════════════════════════════════ */

// ── STATE ──
const state = {
  plugins: [],   // { id, name, desc, color, emoji, filePath, installedAt }
  folders: [],   // { id, name, emoji }
  activeTab: 'home',   // 'home' | plugin id
  selectedFile: null,
  selectedColor: '#38bdf8',
};

// ── UTILS ──
const uid = () => Math.random().toString(36).slice(2, 10);
const $ = id => document.getElementById(id);
const colorGlow = c => c + '28';

// ── BOOT ──
window.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  // Splash → app after ~2.2s
  setTimeout(() => {
    $('splash').classList.add('out');
    setTimeout(() => {
      $('splash').classList.add('hidden');
      $('app').classList.remove('hidden');
      renderAll();
    }, 500);
  }, 2200);
});

// ── PERSISTENCE ──
async function loadData() {
  try {
    const isEl = typeof window.kiwiAPI !== 'undefined';
    const data = isEl ? await window.kiwiAPI.loadData()
                      : JSON.parse(localStorage.getItem('kiwi-data') || '{}');
    state.plugins = data.plugins || [];
    state.folders = data.folders || [];
  } catch(e){}
}

async function saveData() {
  const data = { plugins: state.plugins, folders: state.folders };
  try {
    if (typeof window.kiwiAPI !== 'undefined') await window.kiwiAPI.saveData(data);
    else localStorage.setItem('kiwi-data', JSON.stringify(data));
  } catch(e){}
}

// ── RENDER ──
function renderAll() {
  renderSidebar();
  renderTabs();
  renderHome();
  switchTab(state.activeTab);
}

// ── SIDEBAR ──
function renderSidebar() {
  // Plugin list in sidebar
  const pl = $('plugin-list');
  pl.innerHTML = '';
  state.plugins.forEach(p => {
    const el = document.createElement('div');
    el.className = 'sidebar-row' + (state.activeTab === p.id ? ' active' : '');
    el.dataset.id = p.id;
    el.innerHTML = `
      <span class="sr-dot" style="background:${p.color}"></span>
      <span class="sr-label">${p.name}</span>
    `;
    el.addEventListener('click', () => openPlugin(p.id));
    pl.appendChild(el);
  });
  if (!state.plugins.length) {
    pl.innerHTML = `<div style="padding:12px 10px;font-size:11.5px;color:var(--text3);text-align:center;line-height:1.5">No plugins<br>installed yet</div>`;
  }

  // Folder tree
  const ft = $('folder-tree');
  ft.innerHTML = '';
  state.folders.forEach(f => {
    const el = document.createElement('div');
    el.className = 'folder-row';
    el.innerHTML = `
      <span>${f.emoji || '📁'}</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis">${f.name}</span>
      <button class="fdel" data-id="${f.id}">×</button>
    `;
    el.querySelector('.fdel').addEventListener('click', e => {
      e.stopPropagation();
      state.folders = state.folders.filter(x => x.id !== f.id);
      saveData(); renderAll();
    });
    ft.appendChild(el);
  });
}

// ── TAB BAR ──
function renderTabs() {
  const pt = $('plugin-tabs');
  pt.innerHTML = '';
  state.plugins.forEach(p => {
    const tab = document.createElement('div');
    tab.className = 'tab' + (state.activeTab === p.id ? ' active' : '');
    tab.dataset.id = p.id;
    tab.innerHTML = `
      <span class="tab-icon" style="display:inline-flex;width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0"></span>
      <span>${p.name}</span>
      <button class="tab-close" data-id="${p.id}">×</button>
    `;
    tab.addEventListener('click', e => {
      if (e.target.classList.contains('tab-close')) return;
      openPlugin(p.id);
    });
    tab.querySelector('.tab-close').addEventListener('click', () => closePlugin(p.id));
    pt.appendChild(tab);
  });
}

// ── HOME PAGE ──
function renderHome() {
  const grid = $('plugin-grid');
  const empty = $('home-empty');
  grid.innerHTML = '';

  if (!state.plugins.length) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  state.plugins.forEach((p, i) => {
    const card = buildPluginCard(p, i);
    grid.appendChild(card);
  });
}

function buildPluginCard(p, i) {
  const card = document.createElement('div');
  card.className = 'plugin-card';
  card.style.animationDelay = Math.min(i * 60, 400) + 'ms';
  card.style.setProperty('--thumb-color', p.color + '18');
  card.style.setProperty('--thumb-glow', colorGlow(p.color));

  card.innerHTML = `
    <div class="card-thumb">
      <div class="card-thumb-bg"></div>
      <div class="card-thumb-glow"></div>
      <div class="card-thumb-icon">${p.emoji || '🧩'}</div>
    </div>
    <div class="card-dots" data-id="${p.id}">···</div>
    <div class="card-info">
      <div class="card-name">${p.name}</div>
      <div class="card-desc">${p.desc || 'No description'}</div>
      <div class="card-footer">
        <span class="card-tag" style="color:${p.color};background:${p.color}18">plugin</span>
        <button class="card-open" data-id="${p.id}">Open →</button>
      </div>
    </div>
  `;

  card.querySelector('.card-open').addEventListener('click', e => {
    e.stopPropagation();
    openPlugin(p.id);
  });
  card.querySelector('.card-dots').addEventListener('click', e => {
    e.stopPropagation();
    showCtx(e, p.id);
  });
  card.addEventListener('dblclick', () => openPlugin(p.id));
  return card;
}

// ── OPEN / CLOSE PLUGIN ──
function openPlugin(id) {
  state.activeTab = id;
  // ensure frame exists
  ensureFrame(id);
  // show frame
  document.querySelectorAll('.plugin-frame-wrap').forEach(f => f.classList.remove('active'));
  const frame = document.querySelector(`.plugin-frame-wrap[data-id="${id}"]`);
  if (frame) frame.classList.add('active');
  // hide home
  $('page-home').classList.add('hidden');
  renderTabs();
  renderSidebar();
}

function ensureFrame(id) {
  if (document.querySelector(`.plugin-frame-wrap[data-id="${id}"]`)) return;
  const p = state.plugins.find(x => x.id === id);
  if (!p) return;
  const wrap = document.createElement('div');
  wrap.className = 'plugin-frame-wrap';
  wrap.dataset.id = id;
  const iframe = document.createElement('iframe');
  iframe.src = p.filePath;
  iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-modals allow-popups';
  wrap.appendChild(iframe);
  $('plugin-frames').appendChild(wrap);
}

function closePlugin(id) {
  // remove frame
  const frame = document.querySelector(`.plugin-frame-wrap[data-id="${id}"]`);
  if (frame) frame.remove();
  // if it was active, go home
  if (state.activeTab === id) goHome();
  renderTabs();
  renderSidebar();
}

function goHome() {
  state.activeTab = 'home';
  document.querySelectorAll('.plugin-frame-wrap').forEach(f => f.classList.remove('active'));
  $('page-home').classList.remove('hidden');
  renderTabs();
  renderSidebar();
  renderHome();
}

// ── SWITCH TAB ──
function switchTab(id) {
  if (id === 'home') { goHome(); return; }
  const exists = state.plugins.find(p => p.id === id);
  if (exists) openPlugin(id); else goHome();
}

// ── CONTEXT MENU ──
let ctxEl = null;
function showCtx(e, pluginId) {
  removeCtx();
  const menu = document.createElement('div');
  menu.className = 'ctx';
  menu.innerHTML = `
    <div class="ctx-item" id="ctx-open">Open</div>
    <div class="ctx-sep"></div>
    <div class="ctx-item ctx-danger" id="ctx-uninstall">Uninstall</div>
  `;
  menu.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
  menu.style.top = Math.min(e.clientY, window.innerHeight - 100) + 'px';
  menu.querySelector('#ctx-open').addEventListener('click', () => { openPlugin(pluginId); removeCtx(); });
  menu.querySelector('#ctx-uninstall').addEventListener('click', () => { uninstallPlugin(pluginId); removeCtx(); });
  document.body.appendChild(menu);
  ctxEl = menu;
  setTimeout(() => document.addEventListener('click', removeCtx, { once: true }), 10);
}
function removeCtx() { if (ctxEl) { ctxEl.remove(); ctxEl = null; } }

function uninstallPlugin(id) {
  // close if open
  closePlugin(id);
  state.plugins = state.plugins.filter(p => p.id !== id);
  saveData(); renderAll();
}

// ── UPLOAD PLUGIN MODAL ──
const overlay = $('overlay');

function openUploadModal() {
  state.selectedFile = null;
  state.selectedColor = '#38bdf8';
  $('pm-name').value = '';
  $('pm-desc').value = '';
  updateColorUI();
  const dz = $('drop-zone');
  dz.querySelector('.dz-file')?.remove();
  overlay.classList.remove('hidden');
  setTimeout(() => $('pm-name').focus(), 80);
}
function closeUploadModal() { overlay.classList.add('hidden'); }

$('btn-upload-plugin').addEventListener('click', openUploadModal);
$('btn-upload-empty')?.addEventListener('click', openUploadModal);
$('tab-add-btn').addEventListener('click', openUploadModal);
$('um-close').addEventListener('click', closeUploadModal);
$('um-cancel').addEventListener('click', closeUploadModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeUploadModal(); });

// Browse file
$('btn-browse').addEventListener('click', () => $('file-input').click());
$('file-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) handleFileSelect(file);
});

// Drag & drop on dropzone
const dz = $('drop-zone');
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
dz.addEventListener('drop', e => {
  e.preventDefault(); dz.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) handleFileSelect(file);
});

function handleFileSelect(file) {
  state.selectedFile = file;
  // show filename badge
  dz.querySelector('.dz-file')?.remove();
  const badge = document.createElement('div');
  badge.className = 'dz-file';
  badge.textContent = '📄 ' + file.name;
  dz.appendChild(badge);
  // auto-fill name if empty
  if (!$('pm-name').value) {
    $('pm-name').value = file.name.replace(/\.(html|htm)$/i, '');
  }
}

// Color picker
document.querySelectorAll('.cdot').forEach(d => {
  d.addEventListener('click', () => {
    state.selectedColor = d.dataset.c;
    updateColorUI();
  });
});
function updateColorUI() {
  document.querySelectorAll('.cdot').forEach(d => {
    d.classList.toggle('active', d.dataset.c === state.selectedColor);
  });
}

// Install
$('um-install').addEventListener('click', installPlugin);

function installPlugin() {
  const name = $('pm-name').value.trim();
  if (!name) { $('pm-name').focus(); return; }
  if (!state.selectedFile) {
    alert('Please select a plugin file first.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const blob = new Blob([e.target.result], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const plugin = {
      id: uid(),
      name,
      desc: $('pm-desc').value.trim(),
      color: state.selectedColor,
      emoji: '🧩',
      filePath: url,        // blob URL for iframe
      fileName: state.selectedFile.name,
      installedAt: Date.now(),
    };
    state.plugins.push(plugin);
    saveData();
    closeUploadModal();
    renderAll();
    // auto-open the newly installed plugin
    setTimeout(() => openPlugin(plugin.id), 200);
  };
  reader.readAsText(state.selectedFile);
}

// ── NEW FOLDER ──
const folderOverlay = $('folder-overlay');
$('btn-new-folder').addEventListener('click', () => {
  $('fm-name').value = ''; $('fm-emoji').value = '';
  folderOverlay.classList.remove('hidden');
  setTimeout(() => $('fm-name').focus(), 80);
});
$('fm-close').addEventListener('click', () => folderOverlay.classList.add('hidden'));
$('fm-cancel').addEventListener('click', () => folderOverlay.classList.add('hidden'));
folderOverlay.addEventListener('click', e => { if (e.target === folderOverlay) folderOverlay.classList.add('hidden'); });
$('fm-save').addEventListener('click', () => {
  const name = $('fm-name').value.trim();
  if (!name) { $('fm-name').focus(); return; }
  state.folders.push({ id: uid(), name, emoji: $('fm-emoji').value.trim() || '📁' });
  saveData(); folderOverlay.classList.add('hidden'); renderAll();
});

// ── SIDEBAR TABS ──
document.querySelectorAll('.stab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.stab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $('stab-' + btn.dataset.stab).classList.add('active');
  });
});

// ── HOME TAB ──
$('home-tab').addEventListener('click', goHome);

// ── WINDOW CONTROLS ──
if (typeof window.kiwiAPI !== 'undefined') {
  $('btn-min').addEventListener('click', () => window.kiwiAPI.minimize());
  $('btn-max').addEventListener('click', () => window.kiwiAPI.maximize());
  $('btn-close').addEventListener('click', () => window.kiwiAPI.close());
} else {
  document.querySelector('.traffic-lights').style.display = 'none';
}

// ── ESC ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeUploadModal();
    folderOverlay.classList.add('hidden');
    removeCtx();
  }
});
