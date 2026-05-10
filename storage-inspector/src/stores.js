/**
 * Storage adapters (Strategy pattern).
 *
 * Each store exposes the same async API: { list, set, remove, clear }.
 * - Web storage (localStorage/sessionStorage) lives in the page's JS context;
 *   we hop into the page via chrome.scripting.executeScript.
 * - Cookies use chrome.cookies directly. Original cookie attributes (path,
 *   domain, secure, sameSite, expiration) are preserved on edit.
 */

import { getActiveTab } from './utils.js';

const runInPage = async (func, args = []) => {
  const tab = await getActiveTab();
  if (!tab?.id) throw new Error('No active tab');
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id }, func, args,
  });
  return result?.result;
};

const webStorageAdapter = (kind) => {
  const prop = kind === 'local' ? 'localStorage' : 'sessionStorage';
  return {
    list: () => runInPage((p) => {
      const out = [];
      for (let i = 0; i < window[p].length; i++) {
        const k = window[p].key(i);
        out.push({ key: k, value: window[p].getItem(k) });
      }
      return out;
    }, [prop]),
    set: (k, v) => runInPage((p, k, v) => window[p].setItem(k, v), [prop, k, v]),
    remove: (k) => runInPage((p, k) => window[p].removeItem(k), [prop, k]),
    clear: () => runInPage((p) => window[p].clear(), [prop]),
  };
};

const cookieUrl = (c) =>
  `http${c.secure ? 's' : ''}://${c.domain.replace(/^\./, '')}${c.path}`;

const cookiesAdapter = {
  list: async () => {
    const tab = await getActiveTab();
    if (!tab?.url) return [];
    const cookies = await chrome.cookies.getAll({ url: tab.url });
    return cookies.map((c) => ({ key: c.name, value: c.value }));
  },
  set: async (key, value) => {
    const tab = await getActiveTab();
    if (!tab?.url) return;
    const existing = (await chrome.cookies.getAll({ url: tab.url, name: key }))[0];
    await chrome.cookies.set({
      url: tab.url, name: key, value,
      path: existing?.path ?? '/',
      domain: existing?.domain,
      secure: existing?.secure,
      sameSite: existing?.sameSite,
      expirationDate: existing?.expirationDate,
    });
  },
  remove: async (key) => {
    const tab = await getActiveTab();
    if (!tab?.url) return;
    const matches = await chrome.cookies.getAll({ url: tab.url, name: key });
    await Promise.all(matches.map((c) =>
      chrome.cookies.remove({ url: cookieUrl(c), name: c.name })
    ));
  },
  clear: async () => {
    const tab = await getActiveTab();
    if (!tab?.url) return;
    const all = await chrome.cookies.getAll({ url: tab.url });
    await Promise.all(all.map((c) =>
      chrome.cookies.remove({ url: cookieUrl(c), name: c.name })
    ));
  },
};

export const STORES = {
  local: webStorageAdapter('local'),
  session: webStorageAdapter('session'),
  cookies: cookiesAdapter,
};
