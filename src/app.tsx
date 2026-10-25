import { effect } from '@preact/signals';
import { useEffect, useState } from 'preact/hooks';
import { History } from './history';
import { lang, t } from './i18n';
import { Onboard } from './onboard';
import { Plan } from './plan';
import { Settings } from './settings';
import { patchSettings, ready, state } from './store';
import { joinHousehold, partner, pendingInvite, vault } from './sync';
import { Today } from './today';
import { Sheet, Toast, showToast } from './ui';

type Tab = 'today' | 'plan' | 'history' | 'settings';

const ICONS: Record<Tab, string> = {
  today: 'M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z',
  plan: 'M5 4h14v4H5zM5 10h14v4H5zM5 16h14v4H5z',
  history: 'M12 3a9 9 0 100 18 9 9 0 000-18zm1 4v5.4l3.5 2.1-.8 1.3L11 13V7z',
  settings: 'M12 8a4 4 0 100 8 4 4 0 000-8zm8.4 5.5l1.6 1.2-2 3.4-1.9-.7a7 7 0 01-1.7 1l-.3 2h-4l-.3-2a7 7 0 01-1.7-1l-1.9.7-2-3.4 1.6-1.2a7 7 0 010-2L3.6 10.3l2-3.4 1.9.7a7 7 0 011.7-1l.3-2h4l.3 2a7 7 0 011.7 1l1.9-.7 2 3.4-1.6 1.2a7 7 0 010 2z',
};

// Theme, accent and language live in the settings; mirror them onto the page whenever they change.
effect(() => {
  const s = state.value.settings;
  lang.value = s.lang;
  const root = document.documentElement;
  if (s.theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', s.theme);
  root.style.setProperty('--accent', s.accent);
  root.lang = s.lang;
});

export function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [skipped, setSkipped] = useState(false);
  const s = state.value;

  useEffect(() => {
    partner.onLogs = (logs) => {
      const tasks = state.value.tasks;
      const dogs = state.value.dogs;
      const l = logs[0];
      const task = tasks.find((x) => x.id === l.taskId);
      const dog = dogs.find((x) => x.id === l.dogId);
      if (task && dog) showToast(`${l.by}: ${task.emoji} ${task.name} · ${dog.name}${logs.length > 1 ? ` +${logs.length - 1}` : ''}`);
    };
  }, []);

  if (!ready.value) return null;
  const first = !s.dogs.length && !vault.value && !skipped;
  if (first) return <div class="shell"><Aurora /><div class="scroll"><Onboard done={() => setSkipped(true)} /></div><Toast /></div>;

  return (
    <div class="shell">
      <Aurora />
      <main class="scroll">
        {tab === 'today' && <Today goPlan={() => setTab('plan')} />}
        {tab === 'plan' && <Plan />}
        {tab === 'history' && <History />}
        {tab === 'settings' && <Settings />}
      </main>
      <nav class="tabs">
        {(Object.keys(ICONS) as Tab[]).map((k) => (
          <button key={k} class={tab === k ? 'on' : ''} onClick={() => setTab(k)} aria-current={tab === k ? 'page' : undefined}>
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d={ICONS[k]} fill="currentColor" /></svg>
            <span>{t(`tab.${k}`)}</span>
          </button>
        ))}
      </nav>
      <Toast />
      {pendingInvite.value && !vault.value && <InviteSheet />}
    </div>
  );
}

const Aurora = () => <div class="aurora" aria-hidden="true"><i /><i /><i /></div>;

/** An invite link opened on a device that already has its own data: confirm before merging into the shared household. */
function InviteSheet() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const me = state.value.settings.me;
  const join = async () => {
    setBusy(true);
    try { await joinHousehold(pendingInvite.value); pendingInvite.value = ''; } catch { setErr(t('err.sync')); } finally { setBusy(false); }
  };
  return (
    <Sheet title={t('invited')} onClose={() => (pendingInvite.value = '')}>
      <p class="muted">{t('invitedText')}</p>
      {!me && <input type="text" placeholder={t('yourNamePlaceholder')} onInput={(e) => patchSettings({ me: (e.target as HTMLInputElement).value })} />}
      {err && <p class="error small">{err}</p>}
      <button class="btn primary block" disabled={busy || !state.value.settings.me.trim()} onClick={join}>{t('joinHousehold')}</button>
    </Sheet>
  );
}
