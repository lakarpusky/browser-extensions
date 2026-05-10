# Storage Inspector

> Inspect and edit localStorage, sessionStorage, and cookies for the current tab.

A faster alternative to opening DevTools → Application tab. One toolbar click, three storage types, full inline editing.

## Features

- View localStorage, sessionStorage, and cookies for the active tab
- Add, edit (inline), delete entries — DevTools-style: click to select + preview, double-click to edit
- Live filter, sortable Key column, resizable columns
- Preview pane with format dropdown (Text / JSON / HTML / XML) and raw / parsed toggle
- JSON tree with collapsible nodes; right-click for Expand recursively / Collapse children
- Copy value to clipboard from each row
- Right-click row for Edit "Key" / Edit "Value" / Delete; right-click empty space for Sort by Key / Refresh
- Adapts to light/dark Chrome theme

## Permissions

| Permission | Reason |
|------------|--------|
| `activeTab` | Identify the current tab when the popup opens |
| `scripting` | Inject reads/writes into the page for web storage |
| `cookies` | Read and edit cookies for the active tab's URL |
| `<all_urls>` | Required so cookies and scripting work on any site |

## Installation

See the [root README](../README.md#install).
