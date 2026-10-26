import { compareSize, formatMm, type CutSheetItem, type FurnitureConfig, type MeubleGroup } from './furniture';

export type SheetOrder = 'meuble' | 'taille';

export interface SheetState {
  meubleGroups: MeubleGroup[];
  customItems: CutSheetItem[];
  meubleCounter: number;
  order: SheetOrder;
  groupIdentical: boolean;
  config: FurnitureConfig;
  meubleNom: string;
}

export const SHEET_STORAGE_KEY = 'debit-meuble:v1';
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

const isItem = (v: unknown): v is CutSheetItem =>
  !!v && typeof v === 'object' &&
  typeof (v as CutSheetItem).nom === 'string' &&
  (['longueur', 'largeur', 'epaisseur', 'quantite'] as const).every(
    k => typeof (v as CutSheetItem)[k] === 'number' && Number.isFinite((v as CutSheetItem)[k]),
  );

const isConfig = (v: unknown): v is FurnitureConfig =>
  !!v && typeof v === 'object' &&
  (['hauteur', 'largeur', 'profondeur'] as const).every(
    k => typeof (v as FurnitureConfig)[k] === 'number' && Number.isFinite((v as FurnitureConfig)[k]),
  ) &&
  typeof (v as FurnitureConfig).montantsTouteHauteur === 'boolean' &&
  typeof (v as FurnitureConfig).traversesTouteLargeur === 'boolean';

export const parseSheet = (raw: string | null): SheetState | null => {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== 'object') return null;
    if (!Array.isArray(v.meubleGroups) || !Array.isArray(v.customItems)) return null;
    if (!v.customItems.every(isItem)) return null;
    if (!isConfig(v.config)) return null;
    const meubleGroups: MeubleGroup[] = [];
    for (const g of v.meubleGroups) {
      if (!g || typeof g.id !== 'string' || typeof g.nom !== 'string') return null;
      if (!Array.isArray(g.items) || !g.items.every(isItem)) return null;
      if (!isConfig(g.config)) return null;
      const date = new Date(g.dateAjout);
      meubleGroups.push({ ...g, dateAjout: Number.isNaN(date.getTime()) ? new Date() : date });
    }
    return {
      meubleGroups,
      customItems: v.customItems,
      meubleCounter: Number.isInteger(v.meubleCounter) && v.meubleCounter > 0 ? v.meubleCounter : 1,
      order: v.order === 'taille' ? 'taille' : 'meuble',
      groupIdentical: v.groupIdentical === true,
      config: v.config,
      meubleNom: typeof v.meubleNom === 'string' ? v.meubleNom : '',
    };
  } catch {
    return null;
  }
};
