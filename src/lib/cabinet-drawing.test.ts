import { describe, expect, test } from 'bun:test';
import { getFrontRectangles } from './cabinet-drawing';
import { getFurnitureLayout, type FurnitureConfig } from './furniture';
const base: FurnitureConfig = { hauteur: 2000, largeur: 800, profondeur: 350, epaisseurMontants: 19, epaisseurTraverses: 19, epaisseurRayons: 19, epaisseurDos: 3, epaisseurPortes: 19, montantsTouteHauteur: true, traversesTouteLargeur: false, nombreRayons: 2, dosType: 'aucun', nombrePortes: 1, typePorte: 'applique', retraitRayons: 0, decalageDos: 0 };
describe('Front positions share manufacturing dimensions', () => {
  test('overlay covers sides and full height except 1 mm per edge', () => {
    expect(getFrontRectangles(base)[0]).toMatchObject({ x: 1, y: 1, width: 798, height: 1998 });
  });
  test('inset stays between sides and traverses with 3 mm gaps', () => {
    expect(getFrontRectangles({ ...base, typePorte: 'interieur' })[0]).toMatchObject({ x: 22, y: 22, width: 756, height: 1956 });
  });
  test('removed traverse leaves band starting at top and door below band', () => {
    const c = { ...base, bandeauHaut: { hauteur: 150, remplaceTraverse: true, faceApplique: true } };
    expect(getFurnitureLayout(c)).toMatchObject({ topPanel: false, topInset: 0, topBandEnd: 150 });
    expect(getFrontRectangles(c)).toContainEqual({ name: 'Face fixe haut (applique)', x: 1, y: 1, width: 798, height: 148 });
    expect(getFrontRectangles(c)[0].y).toBe(151);
  });
  test('drawer above door retains exact 2 mm separation', () => {
    const fronts = getFrontRectangles({ ...base, tiroirs: { position: 'haut', hauteurs: [150] } });
    expect(fronts[0].y).toBe(153);
    expect(fronts[1]).toMatchObject({ y: 1, height: 150 });
  });
  test('neighbouring overlay faces keep exactly 2 mm joints and 1 mm outer edges', () => {
    for (const c of [
      base,
      { ...base, nombrePortes: 2 as const },
      { ...base, tiroirs: { position: 'haut' as const, hauteurs: [150, 200] } },
      { ...base, bandeauHaut: { hauteur: 150, remplaceTraverse: true, faceApplique: true }, tiroirs: { position: 'bas' as const, hauteurs: [120] } },
      { ...base, nombrePortes: 0 as const, tiroirs: { position: 'bas' as const, hauteurs: [300, 400] } },
    ]) {
      const fronts = [...getFrontRectangles(c)].sort((a, b) => a.y - b.y);
      expect(fronts.length).toBeGreaterThan(0);
      expect(fronts[0].y).toBe(1);
      expect(fronts[fronts.length - 1].y + fronts[fronts.length - 1].height).toBe(1999);
      for (let i = 1; i < fronts.length; i++) expect(fronts[i].y - (fronts[i - 1].y + fronts[i - 1].height)).toBe(2);
      for (const front of fronts) {
        expect(front.x).toBe(1);
        expect(front.x + front.width).toBe(799);
      }
    }
  });
  test('split overlay drawer faces keep 1 mm outer edges and a 2 mm center joint', () => {
    const fronts = getFrontRectangles({ ...base, nombrePortes: 0, montantIntermediaire: 'entre-traverses', tiroirsCompartiments: { position: 'haut', gauche: [150], droite: [150] } });
    const gauche = fronts.find(f => f.name === 'Face tiroir gauche 1');
    const droite = fronts.find(f => f.name === 'Face tiroir droite 1');
    expect(gauche).toMatchObject({ x: 1, width: 398 });
    expect(droite).toMatchObject({ x: 401, width: 398 });
    expect(droite!.x - (gauche!.x + gauche!.width)).toBe(2);
  });
});
