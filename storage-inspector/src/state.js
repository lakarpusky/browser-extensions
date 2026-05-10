/**
 * App state — single source of truth shared across modules.
 *
 * Mutated directly; modules import `state` and write to fields, then call the
 * orchestrator's `render()` to repaint. This is intentionally simple — no
 * observers, no framework. The popup is small and reactivity isn't worth the
 * weight.
 */

export const state = {
  store: 'local',           // active storage tab: local | session | cookies
  entries: [],              // current list of { key, value }
  filter: '',               // search filter string
  selectedKey: null,        // currently selected row's key (preview pane)
  sortDir: 'asc',           // 'asc' | 'desc'
  format: 'JSON',           // preview format: Text | JSON | HTML | XML
  mode: 'raw',              // preview rendering mode: 'raw' | 'parsed'
};

export const visibleEntries = () => {
  const f = state.filter.toLowerCase();
  const filtered = f
    ? state.entries.filter((e) =>
        e.key.toLowerCase().includes(f) || String(e.value).toLowerCase().includes(f))
    : state.entries;
  const dir = state.sortDir === 'asc' ? 1 : -1;
  return [...filtered].sort((a, b) => a.key.localeCompare(b.key) * dir);
};
