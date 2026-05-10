/**
 * JSON tree renderer.
 *
 * Produces a DOM tree from a parsed JSON value. Objects/arrays are wrapped in
 * <span class="j-expanded|j-collapsed"> with a clickable .j-toggle that flips
 * the class. The root node starts expanded so the first level is always
 * visible; deeper nodes start collapsed.
 *
 * `expandRecursive(node)` and `collapseChildren(node)` are used by the JSON
 * context menu in the preview pane.
 */

import { $$, escapeHtml } from './utils.js';

export const renderJsonNode = (value, keyLabel = null, depth = 0) => {
  const wrap = document.createElement('span');
  const labelHtml = keyLabel !== null
    ? `<span class="j-key">"${escapeHtml(keyLabel)}"</span><span class="j-punct">: </span>`
    : '';

  if (value === null) {
    wrap.innerHTML = `${labelHtml}<span class="j-null">null</span>`;
    return wrap;
  }
  if (typeof value === 'string') {
    wrap.innerHTML = `${labelHtml}<span class="j-str">"${escapeHtml(value)}"</span>`;
    return wrap;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    const cls = typeof value === 'number' ? 'j-num' : 'j-bool';
    wrap.innerHTML = `${labelHtml}<span class="${cls}">${value}</span>`;
    return wrap;
  }

  // Object or array — collapsible.
  const isArray = Array.isArray(value);
  const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);
  const open = isArray ? '[' : '{';
  const close = isArray ? ']' : '}';

  wrap.className = depth === 0 ? 'j-expanded' : 'j-collapsed';

  const toggle = document.createElement('span');
  toggle.className = 'j-toggle';
  toggle.addEventListener('click', () => {
    const expanded = wrap.classList.toggle('j-expanded');
    wrap.classList.toggle('j-collapsed', !expanded);
  });

  const summary = entries.length === 0
    ? `<span class="j-punct">${open}${close}</span>`
    : `<span class="j-punct">${open}</span><span class="j-summary"> ${entries.length} ${
        isArray ? 'items' : 'keys'
      } </span><span class="j-punct">${close}</span>`;

  wrap.appendChild(toggle);
  wrap.insertAdjacentHTML('beforeend', `${labelHtml}${summary}`);

  if (entries.length > 0) {
    const children = document.createElement('div');
    children.className = 'j-children';
    children.style.paddingLeft = '14px';
    for (const [k, v] of entries) {
      const line = document.createElement('div');
      line.appendChild(renderJsonNode(v, isArray ? null : k, depth + 1));
      children.appendChild(line);
    }
    wrap.appendChild(children);
  }
  return wrap;
};

export const expandRecursive = (node) => {
  node.classList.add('j-expanded');
  node.classList.remove('j-collapsed');
  $$('.j-collapsed', node).forEach((n) => {
    n.classList.add('j-expanded');
    n.classList.remove('j-collapsed');
  });
};

export const collapseChildren = (node) => {
  const children = node.querySelector('.j-children');
  if (!children) return;
  $$('.j-expanded', children).forEach((n) => {
    n.classList.add('j-collapsed');
    n.classList.remove('j-expanded');
  });
};
