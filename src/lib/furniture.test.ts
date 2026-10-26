/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { generateMeubleItems, getFurnitureLayout, validateConfig, compareSize, escapeHtml, parseDecimal, type FurnitureConfig } from './furniture';
import auditFixtures from './furniture.audit-fixtures.json';

const base: FurnitureConfig = {hauteur:2000,largeur:800,profondeur:350,epaisseurMontants:19,epaisseurTraverses:19,epaisseurRayons:19,epaisseurDos:3,epaisseurPortes:19,montantsTouteHauteur:true,traversesTouteLargeur:false,nombreRayons:2,dosType:'aucun',nombrePortes:0,typePorte:'interieur',retraitRayons:0,decalageDos:0};
describe('Decimal input parsing', () => {
  for (const [raw, expected] of [['600,5',600.5],['600.5',600.5],['1 200',1200],['600,',600],['',null],['abc',null],['-5',-5],['6,0,0',null]] as const) {
    test(`${JSON.stringify(raw)} parses as ${expected}`, () => expect(parseDecimal(raw)).toBe(expected));
  }
});
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
  test('overlay doors alone deduct a 2 mm operating gap from cabinet and shelf depths', () => {
    for (const nombrePortes of [1, 2] as const) {
      for (const nom of ['Montant gauche', 'Montant droit', 'Traverse haute', 'Traverse basse', 'Rayon']) {
        expect(piece({nombrePortes,typePorte:'applique'},nom).largeur).toBe(329);
      }
    }
    expect(piece({nombrePortes:0,typePorte:'applique'},'Montant gauche').largeur).toBe(350);
    expect(piece({nombrePortes:0,typePorte:'applique'},'Rayon').largeur).toBe(350);
    expect(piece({nombrePortes:1,typePorte:'interieur'},'Montant gauche').largeur).toBe(350);
    expect(piece({nombrePortes:1,typePorte:'interieur'},'Rayon').largeur).toBe(321);
  });
  test('overlay door and back deduct each thickness and operating gap exactly once', () => expect(piece({nombrePortes:1,typePorte:'applique',dosType:'en-applique'},'Rayon').largeur).toBe(326));
  test('shelf setback is additional to inset-door clearance', () => expect(piece({nombrePortes:1,retraitRayons:5},'Rayon').largeur).toBe(316));
  test('full-height back shortens top/bottom by thickness plus rear offset', () => expect(piece({dosType:'toute-hauteur',decalageDos:10},'Traverse haute').largeur).toBe(337));
  test('full-width back shortens sides by thickness plus rear offset', () => expect(piece({dosType:'toute-largeur',decalageDos:10},'Montant gauche').largeur).toBe(337));
  test('between-panel back deducts thickness and rear offset from shelves', () => expect(piece({dosType:'entre-montants-traverses',decalageDos:10,nombrePortes:1},'Rayon').largeur).toBe(308));
  test('5 mm groove engagement adds 10 mm to each back dimension', () => expect(piece({dosType:'en-rainure'},'Dos')).toMatchObject({longueur:772,largeur:1972}));
  test('5 mm exterior grooves allow 8 mm panels', () => expect(validateConfig({...base,dosType:'en-rainure',epaisseurMontants:8,epaisseurTraverses:8})).toEqual([]));
  test('3 mm only allowed for back and 8 mm not allowed for doors', () => {
    expect(validateConfig({...base,epaisseurMontants:3}).length).toBeGreaterThan(0);
    expect(validateConfig({...base,epaisseurPortes:8}).length).toBeGreaterThan(0);
  });
  test('22 mm supported on every panel', () => expect(validateConfig({...base,epaisseurMontants:22,epaisseurTraverses:22,epaisseurRayons:22,epaisseurDos:22,epaisseurPortes:22})).toEqual([]));
});
describe('Invalid configurations and full matrix', () => {
  test('all 60 complete cutting lists match independently calculated numeric references', () => {
    for (const fixture of auditFixtures) {
      const config = fixture.config as FurnitureConfig;
      expect(validateConfig(config)).toEqual([]);
      // Historic references predate the confirmed 1 mm mobile-shelf clearance.
      expect(generateMeubleItems(config)).toEqual(fixture.expected.map(i => i.nom === 'Rayon' ? {...i,longueur:i.longueur-1} : i.nom === 'Dos' && config.dosType === 'en-rainure' ? {...i,longueur:i.longueur-10,largeur:i.largeur-10} : i));
    }
  });
  test('all permitted panel thickness combinations reconstruct overall dimensions and door clearances', () => {
    for (const fixture of auditFixtures) {
      for (const epaisseurMontants of [8,16,19,22]) for (const epaisseurTraverses of [8,16,19,22])
      for (const epaisseurRayons of [8,16,19,22]) for (const epaisseurDos of [3,8,16,19,22]) for (const epaisseurPortes of [16,19,22]) {
        const c = {...fixture.config,epaisseurMontants,epaisseurTraverses,epaisseurRayons,epaisseurDos,epaisseurPortes} as FurnitureConfig;
        expect(validateConfig(c)).toEqual([]);
        const items = generateMeubleItems(c);
        const [side,,top,,shelf] = items;
        expect(side.longueur + (c.montantsTouteHauteur ? 0 : 2*epaisseurTraverses)).toBe(2000);
        expect(top.longueur + (c.traversesTouteLargeur ? 0 : 2*epaisseurMontants)).toBe(800);
        const front = c.nombrePortes > 0 && c.typePorte === 'applique' ? epaisseurPortes + 2 : 0;
        const rear = c.dosType === 'en-applique' ? epaisseurDos : 0;
        const innerBack = c.dosType !== 'aucun' && c.dosType !== 'en-applique' ? epaisseurDos + 10 : 0;
        expect(side.largeur + front + rear + (c.dosType === 'toute-largeur' ? innerBack : 0)).toBe(350);
        expect(top.largeur + front + rear + (c.dosType === 'toute-hauteur' ? innerBack : 0)).toBe(350);
        expect(shelf.largeur + front + rear + innerBack + 5 + (c.nombrePortes > 0 && c.typePorte === 'interieur' ? epaisseurPortes + 10 : 0)).toBe(350);
        expect(shelf.longueur + 2*epaisseurMontants + 1).toBe(800);
        expect(shelf.epaisseur).toBe(epaisseurRayons);
        const doors = items.filter(i => i.nom.startsWith('Porte'));
        expect(doors.length).toBe(c.nombrePortes);
        if (doors.length > 0) {
          const overlay = c.typePorte === 'applique';
          expect(doors.reduce((sum,d) => sum+d.longueur,0) + (doors.length === 2 ? 2 : 0) + (overlay ? 3 : 6 + 2*epaisseurMontants)).toBe(800);
          expect(doors[0].largeur + (overlay ? 3 : 6 + 2*epaisseurTraverses)).toBe(2000);
          expect(doors.every(d => d.epaisseur === epaisseurPortes)).toBe(true);
        }
      }
    }
  });
  test('reject nonfinite and nonpositive overall dimensions', () => {
    for (const hauteur of [0,-1,NaN,Infinity]) expect(validateConfig({...base,hauteur}).length).toBeGreaterThan(0);
  });
  test('reject fractional shelf quantity', () => expect(validateConfig({...base,nombreRayons:1.5}).length).toBeGreaterThan(0));
  test('reject zero/negative panel depth after deductions', () => expect(validateConfig({...base,nombrePortes:1,typePorte:'applique',dosType:'toute-hauteur',decalageDos:347}).length).toBeGreaterThan(0));
  test('reject shelves that consume entire internal height', () => expect(validateConfig({...base,hauteur:100,nombreRayons:10}).length).toBeGreaterThan(0));
  test('back thickness and offset must fit even without shelves', () => {
    for (const dosType of ['toute-hauteur','toute-largeur','entre-montants-traverses','en-rainure'] as const) {
      expect(validateConfig({...base,nombreRayons:0,dosType,decalageDos:400}).length).toBeGreaterThan(0);
      expect(validateConfig({...base,nombreRayons:0,dosType,decalageDos:10})).toEqual([]);
    }
  });
  test('19 mm inset door must fit depth and not overlap a 3 mm back even without shelves', () => {
    expect(validateConfig({...base,nombreRayons:0,nombrePortes:1,profondeur:10}).length).toBeGreaterThan(0);
    expect(validateConfig({...base,nombreRayons:0,nombrePortes:1,profondeur:20,dosType:'entre-montants-traverses'}).length).toBeGreaterThan(0);
    expect(validateConfig({...base,nombreRayons:0,nombrePortes:1,profondeur:23,dosType:'entre-montants-traverses'})).toEqual([]);
  });
  test('reject unsupported runtime door counts, door placements and back types', () => {
    for (const overrides of [{nombrePortes:3},{typePorte:'invalid'},{dosType:'invalid'}]) {
      expect(validateConfig({...base,...overrides} as FurnitureConfig).length).toBeGreaterThan(0);
    }
  });
  test('all 60 assembly/back/door variants maintain the intended depth', () => {
    for (const whole of [true,false]) for (const dosType of ['aucun','toute-hauteur','toute-largeur','en-applique','entre-montants-traverses','en-rainure'] as const) for (const [nombrePortes,typePorte] of [[0,'interieur'],[1,'interieur'],[2,'interieur'],[1,'applique'],[2,'applique']] as const) {
      const c = {...base,montantsTouteHauteur:whole,traversesTouteLargeur:!whole,dosType,nombrePortes,typePorte};
      expect(validateConfig(c)).toEqual([]);
      expect(piece(c,'Rayon').largeur).toBe(350-(nombrePortes ? (typePorte === 'interieur' ? 29 : 21) : 0)-(dosType === 'aucun' ? 0 : 3));
    }
  });
  test('sort by largest side without rotating the piece', () => {
    const a = piece({nombrePortes:1},'Porte (intérieur)'); const b=piece({},'Rayon');
    expect([b,a].sort(compareSize)[0]).toBe(a); expect(a.longueur).toBe(756);
  });
  test('export escapes executable names', () => expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
});

describe('Fixed bands, drawer fronts and fixed shelves', () => {
  const band = {hauteur:150,remplaceTraverse:true,faceApplique:false};
  test('drawer-only remaining height counts 1.5 mm outer edges and only actual 2 mm joints', () => {
    for (const position of ['haut','bas'] as const) {
      const c={...base,nombreRayons:0,tiroirs:{position,hauteurs:[150,200]}};
      expect(getFurnitureLayout(c).frontFreeHeight).toBe(1645);
      expect(generateMeubleItems(c).filter(i => i.nom.startsWith('Porte'))).toHaveLength(0);
      expect(validateConfig(c)).toEqual([]);
      const filled={...c,tiroirs:{position,hauteurs:[150,1845]}};
      expect(getFurnitureLayout(filled).frontFreeHeight).toBe(0);
      expect(validateConfig(filled)).toEqual([]);
      expect(validateConfig({...c,tiroirs:{position,hauteurs:[150,1846]}}).length).toBeGreaterThan(0);
    }
  });
  test('remaining door height includes drawer joint while drawer-only bands reserve the fixed-front joint', () => {
    expect(getFurnitureLayout({...base,nombrePortes:1,typePorte:'applique',tiroirs:{position:'haut',hauteurs:[150,200]}}).doorHeight).toBe(1643);
    const c={...base,nombreRayons:0,bandeauHaut:{...band,faceApplique:true},tiroirs:{position:'haut' as const,hauteurs:[100,120]}};
    expect(getFurnitureLayout(c).frontFreeHeight).toBe(1625.5);
    const filled={...c,tiroirs:{position:'haut' as const,hauteurs:[100,1745.5]}};
    expect(validateConfig(filled)).toEqual([]);
    const faces=generateMeubleItems(filled).filter(i => i.nom.startsWith('Face'));
    expect(faces.reduce((sum,i) => sum+i.largeur,0)+2*2+3).toBe(2000);
  });
  test('mobile shelves deduct 1 mm total while fixed shelves have no width clearance', () => {
    expect(piece({},'Rayon').longueur).toBe(761);
    expect(piece({nombreRayonsFixes:1},'Rayon fixe')).toMatchObject({longueur:762,epaisseur:19,quantite:1});
  });
  test('top band replaces top panel and uses traverse thickness between sides', () => {
    const c = {...base,bandeauHaut:band};
    expect(generateMeubleItems(c).some(i => i.nom === 'Traverse haute')).toBe(false);
    expect(piece(c,'Bandeau haut')).toMatchObject({longueur:762,largeur:150,epaisseur:19});
    expect(piece({...c,montantsTouteHauteur:false,traversesTouteLargeur:true},'Montant gauche').longueur).toBe(1981);
    expect(piece({...c,nombrePortes:1},'Porte (intérieur)').largeur).toBe(1825);
  });
  test('bottom band replaces bottom panel and lengthens sides when full-width panel is removed', () => {
    const c={...base,bandeauBas:band,montantsTouteHauteur:false,traversesTouteLargeur:true};
    expect(generateMeubleItems(c).some(i => i.nom === 'Traverse basse')).toBe(false);
    expect(piece(c,'Montant gauche').longueur).toBe(1981);
    expect(piece(c,'Bandeau bas').longueur).toBe(762);
  });
  test('additional band retains its horizontal panel and deducts panel thickness from opening', () => {
    const c={bandeauHaut:{...band,remplaceTraverse:false},nombrePortes:1 as const};
    expect(piece(c,'Traverse haute').longueur).toBe(762);
    expect(piece(c,'Porte (intérieur)').largeur).toBe(1806);
  });
  test('covered top band respects 1.5 mm outer gap and 2 mm face-to-door joint', () => {
    const c={bandeauHaut:{...band,faceApplique:true},nombrePortes:1 as const,typePorte:'applique' as const};
    const face=piece(c,'Face fixe haut (applique)'); const door=piece(c,'Porte (applique)');
    expect(face).toMatchObject({longueur:797,largeur:147.5,epaisseur:19});
    expect(door.largeur).toBe(1847.5);
    expect(face.largeur+door.largeur+2+3).toBe(2000);
    expect(piece(c,'Montant gauche').largeur).toBe(329);
  });
  test('fixed overlay face without any doors still deducts thickness plus 2 mm in depth', () => expect(piece({bandeauBas:{...band,faceApplique:true}},'Montant gauche').largeur).toBe(329));
  test('drawer fronts above and below overlay doors have 2 mm joints and do not change width', () => {
    for (const position of ['haut','bas'] as const) {
      const c={tiroirs:{position,hauteurs:[150,200]},nombrePortes:2 as const,typePorte:'applique' as const};
      expect(piece(c,`Face tiroir 1 (${position})`)).toMatchObject({longueur:797,largeur:150,epaisseur:19});
      expect(piece(c,'Porte gauche (applique)')).toMatchObject({longueur:397.5,largeur:1643});
      expect(150+200+1643+2*2+3).toBe(2000);
      expect(piece(c,'Montant gauche').largeur).toBe(329);
    }
  });
  test('overlay drawer plus inset door deducts overlay depth once and inset shelf setback separately', () => {
    const c={tiroirs:{position:'haut' as const,hauteurs:[150]},nombrePortes:1 as const};
    expect(piece(c,'Montant gauche').largeur).toBe(329);
    expect(piece(c,'Rayon').largeur).toBe(300);
    expect(piece(c,'Porte (intérieur)').largeur).toBe(1824.5);
  });
  test('two covered bands and two drawers reserve all front joints exactly once', () => {
    const c={bandeauHaut:{...band,faceApplique:true},bandeauBas:{...band,faceApplique:true},tiroirs:{position:'bas' as const,hauteurs:[100,120]},nombrePortes:1 as const,typePorte:'applique' as const};
    const items=generateMeubleItems({...base,...c});
    const frontHeight=items.filter(i => i.nom.startsWith('Face') || i.nom.startsWith('Porte')).reduce((sum,i) => sum+i.largeur,0);
    expect(frontHeight+4*2+3).toBe(2000);
  });
  test('reject invalid bands, drawer heights, exhausted openings and unsupported open grooves', () => {
    for (const c of [{bandeauHaut:{...band,hauteur:0}},{bandeauBas:{...band,hauteur:2000}},{tiroirs:{position:'haut' as const,hauteurs:[-1]}},{tiroirs:{position:'bas' as const,hauteurs:[2000]},nombrePortes:1 as const},{nombreRayonsFixes:1.5},{bandeauHaut:band,dosType:'en-rainure' as const}]) expect(validateConfig({...base,...c}).length).toBeGreaterThan(0);
  });
  test('removed panels adjust back heights without subtracting vertical band heights', () => {
    expect(piece({bandeauHaut:band,dosType:'entre-montants-traverses'},'Dos').largeur).toBe(1981);
    expect(piece({bandeauHaut:band,bandeauBas:band,dosType:'toute-largeur'},'Dos').largeur).toBe(2000);
  });
  test('combined new options remain positive across both assemblies, all back poses and door modes', () => {
    for (const fixture of auditFixtures) for (const position of ['haut','bas'] as const) for (const replace of [false,true]) {
      const c={...fixture.config,nombreRayonsFixes:1,bandeauHaut:{...band,remplaceTraverse:replace,faceApplique:true},bandeauBas:{...band,remplaceTraverse:replace},tiroirs:{position,hauteurs:[100,120]}} as FurnitureConfig;
      if (c.dosType === 'en-rainure' && replace) {expect(validateConfig(c).length).toBeGreaterThan(0);continue;}
      expect(validateConfig(c)).toEqual([]);
      expect(generateMeubleItems(c).every(i => i.longueur>0 && i.largeur>0 && i.epaisseur>0)).toBe(true);
    }
  });
});

describe('Centered divider and compartment clearances', () => {
  const split={...base,montantIntermediaire:'entre-traverses' as const,rayonsCompartiments:{gauche:{mobiles:2,fixes:1},droite:{mobiles:1,fixes:2}}};
  test('centered divider subtracts one thickness and shelves stay inside each bay',()=>{
    expect(piece(split,'Montant intermédiaire')).toMatchObject({longueur:1962,largeur:350,epaisseur:19});
    expect(piece(split,'Rayon fixe gauche').longueur).toBe(371.5);
    expect(piece(split,'Rayon mobile droite').longueur).toBe(370.5);
    expect(2*371.5+3*19).toBe(800);
    expect(generateMeubleItems(split).some(i=>i.nom==='Rayon')).toBe(false);
  });
  test('full-height divider splits horizontal panels rather than intersecting them',()=>{
    const c={...split,montantIntermediaire:'toute-hauteur' as const};
    expect(piece(c,'Montant intermédiaire').longueur).toBe(2000);
    expect(piece(c,'Traverse haute')).toMatchObject({longueur:371.5,quantite:2});
    expect(piece({...c,montantsTouteHauteur:false,traversesTouteLargeur:true},'Traverse haute')).toMatchObject({longueur:390.5,quantite:2});
  });
  test('continuous backs stop divider at front face; split grooved backs engage 5 mm on each edge',()=>{
    expect(piece({...split,dosType:'en-rainure',decalageDos:10},'Montant intermédiaire').largeur).toBe(337);
    expect(piece({...split,dosType:'en-rainure',dosParCompartiment:true,decalageDos:10},'Montant intermédiaire').largeur).toBe(340);
    expect(piece({...split,dosType:'en-rainure',dosParCompartiment:true},'Dos')).toMatchObject({longueur:381.5,largeur:1972,quantite:2});
    expect(validateConfig({...split,dosType:'en-rainure',dosParCompartiment:true,epaisseurMontants:8}).length).toBeGreaterThan(0);
  });
  test('divider clears continuous bands and inset doors in depth',()=>{
    const c={...split,bandeauHaut:{hauteur:150,remplaceTraverse:true,faceApplique:true},nombrePortes:1 as const,typePorte:'interieur' as const};
    expect(piece(c,'Montant intermédiaire')).toMatchObject({longueur:1981,largeur:310});
    expect(validateConfig(c)).toEqual([]);
  });
  test('left/right drawer fronts share 2 mm center joint and reserve the taller stack for common doors',()=>{
    const c={...split,nombrePortes:1 as const,typePorte:'applique' as const,tiroirsCompartiments:{position:'haut' as const,gauche:[150,200],droite:[352]}};
    expect(piece(c,'Face tiroir gauche 1').longueur).toBe(397.5);
    expect(piece(c,'Porte (applique)').largeur).toBe(1643);
    expect(piece(c,'Montant gauche').largeur).toBe(329);
    expect(validateConfig(c)).toEqual([]);
    expect(validateConfig({...c,montantIntermediaire:undefined}).length).toBeGreaterThan(0);
  });
  test('drawer-only bays independently fill available height with actual front joints',()=>{
    const c={...split,tiroirsCompartiments:{position:'haut' as const,gauche:[150,200],droite:[352]}};
    expect(getFurnitureLayout(c).drawerRemaining).toEqual({gauche:1645,droite:1645});
    const filled={...c,tiroirsCompartiments:{position:'haut' as const,gauche:[150,1845],droite:[1997]}};
    expect(getFurnitureLayout(filled).drawerRemaining).toEqual({gauche:0,droite:0});
    expect(validateConfig(filled)).toEqual([]);
  });
  test('both divider poses and backs keep positive independent compartment pieces',()=>{
    for(const fixture of auditFixtures) for(const montantIntermediaire of ['entre-traverses','toute-hauteur'] as const) for(const dosParCompartiment of [false,true]) {
      const c={...fixture.config,montantIntermediaire,dosParCompartiment,rayonsCompartiments:split.rayonsCompartiments} as FurnitureConfig;
      expect(validateConfig(c)).toEqual([]);
      const items=generateMeubleItems(c);
      expect(items.find(i=>i.nom==='Rayon fixe droite')?.longueur).toBe(371.5);
      expect(items.find(i=>i.nom==='Montant intermédiaire')?.largeur).toBeGreaterThan(0);
    }
  });
});

describe('Split-back and decimal regression fixes', () => {
  const split: FurnitureConfig = {...base,montantIntermediaire:'entre-traverses',dosParCompartiment:true,decalageDos:10};
  test('split full-height backs meet behind the divider without a 19 mm center gap', () => {
    const c = {...split,dosType:'toute-hauteur' as const};
    expect(validateConfig(c)).toEqual([]);
    expect(piece(c,'Dos')).toMatchObject({longueur:381,largeur:2000,epaisseur:3,quantite:2});
    expect(piece(c,'Dos').longueur * 2).toBe(762);
    expect(getFurnitureLayout(c).dividerDepth).toBe(337);
    expect(piece(c,'Montant intermédiaire').largeur).toBe(337);
  });
  test('split between-panel backs fit beside a divider reaching the rear back plane', () => {
    const c = {...split,dosType:'entre-montants-traverses' as const};
    expect(validateConfig(c)).toEqual([]);
    expect(piece(c,'Dos')).toMatchObject({longueur:371.5,largeur:1962,epaisseur:3,quantite:2});
    expect(piece(c,'Dos').longueur * 2 + c.epaisseurMontants).toBe(762);
    expect(getFurnitureLayout(c).dividerDepth).toBe(340);
    expect(piece(c,'Montant intermédiaire').largeur).toBe(340);
  });
  test('split grooved backs keep their 5 mm engagement and divider depth', () => {
    const c = {...split,dosType:'en-rainure' as const};
    expect(piece(c,'Dos')).toMatchObject({longueur:381.5,largeur:1972,quantite:2});
    expect(piece(c,'Montant intermédiaire').largeur).toBe(340);
  });
  test('split full-width backs keep their half-width and divider depth', () => {
    const c = {...split,dosType:'toute-largeur' as const};
    expect(piece(c,'Dos')).toMatchObject({longueur:400,largeur:1962,quantite:2});
    expect(piece(c,'Montant intermédiaire').largeur).toBe(337);
  });
  test('split overlay backs keep their half-width and divider depth', () => {
    const c = {...split,dosType:'en-applique' as const};
    expect(piece(c,'Dos')).toMatchObject({longueur:400,largeur:2000,quantite:2});
    expect(piece(c,'Montant intermédiaire').largeur).toBe(347);
  });
  test('a common door rejects unequal 150 mm and 300 mm compartment drawer stacks', () => {
    for (const position of ['haut','bas'] as const) {
      const c = {...split,tiroirsCompartiments:{position,gauche:[150],droite:[300]}};
      expect(validateConfig({...c,nombrePortes:1})).toHaveLength(1);
      expect(validateConfig({...c,nombrePortes:2})).toHaveLength(1);
      expect(validateConfig(c)).toEqual([]);
    }
  });
  test('a common door compares drawer totals including 2 mm joints and 0.01 mm tolerance', () => {
    const c = {...split,nombrePortes:1 as const,tiroirsCompartiments:{position:'haut' as const,gauche:[150,200],droite:[352]}};
    expect(validateConfig(c)).toEqual([]);
    expect(validateConfig({...c,tiroirsCompartiments:{...c.tiroirsCompartiments,droite:[350]}})).toHaveLength(1);
    expect(validateConfig({...c,tiroirsCompartiments:{...c.tiroirsCompartiments,droite:[352.005]}})).toEqual([]);
    expect(validateConfig({...c,tiroirsCompartiments:{...c.tiroirsCompartiments,droite:[352.02]}})).toHaveLength(1);
  });
  test('decimal cabinet dimensions yield an exact 538.4 mm shelf depth', () => {
    // 580.7 - 3 mm back - 10 mm back offset - 29 mm inset-door clearance - 0.3 mm shelf setback.
    const c = {...base,largeur:600,profondeur:580.7,dosType:'entre-montants-traverses' as const,nombrePortes:1,decalageDos:10,retraitRayons:0.3} satisfies FurnitureConfig;
    expect(validateConfig(c)).toEqual([]);
    expect(piece(c,'Rayon')).toMatchObject({longueur:561,largeur:538.4});
  });
  test('generated lengths and widths round to 0.01 mm without changing quantities or thicknesses', () => {
    const c = {...base,hauteur:2000.123,largeur:600.123,profondeur:580.723};
    expect(piece(c,'Montant gauche')).toMatchObject({longueur:2000.12,largeur:580.72,epaisseur:19,quantite:1});
    expect(piece(c,'Rayon')).toMatchObject({longueur:561.12,largeur:580.72,epaisseur:19,quantite:2});
  });
});