import { useState } from 'react';
import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseDecimal } from '@/lib/furniture';

interface Props {
  id: string;
  label?: ReactNode;
  labelClassName?: string;
  value?: number;
  min?: string;
  placeholder?: string;
  className?: string;
  onCommit: (v: number) => void;
}

// Controlled numeric field that keeps the raw draft text while editing so the
// user can clear the field and retype freely (no forced leading zero, no
// canonicalization rewriting the DOM value under the caret).
export function NumberField({ id, label, labelClassName, value, min, placeholder, className, onCommit }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === undefined || !Number.isFinite(value) ? '' : String(value).replace('.', ','));
  return <>
    {label !== undefined && <Label className={labelClassName ?? 'block leading-5'} htmlFor={id}>{label}</Label>}
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      min={min}
      placeholder={placeholder}
      className={className}
      value={shown}
      onChange={e => {
        const raw = e.target.value;
        setDraft(raw);
        const n = parseDecimal(raw);
        if (n !== null) onCommit(n);
      }}
      onBlur={() => setDraft(null)}
    />
  </>;
}
