import { useState } from 'preact/hooks';
import { DatePicker } from './datepicker';
import { localDate } from './dates';
import { fmtKg, fmtLongDay, nameOf, parseKg, timeOf } from './format';
import { t } from './i18n';
import { removeLog, saveLog, state } from './store';
import { stampFor } from './dates';
import type { Log } from './types';
import { Badge, Chip, Empty, Field, Sheet } from './ui';
import { DogFilter } from './today';

export function History() {
  const [edit, setEdit] = useState<Log | null>(null);
  const s = state.value;
  const filter = s.settings.dogFilter;
  const tasks = new Map(s.tasks.map((x) => [x.id, x]));
  const dogs = new Map(s.dogs.map((x) => [x.id, x]));
  const logs = s.logs.filter((l) => filter === 'all' || l.dogId === filter).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 200);

  const groups: { day: string; rows: Log[] }[] = [];
  for (const l of logs) {
    const day = localDate(new Date(l.at));
    const g = groups[groups.length - 1];
    if (g?.day === day) g.rows.push(l);
    else groups.push({ day, rows: [l] });
  }

  return (
    <>
      <div class="topbar"><div><h1>{t('tab.history')}</h1><p class="muted small">{t('history.sub')}</p></div></div>
      <DogFilter />
      {!groups.length && <Empty emoji="🕘" title={t('noHistory')} text={t('noHistoryText')} />}
      {groups.map((g) => (
        <section key={g.day}>
          <h2 class="sec">{fmtLongDay(g.day)}</h2>
          {g.rows.map((l) => {
            const task = tasks.get(l.taskId)!;
            const dog = dogs.get(l.dogId)!;
            return (
              <button key={l.id} class={`item plain-card${l.skipped ? ' archived' : ''}`} onClick={() => setEdit(l)}>
                <Badge emoji={task.emoji} color={task.color} size={40} />
                <span class="item-text">
                  <b>{nameOf(task)}{l.skipped ? ` · ${t('skipped')}` : ''}</b>
                  <span class="small muted">{s.dogs.length > 1 ? `${dog.emoji} ${dog.name} · ` : ''}{l.by} · {timeOf(l.at)}{l.weight ? ` · ${fmtKg(l.weight)}` : ''}{l.note ? ` · ${l.note}` : ''}</span>
                </span>
                <span class="chev" aria-hidden="true">✎</span>
              </button>
            );
          })}
        </section>
      ))}
      {edit && <LogSheet log={edit} onClose={() => setEdit(null)} />}
    </>
  );
}

export function LogSheet({ log, onClose }: { log: Log; onClose: () => void }) {
  const today = localDate();
  const [day, setDay] = useState(localDate(new Date(log.at)));
  const [note, setNote] = useState(log.note ?? '');
  const [by, setBy] = useState(log.by);
  const [next, setNext] = useState(log.nextDue ?? '');
  const [kg, setKg] = useState(log.weight ? String(log.weight) : '');
  const [dogId, setDogId] = useState(log.dogId);
  const task = state.value.tasks.find((x) => x.id === log.taskId);

  const save = () => {
    const sameDay = day === localDate(new Date(log.at));
    saveLog({ ...log, at: sameDay ? log.at : stampFor(day), note: note.trim() || undefined, weight: task?.measure ? parseKg(kg) : log.weight, dogId, by: by.trim() || log.by, nextDue: next || undefined });
    onClose();
  };

  return (
    <Sheet title={task ? nameOf(task) : ''} onClose={onClose}>
      <div class="grid2">
        <Field label={t('doneOn')}><DatePicker value={day} max={today} onChange={(v) => setDay(v || day)} /></Field>
        <Field label={t('doneBy')}><input type="text" value={by} onInput={(e) => setBy((e.target as HTMLInputElement).value)} /></Field>
      </div>
      <Field label={t('nextDue')} hint={t('nextDueHint')}><DatePicker value={next} clearable onChange={setNext} /></Field>
      {state.value.dogs.length > 1 && (
        <Field label={t('forPet')}>
          <div class="chips">{state.value.dogs.map((d) => <Chip key={d.id} on={dogId === d.id} onClick={() => setDogId(d.id)}>{d.emoji} {d.name}</Chip>)}</div>
        </Field>
      )}
      {task?.measure
        ? <Field label={t('weightKg')}><input type="text" inputMode="decimal" value={kg} onInput={(e) => setKg((e.target as HTMLInputElement).value)} /></Field>
        : <Field label={t('note')}><input type="text" value={note} onInput={(e) => setNote((e.target as HTMLInputElement).value)} /></Field>}
      <div class="row gap">
        <button class="btn primary grow" onClick={save}>{t('save')}</button>
        <button class="btn danger" onClick={() => { removeLog(log.id); onClose(); }}>{t('delete')}</button>
      </div>
    </Sheet>
  );
}
