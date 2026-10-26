import { describe, expect, test } from 'bun:test';
import { getFrontRectangles, getSideRectangles } from './cabinet-drawing';
import { generateMeubleItems, getFurnitureLayout, type FurnitureConfig } from './furniture';
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

describe('Side view shares cutting-list depths', () => {
  test('no back panel when dosType is aucun', () => {
    expect(getSideRectangles(base).find(r => r.name === 'Dos')).toBeUndefined();
  });
  test('overlay back sits behind the carcass at full height', () => {
    const c = { ...base, dosType: 'en-applique' as const };
    const layout = getFurnitureLayout(c);
    // frontOffset = 21 (porte applique 19 + jeu 2) : le dos termine exactement la profondeur hors-tout.
    expect(getSideRectangles(c)).toContainEqual({ name: 'Dos', x: 21 + layout.depth, y: 0, width: 3, height: 2000 });
  });
  test('inset back sits inside the carcass with its offset, between traverses', () => {
    const c = { ...base, dosType: 'entre-montants-traverses' as const, decalageDos: 5 };
    const layout = getFurnitureLayout(c);
    expect(getSideRectangles(c)).toContainEqual({ name: 'Dos', x: 21 + layout.depth - 8, y: 19, width: 3, height: 1962 });
  });
  test('overlay door stands at the front edge, 2 mm before the carcass, inset door inside it', () => {
    const rects = getSideRectangles(base);
    const overlay = rects.find(r => r.name.startsWith('Porte'));
    expect(overlay).toMatchObject({ x: 0, width: 19 });
    expect(rects.find(r => r.name === 'Montant')).toMatchObject({ x: 21 });
    const inset = getSideRectangles({ ...base, typePorte: 'interieur' as const }).find(r => r.name.startsWith('Porte'));
    expect(inset).toMatchObject({ x: 0, width: 19 });
  });
  test('side and shelf depths equal the cutting list widths', () => {
    const items = generateMeubleItems(base);
    const rects = getSideRectangles(base);
    expect(rects.find(r => r.name === 'Montant')?.width).toBe(items.find(i => i.nom === 'Montant gauche')?.largeur);
    expect(rects.find(r => r.name === 'Rayon')?.width).toBe(items.find(i => i.nom === 'Rayon')?.largeur);
  });
  test('shelves sit against the back panel, clearance shows at the front', () => {
    // Dos intérieur 3 mm : le rayon le touche, le retrait de 10 mm se lit à l'avant.
    const c = { ...base, dosType: 'entre-montants-traverses' as const, retraitRayons: 10 };
    const layout = getFurnitureLayout(c);
    const shelf = getSideRectangles(c).find(r => r.name === 'Rayon')!;
    expect(shelf.x).toBe(21 + 10); // frontOffset + retrait
    expect(shelf.x + shelf.width).toBe(21 + layout.depth - 3); // contre le dos
    // Porte intérieure : dégagement épaisseur de porte + 10 mm entre porte et rayon.
    const ci = { ...base, typePorte: 'interieur' as const };
    const shelfI = getSideRectangles(ci).find(r => r.name === 'Rayon')!;
    expect(shelfI.x).toBe(19 + 10);
    expect(shelfI.x + shelfI.width).toBe(getFurnitureLayout(ci).depth);
  });
  test('everything stays within the overall depth', () => {
    for (const c of [
      base,
      { ...base, dosType: 'en-applique' as const },
      { ...base, typePorte: 'interieur' as const, dosType: 'en-rainure' as const },
      { ...base, nombrePortes: 0 as const, tiroirs: { position: 'haut' as const, hauteurs: [150, 200] } },
    ]) {
      const rects = getSideRectangles(c);
      expect(rects.length).toBeGreaterThan(0);
      for (const r of rects) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.x + r.width).toBeLessThanOrEqual(c.profondeur);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.y + r.height).toBeLessThanOrEqual(c.hauteur);
      }
    }
  });
});

describe('Thumbnail views for the cutting sheet', () => {
  test('front shows structure and fronts, side matches the side view', async () => {
    const { getThumbnailViews } = await import('./cabinet-drawing');
    const v = getThumbnailViews(base);
    expect(v.front.filter(r => r.kind === 'structure').map(r => r.name)).toContain('Montant gauche');
    expect(v.front.filter(r => r.kind === 'front').map(r => r.name)).toContain('Porte (applique)');
    expect(v.side.length).toBe(getSideRectangles(base).length);
    expect(v.largeur).toBe(800);
  });
  test('all thumbnail rectangles stay inside their view bounds', async () => {
    const { getThumbnailViews } = await import('./cabinet-drawing');
    for (const c of [base, { ...base, typePorte: 'interieur' as const, dosType: 'en-rainure' as const, montantIntermediaire: 'toute-hauteur' as const }]) {
      const v = getThumbnailViews(c);
      for (const r of v.front) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.x + r.width).toBeLessThanOrEqual(v.largeur + 0.001);
        expect(r.y + r.height).toBeLessThanOrEqual(v.hauteur + 0.001);
      }
      for (const r of v.side) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.x + r.width).toBeLessThanOrEqual(v.profondeur + 0.001);
      }
    }
  });
  test('print SVG markup is monochrome and finite', async () => {
    const { thumbnailSvgMarkup } = await import('./cabinet-drawing');
    const svg = thumbnailSvgMarkup(base);
    expect(svg).toContain('<rect');
    expect(svg).not.toMatch(/NaN|Infinity/);
    expect(svg.match(/<svg/g)?.length).toBe(2);
  });
});
