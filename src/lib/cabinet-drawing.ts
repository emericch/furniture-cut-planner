import { generateMeubleItems, getFurnitureLayout, type FurnitureConfig } from './furniture';

export interface FrontRectangle { name: string; x: number; y: number; width: number; height: number }

// All coordinates are manufacturing millimetres, not screen pixels.
export function getFrontRectangles(c: FurnitureConfig): FrontRectangle[] {
  const l = getFurnitureLayout(c);
  const result: FrontRectangle[] = [];
  const items = generateMeubleItems(c);
  const add = (name: string, x: number, y: number) => {
    const item = items.find(i => i.nom === name);
    // Fronts store grain length as longueur (height); the drawing uses geometric width/height.
    if (item) result.push({ name, x, y, width: item.largeur, height: item.longueur });
  };
  const left = c.typePorte === 'applique' ? 1 : c.epaisseurMontants + 3;
  const doors = items.filter(i => i.nom.startsWith('Porte'));
  doors.forEach((door, i) => add(door.nom, left + i * (door.largeur + 2), l.doorTop));
  if (c.bandeauHaut?.faceApplique) add('Face fixe haut (applique)', 1, 1);
  if (c.bandeauBas?.faceApplique) {
    const item = items.find(i => i.nom === 'Face fixe bas (applique)');
    if (item) add(item.nom, 1, c.hauteur - 1 - item.longueur);
  }
  const stack = (heights: number[], position: 'haut' | 'bas', side?: 'gauche' | 'droite') => {
    let offset = position === 'haut' ? l.topOverlay : l.bottomOverlay;
    heights.forEach((height, i) => {
      const name = side ? `Face tiroir ${side} ${i + 1}` : `Face tiroir ${i + 1} (${position})`;
      add(name, side === 'droite' ? (c.largeur + 2) / 2 : 1, position === 'haut' ? offset : c.hauteur - offset - height);
      offset += height + 2;
    });
  };
  if (c.tiroirs) stack(c.tiroirs.hauteurs, c.tiroirs.position);
  if (c.tiroirsCompartiments) {
    stack(c.tiroirsCompartiments.gauche, c.tiroirsCompartiments.position, 'gauche');
    stack(c.tiroirsCompartiments.droite, c.tiroirsCompartiments.position, 'droite');
  }
  return result;
}

export interface SideRectangle { name: string; x: number; y: number; width: number; height: number }

// Coupe latérale en millimètres : x = profondeur depuis l'avant hors-tout (façades comprises), y = hauteur depuis le haut.
// Les profondeurs reprennent les largeurs exactes de la liste de débit.
export function getSideRectangles(c: FurnitureConfig): SideRectangle[] {
  const layout = getFurnitureLayout(c);
  const items = generateMeubleItems(c);
  const result: SideRectangle[] = [];
  const depthOf = (name: string, fallback: number) => items.find(i => i.nom === name)?.largeur ?? fallback;

  // L'avant du caisson recule quand des façades en applique le précèdent (épaisseur + jeu de 2 mm).
  const frontOffset = layout.overlay ? c.epaisseurPortes + 2 : 0;
  const carcassBack = layout.depth; // profondeur du caisson (hors façades et dos en applique)
  result.push({ name: 'Montant', x: frontOffset, y: 0, width: depthOf('Montant gauche', carcassBack), height: c.hauteur });

  const traverseDepth = depthOf('Traverse haute', carcassBack);
  if (layout.topPanel) result.push({ name: 'Traverse haute', x: frontOffset, y: 0, width: traverseDepth, height: c.epaisseurTraverses });
  if (layout.bottomPanel) result.push({ name: 'Traverse basse', x: frontOffset, y: c.hauteur - c.epaisseurTraverses, width: traverseDepth, height: c.epaisseurTraverses });

  if (c.bandeauHaut) result.push({ name: 'Bandeau haut', x: frontOffset, y: layout.topInset, width: c.epaisseurTraverses, height: c.bandeauHaut.hauteur });
  if (c.bandeauBas) result.push({ name: 'Bandeau bas', x: frontOffset, y: c.hauteur - layout.bottomBandEnd, width: c.epaisseurTraverses, height: c.bandeauBas.hauteur });

  // Rayons : mêmes hauteurs que la vue de face, profondeur du débit.
  // Calés contre le dos : le jeu (retrait + dégagement de porte intérieure) se lit entre rayon et porte.
  const shelfDepth = items.find(i => i.nom.startsWith('Rayon'))?.largeur ?? carcassBack;
  const backDeduction = c.dosType !== 'aucun' && c.dosType !== 'en-applique' ? c.epaisseurDos + c.decalageDos : 0;
  const shelfX = frontOffset + Math.max(0, carcassBack - backDeduction - shelfDepth);
  const divided = !!c.montantIntermediaire;
  const bays = divided ? ['gauche', 'droite'] as const : ['gauche'] as const;
  for (const side of bays) {
    const count = divided ? (c.rayonsCompartiments?.[side]?.mobiles ?? 0) + (c.rayonsCompartiments?.[side]?.fixes ?? 0) : c.nombreRayons + (c.nombreRayonsFixes ?? 0);
    const shown = Math.min(count, 8);
    const zone = layout.shelfZones[side];
    for (let i = 0; i < shown; i++) {
      result.push({ name: 'Rayon', x: shelfX, y: zone.top + (zone.bottom - zone.top) * (i + 1) / (shown + 1), width: shelfDepth, height: c.epaisseurRayons });
    }
  }

  // Dos : en applique derrière le caisson, sinon encastré avec son décalage.
  if (c.dosType === 'en-applique') {
    result.push({ name: 'Dos', x: frontOffset + carcassBack, y: 0, width: c.epaisseurDos, height: c.hauteur });
  } else if (c.dosType !== 'aucun') {
    const between = c.dosType === 'entre-montants-traverses' || c.dosType === 'en-rainure';
    result.push({ name: 'Dos', x: frontOffset + carcassBack - c.decalageDos - c.epaisseurDos, y: between ? layout.topInset : 0, width: c.epaisseurDos, height: between ? c.hauteur - layout.topInset - layout.bottomInset : c.hauteur });
  }

  // Façades : en applique devant le caisson (jeu de 2 mm), portes intérieures dans le caisson.
  for (const front of getFrontRectangles(c)) {
    const thickness = items.find(i => i.nom === front.name)?.epaisseur ?? c.epaisseurPortes;
    const inset = c.typePorte === 'interieur' && front.name.startsWith('Porte');
    result.push({ name: front.name, x: inset ? frontOffset : frontOffset - 2 - thickness, y: front.y, width: thickness, height: front.height });
  }

  return result;
}
export interface ThumbnailRect { name: string; x: number; y: number; width: number; height: number; kind: 'structure' | 'front' }

export interface ThumbnailViews {
  front: ThumbnailRect[];
  side: ThumbnailRect[];
  largeur: number;
  hauteur: number;
  profondeur: number;
}

// Vues miniature (face + côté) en millimètres géométriques, pour la feuille de débit.
// La face montre la structure puis les façades par-dessus ; le côté reprend getSideRectangles.
export function getThumbnailViews(c: FurnitureConfig): ThumbnailViews {
  const l = getFurnitureLayout(c);
  const front: ThumbnailRect[] = [];
  const push = (name: string, x: number, y: number, width: number, height: number) =>
    front.push({ name, x, y, width, height, kind: 'structure' });
  const montantY = c.montantsTouteHauteur ? 0 : l.topInset;
  const montantH = c.montantsTouteHauteur ? c.hauteur : c.hauteur - l.topInset - l.bottomInset;
  push('Montant gauche', 0, montantY, c.epaisseurMontants, montantH);
  push('Montant droit', c.largeur - c.epaisseurMontants, montantY, c.epaisseurMontants, montantH);
  const trX = c.montantsTouteHauteur ? c.epaisseurMontants : 0;
  const trW = c.largeur - (c.montantsTouteHauteur ? 2 * c.epaisseurMontants : 0);
  if (l.topPanel) push('Traverse haute', trX, 0, trW, c.epaisseurTraverses);
  if (l.bottomPanel) push('Traverse basse', trX, c.hauteur - c.epaisseurTraverses, trW, c.epaisseurTraverses);
  if (c.bandeauHaut) push('Bandeau haut', c.epaisseurMontants, l.topInset, c.largeur - 2 * c.epaisseurMontants, c.bandeauHaut.hauteur);
  if (c.bandeauBas) push('Bandeau bas', c.epaisseurMontants, c.hauteur - l.bottomBandEnd, c.largeur - 2 * c.epaisseurMontants, c.bandeauBas.hauteur);
  const divided = !!c.montantIntermediaire;
  if (divided) push('Montant intermédiaire', (c.largeur - c.epaisseurMontants) / 2, c.montantIntermediaire === 'toute-hauteur' ? 0 : l.topInset, c.epaisseurMontants, c.montantIntermediaire === 'toute-hauteur' ? c.hauteur : montantH);
  const bays = divided ? ['gauche', 'droite'] as const : ['gauche'] as const;
  for (const side of bays) {
    const count = divided ? (c.rayonsCompartiments?.[side]?.mobiles ?? 0) + (c.rayonsCompartiments?.[side]?.fixes ?? 0) : c.nombreRayons + (c.nombreRayonsFixes ?? 0);
    const shown = Math.min(count, 8);
    const zone = l.shelfZones[side];
    for (let i = 0; i < shown; i++) {
      push('Rayon', side === 'droite' ? (c.largeur + c.epaisseurMontants) / 2 : c.epaisseurMontants, zone.top + (zone.bottom - zone.top) * (i + 1) / (shown + 1), divided ? l.bayWidth : c.largeur - 2 * c.epaisseurMontants, c.epaisseurRayons);
    }
  }
  for (const f of getFrontRectangles(c)) front.push({ name: f.name, x: f.x, y: f.y, width: f.width, height: f.height, kind: 'front' });
  const frontNames = new Set(getFrontRectangles(c).map(f => f.name));
  const side = getSideRectangles(c).map(r => ({ ...r, kind: (frontNames.has(r.name) ? 'front' : 'structure') as 'structure' | 'front' }));
  return { front, side, largeur: c.largeur, hauteur: c.hauteur, profondeur: c.profondeur };
}

// Rendu SVG monochrome autonome (impression) : épaisseurs minimales visibles, bords clampés.
export function thumbnailSvgMarkup(c: FurnitureConfig, heightPx = 60): string {
  const { front, side, largeur, hauteur, profondeur } = getThumbnailViews(c);
  const render = (rects: ThumbnailRect[], w: number, h: number) => {
    const s = (heightPx - 2) / Math.max(1, h);
    const widthPx = Math.max(1, w * s);
    const minT = 1.5 / s;
    const body = rects.map(r => {
      const rw = Math.max(r.width, Math.min(minT, w));
      const rh = Math.max(r.height, Math.min(minT, h));
      const x = Math.max(0, Math.min(r.x, w - rw));
      const y = Math.max(0, Math.min(r.y, h - rh));
      return `<rect x="${(x * s).toFixed(1)}" y="${(y * s).toFixed(1)}" width="${(rw * s).toFixed(1)}" height="${(rh * s).toFixed(1)}" fill="${r.kind === 'front' ? '#ffffff' : '#e8e8e8'}" stroke="#000000" stroke-width="0.6"/>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${widthPx.toFixed(0)}" height="${heightPx}" viewBox="0 0 ${widthPx.toFixed(1)} ${heightPx}" style="margin-right:6px;vertical-align:middle">${body}</svg>`;
  };
  return `<span style="display:inline-block;vertical-align:middle;margin-right:8px">${render(front, largeur, hauteur)}${render(side, profondeur, hauteur)}</span>`;
}
