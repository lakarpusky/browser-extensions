/**
 * Row rendering and inline editors.
 *
 * - buildRow(entry): produces a row element with key/value cells + copy/delete buttons.
 * - editCell(cell, opts): replaces a cell's content with an input/textarea editor.
 *   Enter saves, Escape cancels, blur saves. Renaming a key deletes the old
 *   entry and writes a new one (cookies API supports this; web storage too).
 * - startAddRow(refresh): inserts an "adding" row at the top with two editors.
 *   Tab/Enter moves to next field; second Enter or blur commits.
 */

import { $, $$ } from './utils.js';
import { state } from './state.js';
import { STORES } from './stores.js';
import { detectFormat } from './formats.js';

const ROW_TEMPLATE = `
  <div class="cell-key"></div>
  <div></div>
  <div class="cell-value"></div>
  <div class="cell-actions">
    <button class="row-copy" title="Copy value">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <rect x="5" y="5" width="9" height="9" rx="1.5"/>
        <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/>
      </svg>
    </button>
    <button class="row-delete" title="Delete">✕</button>
  </div>`;

export const buildRow = (entry) => {
  const row = document.createElement('div');
  row.className = 'row';
  if (state.selectedKey === entry.key) row.classList.add('selected');
  row.dataset.key = entry.key;
  row.innerHTML = ROW_TEMPLATE;
  row.querySelector('.cell-key').textContent = entry.key;
  row.querySelector('.cell-value').textContent = entry.value;
  return row;
};

export const editCell = (cell, { isKey, originalKey, originalValue }, refresh) => {
  if (cell.classList.contains('editing')) return;
  cell.classList.add('editing');

  const editor = document.createElement(isKey ? 'input' : 'textarea');
  editor.value = isKey ? originalKey : originalValue;
  cell.textContent = '';
  cell.appendChild(editor);
  editor.focus();
  editor.select();

  let committed = false;
  const commit = async (save) => {
    if (committed) return;
    committed = true;
    cell.classList.remove('editing');
    const newVal = editor.value;

    if (!save) {
      cell.textContent = isKey ? originalKey : originalValue;
      return;
    }
    if (isKey) {
      const trimmed = newVal.trim();
      if (!trimmed || trimmed === originalKey) {
        cell.textContent = originalKey;
        return;
      }
      // Rename: delete old, write new with same value.
      await STORES[state.store].remove(originalKey);
      await STORES[state.store].set(trimmed, originalValue);
      state.selectedKey = trimmed;
    } else {
      if (newVal === originalValue) {
        cell.textContent = originalValue;
        return;
      }
      await STORES[state.store].set(originalKey, newVal);
    }
    await refresh();
  };

  editor.addEventListener('blur', () => commit(true));
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); commit(false); }
    else if (e.key === 'Enter' && (isKey || !e.shiftKey)) {
      e.preventDefault();
      editor.blur();
    }
  });
};

export const startAddRow = (refresh) => {
  if ($('#rows .row.adding')) return;
  const row = document.createElement('div');
  row.className = 'row adding';
  row.innerHTML = `
    <div class="cell-key editing"></div>
    <div></div>
    <div class="cell-value editing"></div>
    <div class="cell-actions"></div>`;

  const keyInput = Object.assign(document.createElement('input'), { placeholder: 'key' });
  const valueInput = Object.assign(document.createElement('textarea'), { placeholder: 'value' });
  $('.cell-key', row).appendChild(keyInput);
  $('.cell-value', row).appendChild(valueInput);

  $('#rows').prepend(row);
  $('#empty').hidden = true;
  keyInput.focus();

  let committed = false;
  const commit = async (save) => {
    if (committed) return;
    committed = true;
    const k = keyInput.value.trim();
    if (save && k) {
      await STORES[state.store].set(k, valueInput.value);
      state.selectedKey = k;
      state.format = detectFormat(valueInput.value);
      await refresh();
    } else {
      row.remove();
      if (!state.entries.length) $('#empty').hidden = false;
    }
  };

  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); commit(false); }
    else if (e.key === 'Enter' && !e.shiftKey && e.target === keyInput) {
      e.preventDefault();
      valueInput.focus();
    } else if (e.key === 'Enter' && !e.shiftKey && e.target === valueInput) {
      e.preventDefault();
      commit(true);
    }
  };
  const onBlur = () => {
    setTimeout(() => {
      if (!row.contains(document.activeElement)) commit(true);
    }, 0);
  };
  [keyInput, valueInput].forEach((el) => {
    el.addEventListener('keydown', onKey);
    el.addEventListener('blur', onBlur);
  });
};
