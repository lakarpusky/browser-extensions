/**
 * Format parsers (Strategy pattern).
 *
 * Each parser exposes parse(str) -> { ok: true, renderInto(el) } or
 * { ok: false, error: 'message' }. Renderers append into the preview body
 * element passed in.
 *
 * `detectFormat(str)` returns the most likely format name based on simple
 * shape heuristics (used to pre-select the dropdown when a row is opened).
 */

import { renderJsonNode } from './json-tree.js';

// Indent an HTML/XML string. Naive but adequate for preview-sized payloads.
const prettyPrintXml = (str, mode) => {
  const tokens = str.replace(/>\s*</g, '>\n<').split('\n');
  let depth = 0;
  return tokens.map((line) => {
    line = line.trim();
    if (!line) return '';
    const isClose = /^<\/[^>]+>/.test(line);
    const isSelfClose = /\/>$/.test(line) ||
      (mode === 'html' && /^<(br|hr|img|input|meta|link)\b/i.test(line));
    if (isClose) depth = Math.max(0, depth - 1);
    const indented = '  '.repeat(depth) + line;
    if (!isClose && !isSelfClose && /^<[^!?][^>]*[^/]>$/.test(line)) depth += 1;
    return indented;
  }).join('\n');
};

export const FORMATS = {
  Text: {
    parse: (str) => ({
      ok: true,
      renderInto: (el) => { el.textContent = str; },
    }),
  },
  JSON: {
    parse: (str) => {
      try {
        const value = JSON.parse(str);
        return { ok: true, renderInto: (el) => el.appendChild(renderJsonNode(value)) };
      } catch {
        return { ok: false, error: 'Not valid JSON' };
      }
    },
  },
  HTML: {
    parse: (str) => {
      try {
        const doc = new DOMParser().parseFromString(str, 'text/html');
        const hasContent = doc.body && doc.body.children.length > 0;
        if (!hasContent && !str.trim().startsWith('<')) {
          return { ok: false, error: 'Not valid HTML' };
        }
        return {
          ok: true,
          renderInto: (el) => { el.textContent = prettyPrintXml(doc.body.innerHTML, 'html'); },
        };
      } catch {
        return { ok: false, error: 'Not valid HTML' };
      }
    },
  },
  XML: {
    parse: (str) => {
      try {
        const doc = new DOMParser().parseFromString(str, 'application/xml');
        if (doc.querySelector('parsererror')) {
          return { ok: false, error: 'Not valid XML' };
        }
        const serialized = new XMLSerializer().serializeToString(doc.documentElement);
        return {
          ok: true,
          renderInto: (el) => { el.textContent = prettyPrintXml(serialized, 'xml'); },
        };
      } catch {
        return { ok: false, error: 'Not valid XML' };
      }
    },
  },
};

export const detectFormat = (str) => {
  if (typeof str !== 'string') return 'Text';
  const t = str.trim();
  if (!t) return 'Text';
  if (t[0] === '{' || t[0] === '[') {
    try { JSON.parse(t); return 'JSON'; } catch {}
  }
  if (t.startsWith('<?xml')) return 'XML';
  if (/^<[a-z!]/i.test(t) && t.includes('</')) return 'HTML';
  return 'Text';
};
