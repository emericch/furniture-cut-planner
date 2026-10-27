import { Button } from '@/components/ui/button';
import { Layers, PanelTop, DoorOpen } from 'lucide-react';
import { getFurnitureLayout, formatMm, type FurnitureConfig } from '@/lib/furniture';
import { getFrontRectangles, getSideRectangles, getThumbnailViews, type ThumbnailRect } from '@/lib/cabinet-drawing';

const coordinate = (n: number) => Number.isFinite(n) ? n : 0;
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
  // Épaisseurs rendues à une échelle visuelle commune (base : échelle horizontale),
  // pour que 19 mm paraisse identique sur les montants, traverses et rayons.
  const sx = 276 / Math.max(1, size(c.largeur));
  const sy = 276 / Math.max(1, size(c.hauteur));
  const T = Math.max(sx, sy, 5 / 19);
  const thH = (mm: number) => size(mm) * T / sx; // largeur dessinée d'un panneau vertical
  const thV = (mm: number) => size(mm) * T / sy; // hauteur dessinée d'un panneau horizontal
  // Vue de côté : profondeur à l'échelle, épaisseurs gonflées avec la même échelle visuelle que la vue de face.
  const sxSide = 156 / Math.max(1, size(c.profondeur));
  const sideW = (mm: number) => mm <= 40 ? size(mm) * T / sxSide : size(mm);
  const sideH = (mm: number) => mm <= 40 ? size(mm) * T / sy : size(mm);
  // Jeux entre façades exagérés (3 px à l'écran) pour rester lisibles, comme les épaisseurs.
  const frontNames = new Set(getFrontRectangles(c).map(f => f.name));
  const joint = 3 / sy;
  return <figure className="min-w-0 space-y-3">
    <div className="flex items-start justify-center gap-3">
      <div className="min-w-0 max-w-[300px] flex-[1.58]">
        <div className="relative aspect-[16/15]">
          <svg viewBox="0 0 320 300" className="h-full w-full" role="img" aria-label={view === 'interieur' ? 'Vue de face de la structure du meuble' : 'Vue de face des portes et tiroirs'}>
            <g transform={`translate(22 12) scale(${276 / Math.max(1, size(c.largeur))} ${276 / Math.max(1, size(c.hauteur))})`}>
              <g className="fill-secondary stroke-foreground">
                <rect data-piece="Montant gauche" x="0" y={coordinate(c.montantsTouteHauteur ? 0 : layout.topInset)} width={thH(c.epaisseurMontants)} height={size(c.montantsTouteHauteur ? c.hauteur : c.hauteur-layout.topInset-layout.bottomInset)} />
                <rect data-piece="Montant droit" x={coordinate(c.largeur-thH(c.epaisseurMontants))} y={coordinate(c.montantsTouteHauteur ? 0 : layout.topInset)} width={thH(c.epaisseurMontants)} height={size(c.montantsTouteHauteur ? c.hauteur : c.hauteur-layout.topInset-layout.bottomInset)} />
                {layout.topPanel && <rect data-piece="Traverse haute" x={coordinate(c.montantsTouteHauteur ? c.epaisseurMontants : 0)} y="0" width={size(c.largeur-(c.montantsTouteHauteur ? 2*c.epaisseurMontants : 0))} height={thV(c.epaisseurTraverses)} />}
                {layout.bottomPanel && <rect data-piece="Traverse basse" x={coordinate(c.montantsTouteHauteur ? c.epaisseurMontants : 0)} y={coordinate(c.hauteur-thV(c.epaisseurTraverses))} width={size(c.largeur-(c.montantsTouteHauteur ? 2*c.epaisseurMontants : 0))} height={thV(c.epaisseurTraverses)} />}
                {c.bandeauHaut && <rect data-piece="Bandeau haut" x={coordinate(c.epaisseurMontants)} y={coordinate(layout.topInset)} width={size(c.largeur-2*c.epaisseurMontants)} height={size(c.bandeauHaut.hauteur)} />}
                {c.bandeauBas && <rect data-piece="Bandeau bas" x={coordinate(c.epaisseurMontants)} y={coordinate(c.hauteur-layout.bottomBandEnd)} width={size(c.largeur-2*c.epaisseurMontants)} height={size(c.bandeauBas.hauteur)} />}
                {view === 'interieur' && divided && <rect x={coordinate((c.largeur-thH(c.epaisseurMontants))/2)} y={coordinate(c.montantIntermediaire==='toute-hauteur' ? 0 : layout.topInset)} width={thH(c.epaisseurMontants)} height={size(c.montantIntermediaire==='toute-hauteur' ? c.hauteur : c.hauteur-layout.topInset-layout.bottomInset)} />}
                {view === 'interieur' && bays.map(side => {
                  const count = divided ? (c.rayonsCompartiments?.[side]?.mobiles ?? 0)+(c.rayonsCompartiments?.[side]?.fixes ?? 0) : c.nombreRayons+(c.nombreRayonsFixes ?? 0);
                  const zone = layout.shelfZones[side];
                  return Array.from({length:Math.min(count,8)},(_,i)=><rect key={`${side}-${i}`} x={coordinate(side==='droite' ? (c.largeur+c.epaisseurMontants)/2 : c.epaisseurMontants)} y={coordinate(zone.top+(zone.bottom-zone.top)*(i+1)/(Math.min(count,8)+1))} width={size(divided ? layout.bayWidth : c.largeur-2*c.epaisseurMontants)} height={thV(c.epaisseurRayons)} />);
                })}
              </g>
              {view === 'facades' && <g className="fill-background stroke-foreground">{getFrontRectangles(c).map(front=><rect key={front.name} data-piece={front.name} x={coordinate(front.x)} y={coordinate(front.y)} width={size(front.width)} height={size(front.height)} vectorEffect="non-scaling-stroke" strokeWidth="1.5" />)}</g>}
            </g>
          </svg>
          <div className="absolute inset-x-0 top-0 flex justify-center">
            <Button variant="outline" size="icon" title="Bandeaux et façades" aria-label="Sélectionner les bandeaux et façades" onClick={() => onSelect(3)}><PanelTop className="h-5 w-5" /></Button>
          </div>
          <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 flex justify-around">
            {view === 'interieur' ? bays.map(side => <Button key={side} variant="outline" size="icon" title={`Rayons ${divided ? side : ''}`} aria-label={`Sélectionner les rayons ${side}`} onClick={() => onSelect(2, side)}><Layers className="h-5 w-5" /></Button>) : <Button variant="outline" size="icon" title="Portes et tiroirs" aria-label="Sélectionner les portes et tiroirs" onClick={() => onSelect(3)}><DoorOpen className="h-5 w-5" /></Button>}
          </div>
        </div>
        <p className="mt-1 text-center text-xs text-muted-foreground">Vue de face</p>
      </div>
      <div className="min-w-0 max-w-[190px] flex-1">
        <div className="aspect-[2/3]">
          <svg viewBox="0 0 200 300" className="h-full w-full" role="img" aria-label="Vue de côté : profondeur du meuble avec dos, rayons et façades">
            <g transform={`translate(22 12) scale(${sxSide} ${sy})`}>
              {getSideRectangles(c).map((r, i) => {
                const isFront = frontNames.has(r.name);
                return <rect key={`${r.name}-${i}`} data-piece={r.name} x={coordinate(r.x)} y={coordinate(r.y) + (isFront ? joint / 2 : 0)} width={sideW(r.width)} height={Math.max(1, sideH(r.height) - (isFront ? joint : 0))} vectorEffect="non-scaling-stroke" strokeWidth="1.5" className={r.name === 'Montant' ? 'fill-secondary stroke-foreground' : 'fill-background stroke-foreground'} />;
              })}
            </g>
          </svg>
        </div>
        <p className="mt-1 text-center text-xs text-muted-foreground">Vue de côté</p>
      </div>
    </div>
    <figcaption className="text-center text-sm text-muted-foreground">H {formatMm(c.hauteur)} · L {formatMm(c.largeur)} · P {formatMm(c.profondeur)} mm</figcaption>
  </figure>;
}

// Miniature sans texte ni boutons pour la feuille de débit : vue de face + vue de côté.
export function CabinetThumbnail({ config: c, className }: { config: FurnitureConfig; className?: string }) {
  const { front, side, largeur, hauteur, profondeur } = getThumbnailViews(c);
  const H = 96;
  const render = (rects: ThumbnailRect[], w: number, h: number, label: string) => {
    const s = H / Math.max(1, size(h));
    const minT = 1.5 / s;
    return <svg width={Math.max(1, size(w) * s)} height={H} viewBox={`0 0 ${Math.max(1, size(w) * s)} ${H}`} role="img" aria-label={label} className="shrink-0">
      {rects.map((r, i) => {
        const rw = Math.max(size(r.width), minT);
        const rh = Math.max(size(r.height), minT);
        return <rect key={`${r.name}-${i}`} x={Math.max(0, Math.min(coordinate(r.x), w - rw)) * s} y={Math.max(0, Math.min(coordinate(r.y), h - rh)) * s} width={rw * s} height={rh * s} vectorEffect="non-scaling-stroke" strokeWidth="1" className={r.kind === 'front' ? 'fill-background stroke-foreground' : 'fill-secondary stroke-foreground'} />;
      })}
    </svg>;
  };
  return <div className={`flex items-start gap-1 ${className ?? ''}`}>{render(front, largeur, hauteur, 'Vue de face miniature')}{render(side, profondeur, hauteur, 'Vue de côté miniature')}</div>;
}
