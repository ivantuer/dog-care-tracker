import { useEffect, useState } from 'preact/hooks';
import { allItems } from './care';
import { localDate } from './dates';
import { DatePicker } from './datepicker';
import { fmtDay } from './format';
import { t } from './i18n';
import { buildIcs, download } from './ics';
import { ACCENTS, COLORS, presetsFor, SPECIES, SPECIES_EMOJI } from './presets';
import { disablePush, enableLocalOnly, enablePush, isIos, pushSupported, scheduleUpload, showDigest, standalone, supported } from './push';
import { exportJson, importJson, patchSettings, removeDog, saveDog, saveTask, sharedData, state, taskFromPreset, uid } from './store';
import { createHousehold, joinHousehold, leaveHousehold, newInviteLink, connectGoogle, disableGoogle, enableGoogle, serverUrl, sync, syncNow, vault } from './sync';
import type { Dog, Lang, Species } from './types';
import { cachePhoto, fullPhotoUrl, storeFullPhoto, toAvatar, toFull } from './photo';
import { newPhotoId } from './sync-core';
import { Avatar, Chip, Field, GoogleButton, Sheet, showToast } from './ui';

export function Settings() {
  const s = state.value;
  const set = s.settings;
  const [dog, setDog] = useState<Omit<Dog, 'updatedAt'> | null>(null);

  return (
    <>
      <div class="topbar"><h1>{t('tab.settings')}</h1></div>

      <div class="card">
        <h2>{t('you')}</h2>
        <Field label={t('yourName')} hint={t('yourNameHint')}>
          <input type="text" value={set.me} onInput={(e) => patchSettings({ me: (e.target as HTMLInputElement).value })} />
        </Field>
      </div>

      <div class="card">
        <div class="row between"><h2>{t('dogs')}</h2><button class="btn small-btn" onClick={() => setDog({ id: uid(), name: '', emoji: SPECIES_EMOJI.dog[0], species: 'dog', color: COLORS[s.dogs.length % COLORS.length] })}>+ {t('add')}</button></div>
        {s.dogs.map((d) => (
          <button key={d.id} class="item plain-card flat" onClick={() => setDog(d)}>
            <Avatar dog={d} /><span class="item-text"><b>{d.name}</b><span class="small muted">{[d.breed, d.birthday && fmtDay(d.birthday, true)].filter(Boolean).join(' · ')}</span></span><span class="chev">›</span>
          </button>
        ))}
      </div>

      <Household />
      <Reminders />

      <div class="card">
        <h2>{t('appearance')}</h2>
        <Field label={t('language')}>
          <div class="seg">
            {(['en', 'uk'] as Lang[]).map((l) => <button key={l} class={set.lang === l ? 'on' : ''} onClick={() => patchSettings({ lang: l })}>{l === 'en' ? 'English' : 'Українська'}</button>)}
          </div>
        </Field>
        <Field label={t('theme')}>
          <div class="seg">
            {(['auto', 'light', 'dark'] as const).map((m) => <button key={m} class={set.theme === m ? 'on' : ''} onClick={() => patchSettings({ theme: m })}>{t(`theme.${m}`)}</button>)}
          </div>
        </Field>
        <Field label={t('accent')}>
          <div class="swatches">{ACCENTS.map((c) => <button key={c} class={`sw${set.accent === c ? ' on' : ''}`} style={{ background: c }} aria-label={c} onClick={() => patchSettings({ accent: c })} />)}</div>
        </Field>
      </div>

      <Data />
      {dog && <DogSheet draft={dog} isNew={!s.dogs.some((x) => x.id === dog.id)} onClose={() => setDog(null)} />}
    </>
  );
}

function Household() {
  const [busy, setBusy] = useState(false);
  const [join, setJoin] = useState('');
  const [err, setErr] = useState('');
  const set = state.value.settings;
  const v = vault.value;
  const st = sync.value;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setErr('');
    try { await fn(); } catch (e) {
      const m = (e as Error).message;
      setErr(m === 'server' ? t('noServerHint') : m === 'invite' ? t('err.invite') : m === 'used' ? t('err.used') : m === 'nolink' ? t('err.nolink') : `${t('err.sync')} (${m})`);
    } finally { setBusy(false); }
  };

  const [invite, setInvite] = useState('');
  const [confirmOff, setConfirmOff] = useState(false);
  const invitePartner = () => void run(async () => setInvite(await newInviteLink()));

  return (
    <div class="card">
      <h2>{t('household')}</h2>
      {v ? (
        <>
          <p class="small">
            <span class={`dot ${st.error ? (st.error === 'auth' ? 'bad' : 'off') : st.live ? 'live' : 'idle'}`}><i />{t(`sync.${st.error === 'auth' ? 'bad' : st.error ? 'off' : st.live ? 'live' : 'idle'}`)}</span>
            {st.at > 0 && <span class="muted"> · {t('syncedAt', { time: new Date(st.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}</span>}
          </p>
          {st.error === 'auth' && <p class="error small">{t('err.auth')}</p>}
          <p class="muted small">{t('householdOn')}</p>
          <div class="row gap wrap">
            <button class="btn primary" disabled={busy} onClick={invitePartner}>{t('invitePartner')}</button>
            <button class="btn" disabled={st.busy} onClick={() => void syncNow()}>{t('syncNow')}</button>
            <button class="btn danger" onClick={() => confirm(t('leaveConfirm')) && void leaveHousehold()}>{t('leave')}</button>
          </div>
          <h2>{t('googleTitle')}</h2>
          {set.googleEmail ? (
            <>
              <p class="small">{t('googleOn', { email: set.googleEmail })}</p>
              {confirmOff ? (
                <><p class="muted small">{t('googleConfirmOff')}</p><GoogleButton onCredential={(tok) => void run(async () => { await disableGoogle(tok); setConfirmOff(false); })} /></>
              ) : <button class="btn danger" onClick={() => setConfirmOff(true)}>{t('googleOff')}</button>}
            </>
          ) : (
            <>
              <p class="muted small">{t('googleExplain')}</p>
              <GoogleButton onCredential={(tok) => void run(() => enableGoogle(tok))} />
            </>
          )}
        </>
      ) : (
        <>
          <p class="muted small">{t('householdOff')}</p>
          <Field label={t('server')} hint={t('serverHint')}>
            <input type="url" value={set.server} placeholder={serverUrl() || 'https://dogcare-sync.you.workers.dev'} onInput={(e) => patchSettings({ server: (e.target as HTMLInputElement).value })} />
          </Field>
          <button class="btn primary block" disabled={busy || !serverUrl()} onClick={() => void run(createHousehold)}>{t('createHousehold')}</button>
          <Field label={t('inviteLink')}><input type="text" value={join} placeholder="https://…#join=…" onInput={(e) => setJoin((e.target as HTMLInputElement).value)} /></Field>
          <button class="btn block" disabled={busy || !join.trim()} onClick={() => void run(() => joinHousehold(join))}>{t('joinHousehold')}</button>
          <p class="or">{t('or')}</p>
          <GoogleButton onCredential={(tok) => void run(() => connectGoogle(tok))} />
        </>
      )}
      {err && <p class="error small">{err}</p>}
      {invite && <InviteSheet link={invite} onClose={() => setInvite('')} />}
    </div>
  );
}

function Reminders() {
  const set = state.value.settings;
  const [err, setErr] = useState('');
  const perm = supported() ? Notification.permission : 'denied';
  const on = set.notify && perm === 'granted';

  const toggle = async () => {
    setErr('');
    try {
      if (on) { await disablePush(); patchSettings({ notify: false }); return; }
      if (vault.value && pushSupported()) await enablePush();
      else await enableLocalOnly();
    } catch (e) {
      const m = (e as Error).message;
      setErr(m === 'denied' ? t('err.denied') : m === 'vapid' ? t('err.vapid') : `${t('err.sync')} (${m})`);
    }
  };

  return (
    <div class="card">
      <h2>{t('reminders')}</h2>
      {!supported() ? <p class="muted small">{t('noNotifications')}</p> : (
        <>
          <div class="row between">
            <span>{t('notifyMe')}</span>
            <label class="switch"><input type="checkbox" checked={on} onChange={toggle} /><span /></label>
          </div>
          <Field label={t('remindAt')} hint={t('remindAtHint')}>
            <select value={set.hour} onChange={(e) => { patchSettings({ hour: Number((e.target as HTMLSelectElement).value) }); scheduleUpload(); }}>
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
            </select>
          </Field>
          {on && <button class="btn" onClick={async () => { if (!(await showDigest(true))) showToast(t('allGood')); }}>{t('testReminder')}</button>}
          {isIos() && !standalone() && <p class="muted small">{t('iosInstall')}</p>}
          {on && !(vault.value && set.push) && <p class="muted small">{t('localOnly')}</p>}
          {err && <p class="error small">{err}</p>}
        </>
      )}
      <button class="btn block" onClick={() => download('dog-care.ics', buildIcs(allItems(sharedData()).filter((i) => !i.task.archived), set.hour), 'text/calendar')}>{t('exportIcs')}</button>
      <p class="muted small">{t('icsHint')}</p>
    </div>
  );
}

function Data() {
  const backup = () => download(`dog-care-${localDate()}.json`, exportJson(), 'application/json');
  const restore = (e: Event) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    void f.text().then((txt) => {
      try { importJson(txt); showToast(t('imported')); } catch { showToast(t('err.backup')); }
    });
    (e.target as HTMLInputElement).value = '';
  };
  return (
    <div class="card">
      <h2>{t('data')}</h2>
      <div class="row gap wrap">
        <button class="btn" onClick={backup}>{t('exportJson')}</button>
        <label class="btn">{t('importJson')}<input type="file" accept="application/json,.json" hidden onChange={restore} /></label>
      </div>
      <p class="muted small">{t('privacy')}</p>
    </div>
  );
}

function DogSheet({ draft, isNew, onClose }: { draft: Omit<Dog, 'updatedAt'>; isNew: boolean; onClose: () => void }) {
  const [d, setD] = useState(draft);
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((x) => ({ ...x, [k]: v }));
  const sp: Species = d.species ?? 'dog';
  const [full, setFull] = useState<Blob | undefined>();
  const [newId, setNewId] = useState<string | undefined>();
  const [viewing, setViewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const pick = async (f: File) => {
    try {
      const [thumb, big] = await Promise.all([toAvatar(f), toFull(f)]);
      const id = newPhotoId();
      await cachePhoto(id, big);
      setFull(big); setNewId(id);
      setD((x) => ({ ...x, photo: thumb, photoId: id }));
    } catch { showToast(t('err.photo')); }
  };
  // A new kind of animal starts with its standard routines unless something already covers it.
  const covered = state.value.tasks.some((x) => !x.archived && (x.species ?? 'dog') === sp && !x.dogIds.length);
  const [seed, setSeed] = useState<boolean | null>(null);
  const seeding = isNew && (seed ?? !covered);
  const chooseSpecies = (s: Species) => { setD((x) => ({ ...x, species: s, emoji: SPECIES_EMOJI[s][0] })); setSeed(null); };
  const save = async () => {
    setBusy(true);
    // The picture goes up first, so the other phone never sees a photo id that has nothing behind it.
    const original = state.value.dogs.find((x) => x.id === d.id);
    let photoId = d.photoId;
    try {
      await storeFullPhoto(newId, full, original?.photoId !== d.photoId ? original?.photoId : undefined);
    } catch (e) {
      showToast(t('err.photoUpload'));
      if (newId) photoId = undefined;
    }
    if (photoId && !vault.value) photoId = original?.photoId === photoId ? photoId : undefined;
    setBusy(false);
    saveDog({ ...d, photoId, species: sp, name: d.name.trim() });
    if (seeding) for (const p of presetsFor(sp)) if (p.common.includes(sp)) saveTask(taskFromPreset(p.key, t(`preset.${p.key}`), sp));
    onClose();
  };
  return (
    <Sheet title={isNew ? t('addDog') : t('editDog')} onClose={onClose}>
      <div class="row gap"><button type="button" class="avatar-btn" aria-label={t('viewPhoto')} disabled={!d.photoId} onClick={() => setViewing(true)}><Avatar dog={d} size={64} /></button><Field label={t('dogName')}><input type="text" value={d.name} onInput={(e) => set('name', (e.target as HTMLInputElement).value)} /></Field></div>
      <div class="row gap wrap">
        <label class="btn small-btn">{d.photo ? t('changePhoto') : t('addPhoto')}
          <input type="file" accept="image/*" hidden onChange={(e) => {
            const f = (e.target as HTMLInputElement).files?.[0];
            (e.target as HTMLInputElement).value = '';
            if (f) void pick(f);
          }} />
        </label>
        {d.photo && <button class="btn small-btn danger" onClick={() => { setD((x) => ({ ...x, photo: undefined, photoId: undefined })); setFull(undefined); setNewId(undefined); }}>{t('removePhoto')}</button>}
      </div>
      {isNew && <div class="chips">{SPECIES.map((s) => <Chip key={s} on={sp === s} onClick={() => chooseSpecies(s)}>{SPECIES_EMOJI[s][0]} {t(`species.${s}`)}</Chip>)}</div>}
      <div class="chips">{SPECIES_EMOJI[sp].map((e) => <Chip key={e} on={d.emoji === e} onClick={() => set('emoji', e)}>{e}</Chip>)}</div>
      {isNew && (
        <div class="row between">
          <span class="small">{t('seedRoutines')}</span>
          <label class="switch"><input type="checkbox" checked={seeding} onChange={(e) => setSeed((e.target as HTMLInputElement).checked)} /><span /></label>
        </div>
      )}
      <div class="swatches">{COLORS.map((c) => <button key={c} class={`sw${d.color === c ? ' on' : ''}`} style={{ background: c }} aria-label={c} onClick={() => set('color', c)} />)}</div>
      <div class="grid2">
        <Field label={t('breed')}><input type="text" value={d.breed ?? ''} onInput={(e) => set('breed', (e.target as HTMLInputElement).value || undefined)} /></Field>
        <Field label={t('birthday')}><DatePicker value={d.birthday ?? ''} max={localDate()} clearable onChange={(v) => set('birthday', v || undefined)} /></Field>
      </div>
      <div class="row gap">
        <button class="btn primary grow" disabled={!d.name.trim() || busy} onClick={() => void save()}>{t('save')}</button>
        {!isNew && <button class="btn danger" onClick={() => confirm(t('deleteDogConfirm', { name: d.name })) && (removeDog(d.id), onClose())}>{t('delete')}</button>}
      </div>
      {viewing && d.photoId && <PhotoViewer id={d.photoId} thumb={d.photo} onClose={() => setViewing(false)} />}
    </Sheet>
  );
}

const mobile = () => /Mobi|iPhone|iPad|Android/i.test(navigator.userAgent);

/** The one-time link, ready to copy. The system share sheet is offered only on phones, where it reaches Messages and mail apps. */
function InviteSheet({ link, onClose }: { link: string; onClose: () => void }) {
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); showToast(t('copied')); } catch { prompt(t('inviteLink'), link); }
  };
  const share = () => void navigator.share({ title: t('app'), text: t('inviteMessage'), url: link }).catch(() => {});
  return (
    <Sheet title={t('invitePartner')} onClose={onClose}>
      <p class="muted small">{t('inviteOnce')}</p>
      <input type="text" readOnly value={link} onFocus={(e) => (e.target as HTMLInputElement).select()} />
      <div class="row gap">
        <button class="btn primary grow" onClick={copy}>{t('copyLink')}</button>
        {mobile() && 'share' in navigator && <button class="btn" onClick={share}>{t('shareLink')}</button>}
      </div>
    </Sheet>
  );
}

/** The full-size picture on a dark backdrop. Shows the thumbnail while the real one loads, and keeps it if the real one is unavailable. */
function PhotoViewer({ id, thumb, onClose }: { id: string; thumb?: string; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let made: string | null = null;
    void fullPhotoUrl(id).then((u) => { made = u; if (u) setUrl(u); else setFailed(true); });
    return () => { if (made) URL.revokeObjectURL(made); };
  }, [id]);
  return (
    <div class="viewer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}>
      <img src={url ?? thumb} alt="" class={url ? '' : 'blurred'} />
      {failed && <p class="small">{t('photoUnavailable')}</p>}
      <button class="icon-btn" aria-label={t('close')}>✕</button>
    </div>
  );
}
