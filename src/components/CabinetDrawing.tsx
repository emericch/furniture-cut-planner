import { Button } from '@/components/ui/button';
import { Columns2, Layers, PanelTop, DoorOpen } from 'lucide-react';
import { getFurnitureLayout, formatMm, type FurnitureConfig } from '@/lib/furniture';
import { getFrontRectangles } from '@/lib/cabinet-drawing';

const size = (n: number) => Number.isFinite(n) && n > 0 ? n : 0;

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
        <g transform={`translate(22 12) scale(${276 / Math.max(1, c.largeur)} ${276 / Math.max(1, c.hauteur)})`}>
          <g className="fill-secondary stroke-foreground">
            <rect data-piece="Montant gauche" x="0" y={c.montantsTouteHauteur ? 0 : layout.topInset} width={size(c.epaisseurMontants)} height={size(c.montantsTouteHauteur ? c.hauteur : c.hauteur-layout.topInset-layout.bottomInset)} />
            <rect data-piece="Montant droit" x={c.largeur-c.epaisseurMontants} y={c.montantsTouteHauteur ? 0 : layout.topInset} width={size(c.epaisseurMontants)} height={size(c.montantsTouteHauteur ? c.hauteur : c.hauteur-layout.topInset-layout.bottomInset)} />
            {layout.topPanel && <rect data-piece="Traverse haute" x={c.montantsTouteHauteur ? c.epaisseurMontants : 0} y="0" width={size(c.largeur-(c.montantsTouteHauteur ? 2*c.epaisseurMontants : 0))} height={size(c.epaisseurTraverses)} />}
            {layout.bottomPanel && <rect data-piece="Traverse basse" x={c.montantsTouteHauteur ? c.epaisseurMontants : 0} y={c.hauteur-c.epaisseurTraverses} width={size(c.largeur-(c.montantsTouteHauteur ? 2*c.epaisseurMontants : 0))} height={size(c.epaisseurTraverses)} />}
            {c.bandeauHaut && <rect data-piece="Bandeau haut" x={c.epaisseurMontants} y={layout.topInset} width={size(c.largeur-2*c.epaisseurMontants)} height={size(c.bandeauHaut.hauteur)} />}
            {c.bandeauBas && <rect data-piece="Bandeau bas" x={c.epaisseurMontants} y={c.hauteur-layout.bottomBandEnd} width={size(c.largeur-2*c.epaisseurMontants)} height={size(c.bandeauBas.hauteur)} />}
            {view === 'interieur' && divided && <rect x={(c.largeur-c.epaisseurMontants)/2} y={c.montantIntermediaire==='toute-hauteur' ? 0 : layout.topInset} width={size(c.epaisseurMontants)} height={size(c.montantIntermediaire==='toute-hauteur' ? c.hauteur : c.hauteur-layout.topInset-layout.bottomInset)} />}
            {view === 'interieur' && bays.map(side => {
              const count = divided ? (c.rayonsCompartiments?.[side]?.mobiles ?? 0)+(c.rayonsCompartiments?.[side]?.fixes ?? 0) : c.nombreRayons+(c.nombreRayonsFixes ?? 0);
              return Array.from({length:Math.min(count,8)},(_,i)=><rect key={`${side}-${i}`} x={side==='droite' ? (c.largeur+c.epaisseurMontants)/2 : c.epaisseurMontants} y={layout.topBandEnd+(c.hauteur-layout.topBandEnd-layout.bottomBandEnd)*(i+1)/(Math.min(count,8)+1)} width={size(divided ? layout.bayWidth : c.largeur-2*c.epaisseurMontants)} height={size(c.epaisseurRayons)} />);
            })}
          </g>
          {view === 'facades' && <g className="fill-background stroke-foreground">{getFrontRectangles(c).map(front=><rect key={front.name} data-piece={front.name} x={front.x} y={front.y} width={size(front.width)} height={size(front.height)} vectorEffect="non-scaling-stroke" strokeWidth="1.5" />)}</g>}
        </g>
      </svg>
      <div className="absolute inset-x-0 top-0 flex justify-center">
        <Button variant="outline" size="icon" title="Bandeaux et façades" aria-label="Sélectionner les bandeaux et façades" onClick={() => onSelect(3)}><PanelTop className="h-5 w-5" /></Button>
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