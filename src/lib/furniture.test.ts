/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { generateMeubleItems, validateConfig, compareSize, escapeHtml, type FurnitureConfig } from './furniture';

const base: FurnitureConfig = {hauteur:2000,largeur:800,profondeur:350,epaisseurMontants:19,epaisseurTraverses:19,epaisseurRayons:19,epaisseurDos:3,epaisseurPortes:19,montantsTouteHauteur:true,traversesTouteLargeur:false,nombreRayons:2,dosType:'aucun',nombrePortes:0,typePorte:'interieur',retraitRayons:0,decalageDos:0};
const piece = (c: Partial<FurnitureConfig>, name: string) => {
  const found = generateMeubleItems({...base,...c}).find(i => i.nom === name);
  if (!found) throw new Error('Missing piece: '+name);
  return found;
};
describe('Concrete manufacturing rules', () => {
  test('full-height sides deduct two side thicknesses from top/bottom', () => expect(piece({},'Traverse haute').longueur).toBe(762));
  test('full-width top/bottom deduct two top/bottom thicknesses from sides', () => expect(piece({montantsTouteHauteur:false,traversesTouteLargeur:true},'Montant gauche').longueur).toBe(1962));
  test('overlay door has 1.5 mm on each edge', () => expect(piece({nombrePortes:1,typePorte:'applique'},'Porte (applique)')).toMatchObject({longueur:797,largeur:1997}));
  test('two overlay doors have 2 mm center gap', () => expect(piece({nombrePortes:2,typePorte:'applique'},'Porte gauche (applique)').longueur).toBe(397.5));
  test('two inset doors retain 3 mm per edge and 2 mm center gap', () => expect(piece({nombrePortes:2},'Porte gauche (intérieur)')).toMatchObject({longueur:377,largeur:1956}));
  test('inset door deducts thickness plus 10 mm from shelf only', () => {
    expect(piece({nombrePortes:1},'Rayon').largeur).toBe(321);
    expect(piece({nombrePortes:1},'Montant gauche').largeur).toBe(350);
  });
  test('overlay door and back deduct each thickness exactly once', () => expect(piece({nombrePortes:1,typePorte:'applique',dosType:'en-applique'},'Rayon').largeur).toBe(328));
  test('shelf setback is additional to inset-door clearance', () => expect(piece({nombrePortes:1,retraitRayons:5},'Rayon').largeur).toBe(316));
  test('full-height back shortens top/bottom by thickness plus rear offset', () => expect(piece({dosType:'toute-hauteur',decalageDos:10},'Traverse haute').largeur).toBe(337));
  test('full-width back shortens sides by thickness plus rear offset', () => expect(piece({dosType:'toute-largeur',decalageDos:10},'Montant gauche').largeur).toBe(337));
  test('between-panel back deducts thickness and rear offset from shelves', () => expect(piece({dosType:'entre-montants-traverses',decalageDos:10,nombrePortes:1},'Rayon').largeur).toBe(308));
  test('10 mm groove engagement adds 20 mm to each back dimension', () => expect(piece({dosType:'en-rainure'},'Dos')).toMatchObject({longueur:782,largeur:1982}));
  test('10 mm groove needs more than 10 mm of surrounding material', () => expect(validateConfig({...base,dosType:'en-rainure',epaisseurMontants:8}).length).toBeGreaterThan(0));
  test('3 mm only allowed for back and 8 mm not allowed for doors', () => {
    expect(validateConfig({...base,epaisseurMontants:3}).length).toBeGreaterThan(0);
    expect(validateConfig({...base,epaisseurPortes:8}).length).toBeGreaterThan(0);
  });
  test('22 mm supported on every panel', () => expect(validateConfig({...base,epaisseurMontants:22,epaisseurTraverses:22,epaisseurRayons:22,epaisseurDos:22,epaisseurPortes:22})).toEqual([]));
});
describe('Invalid configurations and full matrix', () => {
  test('reject nonfinite and nonpositive overall dimensions', () => {
    for (const hauteur of [0,-1,NaN,Infinity]) expect(validateConfig({...base,hauteur}).length).toBeGreaterThan(0);
  });
  test('reject fractional shelf quantity', () => expect(validateConfig({...base,nombreRayons:1.5}).length).toBeGreaterThan(0));
  test('reject zero/negative panel depth after deductions', () => expect(validateConfig({...base,nombrePortes:1,typePorte:'applique',dosType:'toute-hauteur',decalageDos:347}).length).toBeGreaterThan(0));
  test('reject shelves that consume entire internal height', () => expect(validateConfig({...base,hauteur:100,nombreRayons:10}).length).toBeGreaterThan(0));
  test('all 60 assembly/back/door variants maintain the intended depth', () => {
    for (const whole of [true,false]) for (const dosType of ['aucun','toute-hauteur','toute-largeur','en-applique','entre-montants-traverses','en-rainure'] as const) for (const [nombrePortes,typePorte] of [[0,'interieur'],[1,'interieur'],[2,'interieur'],[1,'applique'],[2,'applique']] as const) {
      const c = {...base,montantsTouteHauteur:whole,traversesTouteLargeur:!whole,dosType,nombrePortes,typePorte};
      expect(validateConfig(c)).toEqual([]);
      expect(piece(c,'Rayon').largeur).toBe(350-(nombrePortes ? (typePorte === 'interieur' ? 29 : 19) : 0)-(dosType === 'aucun' ? 0 : 3));
    }
  });
  test('sort by largest side without rotating the piece', () => {
    const a = piece({nombrePortes:1},'Porte (intérieur)'); const b=piece({},'Rayon');
    expect([b,a].sort(compareSize)[0]).toBe(a); expect(a.longueur).toBe(756);
  });
  test('export escapes executable names', () => expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
});