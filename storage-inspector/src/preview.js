/**
 * Preview pane.
 *
 * Built per-render when a row is selected. Has two controls:
 * - Format dropdown (Text / JSON / HTML / XML)
 * - Raw / parsed radio toggle
 *
 * `renderBody` is a closure that re-renders the preview body when either
 * control changes — no full popup re-render needed.
 */

import { $, $$ } from './utils.js';
import { state } from './state.js';
import { FORMATS } from './formats.js';

export const buildPreview = (entry) => {
  const wrap = document.createElement('div');
  wrap.className = 'preview';
  wrap.innerHTML = `
    <div class="preview-toolbar">
      <div class="format-select">
        <button class="format-trigger">
          <span class="format-label">${state.format}</span>
          <svg viewBox="0 0 10 10" fill="currentColor"><path d="M2 4l3 3 3-3z"/></svg>
        </button>
        <div class="format-menu" hidden></div>
      </div>
      <div class="mode-toggle">
        <label>
          <input type="radio" name="mode" value="raw" ${state.mode === 'raw' ? 'checked' : ''} />
          <span class="dot"></span><span class="label-text">raw</span>
        </label>
        <label>
          <input type="radio" name="mode" value="parsed" ${state.mode === 'parsed' ? 'checked' : ''} />
          <span class="dot"></span><span class="label-text">parsed</span>
        </label>
      </div>
    </div>
    <div class="preview-body"></div>`;

  const body = $('.preview-body', wrap);
  const trigger = $('.format-trigger', wrap);
  const menu = $('.format-menu', wrap);
  const label = $('.format-label', wrap);

  const renderBody = () => {
    body.innerHTML = '';
    body.classList.remove('parsed');
    if (state.mode === 'raw') {
      body.textContent = entry.value;
      return;
    }
    const result = FORMATS[state.format].parse(entry.value);
    if (!result.ok) {
      const err = document.createElement('div');
      err.className = 'preview-error';
      err.textContent = result.error;
      body.appendChild(err);
      return;
    }
    body.classList.add('parsed');
    result.renderInto(body);
  };

  // Format dropdown items
  for (const name of Object.keys(FORMATS)) {
    const btn = document.createElement('button');
    btn.textContent = name;
    if (name === state.format) btn.classList.add('active');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.format = name;
      label.textContent = name;
      $$('button', menu).forEach((b) =>
        b.classList.toggle('active', b.textContent === name));
      menu.hidden = true;
      renderBody();
    });
    menu.appendChild(btn);
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  });

  $$('input[name="mode"]', wrap).forEach((input) => {
    input.addEventListener('change', () => {
      state.mode = input.value;
      renderBody();
    });
  });

  renderBody();
  return wrap;
};
