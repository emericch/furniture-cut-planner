import { describe, expect, test } from 'bun:test';
import { getFrontRectangles } from './cabinet-drawing';
import { getFurnitureLayout, type FurnitureConfig } from './furniture';
const base: FurnitureConfig = { hauteur: 2000, largeur: 800, profondeur: 350, epaisseurMontants: 19, epaisseurTraverses: 19, epaisseurRayons: 19, epaisseurDos: 3, epaisseurPortes: 19, montantsTouteHauteur: true, traversesTouteLargeur: false, nombreRayons: 2, dosType: 'aucun', nombrePortes: 1, typePorte: 'applique', retraitRayons: 0, decalageDos: 0 };
describe('Front positions share manufacturing dimensions', () => {
  test('overlay covers sides and full height except 1.5 mm per edge', () => {
    expect(getFrontRectangles(base)[0]).toMatchObject({ x: 1.5, y: 1.5, width: 797, height: 1997 });
  });
  test('inset stays between sides and traverses with 3 mm gaps', () => {
    expect(getFrontRectangles({ ...base, typePorte: 'interieur' })[0]).toMatchObject({ x: 22, y: 22, width: 756, height: 1956 });
  });
  test('removed traverse leaves band starting at top and door below band', () => {
    const c = { ...base, bandeauHaut: { hauteur: 150, remplaceTraverse: true, faceApplique: true } };
    expect(getFurnitureLayout(c)).toMatchObject({ topPanel: false, topInset: 0, topBandEnd: 150 });
    expect(getFrontRectangles(c)).toContainEqual({ name: 'Face fixe haut (applique)', x: 1.5, y: 1.5, width: 797, height: 147.5 });
    expect(getFrontRectangles(c)[0].y).toBe(151);
  });
  test('drawer above door retains exact 2 mm separation', () => {
    const fronts = getFrontRectangles({ ...base, tiroirs: { position: 'haut', hauteurs: [150] } });
    expect(fronts[0].y).toBe(153.5);
    expect(fronts[1]).toMatchObject({ y: 1.5, height: 150 });
  });
});