import { useState } from 'preact/hooks';
import { allItems, type Item, type Status } from './care';
import { localDate } from './dates';
import { agoText, dueText, everyLabel, fmtDay, fmtLongDay } from './format';
import { t } from './i18n';
import { logCare, patchSettings, removeLog, state } from './store';
import { sync, vault } from './sync';
import { Avatar, Badge, Chip, Empty, Field, Sheet, showToast } from './ui';

export function DogFilter() {
  const { dogs, settings } = state.value;
  if (dogs.length < 2) return null;
  return (
    <div class="chips scroll-x">
      <Chip on={settings.dogFilter === 'all'} onClick={() => patchSettings({ dogFilter: 'all' })}>{t('all')}</Chip>
      {dogs.map((d) => (
        <Chip key={d.id} on={settings.dogFilter === d.id} onClick={() => patchSettings({ dogFilter: d.id })}>{d.emoji} {d.name}</Chip>
      ))}
    </div>
  );
}

export function SyncDot() {
  const s = sync.value;
  if (!vault.value) return null;
  const mode = s.error === 'auth' ? 'bad' : s.error ? 'off' : s.live ? 'live' : 'idle';
  return <span class={`dot ${mode}`} title={t(`sync.${mode}`)}><i />{t(`sync.${mode}`)}</span>;
}

function done(i: Item) {
  const id = logCare({ taskId: i.task.id, dogId: i.dog.id });
  showToast(`${i.task.emoji} ${i.task.name} · ${i.dog.name}`, () => removeLog(id));
}

function Card({ i, showDog, onOpen }: { i: Item; showDog: boolean; onOpen: () => void }) {
  const sub = i.last ? t('last', { when: agoText(i.last.at), by: i.last.by }) : t('never');
  return (
    <div class={`item ${i.status}`}>
      <button class="item-main" onClick={onOpen}>
        <Badge emoji={i.task.emoji} color={i.task.color} />
        <span class="item-text">
          <b>{i.task.name}</b>
          <span class="small due">{showDog && <>{i.dog.emoji} {i.dog.name} · </>}{dueText(i.days)}{i.status === 'ok' && <> · {fmtDay(i.due)}</>}</span>
          <span class="small muted">{sub}</span>
        </span>
      </button>
      <button class="done" aria-label={t('done')} onClick={() => done(i)}>✓</button>
    </div>
  );
}

const SECTIONS: { status: Status; key: string }[] = [
  { status: 'overdue', key: 'sec.overdue' },
  { status: 'today', key: 'sec.today' },
  { status: 'soon', key: 'sec.soon' },
  { status: 'ok', key: 'sec.later' },
];

export function Today({ goPlan }: { goPlan: () => void }) {
  const [open, setOpen] = useState<{ taskId: string; dogId: string } | null>(null);
  const s = state.value;
  const filter = s.settings.dogFilter;
  const all = allItems(s).filter((i) => filter === 'all' || i.dog.id === filter);
  const showDog = s.dogs.length > 1 && filter === 'all';
  const attention = all.filter((i) => i.status !== 'ok').length;
  const current = open ? all.find((i) => i.task.id === open.taskId && i.dog.id === open.dogId) : undefined;

  return (
    <>
      <div class="topbar">
        <div>
          <h1>{fmtLongDay(localDate())}</h1>
          <p class="muted small">{attention ? t('attention', { n: String(attention) }) : t('allGood')}</p>
        </div>
        <SyncDot />
      </div>
      <DogFilter />
      {!s.tasks.length && (
        <Empty emoji="📋" title={t('noTasks')} text={t('noTasksText')}>
          <button class="btn primary" onClick={goPlan}>{t('addTask')}</button>
        </Empty>
      )}
      {SECTIONS.map(({ status, key }) => {
        const rows = all.filter((i) => i.status === status);
        if (!rows.length) return null;
        return (
          <section key={status}>
            <h2 class={`sec ${status}`}>{t(key)} <span class="count">{rows.length}</span></h2>
            {rows.map((i) => <Card key={i.task.id + i.dog.id} i={i} showDog={showDog} onOpen={() => setOpen({ taskId: i.task.id, dogId: i.dog.id })} />)}
          </section>
        );
      })}
      {current && <ItemSheet i={current} onClose={() => setOpen(null)} />}
    </>
  );
}

function ItemSheet({ i, onClose }: { i: Item; onClose: () => void }) {
  const today = localDate();
  const [day, setDay] = useState(today);
  const [note, setNote] = useState('');
  const [next, setNext] = useState('');
  const recent = state.value.logs.filter((l) => l.taskId === i.task.id && l.dogId === i.dog.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5);

  const submit = (skipped: boolean) => {
    const id = logCare({ taskId: i.task.id, dogId: i.dog.id, day: skipped ? today : day, note: note.trim(), nextDue: next || undefined, skipped });
    showToast(`${skipped ? t('skipped') : '✓'} ${i.task.emoji} ${i.task.name} · ${i.dog.name}`, () => removeLog(id));
    onClose();
  };

  return (
    <Sheet title={`${i.task.name} · ${i.dog.name}`} onClose={onClose}>
      <div class="row gap">
        <Badge emoji={i.task.emoji} color={i.task.color} size={52} />
        <div>
          <b>{dueText(i.days)}</b>
          <div class="small muted">{fmtDay(i.due, true)} · {everyLabel(i.task.every, i.task.unit)}</div>
        </div>
      </div>
      {i.task.notes && <p class="note">{i.task.notes}</p>}
      <div class="grid2">
        <Field label={t('doneOn')}><input type="date" value={day} max={today} onInput={(e) => setDay((e.target as HTMLInputElement).value || today)} /></Field>
        <Field label={t('nextDue')} hint={t('nextDueHint')}><input type="date" value={next} min={today} onInput={(e) => setNext((e.target as HTMLInputElement).value)} /></Field>
      </div>
      <Field label={t('note')}><input type="text" value={note} placeholder={t('notePlaceholder')} onInput={(e) => setNote((e.target as HTMLInputElement).value)} /></Field>
      <div class="row gap">
        <button class="btn primary grow" onClick={() => submit(false)}>✓ {t('markDone')}</button>
        <button class="btn" onClick={() => submit(true)}>{t('skip')}</button>
      </div>
      {recent.length > 0 && (
        <>
          <h2 class="sec">{t('recent')}</h2>
          <ul class="plain">
            {recent.map((l) => (
              <li key={l.id} class="row between small">
                <span>{fmtDay(localDate(new Date(l.at)), true)}{l.skipped ? ` · ${t('skipped')}` : ''}{l.note ? ` · ${l.note}` : ''}</span>
                <span class="muted">{l.by}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  );
}
