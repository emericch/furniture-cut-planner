import { compareSize, formatMm, type CutSheetItem, type FurnitureConfig, type MeubleGroup } from './furniture';

export type SheetOrder = 'meuble' | 'taille';

export interface SheetState {
  meubleGroups: MeubleGroup[];
  customItems: CutSheetItem[];
  meubleCounter: number;
  order: SheetOrder;
  groupIdentical: boolean;
  showThumbnails?: boolean;
  config?: FurnitureConfig;
  meubleNom: string;
}

export const SHEET_STORAGE_KEY = 'debit-meuble:v1';
export const COLLECTION_STORAGE_KEY = 'debit-meuble-listes:v1';

// --- Plusieurs listes de débit ---

export interface SheetEntry {
  id: string;
  nom: string;
  state: SheetState;
}

export interface SheetCollection {
  sheets: SheetEntry[];
  activeId: string;
}

export const emptySheetState = (): SheetState => ({
  meubleGroups: [],
  customItems: [],
  meubleCounter: 1,
  order: 'meuble',
  groupIdentical: false,
  showThumbnails: false,
  meubleNom: '',
});

export const serializeCollection = (collection: SheetCollection): string =>
  JSON.stringify({
    activeId: collection.activeId,
    sheets: collection.sheets.map(s => ({ id: s.id, nom: s.nom, state: JSON.parse(serializeSheet(s.state)) })),
  });
export const CUSTOM_SECTION_ID = 'custom';
export const CUSTOM_SECTION_NAME = 'Pièces personnalisées';
export const GRAIN_LEGEND = 'L = longueur dans le sens du fil';

// --- Pivotement du sens du fil ---

export const pivotItem = (item: CutSheetItem): CutSheetItem => ({
  ...item,
  longueur: item.largeur,
  largeur: item.longueur,
  filPivote: !item.filPivote,
});

export const pivotAt = (items: CutSheetItem[], index: number): CutSheetItem[] =>
  items.map((item, i) => (i === index ? pivotItem(item) : item));

const sameDims = (a: CutSheetItem, b: CutSheetItem) =>
  a.longueur === b.longueur && a.largeur === b.largeur && a.epaisseur === b.epaisseur;

export const pivotMatching = (items: CutSheetItem[], target: CutSheetItem): CutSheetItem[] =>
  items.map(item => (sameDims(item, target) ? pivotItem(item) : item));

// Réapplique le pivotement après régénération des pièces d'un meuble modifié.
export const reapplyPivots = (oldItems: CutSheetItem[], newItems: CutSheetItem[]): CutSheetItem[] => {
  const pivotedNames = new Set(oldItems.filter(i => i.filPivote).map(i => i.nom));
  return newItems.map(item => (pivotedNames.has(item.nom) ? pivotItem(item) : item));
};

// --- Regroupement des pièces identiques ---

const joinNames = (current: string, added: string) =>
  current.split(' + ').includes(added) ? current : `${current} + ${added}`;

export const groupItems = (items: CutSheetItem[]): CutSheetItem[] => {
  const merged: CutSheetItem[] = [];
  for (const item of items) {
    const found = merged.find(m => sameDims(m, item));
    if (found) {
      found.quantite += item.quantite;
      found.nom = joinNames(found.nom, item.nom);
    } else {
      merged.push({ ...item });
    }
  }
  return merged;
};

// --- Lignes affichées (source unique pour l'écran, l'impression et le PDF) ---

export interface SectionRow {
  item: CutSheetItem;
  index: number; // -1 pour une ligne regroupée (pivotement par dimensions)
}

export interface SheetSection {
  id: string;
  nom: string;
  detail: string;
  rows: SectionRow[];
}

export interface SizeRow {
  item: CutSheetItem;
  meuble: string;
  meubleId: string;
  index: number; // -1 pour une ligne regroupée
}

export const buildMeubleSections = (
  groups: MeubleGroup[],
  customItems: CutSheetItem[],
  groupIdentical: boolean,
): SheetSection[] => {
  const sections: SheetSection[] = groups.map(g => ({
    id: g.id,
    nom: g.nom,
    detail: `${formatMm(g.config.hauteur)} × ${formatMm(g.config.largeur)} × ${formatMm(g.config.profondeur)}mm`,
    rows: (groupIdentical ? groupItems(g.items) : g.items).map((item, index) => ({
      item,
      index: groupIdentical ? -1 : index,
    })),
  }));
  if (customItems.length) {
    sections.push({
      id: CUSTOM_SECTION_ID,
      nom: CUSTOM_SECTION_NAME,
      detail: '',
      rows: (groupIdentical ? groupItems(customItems) : customItems).map((item, index) => ({
        item,
        index: groupIdentical ? -1 : index,
      })),
    });
  }
  return sections;
};

export const buildSizeRows = (
  groups: MeubleGroup[],
  customItems: CutSheetItem[],
  groupIdentical: boolean,
): SizeRow[] => {
  const flat: SizeRow[] = [
    ...groups.flatMap(g => g.items.map((item, index) => ({ item, meuble: g.nom, meubleId: g.id, index }))),
    ...customItems.map((item, index) => ({ item, meuble: CUSTOM_SECTION_NAME, meubleId: CUSTOM_SECTION_ID, index })),
  ];
  if (!groupIdentical) return flat.sort((a, b) => compareSize(a.item, b.item));
  const merged: SizeRow[] = [];
  for (const row of flat) {
    const found = merged.find(m => sameDims(m.item, row.item));
    if (found) {
      found.item.quantite += row.item.quantite;
      found.item.nom = joinNames(found.item.nom, row.item.nom);
      found.meuble = joinNames(found.meuble, row.meuble);
    } else {
      merged.push({ item: { ...row.item }, meuble: row.meuble, meubleId: row.meubleId, index: -1 });
    }
  }
  return merged.sort((a, b) => compareSize(a.item, b.item));
};

// --- Sauvegarde locale ---

export const serializeSheet = (state: SheetState): string =>
  JSON.stringify({
    ...state,
    meubleGroups: state.meubleGroups.map(g => ({
      ...g,
      dateAjout: g.dateAjout instanceof Date ? g.dateAjout.toISOString() : g.dateAjout,
    })),
  });

const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isNumberArray = (v: unknown) => Array.isArray(v) && v.every(isFiniteNumber);

const isItem = (v: unknown): v is CutSheetItem =>
  isRecord(v) && typeof v.nom === 'string' &&
  ['longueur', 'largeur', 'epaisseur'].every(k => isFiniteNumber(v[k]) && v[k] > 0) &&
  isFiniteNumber(v.quantite) && Number.isInteger(v.quantite) && v.quantite > 0 &&
  (v.filPivote === undefined || typeof v.filPivote === 'boolean');

// Check the complete stored shape before calling layout/calculation code.
// Semantic validation remains in furniture.ts; invalid drafts never discard saved furniture.
const isConfig = (v: unknown): v is FurnitureConfig => {
  if (!isRecord(v)) return false;
  if (!['hauteur', 'largeur', 'profondeur', 'epaisseurMontants', 'epaisseurTraverses',
    'epaisseurRayons', 'epaisseurDos', 'epaisseurPortes', 'nombreRayons', 'retraitRayons',
    'decalageDos'].every(k => isFiniteNumber(v[k]))) return false;
  if (typeof v.montantsTouteHauteur !== 'boolean' || typeof v.traversesTouteLargeur !== 'boolean') return false;
  if (![0, 1, 2].includes(v.nombrePortes as number) || !['applique', 'interieur'].includes(v.typePorte as string) ||
    !['aucun', 'toute-hauteur', 'toute-largeur', 'en-applique', 'entre-montants-traverses', 'en-rainure'].includes(v.dosType as string)) return false;
  if (v.nombreRayonsFixes !== undefined && !isFiniteNumber(v.nombreRayonsFixes)) return false;
  if (v.montantIntermediaire !== undefined && !['entre-traverses', 'toute-hauteur'].includes(v.montantIntermediaire as string)) return false;
  if (v.dosParCompartiment !== undefined && typeof v.dosParCompartiment !== 'boolean') return false;
  for (const band of [v.bandeauHaut, v.bandeauBas]) {
    if (band !== undefined && (!isRecord(band) || !isFiniteNumber(band.hauteur) ||
      typeof band.remplaceTraverse !== 'boolean' || typeof band.faceApplique !== 'boolean' ||
      (band.cachePorte !== undefined && typeof band.cachePorte !== 'boolean'))) return false;
  }
  if (v.tiroirs !== undefined && (!isRecord(v.tiroirs) || !['haut', 'bas'].includes(v.tiroirs.position as string) || !isNumberArray(v.tiroirs.hauteurs))) return false;
  if (v.tiroirsCompartiments !== undefined && (!isRecord(v.tiroirsCompartiments) ||
    !['haut', 'bas'].includes(v.tiroirsCompartiments.position as string) ||
    !isNumberArray(v.tiroirsCompartiments.gauche) || !isNumberArray(v.tiroirsCompartiments.droite))) return false;
  if (v.rayonsCompartiments !== undefined) {
    if (!isRecord(v.rayonsCompartiments)) return false;
    for (const side of ['gauche', 'droite']) {
      const counts = v.rayonsCompartiments[side];
      if (!isRecord(counts) || !isFiniteNumber(counts.mobiles) || !isFiniteNumber(counts.fixes)) return false;
    }
  }
  return true;
};

// Ne rejette tout que si le JSON est illisible ou n'est pas un objet :
// une entrée invalide est ignorée seule, une config de formulaire invalide est simplement absente.
export const parseSheet = (raw: string | null): SheetState | null => {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
    if (!Array.isArray(v.meubleGroups) && !Array.isArray(v.customItems)) return null;
    const meubleGroups: MeubleGroup[] = [];
    for (const g of Array.isArray(v.meubleGroups) ? v.meubleGroups : []) {
      if (!g || typeof g.id !== 'string' || typeof g.nom !== 'string') continue;
      if (!Array.isArray(g.items) || !g.items.every(isItem)) continue;
      if (!isConfig(g.config)) continue;
      const date = new Date(typeof g.dateAjout === 'string' || typeof g.dateAjout === 'number' ? g.dateAjout : NaN);
      meubleGroups.push({ ...g, dateAjout: Number.isNaN(date.getTime()) ? new Date() : date });
    }
    const config = isConfig(v.config) ? v.config : undefined;
    return {
      meubleGroups,
      customItems: Array.isArray(v.customItems) ? v.customItems.filter(isItem) : [],
      meubleCounter: Number.isInteger(v.meubleCounter) && v.meubleCounter > 0 ? v.meubleCounter : 1,
      order: v.order === 'taille' ? 'taille' : 'meuble',
      groupIdentical: v.groupIdentical === true,
      showThumbnails: v.showThumbnails === true,
      config,
      meubleNom: config && typeof v.meubleNom === 'string' ? v.meubleNom : '',
    };
  } catch {
    return null;
  }
};
