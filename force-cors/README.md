# Force CORS Errors – Chrome Extension (Dev Only)

> Strip all CORS headers to simulate real-world CORS failures.  
> Perfect for testing error handling in `fetch`, `XMLHttpRequest`, and APIs.

## Features

- Removes all `Access-Control-*` headers from responses
- Works on every cross-origin request (XHR, fetch, subframes, media, websockets)
- Toggle on/off via popup
- State persists across browser restarts
- Auto-enables on first install

## Installation

See the [root README](../README.md#install).

## ⚠️ Warning

This extension requires `<all_urls>` host permission and modifies network responses on every site. **Use only in development.** Disable or remove it before browsing normally.
