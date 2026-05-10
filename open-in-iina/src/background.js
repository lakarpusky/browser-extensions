// URL matchers for supported video sources.
// Each entry is independent so adding a new platform is a one-liner (OCP).
const SUPPORTED = [
  /^https:\/\/(www\.)?youtube\.com\/(watch|shorts)\b/,
  /^https:\/\/(www\.)?(twitter|x)\.com\/[^/]+\/status\/\d+/,
  /^https:\/\/(www\.)?twitch\.tv\/(videos\/\d+|clips\/[\w-]+|[a-z0-9_]{4,25})\/?$/i,
];

const toIinaUrl = (url) => `iina://weblink?url=${encodeURIComponent(url)}`;
const isSupported = (url) => SUPPORTED.some((re) => re.test(url));

// Per-tab action state: enabled + badge feedback when the URL is supported.
const updateActionState = (tabId, url) => {
  const supported = Boolean(url) && isSupported(url);

  if (supported) {
    chrome.action.enable(tabId);
    chrome.action.setBadgeText({ tabId, text: '▶' });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#7B68EE' });
  } else {
    chrome.action.disable(tabId);
    chrome.action.setBadgeText({ tabId, text: '' });
  }
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === 'complete') {
    updateActionState(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  updateActionState(tabId, tab.url);
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id || !tab?.url || !isSupported(tab.url)) return;
  chrome.tabs.update(tab.id, { url: toIinaUrl(tab.url) });
});