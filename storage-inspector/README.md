# Storage Inspector

> Inspect and edit localStorage, sessionStorage, and cookies for the current tab.

## What it does

- View and edit entries across localStorage, sessionStorage, and cookies — including HttpOnly cookies that page JS can't read.
- Inline editing: double-click key or value. Renaming a key deletes the old entry and writes a new one with the same value.
- Preview pane with format support: raw, or parsed as JSON (collapsible tree with syntax colors), HTML, or XML.
- JSON tree context menu: expand recursively, collapse children.
- Filter, sort by key, copy value, delete, clear all.

## Cookie behavior

Cookie editing preserves the original `path`, `domain`, `secure`, `sameSite`, and `expirationDate`. Renaming a cookie deletes all path/domain variants of the old name and writes the new one.

The UI shows only name + value. Other attributes are preserved silently — not editable here.

## Permissions

| Permission | Reason |
|------------|--------|
| `activeTab` | Identify the current tab when the popup opens |
| `scripting` | Inject reads/writes into the page for localStorage and sessionStorage |
| `cookies` | Read and edit cookies for the active tab's URL |
| `<all_urls>` | Required so cookies and scripting work on any site |

## Limitations

- IndexedDB is not supported (planned as a separate extension).
- Cookie attributes beyond name and value are preserved but not editable.

## Installation

See the [root README](../README.md#install).
