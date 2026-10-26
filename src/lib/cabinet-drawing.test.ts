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
      const fronts = getFrontRectangles(c);
      expect(fronts.length).toBeGreaterThan(0);
      // Group side-by-side faces into rows, then check vertical and horizontal joints.
      const rows = [...new Set(fronts.map(f => f.y))].sort((a, b) => a - b).map(y => fronts.filter(f => f.y === y).sort((a, b) => a.x - b.x));
      expect(rows[0][0].y).toBe(1);
      const lastRow = rows[rows.length - 1];
      expect(lastRow[0].y + lastRow[0].height).toBe(1999);
      for (let i = 1; i < rows.length; i++) expect(rows[i][0].y - (rows[i - 1][0].y + rows[i - 1][0].height)).toBe(2);
      for (const row of rows) {
        expect(row[0].x).toBe(1);
        expect(row[row.length - 1].x + row[row.length - 1].width).toBe(799);
        for (let i = 1; i < row.length; i++) expect(row[i].x - (row[i - 1].x + row[i - 1].width)).toBe(2);
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
