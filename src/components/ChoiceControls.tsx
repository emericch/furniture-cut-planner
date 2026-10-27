import { Minus, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Boutons côte à côte pour 2-3 choix courts ; passent à la ligne sans chevauchement. */
export function Segmented({ label, value, options, onChange, id }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void; id?: string }) {
  const compact = Math.max(...options.map(o => o[1].length)) <= 4;
  return <div className="min-w-0 space-y-2">
    <Label className="block leading-5" id={`${id ?? label}-label`}>{label}</Label>
    <div role="radiogroup" aria-labelledby={`${id ?? label}-label`} className="flex flex-wrap gap-1 rounded-md border border-input bg-muted/40 p-1">
      {options.map(([v, text]) => {
        const active = v === value;
        return <button key={v} type="button" role="radio" aria-checked={active} onClick={() => onChange(v)}
          className={cn('min-h-9 flex-1 rounded', compact ? 'basis-0 min-w-[2.5rem] px-1' : 'basis-[7rem]', 'rounded px-3 py-1.5 text-sm leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            active ? 'bg-background font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{text}</button>;
      })}
    </div>
  </div>;
}

/** Compteur − / + pour les quantités entières. */
export function Stepper({ label, value, onChange, min = 0, max = 30 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const n = Number.isFinite(value) ? value : 0;
  return <div className="min-w-0 space-y-2">
    <Label className="block leading-5">{label}</Label>
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="icon" aria-label={`Retirer · ${label}`} disabled={n <= min} onClick={() => onChange(Math.max(min, n - 1))}><Minus className="h-4 w-4" /></Button>
      <span aria-live="polite" aria-label={label} className="w-8 text-center text-base font-medium tabular-nums">{n}</span>
      <Button type="button" variant="outline" size="icon" aria-label={`Ajouter · ${label}`} disabled={n >= max} onClick={() => onChange(Math.min(max, n + 1))}><Plus className="h-4 w-4" /></Button>
    </div>
  </div>;
}
