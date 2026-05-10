/**
 * Storage Inspector — popup orchestrator (entry point).
 *
 * Responsibilities:
 * - render(): paint rows + preview from current state
 * - refresh(): reload entries from the active store and re-render
 * - event wiring for tabs, toolbar buttons, search, sort header, rows area
 *   (click selection vs double-click edit, copy/delete buttons)
 * - column resize, origin label, menu init
 *
 * Module dependencies fan out from here; each module is independent of the
 * orchestrator (they take callbacks like `refresh` when they need to trigger
 * a repaint).
 */

import { $, $$, debounce, getActiveTab } from './utils.js';
import { state, visibleEntries } from './state.js';
import { STORES } from './stores.js';
import { detectFormat } from './formats.js';
import { buildRow, editCell, startAddRow } from './rows.js';
import { buildPreview } from './preview.js';
import { initMenus } from './menus.js';

// ---------------------------------------------------------------------------
// Render + refresh
// ---------------------------------------------------------------------------

const render = () => {
  const rowsEl = $('#rows');
  const previewHost = $('#preview-host');
  const visible = visibleEntries();

  rowsEl.innerHTML = '';
  previewHost.innerHTML = '';

  for (const entry of visible) rowsEl.appendChild(buildRow(entry));

  const selected = visible.find((e) => e.key === state.selectedKey);
  if (selected) previewHost.appendChild(buildPreview(selected));

  $('#empty').hidden = visible.length > 0;
  $('#count').textContent = `${visible.length}${
    visible.length !== state.entries.length ? ` / ${state.entries.length}` : ''
  } entries · sort: ${state.sortDir}`;
  $('#sort-indicator').textContent = state.sortDir === 'asc' ? '▲' : '▼';
};

const refresh = async () => {
  try {
    state.entries = (await STORES[state.store].list()) ?? [];
  } catch (err) {
    console.error('[Storage Inspector]', err);
    state.entries = [];
  }
  render();
};

const toggleSort = () => {
  state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
  render();
};

// ---------------------------------------------------------------------------
// Column resize
// ---------------------------------------------------------------------------

const initColumnResize = () => {
  const resizer = $('#resizer');
  const grid = $('#grid');
  let startX = 0;
  let startPct = 50;

  const onMove = (e) => {
    const total = grid.getBoundingClientRect().width;
    let pct = startPct + ((e.clientX - startX) / total) * 100;
    pct = Math.max(15, Math.min(70, pct));
    grid.style.setProperty('--key-w', `${pct}%`);
  };
  const onUp = () => {
    resizer.classList.remove('dragging');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  resizer.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    const css = getComputedStyle(grid).getPropertyValue('--key-w').trim();
    startPct = css.endsWith('%') ? parseFloat(css) : 50;
    resizer.classList.add('dragging');
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
  });
};

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------

$$('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.tab').forEach((t) => t.classList.remove('active'));
    btn.classList.add('active');
    state.store = btn.dataset.store;
    state.selectedKey = null;
    refresh();
  });
});

$('#search').addEventListener('input',
  debounce((e) => { state.filter = e.target.value; render(); }));

$('#refresh').addEventListener('click', refresh);
$('#add').addEventListener('click', () => startAddRow(refresh));
$('#sort-key').addEventListener('click', toggleSort);

$('#clear').addEventListener('click', async () => {
  if (!state.entries.length) return;
  if (!confirm(`Clear all ${state.entries.length} entries?`)) return;
  await STORES[state.store].clear();
  state.selectedKey = null;
  await refresh();
});

// Row click behavior: copy / delete buttons fire immediately. A bare row click
// selects (toggles preview) — but is deferred 220ms so a double-click can
// cancel it and start an inline edit instead.
let pendingClick = null;

$('#rows').addEventListener('click', async (e) => {
  const copyBtn = e.target.closest('.row-copy');
  if (copyBtn) {
    const row = copyBtn.closest('.row');
    const entry = state.entries.find((x) => x.key === row.dataset.key);
    if (entry) {
      try {
        await navigator.clipboard.writeText(entry.value);
        copyBtn.classList.add('copied');
        setTimeout(() => copyBtn.classList.remove('copied'), 800);
      } catch {}
    }
    return;
  }

  const delBtn = e.target.closest('.row-delete');
  if (delBtn) {
    const row = delBtn.closest('.row');
    await STORES[state.store].remove(row.dataset.key);
    if (state.selectedKey === row.dataset.key) state.selectedKey = null;
    await refresh();
    return;
  }

  if (e.target.closest('.preview') || e.target.closest('.editing')) return;

  const row = e.target.closest('.row');
  if (!row || row.classList.contains('adding')) return;

  if (pendingClick) clearTimeout(pendingClick);
  pendingClick = setTimeout(() => {
    pendingClick = null;
    if (state.selectedKey === row.dataset.key) {
      state.selectedKey = null;
    } else {
      state.selectedKey = row.dataset.key;
      const entry = state.entries.find((x) => x.key === row.dataset.key);
      if (entry) state.format = detectFormat(entry.value);
    }
    render();
  }, 220);
});

$('#rows').addEventListener('dblclick', (e) => {
  if (pendingClick) { clearTimeout(pendingClick); pendingClick = null; }
  const cell = e.target.closest('.cell-key, .cell-value');
  if (!cell) return;
  const row = cell.closest('.row');
  if (!row || row.classList.contains('adding')) return;
  if (cell.closest('.preview')) return;
  const entry = state.entries.find((x) => x.key === row.dataset.key);
  if (!entry) return;
  editCell(cell, {
    isKey: cell.classList.contains('cell-key'),
    originalKey: entry.key,
    originalValue: entry.value,
  }, refresh);
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

(async () => {
  const tab = await getActiveTab();
  if (tab?.url) {
    try {
      const { origin } = new URL(tab.url);
      const el = $('#origin');
      el.textContent = origin;
      el.title = origin;
    } catch {}
  }
})();

initColumnResize();
initMenus({ refresh, toggleSort });
refresh();
