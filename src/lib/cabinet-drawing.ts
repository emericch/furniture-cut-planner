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