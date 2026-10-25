import { signal } from '@preact/signals';
import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { t } from './i18n';
import type { Dog } from './types';

// ---- toast -----------------------------------------------------------------------------------------------

export const toast = signal<{ text: string; undo?: () => void; n: number } | null>(null);
let toastTimer = 0;
let toastN = 0;

export function showToast(text: string, undo?: () => void) {
  toast.value = { text, undo, n: ++toastN };
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toast.value = null), undo ? 6000 : 3500);
}

export function Toast() {
  const x = toast.value;
  if (!x) return null;
  return (
    <div class="toast" role="status" key={x.n}>
      <span>{x.text}</span>
      {x.undo && (
        <button onClick={() => { x.undo!(); toast.value = null; }}>{t('undo')}</button>
      )}
    </div>
  );
}

// ---- sheet -----------------------------------------------------------------------------------------------

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ComponentChildren }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [onClose]);
  return (
    <div class="sheet-wrap" onClick={onClose}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div class="grab" />
        <div class="row between sheet-head">
          <h3>{title}</h3>
          <button class="icon-btn" aria-label={t('close')} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---- small pieces ----------------------------------------------------------------------------------------

export const Avatar = ({ dog, size = 36 }: { dog: Pick<Dog, 'emoji' | 'color' | 'photo'>; size?: number }) => (
  <span class="avatar" style={{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.55}px`, background: `color-mix(in srgb, ${dog.color} 28%, transparent)`, borderColor: dog.color }}>
    {dog.photo ? <img src={dog.photo} alt="" /> : dog.emoji}
  </span>
);

export const Badge = ({ emoji, color, size = 44 }: { emoji: string; color: string; size?: number }) => (
  <span class="badge" style={{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.52}px`, background: `color-mix(in srgb, ${color} 30%, transparent)`, color }}>{emoji}</span>
);

export function Chip({ on, onClick, children, color }: { on: boolean; onClick: () => void; children: ComponentChildren; color?: string }) {
  return (
    <button type="button" class={`chip${on ? ' on' : ''}`} style={on && color ? { background: color, borderColor: color, color: '#fff' } : undefined} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

export const Field = ({ label, children, hint }: { label: string; children: ComponentChildren; hint?: string }) => (
  <label class="field">
    <span class="label">{label}</span>
    {children}
    {hint && <span class="hint">{hint}</span>}
  </label>
);

export function Empty({ emoji, title, text, children }: { emoji: string; title: string; text?: string; children?: ComponentChildren }) {
  return (
    <div class="empty">
      <div class="empty-emoji">{emoji}</div>
      <h3>{title}</h3>
      {text && <p class="muted">{text}</p>}
      {children}
    </div>
  );
}

/** A whole-number field you can clear and retype: the typed text is kept as is, and the number is only taken when valid. */
export function NumInput({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (n: number) => void }) {
  const [text, setText] = useState(String(value));
  return (
    <input
      type="text" inputMode="numeric" pattern="[0-9]*" value={text}
      onInput={(e) => {
        const v = (e.target as HTMLInputElement).value.replace(/\D/g, '');
        setText(v);
        const n = Number(v);
        if (v !== '' && n >= min && n <= max) onChange(n);
      }}
      onBlur={() => setText(String(value))}
    />
  );
}
