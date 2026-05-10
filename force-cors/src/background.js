const RULE_ID = 1;
const STORAGE_KEY = 'enabled';

const CORS_RULE = {
  id: RULE_ID,
  priority: 1,
  action: {
    type: 'modifyHeaders',
    responseHeaders: [
      { header: 'access-control-allow-origin', operation: 'remove' },
      { header: 'access-control-allow-credentials', operation: 'remove' },
      { header: 'access-control-allow-methods', operation: 'remove' },
      { header: 'access-control-allow-headers', operation: 'remove' },
      { header: 'access-control-expose-headers', operation: 'remove' },
    ],
  },
  condition: {
    resourceTypes: [
      'xmlhttprequest',
      'sub_frame',
      'main_frame',
      'media',
      'websocket',
      'other',
    ],
  },
};

// Single source of truth: storage drives rule state.
const setEnabled = async (enabled) => {
  if (enabled) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [RULE_ID],
      addRules: [CORS_RULE],
    });
  } else {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [RULE_ID],
    });
  }
  await chrome.storage.sync.set({ [STORAGE_KEY]: enabled });
};

const getEnabled = async () => {
  const { [STORAGE_KEY]: enabled } = await chrome.storage.sync.get(STORAGE_KEY);
  return Boolean(enabled);
};

// Sync rule state with stored preference on install/startup.
const syncFromStorage = async () => {
  const enabled = await getEnabled();
  await setEnabled(enabled);
};

chrome.runtime.onInstalled.addListener(async () => {
  // Default to enabled on first install.
  const { [STORAGE_KEY]: existing } = await chrome.storage.sync.get(STORAGE_KEY);
  await setEnabled(existing ?? true);
});

chrome.runtime.onStartup.addListener(syncFromStorage);

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.action === 'toggle') {
    setEnabled(Boolean(msg.enabled))
      .then(() => sendResponse({ ok: true, enabled: Boolean(msg.enabled) }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (msg?.action === 'getStatus') {
    getEnabled()
      .then((enabled) => sendResponse({ ok: true, enabled }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});
