import { describe, expect, test } from 'bun:test';
import {
  buildMeubleSections,
  buildSizeRows,
  groupItems,
  parseSheet,
  pivotAt,
  pivotItem,
  pivotMatching,
  reapplyPivots,
  serializeSheet,
  CUSTOM_SECTION_ID,
  type SheetState,
} from './sheet';
import { generateMeubleItems, validateConfig, type CutSheetItem, type FurnitureConfig, type MeubleGroup } from './furniture';

const baseConfig: FurnitureConfig = {
  hauteur: 2000,
  largeur: 800,
  profondeur: 350,
  epaisseurMontants: 19,
  epaisseurTraverses: 19,
  epaisseurRayons: 19,
  epaisseurDos: 3,
  epaisseurPortes: 19,
  montantsTouteHauteur: true,
  traversesTouteLargeur: false,
  nombreRayons: 2,
  nombreRayonsFixes: 0,
  dosType: 'aucun',
  nombrePortes: 0,
  typePorte: 'interieur',
  retraitRayons: 0,
  decalageDos: 0,
};

const makeGroup = (id: string, nom: string, config: FurnitureConfig = baseConfig): MeubleGroup => ({
  id,
  nom,
  config,
  items: generateMeubleItems(config),
  dateAjout: new Date('2026-10-26T10:00:00.000Z'),
});

const custom = (nom: string, longueur: number, largeur: number, epaisseur = 19, quantite = 1): CutSheetItem =>
  ({ nom, longueur, largeur, epaisseur, quantite });

describe('pivotement du sens du fil', () => {
  test('pivotItem échange longueur et largeur et marque filPivote', () => {
    const pivoted = pivotItem(custom('Porte', 1998, 798));
    expect(pivoted.longueur).toBe(798);
    expect(pivoted.largeur).toBe(1998);
    expect(pivoted.filPivote).toBe(true);
    expect(pivotItem(pivoted).filPivote).toBe(false);
  });

  test('pivotAt ne pivote que la pièce visée', () => {
    const items = [custom('A', 100, 50), custom('B', 100, 50)];
    const result = pivotAt(items, 1);
    expect(result[0].longueur).toBe(100);
    expect(result[1].longueur).toBe(50);
  });

  test('pivotMatching pivote toutes les pièces de mêmes dimensions', () => {
    const items = [custom('A', 100, 50), custom('B', 100, 50), custom('C', 200, 50)];
    const result = pivotMatching(items, items[0]);
    expect(result[0].longueur).toBe(50);
    expect(result[1].longueur).toBe(50);
    expect(result[2].longueur).toBe(200);
  });

  test('reapplyPivots réapplique le pivotement aux pièces de même nom', () => {
    const oldItems = [pivotItem(custom('Porte', 1998, 798)), custom('Rayon', 762, 350)];
    const newItems = [custom('Porte', 1998, 798), custom('Rayon', 762, 350)];
    const result = reapplyPivots(oldItems, newItems);
    expect(result[0].longueur).toBe(798);
    expect(result[0].filPivote).toBe(true);
    expect(result[1].longueur).toBe(762);
    expect(result[1].filPivote).toBeUndefined();
  });
});

describe('regroupement des pièces identiques', () => {
  test('groupItems fusionne mêmes dimensions, additionne les quantités et joint les noms', () => {
    const items = [custom('Montant gauche', 2000, 350), custom('Montant droit', 2000, 350), custom('Rayon', 762, 350)];
    const merged = groupItems(items);
    expect(merged).toHaveLength(2);
    expect(merged[0].nom).toBe('Montant gauche + Montant droit');
    expect(merged[0].quantite).toBe(2);
    expect(merged[1].nom).toBe('Rayon');
  });

  test('groupItems ne répète pas un nom identique', () => {
    const merged = groupItems([custom('Rayon', 762, 350), custom('Rayon', 762, 350)]);
    expect(merged).toHaveLength(1);
    expect(merged[0].nom).toBe('Rayon');
    expect(merged[0].quantite).toBe(2);
  });

  test('groupItems distingue les épaisseurs différentes', () => {
    const merged = groupItems([custom('A', 100, 50, 19), custom('B', 100, 50, 16)]);
    expect(merged).toHaveLength(2);
  });

  test('classement par meuble : regroupement à l’intérieur de chaque meuble et des pièces personnalisées', () => {
    const groups = [makeGroup('m1', 'Meuble 1'), makeGroup('m2', 'Meuble 2')];
    const customs = [custom('Tablette', 500, 300), custom('Tablette', 500, 300)];
    const sections = buildMeubleSections(groups, customs, true);
    expect(sections).toHaveLength(3);
    const montants = sections[0].rows.find(r => r.item.nom.includes('Montant'));
    expect(montants?.item.quantite).toBe(2);
    expect(montants?.item.nom).toContain(' + ');
    const customSection = sections[2];
    expect(customSection.id).toBe(CUSTOM_SECTION_ID);
    expect(customSection.rows).toHaveLength(1);
    expect(customSection.rows[0].item.quantite).toBe(2);
  });

  test('classement par taille : regroupement tous meubles confondus, étiquettes jointes', () => {
    const groups = [makeGroup('m1', 'Cuisine'), makeGroup('m2', 'Salon')];
    const rows = buildSizeRows(groups, [], true);
    const montants = rows.find(r => r.item.nom.includes('Montant'));
    expect(montants?.item.quantite).toBe(4);
    expect(montants?.meuble).toBe('Cuisine + Salon');
    expect(montants?.index).toBe(-1);
  });

  test('classement par taille sans regroupement : une ligne par pièce, tri décroissant', () => {
    const groups = [makeGroup('m1', 'Cuisine')];
    const rows = buildSizeRows(groups, [], false);
    expect(rows).toHaveLength(groups[0].items.length);
    for (let i = 1; i < rows.length; i++) {
      const prev = Math.max(rows[i - 1].item.longueur, rows[i - 1].item.largeur);
      const curr = Math.max(rows[i].item.longueur, rows[i].item.largeur);
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });

  test('les deux classements conservent le même total de pièces (écran, impression et PDF identiques)', () => {
    const groups = [makeGroup('m1', 'Cuisine'), makeGroup('m2', 'Salon')];
    const customs = [custom('Tablette', 500, 300, 19, 3)];
    for (const grouped of [false, true]) {
      const sectionTotal = buildMeubleSections(groups, customs, grouped)
        .reduce((sum, s) => sum + s.rows.reduce((n, r) => n + r.item.quantite, 0), 0);
      const sizeTotal = buildSizeRows(groups, customs, grouped)
        .reduce((sum, r) => sum + r.item.quantite, 0);
      const expected = groups.reduce((sum, g) => sum + g.items.reduce((n, i) => n + i.quantite, 0), 0) + 3;
      expect(sectionTotal).toBe(expected);
      expect(sizeTotal).toBe(expected);
    }
  });
});

describe('sauvegarde locale', () => {
  const state: SheetState = {
    meubleGroups: [makeGroup('m1', 'Cuisine')],
    customItems: [custom('Tablette', 500, 300)],
    meubleCounter: 3,
    order: 'taille',
    groupIdentical: true,
    config: baseConfig,
    meubleNom: 'En cours',
  };

  test('serializeSheet puis parseSheet restaure tout, dates comprises', () => {
    const restored = parseSheet(serializeSheet(state));
    expect(restored).not.toBeNull();
    expect(restored!.meubleGroups).toHaveLength(1);
    expect(restored!.meubleGroups[0].nom).toBe('Cuisine');
    expect(restored!.meubleGroups[0].dateAjout).toBeInstanceOf(Date);
    expect(restored!.meubleGroups[0].dateAjout.toISOString()).toBe('2026-10-26T10:00:00.000Z');
    expect(restored!.customItems).toHaveLength(1);
    expect(restored!.meubleCounter).toBe(3);
    expect(restored!.order).toBe('taille');
    expect(restored!.groupIdentical).toBe(true);
    expect(restored!.meubleNom).toBe('En cours');
    expect(restored!.config.hauteur).toBe(2000);
  });

  test('données absentes ou illisibles : parseSheet renvoie null sans planter', () => {
    expect(parseSheet(null)).toBeNull();
    expect(parseSheet('')).toBeNull();
    expect(parseSheet('pas du json {')).toBeNull();
    expect(parseSheet('42')).toBeNull();
    expect(parseSheet('[1,2]')).toBeNull();
    expect(parseSheet('{"meubleGroups":"oui"}')).toBeNull();
  });

  test('config de formulaire invalide (largeur NaN sérialisée en null) : les meubles sont conservés, la config est absente', () => {
    const corrupt: SheetState = {
      ...state,
      meubleGroups: [makeGroup('m1', 'Cuisine'), makeGroup('m2', 'Salon')],
      config: { ...baseConfig, largeur: NaN },
    };
    const restored = parseSheet(serializeSheet(corrupt));
    expect(restored).not.toBeNull();
    expect(restored!.meubleGroups.map(g => g.nom)).toEqual(['Cuisine', 'Salon']);
    expect(restored!.customItems).toHaveLength(1);
    expect(restored!.config).toBeUndefined();
    expect(restored!.meubleNom).toBe('');
  });

  test('un meuble corrompu parmi 3 : les 2 autres sont conservés', () => {
    const raw = JSON.parse(serializeSheet({
      ...state,
      meubleGroups: [makeGroup('m1', 'Cuisine'), makeGroup('m2', 'Salon'), makeGroup('m3', 'Entrée')],
    }));
    raw.meubleGroups[1] = { id: 42, items: 'pas un tableau' };
    const restored = parseSheet(JSON.stringify(raw));
    expect(restored).not.toBeNull();
    expect(restored!.meubleGroups.map(g => g.nom)).toEqual(['Cuisine', 'Entrée']);
  });

  test('une pièce personnalisée corrompue : les autres sont conservées', () => {
    const raw = JSON.parse(serializeSheet({
      ...state,
      customItems: [custom('Tablette', 500, 300), custom('Tiroir', 400, 200)],
    }));
    raw.customItems.splice(1, 0, { nom: 'Sans dimensions' });
    const restored = parseSheet(JSON.stringify(raw));
    expect(restored).not.toBeNull();
    expect(restored!.customItems.map(i => i.nom)).toEqual(['Tablette', 'Tiroir']);
  });

  test('options imbriquées corrompues : le formulaire est ignoré sans perdre les meubles', () => {
    const brokenOptions = [
      { tiroirs: { position: 'haut', hauteurs: null } },
      { tiroirsCompartiments: { position: 'haut', gauche: [], droite: {} } },
      { rayonsCompartiments: { gauche: null, droite: { mobiles: 1, fixes: 0 } } },
      { bandeauHaut: { hauteur: 150, remplaceTraverse: true } },
      { epaisseurRayons: null },
    ];
    for (const options of brokenOptions) {
      const raw = JSON.parse(serializeSheet(state));
      raw.config = { ...raw.config, ...options };
      const restored = parseSheet(JSON.stringify(raw));
      expect(restored?.config).toBeUndefined();
      expect(restored?.meubleGroups.map(g => g.nom)).toEqual(['Cuisine']);
      expect(restored?.customItems).toHaveLength(1);
    }
  });

  test('un meuble aux tiroirs corrompus est ignoré seul', () => {
    const raw = JSON.parse(serializeSheet({ ...state, meubleGroups: [makeGroup('m1', 'Cuisine'), makeGroup('m2', 'Salon')] }));
    raw.meubleGroups[0].config.tiroirs = { position: 'haut', hauteurs: null };
    expect(parseSheet(JSON.stringify(raw))?.meubleGroups.map(g => g.nom)).toEqual(['Salon']);
  });

  test('une collection corrompue ne supprime pas l’autre collection', () => {
    const raw = JSON.parse(serializeSheet(state));
    expect(parseSheet(JSON.stringify({ ...raw, meubleGroups: null }))?.customItems.map(i => i.nom)).toEqual(['Tablette']);
    expect(parseSheet(JSON.stringify({ ...raw, customItems: null }))?.meubleGroups.map(g => g.nom)).toEqual(['Cuisine']);
    expect(parseSheet(JSON.stringify({ ...raw, meubleGroups: null }))?.meubleGroups).toEqual([]);
    expect(parseSheet(JSON.stringify({ ...raw, customItems: null }))?.customItems).toEqual([]);
  });

  test('dates corrompues et pièces négatives ne font pas perdre les entrées valides', () => {
    const raw = JSON.parse(serializeSheet(state));
    raw.meubleGroups[0].dateAjout = { toString: 42 };
    raw.customItems.push(custom('Invalide', -1, 300), custom('Fraction', 500, 300, 19, 1.5));
    const restored = parseSheet(JSON.stringify(raw));
    expect(restored?.meubleGroups).toHaveLength(1);
    expect(restored?.meubleGroups[0].dateAjout).toBeInstanceOf(Date);
    expect(restored?.customItems.map(i => i.nom)).toEqual(['Tablette']);
  });
});

describe('bandeau caché (correctifs F)', () => {
  test('face fixe et bandeau caché ensemble sont refusés', () => {
    const config: FurnitureConfig = {
      ...baseConfig,
      nombrePortes: 1,
      typePorte: 'applique',
      bandeauHaut: { hauteur: 150, remplaceTraverse: true, faceApplique: true, cachePorte: true },
    };
    expect(validateConfig(config)).toContain('Choisissez face fixe ou bandeau caché, pas les deux.');
  });

  test('un bandeau caché resté coché avec des portes intérieures est signalé', () => {
    const config: FurnitureConfig = {
      ...baseConfig,
      nombrePortes: 1,
      typePorte: 'interieur',
      bandeauHaut: { hauteur: 150, remplaceTraverse: true, faceApplique: false, cachePorte: true },
    };
    expect(validateConfig(config)).toContain('Un bandeau caché nécessite des portes en applique.');
  });

  test('un bandeau caché avec portes en applique reste valide', () => {
    const config: FurnitureConfig = {
      ...baseConfig,
      nombrePortes: 1,
      typePorte: 'applique',
      bandeauHaut: { hauteur: 150, remplaceTraverse: true, faceApplique: false, cachePorte: true },
    };
    expect(validateConfig(config)).toHaveLength(0);
  });
});

describe('Miniatures option persistence', () => {
  test('showThumbnails survives a save/load roundtrip and defaults to false', () => {
    const state = { meubleGroups: [], customItems: [], meubleCounter: 1, order: 'meuble' as const, groupIdentical: false, showThumbnails: true, meubleNom: '' };
    expect(parseSheet(serializeSheet(state))?.showThumbnails).toBe(true);
    const without = { ...state } as Record<string, unknown>;
    delete without.showThumbnails;
    expect(parseSheet(JSON.stringify(without))?.showThumbnails).toBe(false);
  });
});
