// Browser-side stand-in for the Tauri backend, injected with page.addInitScript.
// Gives the UI sample profiles and lets the harness emit process_status_changed events.
export function installTauriMock({ profiles, theme }) {
  localStorage.setItem('theme', theme);
  let cbid = 1;
  const cbs = {};
  window.__TAURI_INTERNALS__ = {
    transformCallback: cb => { const id = cbid++; cbs[id] = cb; return id; },
    unregisterCallback: () => {},
    convertFileSrc: p => p,
    invoke: async (cmd, args) => {
      if (cmd === 'list_profiles') return profiles;
      if (cmd === 'list_installed_apps') return ['Discord', 'SimHub', 'Steam', 'Trading Paints', 'Visual Studio Code'].map(n => ({ name: n, exe_path: 'C:/' + n + '.exe' }));
      if (cmd === 'run_sequence') { window.__simulateSequence(profiles, args.profileId); return null; }
      if (cmd === 'cancel_sequence') { window.__cancelled = true; return null; }
      if (cmd === 'plugin:event|listen') {
        (window.__listeners = window.__listeners || []).push({ event: args.event, handler: cbs[args.handler] });
        return 1;
      }
      return null;
    },
  };
  // Minimal stand-in for the Rust sequencer: one app every 700 ms, cancellable.
  window.__simulateSequence = async (list, profileId) => {
    const apps = (list.find(p => p.id === profileId) || { apps: [] }).apps.filter(a => a.enabled);
    window.__cancelled = false;
    for (let i = 0; i < apps.length; i++) {
      if (window.__cancelled) return window.__emit('sequence_progress', { profile_id: profileId, state: 'cancelled', step: i, total: apps.length });
      window.__emit('sequence_progress', { profile_id: profileId, state: 'launching', step: i + 1, total: apps.length, app_id: apps[i].id });
      window.__emit('process_status_changed', { entry_id: apps[i].id, pid: i + 1, status: 'running' });
      await new Promise(r => setTimeout(r, 700));
    }
    window.__emit('sequence_progress', { profile_id: profileId, state: 'done', step: apps.length, total: apps.length });
  };
  window.__emit = (event, payload) =>
    (window.__listeners || []).filter(l => l.event === event).forEach(l => l.handler({ event, payload, id: 0 }));
}

const app = (i, name) => ({
  id: 'a' + i, name, executable_path: 'C:/x.exe', args: [], launch_delay_ms: 0,
  wait_strategy: 'fire_and_forget', enabled: true, order: i,
});

export const PROFILES = [
  { id: 'p1', name: 'Sim Racing', emoji: '🏎️', created_at: '', updated_at: '',
    apps: [app(0, 'SimHub'), app(1, 'iRacing'), app(2, 'Fanatec App'), app(3, 'Discord'), app(4, 'Trading Paints')] },
  { id: 'p2', name: 'Work Stuff', apps: [], created_at: '', updated_at: '' },
  { id: 'p3', name: 'Music Production', apps: [], created_at: '', updated_at: '' },
];

// a0–a2 running, a3 crashed, a4 stopped
export const STATUSES = [
  { entry_id: 'a0', pid: 1, status: 'running' },
  { entry_id: 'a1', pid: 2, status: 'running' },
  { entry_id: 'a2', pid: 3, status: 'running' },
  { entry_id: 'a3', pid: 4, status: 'crashed', error_message: 'Exit code 0xC0000005' },
];
