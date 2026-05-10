const toggleBtn = document.getElementById('toggle');
const statusEl = document.getElementById('status');

const render = (enabled) => {
  statusEl.textContent = enabled ? 'CORS BLOCK: ON' : 'CORS BLOCK: OFF';
  toggleBtn.textContent = enabled ? 'Disable CORS Block' : 'Enable CORS Block';
  toggleBtn.dataset.enabled = String(enabled);
  toggleBtn.disabled = false;
};

const sendMessage = (msg) =>
  new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (response) => {
      if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
      if (!response?.ok) return reject(new Error(response?.error ?? 'Unknown error'));
      resolve(response);
    });
  });

toggleBtn.addEventListener('click', async () => {
  toggleBtn.disabled = true;
  const current = toggleBtn.dataset.enabled === 'true';
  try {
    const { enabled } = await sendMessage({ action: 'toggle', enabled: !current });
    render(enabled);
  } catch (err) {
    statusEl.textContent = 'Error';
    console.error(err);
  }
});

(async () => {
  try {
    const { enabled } = await sendMessage({ action: 'getStatus' });
    render(enabled);
  } catch (err) {
    statusEl.textContent = 'Error';
    console.error(err);
  }
})();
