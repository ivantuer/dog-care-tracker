import { useState } from 'preact/hooks';
import { everyLabel } from './format';
import { t } from './i18n';
import { COLORS, presetsFor, SPECIES, SPECIES_EMOJI } from './presets';
import { patchSettings, saveDog, saveTask, state, taskFromPreset, uid } from './store';
import { joinHousehold, pendingInvite, serverUrl } from './sync';
import type { Species } from './types';
import { Badge, Chip, Field } from './ui';

/** First run: your name, your dog, and which routines to track. Everything can be changed later. */
export function Onboard({ done }: { done: () => void }) {
  const [me, setMe] = useState(state.value.settings.me);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('dog');
  const [emoji, setEmoji] = useState(SPECIES_EMOJI.dog[0]);
  const common = (sp: Species) => new Set(presetsFor(sp).filter((p) => p.common.includes(sp)).map((p) => p.key));
  const [picked, setPicked] = useState(() => common('dog'));
  const chooseSpecies = (sp: Species) => { setSpecies(sp); setEmoji(SPECIES_EMOJI[sp][0]); setPicked(common(sp)); };
  const [join, setJoin] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const toggle = (k: string) => setPicked((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const start = () => {
    patchSettings({ me: me.trim() });
    const dog = { id: uid(), name: name.trim(), emoji, species, color: COLORS[Math.floor(Math.random() * COLORS.length)] };
    saveDog(dog);
    for (const p of presetsFor(species)) if (picked.has(p.key)) saveTask(taskFromPreset(p.key, t(`preset.${p.key}`), species));
    done();
  };

  const joinWith = async (text: string) => {
    setBusy(true); setErr('');
    try {
      patchSettings({ me: me.trim() });
      await joinHousehold(text);
      pendingInvite.value = '';
      done();
    } catch (e) {
      const m = (e as Error).message;
      setErr(m === 'invite' ? t('err.invite') : m === 'used' ? t('err.used') : t('err.sync'));
    } finally { setBusy(false); }
  };

  return (
    <div class="onboard">
      <div class="hello">🐾</div>
      <h1>{t('welcome')}</h1>
      <p class="muted">{t('welcomeText')}</p>
      <Field label={t('yourName')} hint={t('yourNameHint')}><input type="text" value={me} placeholder={t('yourNamePlaceholder')} onInput={(e) => setMe((e.target as HTMLInputElement).value)} /></Field>

      {pendingInvite.value ? (
        <div class="card">
          <h3>{t('invited')}</h3>
          <p class="muted small">{t('invitedText')}</p>
          {err && <p class="error small">{err}</p>}
          <button class="btn primary block" disabled={!me.trim() || busy} onClick={() => joinWith(pendingInvite.value)}>{t('joinHousehold')}</button>
        </div>
      ) : (
        <>
          <h2 class="sec">{t('speciesLabel')}</h2>
          <div class="chips">{SPECIES.map((sp) => <Chip key={sp} on={species === sp} onClick={() => chooseSpecies(sp)}>{SPECIES_EMOJI[sp][0]} {t(`species.${sp}`)}</Chip>)}</div>
          <Field label={t('dogName')}><input type="text" value={name} placeholder={t('dogNamePlaceholder')} onInput={(e) => setName((e.target as HTMLInputElement).value)} /></Field>
          <div class="chips">{SPECIES_EMOJI[species].map((e) => <Chip key={e} on={emoji === e} onClick={() => setEmoji(e)}>{e}</Chip>)}</div>
          <h2 class="sec">{t('whatToTrack')}</h2>
          {presetsFor(species).map((p) => (
            <button key={p.key} class={`item plain-card pick${picked.has(p.key) ? ' on' : ''}`} onClick={() => toggle(p.key)}>
              <Badge emoji={p.emoji} color={p.color} size={38} />
              <span class="item-text"><b>{t(`preset.${p.key}`)}</b><span class="small muted">{everyLabel(p.every, p.unit)}</span></span>
              <span class="tick">{picked.has(p.key) ? '✓' : ''}</span>
            </button>
          ))}
          <button class="btn primary block" disabled={!name.trim() || !me.trim()} onClick={start}>{t('start')}</button>
          <details class="join">
            <summary>{t('haveInvite')}</summary>
            <Field label={t('inviteLink')}><input type="text" value={join} placeholder="https://…#join=…" onInput={(e) => setJoin((e.target as HTMLInputElement).value)} /></Field>
            {err && <p class="error small">{err}</p>}
            <button class="btn block" disabled={!join.trim() || !me.trim() || busy} onClick={() => joinWith(join)}>{t('joinHousehold')}</button>
            <p class="muted small">{serverUrl() ? '' : t('noServerHint')}</p>
          </details>
        </>
      )}
    </div>
  );
}
