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

// Coupe latérale en millimètres : x = profondeur depuis l'avant du caisson, y = hauteur depuis le haut.
// Les profondeurs reprennent les largeurs exactes de la liste de débit.
export function getSideRectangles(c: FurnitureConfig): SideRectangle[] {
  const layout = getFurnitureLayout(c);
  const items = generateMeubleItems(c);
  const result: SideRectangle[] = [];
  const depthOf = (name: string, fallback: number) => items.find(i => i.nom === name)?.largeur ?? fallback;

  const carcassBack = layout.depth; // arrière du caisson (hors dos en applique)
  result.push({ name: 'Montant', x: 0, y: 0, width: depthOf('Montant gauche', carcassBack), height: c.hauteur });

  const traverseDepth = depthOf('Traverse haute', carcassBack);
  if (layout.topPanel) result.push({ name: 'Traverse haute', x: 0, y: 0, width: traverseDepth, height: c.epaisseurTraverses });
  if (layout.bottomPanel) result.push({ name: 'Traverse basse', x: 0, y: c.hauteur - c.epaisseurTraverses, width: traverseDepth, height: c.epaisseurTraverses });

  if (c.bandeauHaut) result.push({ name: 'Bandeau haut', x: 0, y: layout.topInset, width: c.epaisseurTraverses, height: c.bandeauHaut.hauteur });
  if (c.bandeauBas) result.push({ name: 'Bandeau bas', x: 0, y: c.hauteur - layout.bottomBandEnd, width: c.epaisseurTraverses, height: c.bandeauBas.hauteur });

  // Rayons : mêmes hauteurs que la vue de face, profondeur du débit.
  const shelfDepth = items.find(i => i.nom.startsWith('Rayon'))?.largeur ?? carcassBack;
  const divided = !!c.montantIntermediaire;
  const bays = divided ? ['gauche', 'droite'] as const : ['gauche'] as const;
  for (const side of bays) {
    const count = divided ? (c.rayonsCompartiments?.[side]?.mobiles ?? 0) + (c.rayonsCompartiments?.[side]?.fixes ?? 0) : c.nombreRayons + (c.nombreRayonsFixes ?? 0);
    const shown = Math.min(count, 8);
    const zone = layout.shelfZones[side];
    for (let i = 0; i < shown; i++) {
      result.push({ name: 'Rayon', x: 0, y: zone.top + (zone.bottom - zone.top) * (i + 1) / (shown + 1), width: shelfDepth, height: c.epaisseurRayons });
    }
  }

  // Dos : en applique derrière le caisson, sinon encastré avec son décalage.
  if (c.dosType === 'en-applique') {
    result.push({ name: 'Dos', x: carcassBack, y: 0, width: c.epaisseurDos, height: c.hauteur });
  } else if (c.dosType !== 'aucun') {
    const between = c.dosType === 'entre-montants-traverses' || c.dosType === 'en-rainure';
    result.push({ name: 'Dos', x: carcassBack - c.decalageDos - c.epaisseurDos, y: between ? layout.topInset : 0, width: c.epaisseurDos, height: between ? c.hauteur - layout.topInset - layout.bottomInset : c.hauteur });
  }

  // Façades : en applique devant le caisson (jeu de 2 mm), portes intérieures dans le caisson.
  for (const front of getFrontRectangles(c)) {
    const thickness = items.find(i => i.nom === front.name)?.epaisseur ?? c.epaisseurPortes;
    const inset = c.typePorte === 'interieur' && front.name.startsWith('Porte');
    result.push({ name: front.name, x: inset ? 0 : carcassBack + 2, y: front.y, width: thickness, height: front.height });
  }

  return result;
}