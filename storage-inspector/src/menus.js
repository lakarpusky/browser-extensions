/**
 * Context menus.
 *
 * Two menus:
 * - #ctxmenu: shown on right-click in the rows area. Always shows Sort by Key
 *   and Refresh. When the click landed on a row, also shows Edit "Key|Value"
 *   and Delete (the delete button stays last).
 * - #json-ctxmenu: shown on right-click in the preview pane when the parsed
 *   JSON tree is rendered. Targets the clicked node, or the root if the click
 *   landed in empty space below the tree.
 */

import { $, $$ } from './utils.js';
import { state } from './state.js';
import { STORES } from './stores.js';
import { editCell } from './rows.js';
import { expandRecursive, collapseChildren } from './json-tree.js';

const positionMenu = (menu, x, y) => {
  menu.hidden = false;
  const rect = menu.getBoundingClientRect();
  menu.style.left = `${Math.min(x, window.innerWidth - rect.width - 4)}px`;
  menu.style.top = `${Math.min(y, window.innerHeight - rect.height - 4)}px`;
};

export const hideAllMenus = () => {
  $('#ctxmenu').hidden = true;
  $('#json-ctxmenu').hidden = true;
  $$('.format-menu').forEach((m) => { m.hidden = true; });
};

export const initMenus = ({ refresh, toggleSort }) => {
  let rowCtxTarget = null;
  let jsonCtxTarget = null;

  // --- Main rows context menu ---
  $('main').addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const cell = e.target.closest('.cell-key, .cell-value');
    const row = e.target.closest('.row');
    const onRow = row && !row.classList.contains('adding') && cell;

    const editBtn = $('#ctxmenu button[data-act="edit"]');
    const deleteBtn = $('#ctxmenu button[data-act="delete"]');

    if (onRow) {
      rowCtxTarget = {
        key: row.dataset.key,
        isKey: cell.classList.contains('cell-key'),
        cell,
      };
      editBtn.textContent = `Edit "${rowCtxTarget.isKey ? 'Key' : 'Value'}"`;
      editBtn.hidden = false;
      deleteBtn.hidden = false;
    } else {
      rowCtxTarget = null;
      editBtn.hidden = true;
      deleteBtn.hidden = true;
      editBtn.textContent = '';
    }

    positionMenu($('#ctxmenu'), e.clientX, e.clientY);
  });

  $('#ctxmenu').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    hideAllMenus();
    const act = btn.dataset.act;

    if (act === 'sort-key') return toggleSort();
    if (act === 'refresh') return refresh();

    if (!rowCtxTarget) return;
    const { key, isKey, cell } = rowCtxTarget;
    const entry = state.entries.find((x) => x.key === key);
    rowCtxTarget = null;
    if (!entry) return;

    if (act === 'edit') {
      editCell(cell, { isKey, originalKey: entry.key, originalValue: entry.value }, refresh);
    } else if (act === 'delete') {
      await STORES[state.store].remove(key);
      if (state.selectedKey === key) state.selectedKey = null;
      await refresh();
    }
  });

  // --- JSON tree context menu (preview pane) ---
  $('#preview-host').addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    hideAllMenus();

    const body = $('#preview-host .preview-body.parsed');
    if (!body) return;

    const clicked = e.target.closest('.j-expanded, .j-collapsed');
    jsonCtxTarget = clicked ?? body.querySelector('.j-expanded, .j-collapsed');
    if (!jsonCtxTarget) return;

    positionMenu($('#json-ctxmenu'), e.clientX, e.clientY);
  });

  $('#json-ctxmenu').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn || !jsonCtxTarget) return;
    if (btn.dataset.act === 'expand-recursive') expandRecursive(jsonCtxTarget);
    else if (btn.dataset.act === 'collapse-children') collapseChildren(jsonCtxTarget);
    hideAllMenus();
    jsonCtxTarget = null;
  });

  // Global dismiss
  document.addEventListener('click', hideAllMenus);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideAllMenus();
  });
};
