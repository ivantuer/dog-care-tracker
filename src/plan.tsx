import { useState } from 'preact/hooks';
import { everyLabel, monthName } from './format';
import { t } from './i18n';
import { COLORS, PRESETS, TASK_EMOJI } from './presets';
import { nextOrder, removeTask, saveTask, state, taskFromPreset, uid } from './store';
import type { Task, Unit } from './types';
import { Badge, Chip, Empty, Field, Sheet } from './ui';

const UNITS: Unit[] = ['day', 'week', 'month', 'year'];

type Draft = Omit<Task, 'updatedAt'>;

const blank = (): Draft => ({ id: uid(), name: '', emoji: '🐾', color: COLORS[6], every: 1, unit: 'month', lead: 3, dogIds: [], months: [], order: nextOrder() });

function dogsLabel(task: Task) {
  const { dogs } = state.value;
  if (!task.dogIds.length || dogs.length < 2) return '';
  return dogs.filter((d) => task.dogIds.includes(d.id)).map((d) => d.name).join(', ');
}

export function Plan() {
  const [edit, setEdit] = useState<Draft | null>(null);
  const [adding, setAdding] = useState(false);
  const tasks = [...state.value.tasks].sort((a, b) => Number(!!a.archived) - Number(!!b.archived) || a.order - b.order);

  return (
    <>
      <div class="topbar">
        <div>
          <h1>{t('tab.plan')}</h1>
          <p class="muted small">{t('plan.sub')}</p>
        </div>
        <button class="btn primary" onClick={() => setAdding(true)}>+ {t('add')}</button>
      </div>
      {!tasks.length && <Empty emoji="📋" title={t('noTasks')} text={t('noTasksText')} />}
      {tasks.map((task) => (
        <button key={task.id} class={`item plain-card${task.archived ? ' archived' : ''}`} onClick={() => setEdit(task)}>
          <Badge emoji={task.emoji} color={task.color} />
          <span class="item-text">
            <b>{task.name}</b>
            <span class="small muted">
              {everyLabel(task.every, task.unit)}
              {task.lead > 0 && ` · ${t('remindBefore', { d: String(task.lead) })}`}
              {dogsLabel(task) && ` · ${dogsLabel(task)}`}
              {task.months.length > 0 && ` · ${task.months.map(monthName).join(' ')}`}
              {task.archived && ` · ${t('paused')}`}
            </span>
          </span>
          <span class="chev">›</span>
        </button>
      ))}
      {adding && (
        <Sheet title={t('addTask')} onClose={() => setAdding(false)}>
          <div class="presets">
            {PRESETS.map((p) => (
              <button key={p.key} class="preset" onClick={() => { setAdding(false); setEdit(taskFromPreset(p.key, t(`preset.${p.key}`))); }}>
                <Badge emoji={p.emoji} color={p.color} size={40} />
                <span><b>{t(`preset.${p.key}`)}</b><span class="small muted">{everyLabel(p.every, p.unit)}</span></span>
              </button>
            ))}
            <button class="preset" onClick={() => { setAdding(false); setEdit(blank()); }}>
              <Badge emoji="✨" color="#8e4ec6" size={40} />
              <span><b>{t('custom')}</b><span class="small muted">{t('customHint')}</span></span>
            </button>
          </div>
        </Sheet>
      )}
      {edit && <TaskSheet draft={edit} isNew={!state.value.tasks.some((x) => x.id === edit.id)} onClose={() => setEdit(null)} />}
    </>
  );
}

function TaskSheet({ draft, isNew, onClose }: { draft: Draft; isNew: boolean; onClose: () => void }) {
  const [d, setD] = useState(draft);
  const dogs = state.value.dogs;
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const toggle = <T,>(xs: T[], v: T) => (xs.includes(v) ? xs.filter((x) => x !== v) : [...xs, v]);
  const valid = d.name.trim().length > 0 && d.every >= 1;

  return (
    <Sheet title={isNew ? t('addTask') : t('editTask')} onClose={onClose}>
      <div class="row gap">
        <Badge emoji={d.emoji} color={d.color} size={52} />
        <Field label={t('name')}><input type="text" value={d.name} placeholder={t('taskNamePlaceholder')} onInput={(e) => set('name', (e.target as HTMLInputElement).value)} /></Field>
      </div>
      <div class="chips scroll-x">
        {TASK_EMOJI.map((e) => <Chip key={e} on={d.emoji === e} onClick={() => set('emoji', e)}>{e}</Chip>)}
      </div>
      <div class="swatches">
        {COLORS.map((c) => <button key={c} type="button" class={`sw${d.color === c ? ' on' : ''}`} style={{ background: c }} aria-label={c} onClick={() => set('color', c)} />)}
      </div>

      <div class="grid2">
        <Field label={t('repeatEvery')}>
          <div class="row gap">
            <input type="number" min="1" max="999" inputMode="numeric" value={d.every} onInput={(e) => set('every', Math.max(1, Math.floor(Number((e.target as HTMLInputElement).value) || 1)))} />
            <select value={d.unit} onChange={(e) => set('unit', (e.target as HTMLSelectElement).value as Unit)}>
              {UNITS.map((u) => <option key={u} value={u}>{t(`units.${u}`)}</option>)}
            </select>
          </div>
        </Field>
        <Field label={t('remindDays')} hint={t('remindDaysHint')}>
          <input type="number" min="0" max="365" inputMode="numeric" value={d.lead} onInput={(e) => set('lead', Math.max(0, Math.floor(Number((e.target as HTMLInputElement).value) || 0)))} />
        </Field>
      </div>

      {dogs.length > 1 && (
        <Field label={t('forDogs')} hint={t('forDogsHint')}>
          <div class="chips">
            {dogs.map((dog) => <Chip key={dog.id} on={d.dogIds.includes(dog.id)} onClick={() => set('dogIds', toggle(d.dogIds, dog.id))}>{dog.emoji} {dog.name}</Chip>)}
          </div>
        </Field>
      )}

      <Field label={t('season')} hint={t('seasonHint')}>
        <div class="chips">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <Chip key={m} on={d.months.includes(m)} onClick={() => set('months', toggle(d.months, m).sort((a, b) => a - b))}>{monthName(m)}</Chip>)}
        </div>
      </Field>

      <div class="grid2">
        <Field label={t('firstDue')} hint={t('firstDueHint')}><input type="date" value={d.startDate ?? ''} onInput={(e) => set('startDate', (e.target as HTMLInputElement).value || undefined)} /></Field>
        <Field label={t('paused')}>
          <label class="switch"><input type="checkbox" checked={!!d.archived} onChange={(e) => set('archived', (e.target as HTMLInputElement).checked || undefined)} /><span /></label>
        </Field>
      </div>
      <Field label={t('notes')}><textarea rows={2} value={d.notes ?? ''} placeholder={t('notesPlaceholder')} onInput={(e) => set('notes', (e.target as HTMLTextAreaElement).value || undefined)} /></Field>

      <div class="row gap">
        <button class="btn primary grow" disabled={!valid} onClick={() => { saveTask({ ...d, name: d.name.trim() }); onClose(); }}>{t('save')}</button>
        {!isNew && <button class="btn danger" onClick={() => confirm(t('deleteTaskConfirm', { name: d.name })) && (removeTask(d.id), onClose())}>{t('delete')}</button>}
      </div>
    </Sheet>
  );
}
