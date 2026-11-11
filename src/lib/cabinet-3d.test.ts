/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { getBoxes3D } from './cabinet-3d';
import { generateMeubleItems, type FurnitureConfig } from './furniture';

const base: FurnitureConfig = {hauteur:765,largeur:600,profondeur:550,epaisseurMontants:19,epaisseurTraverses:19,epaisseurRayons:19,epaisseurDos:3,epaisseurPortes:19,montantsTouteHauteur:true,traversesTouteLargeur:false,nombreRayons:2,nombreRayonsFixes:1,dosType:'en-applique',nombrePortes:1,typePorte:'applique',retraitRayons:0,decalageDos:0};
const variants: FurnitureConfig[] = [];
for (const dosType of ['aucun','toute-hauteur','toute-largeur','en-applique','entre-montants-traverses','en-rainure'] as const)
  for (const mth of [true,false])
    for (const nombrePortes of [0,1,2] as const)
      for (const typePorte of ['applique','interieur'] as const)
        for (const extra of [{}, {montantIntermediaire:'entre-traverses' as const, rayonsCompartiments:{gauche:{mobiles:2,fixes:1},droite:{mobiles:1,fixes:0}}}, {tiroirs:{position:'bas' as const,hauteurs:[140,140]}}, {bandeauHaut:{hauteur:80,remplaceTraverse:false,faceApplique:true}}])
          variants.push({...base,dosType,montantsTouteHauteur:mth,traversesTouteLargeur:!mth,nombrePortes,typePorte,decalageDos:dosType==='aucun'||dosType==='en-applique'?0:10,...extra});

describe('3D boxes', () => {
  test('every box stays inside the overall envelope', () => {
    for (const c of variants) for (const b of getBoxes3D(c)) {
      const g = c.dosType === 'en-rainure' && b.kind === 'back' ? 5 : 0;
      expect(b.x).toBeGreaterThanOrEqual(-0.001); expect(b.y).toBeGreaterThanOrEqual(-0.001 - g); expect(b.z).toBeGreaterThanOrEqual(-0.001);
      expect(b.x + b.w).toBeLessThanOrEqual(c.largeur + 0.001);
      expect(b.y + b.h).toBeLessThanOrEqual(c.hauteur + 0.001 + g);
      expect(b.z + b.d).toBeLessThanOrEqual(c.profondeur + 0.001);
    }
  });
  test('box count per piece matches the cutting-list quantities', () => {
    for (const c of variants) {
      const boxes = getBoxes3D(c);
      for (const it of generateMeubleItems(c)) expect([it.nom, boxes.filter(b => b.name === it.nom).length]).toEqual([it.nom, it.quantite]);
    }
  });
  test('structure panels do not intersect each other', () => {
    for (const c of variants) {
      const s = getBoxes3D(c).filter(b => b.kind !== 'back' || c.dosType !== 'en-rainure');
      for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
        const a = s[i], b = s[j], e = 0.01;
        const hit = a.x + a.w > b.x + e && b.x + b.w > a.x + e && a.y + a.h > b.y + e && b.y + b.h > a.y + e && a.z + a.d > b.z + e && b.z + b.d > a.z + e;
        if (hit) throw new Error(`${a.name} ∩ ${b.name}`);
      }
    }
  });
});