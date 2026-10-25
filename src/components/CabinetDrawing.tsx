import { Button } from '@/components/ui/button';
import { Columns2, Layers, PanelTop, DoorOpen } from 'lucide-react';
import { getFurnitureLayout, formatMm, type FurnitureConfig } from '@/lib/furniture';

interface Props {
  config: FurnitureConfig;
  view: 'interieur' | 'facades';
  onSelect: (step: number, side?: 'gauche' | 'droite') => void;
}

export function CabinetDrawing({ config: c, view, onSelect }: Props) {
  const layout = getFurnitureLayout(c);
  const divided = !!c.montantIntermediaire;
  const bays = divided ? ['gauche', 'droite'] as const : ['gauche'] as const;
  return <figure className="min-w-0 space-y-3">
    <div className="relative mx-auto w-full max-w-[320px] aspect-[16/15]">
      <svg viewBox="0 0 320 300" className="h-full w-full" role="img" aria-label={view === 'interieur' ? 'Vue de face de la structure du meuble' : 'Vue de face des portes et tiroirs'}>
        <rect x="22" y="12" width="276" height="276" className="fill-background stroke-border" strokeWidth="2" />
        <g className="fill-secondary stroke-foreground" strokeWidth="1.5">
          <rect x="22" y="12" width="12" height="276" />
          <rect x="286" y="12" width="12" height="276" />
          {layout.topPanel && <rect x="34" y="12" width="252" height="12" />}
          {layout.bottomPanel && <rect x="34" y="276" width="252" height="12" />}
          {c.bandeauHaut && <rect x="34" y="24" width="252" height="28" />}
          {c.bandeauBas && <rect x="34" y="248" width="252" height="28" />}
          {view === 'interieur' && divided && <rect x="154" y="24" width="12" height="252" />}
          {view === 'interieur' && bays.map(side => {
            const count = divided ? (c.rayonsCompartiments?.[side]?.mobiles ?? 0) + (c.rayonsCompartiments?.[side]?.fixes ?? 0) : c.nombreRayons + (c.nombreRayonsFixes ?? 0);
            return Array.from({ length: Math.min(count, 8) }, (_, i) => <rect key={`${side}-${i}`} x={!divided || side === 'gauche' ? 34 : 166} y={60 + (i + 1) * 180 / (Math.min(count, 8) + 1)} width={divided ? 120 : 252} height="5" />);
          })}
        </g>
        {view === 'facades' && <g className="fill-background stroke-foreground" strokeWidth="1.5">
          {bays.map(side => {
            const heights = c.tiroirsCompartiments?.[side] ?? c.tiroirs?.hauteurs ?? [];
            const separate = !!c.tiroirsCompartiments;
            if (!separate && side === 'droite') return null;
            const x = separate && side === 'droite' ? 162 : 36;
            const width = separate ? 122 : 248;
            const position = c.tiroirsCompartiments?.position ?? c.tiroirs?.position;
            let offset = 0;
            return heights.map((h, i) => {
              const height = Math.max(8, Math.min(210 / Math.max(1, heights.length), h / Math.max(1, c.hauteur) * 240));
              const y = position === 'bas' ? 272 - offset - height : 28 + offset;
              offset += height + 3;
              return <rect key={`${side}-${i}`} x={x} y={y} width={width} height={height} />;
            });
          })}
          {Array.from({ length: c.nombrePortes }, (_, i) => <rect key={i} x={36 + i * (248 / Math.max(1, c.nombrePortes))} y={c.tiroirs?.position === 'haut' || c.tiroirsCompartiments?.position === 'haut' ? 28 + Math.min(150, (c.tiroirs?.hauteurs.reduce((a, b) => a + b, 0) ?? Math.max(c.tiroirsCompartiments?.gauche.reduce((a, b) => a + b, 0) ?? 0, c.tiroirsCompartiments?.droite.reduce((a, b) => a + b, 0) ?? 0)) / Math.max(1, c.hauteur) * 240 + 6) : 28} width={248 / Math.max(1, c.nombrePortes) - 3} height={Math.max(12, Math.min(240, layout.doorHeight / Math.max(1, c.hauteur) * 240))} />)}
        </g>}
      </svg>
      <div className="absolute inset-x-0 top-0 flex justify-center">
        <Button variant="outline" size="icon" title="Traverses et bandeaux" aria-label="Sélectionner les traverses et bandeaux" onClick={() => onSelect(3)}><PanelTop className="h-5 w-5" /></Button>
      </div>
      <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 flex justify-around">
        {view === 'interieur' ? bays.map(side => <Button key={side} variant="outline" size="icon" title={`Rayons ${divided ? side : ''}`} aria-label={`Sélectionner les rayons ${side}`} onClick={() => onSelect(2, side)}><Layers className="h-5 w-5" /></Button>) : <Button variant="outline" size="icon" title="Portes et tiroirs" aria-label="Sélectionner les portes et tiroirs" onClick={() => onSelect(3)}><DoorOpen className="h-5 w-5" /></Button>}
      </div>
    </div>
    <figcaption className="text-center text-sm text-muted-foreground">H {formatMm(c.hauteur)} · L {formatMm(c.largeur)} · P {formatMm(c.profondeur)} mm</figcaption>
    <div className="grid grid-cols-2 gap-2">
      <Button variant="outline" className="h-auto min-h-11 whitespace-normal" onClick={() => onSelect(1)}><Columns2 className="mr-2 h-4 w-4 shrink-0" />Montants et dos</Button>
      <Button variant="outline" className="h-auto min-h-11 whitespace-normal" onClick={() => onSelect(3)}><PanelTop className="mr-2 h-4 w-4 shrink-0" />Bandeaux et façades</Button>
    </div>
  </figure>;
}