import { generateMeubleItems, getFurnitureLayout, formatMm, type FurnitureConfig } from './furniture';
import { getFrontRectangles } from './cabinet-drawing';

export type Kind3D = 'structure' | 'shelf' | 'back' | 'door' | 'drawer' | 'fixed';

// Boîte en millimètres : x depuis la gauche, y depuis le haut, z depuis l'avant hors-tout (façades comprises).
export interface Box3D {
  id: string;
  name: string;
  kind: Kind3D;
  x: number; y: number; z: number;
  w: number; h: number; d: number;
  hinge?: 'left' | 'right';
  section: number;
  side?: 'gauche' | 'droite';
  dims: string;
}

// Volumes 3D dérivés du même calcul que la feuille de débit : la vue ne peut pas contredire le débit.
export function getBoxes3D(c: FurnitureConfig): Box3D[] {
  const l = getFurnitureLayout(c);
  const items = generateMeubleItems(c);
  const item = (name: string) => items.find(i => i.nom === name);
  const dims = (name: string) => {
    const i = item(name);
    return i ? `${formatMm(i.longueur)} × ${formatMm(i.largeur)} × ${formatMm(i.epaisseur)} mm` : '';
  };
  const out: Box3D[] = [];
  const push = (b: Omit<Box3D, 'id' | 'dims'> & { item?: string }) => {
    const { item: itemName, ...rest } = b;
    if (![b.w, b.h, b.d, b.x, b.y, b.z].every(Number.isFinite) || b.w <= 0 || b.h <= 0 || b.d <= 0) return;
    out.push({ ...rest, id: `${b.name}#${out.length}`, dims: dims(itemName ?? b.name) });
  };
  const eM = c.epaisseurMontants, eT = c.epaisseurTraverses;
  const front = l.overlay ? c.epaisseurPortes + 2 : 0;
  const inner = c.dosType !== 'aucun' && c.dosType !== 'en-applique' ? c.epaisseurDos + c.decalageDos : 0;

  // Montants
  const mg = item('Montant gauche');
  if (mg) {
    const y = c.montantsTouteHauteur ? 0 : l.topInset;
    push({ name: 'Montant gauche', kind: 'structure', section: 1, x: 0, y, z: front, w: eM, h: mg.longueur, d: mg.largeur });
    push({ name: 'Montant droit', kind: 'structure', section: 1, x: c.largeur - eM, y, z: front, w: eM, h: mg.longueur, d: mg.largeur });
  }
  // Traverses (en deux parties si le montant intermédiaire est toute hauteur)
  for (const [name, y] of [['Traverse haute', 0], ['Traverse basse', c.hauteur - eT]] as const) {
    const t = item(name);
    if (!t) continue;
    const x0 = c.traversesTouteLargeur ? 0 : eM;
    if (t.quantite === 2) {
      push({ name, kind: 'structure', section: 1, x: x0, y, z: front, w: t.longueur, h: eT, d: t.largeur });
      push({ name, kind: 'structure', section: 1, x: c.largeur - x0 - t.longueur, y, z: front, w: t.longueur, h: eT, d: t.largeur });
    } else push({ name, kind: 'structure', section: 1, x: x0, y, z: front, w: t.longueur, h: eT, d: t.largeur });
  }
  // Montant intermédiaire
  const mi = item('Montant intermédiaire');
  if (mi) {
    const dividerFront = Math.max(c.nombrePortes > 0 && c.typePorte === 'interieur' ? c.epaisseurPortes : 0, c.bandeauHaut || c.bandeauBas ? eT : 0);
    push({ name: 'Montant intermédiaire', kind: 'structure', section: 1, x: (c.largeur - eM) / 2, y: c.montantIntermediaire === 'toute-hauteur' ? 0 : l.topInset, z: front + dividerFront, w: eM, h: mi.longueur, d: mi.largeur });
  }
  // Bandeaux
  if (c.bandeauHaut) push({ name: 'Bandeau haut', kind: 'structure', section: 3, x: eM, y: l.topInset, z: front, w: c.largeur - 2 * eM, h: c.bandeauHaut.hauteur, d: eT });
  if (c.bandeauBas) push({ name: 'Bandeau bas', kind: 'structure', section: 3, x: eM, y: c.hauteur - l.bottomBandEnd, z: front, w: c.largeur - 2 * eM, h: c.bandeauBas.hauteur, d: eT });

  // Rayons : répartis régulièrement dans la zone libre, calés contre le dos.
  const divided = !!c.montantIntermediaire;
  for (const side of (divided ? ['gauche', 'droite'] : ['gauche']) as Array<'gauche' | 'droite'>) {
    const mobiles = divided ? c.rayonsCompartiments?.[side]?.mobiles ?? 0 : c.nombreRayons;
    const fixes = divided ? c.rayonsCompartiments?.[side]?.fixes ?? 0 : c.nombreRayonsFixes ?? 0;
    const n = Math.min(mobiles + fixes, 30);
    const zone = l.shelfZones[side];
    const gap = (zone.bottom - zone.top - n * c.epaisseurRayons) / (n + 1);
    const bayX = divided && side === 'droite' ? (c.largeur + eM) / 2 : eM;
    const bayW = divided ? l.bayWidth : c.largeur - 2 * eM;
    for (let i = 0; i < n; i++) {
      // Les rayons fixes sont répartis parmi les mobiles (un fixe au milieu rigidifie le meuble).
      const fixed = fixes > 0 && Math.floor((i + 1) * fixes / n) > Math.floor(i * fixes / n);
      const itemName = divided ? `Rayon ${fixed ? 'fixe' : 'mobile'} ${side}` : fixed ? 'Rayon fixe' : 'Rayon';
      const it = item(itemName);
      if (!it) continue;
      push({ name: itemName, kind: 'shelf', section: 2, side, x: bayX + (bayW - it.longueur) / 2, y: zone.top + gap * (i + 1) + c.epaisseurRayons * i, z: front + Math.max(0, l.depth - inner - it.largeur), w: it.longueur, h: c.epaisseurRayons, d: it.largeur });
    }
  }

  // Dos
  const dos = item('Dos');
  if (dos) {
    const z = c.dosType === 'en-applique' ? front + l.depth : front + l.depth - c.decalageDos - c.epaisseurDos;
    const full = c.dosType === 'en-applique' || c.dosType === 'toute-largeur';
    const groove = c.dosType === 'en-rainure' ? 5 : 0;
    const x0 = full ? 0 : eM - groove;
    const y0 = c.dosType === 'en-applique' || c.dosType === 'toute-hauteur' ? 0 : l.topInset - groove;
    if (dos.quantite === 2) {
      push({ name: 'Dos', kind: 'back', section: 1, x: x0, y: y0, z, w: dos.largeur, h: dos.longueur, d: c.epaisseurDos });
      push({ name: 'Dos', kind: 'back', section: 1, x: c.largeur - x0 - dos.largeur, y: y0, z, w: dos.largeur, h: dos.longueur, d: c.epaisseurDos });
    } else push({ name: 'Dos', kind: 'back', section: 1, x: x0, y: y0, z, w: dos.largeur, h: dos.longueur, d: c.epaisseurDos });
  }

  // Façades : mêmes rectangles que la vue de face.
  const fronts = getFrontRectangles(c);
  const doorCount = fronts.filter(f => f.name.startsWith('Porte')).length;
  for (const f of fronts) {
    const thickness = item(f.name)?.epaisseur ?? c.epaisseurPortes;
    const isDoor = f.name.startsWith('Porte');
    const inset = isDoor && c.typePorte === 'interieur';
    push({
      name: f.name,
      kind: isDoor ? 'door' : f.name.startsWith('Face tiroir') ? 'drawer' : 'fixed',
      section: 3,
      hinge: isDoor ? (doorCount === 2 && f.name.includes('droite') ? 'right' : 'left') : undefined,
      x: f.x, y: f.y, z: inset ? front : Math.max(0, front - 2 - thickness), w: f.width, h: f.height, d: thickness,
    });
  }
  return out;
}