export interface FurnitureConfig {
  // Dimensions générales
  hauteur: number;
  largeur: number;
  profondeur: number;
  
  // Épaisseurs
  epaisseurMontants: number;
  epaisseurTraverses: number;
  epaisseurRayons: number;
  epaisseurDos: number;
  epaisseurPortes: number;
  
  // Configuration montants/traverses
  montantsTouteHauteur: boolean;
  traversesTouteLargeur: boolean;
  
  // Rayons
  nombreRayons: number;
  
  // Dos
  dosType: 'aucun' | 'toute-hauteur' | 'toute-largeur' | 'en-applique' | 'entre-montants-traverses' | 'en-rainure';
  
  // Portes
  nombrePortes: 0 | 1 | 2;
  typePorte: 'applique' | 'interieur';

  // Options
  retraitRayons: number;
  decalageDos: number;
}

export interface CutSheetItem {
  nom: string;
  longueur: number;
  largeur: number;
  epaisseur: number;
  quantite: number;
}

export interface MeubleGroup {
  id: string;
  nom: string;
  config: FurnitureConfig;
  items: CutSheetItem[];
  dateAjout: Date;
}

export const generateMeubleItems = (config: FurnitureConfig): CutSheetItem[] => {
    const items: CutSheetItem[] = [];
    
    // Calcul des profondeurs utiles (mesures totales, portes et dos compris)
    const hasDoorApplique = config.nombrePortes > 0 && config.typePorte === 'applique';
    const profondeurBase = 
      config.profondeur 
      - (hasDoorApplique ? config.epaisseurPortes + 2 : 0) 
      - (config.dosType === 'en-applique' ? config.epaisseurDos : 0);
    
    // Profondeur des montants (réduite si dos toute largeur)
    const profondeurMontants = profondeurBase - 
      (config.dosType === 'toute-largeur' ? config.epaisseurDos + config.decalageDos : 0);
    
    // Profondeur des traverses (réduite si dos toute hauteur)
    const profondeurTraverses = profondeurBase - 
      (config.dosType === 'toute-hauteur' ? config.epaisseurDos + config.decalageDos : 0);
    
    // Profondeur des rayons
    const profondeurRayons = 
      profondeurBase 
      - (config.dosType === 'toute-hauteur' || config.dosType === 'toute-largeur' || config.dosType === 'entre-montants-traverses' || config.dosType === 'en-rainure' ? config.epaisseurDos + config.decalageDos : 0)
      - (config.retraitRayons || 0)
      - (config.nombrePortes > 0 && config.typePorte === 'interieur' ? config.epaisseurPortes + 10 : 0);
    
    // Calcul des montants
    const hauteurMontants = config.montantsTouteHauteur 
      ? config.hauteur 
      : config.hauteur - (2 * config.epaisseurTraverses);
    
    items.push({
      nom: 'Montant gauche',
      longueur: hauteurMontants,
      largeur: profondeurMontants,
      epaisseur: config.epaisseurMontants,
      quantite: 1
    });
    
    items.push({
      nom: 'Montant droit',
      longueur: hauteurMontants,
      largeur: profondeurMontants,
      epaisseur: config.epaisseurMontants,
      quantite: 1
    });

    // Calcul des traverses
    const largeurTraverses = config.traversesTouteLargeur 
      ? config.largeur 
      : config.largeur - (2 * config.epaisseurMontants);
    
    items.push({
      nom: 'Traverse haute',
      longueur: largeurTraverses,
      largeur: profondeurTraverses,
      epaisseur: config.epaisseurTraverses,
      quantite: 1
    });
    
    items.push({
      nom: 'Traverse basse',
      longueur: largeurTraverses,
      largeur: profondeurTraverses,
      epaisseur: config.epaisseurTraverses,
      quantite: 1
    });

    // Calcul des rayons
    if (config.nombreRayons > 0) {
      const largeurRayons = config.largeur - (2 * config.epaisseurMontants);
      
      items.push({
        nom: 'Rayon',
        longueur: largeurRayons,
        largeur: profondeurRayons,
        epaisseur: config.epaisseurRayons,
        quantite: config.nombreRayons
      });
    }

    // Calcul du dos (si présent)
    if (config.dosType !== 'aucun') {
      let hauteurDos = config.hauteur;
      let largeurDos = config.largeur;
      
      switch (config.dosType) {
        case 'toute-hauteur':
          largeurDos = config.largeur - (2 * config.epaisseurMontants);
          break;
        case 'toute-largeur':
          hauteurDos = config.hauteur - (2 * config.epaisseurTraverses);
          break;
        case 'en-applique':
          // Aucune déduction, dimensions complètes
          break;
        case 'en-rainure':
          hauteurDos = config.hauteur - 2 * config.epaisseurTraverses + 20;
          largeurDos = config.largeur - 2 * config.epaisseurMontants + 20;
          break;
        case 'entre-montants-traverses':
          hauteurDos = config.hauteur - (2 * config.epaisseurTraverses);
          largeurDos = config.largeur - (2 * config.epaisseurMontants);
          break;
      }
      
      items.push({
        nom: 'Dos',
        longueur: largeurDos,
        largeur: hauteurDos,
        epaisseur: config.epaisseurDos,
        quantite: 1
      });
    }

    // Calcul des portes (si présentes)
    if (config.nombrePortes > 0) {
      const jeuPeripherique = 3;
      let hauteurUtile, largeurUtile;
      
      if (config.typePorte === 'applique') {
        // Porte en applique: dimensions extérieures du meuble
        hauteurUtile = config.hauteur - 3;
        largeurUtile = config.largeur - 3;
      } else {
        // Porte en intérieur: dimensions réduites par les montants/traverses
        hauteurUtile = config.hauteur - (2 * config.epaisseurTraverses) - (2 * jeuPeripherique);
        largeurUtile = config.largeur - (2 * config.epaisseurMontants) - (2 * jeuPeripherique);
      }
      
      // Profondeur des portes
      let profondeurPortes = config.epaisseurPortes;
      
      if (config.nombrePortes === 1) {
        items.push({
          nom: config.typePorte === 'applique' ? 'Porte (applique)' : 'Porte (intérieur)',
          longueur: largeurUtile,
          largeur: hauteurUtile,
          epaisseur: profondeurPortes,
          quantite: 1
        });
      } else if (config.nombrePortes === 2) {
        const jeuEntrePortes = 2;
        const largeurPorte = (largeurUtile - jeuEntrePortes) / 2;
        
        items.push({
          nom: config.typePorte === 'applique' ? 'Porte gauche (applique)' : 'Porte gauche (intérieur)',
          longueur: largeurPorte,
          largeur: hauteurUtile,
          epaisseur: profondeurPortes,
          quantite: 1
        });
        
        items.push({
          nom: config.typePorte === 'applique' ? 'Porte droite (applique)' : 'Porte droite (intérieur)',
          longueur: largeurPorte,
          largeur: hauteurUtile,
          epaisseur: profondeurPortes,
          quantite: 1
        });
      }
    }

    return items;
  };


export const validateConfig = (c: FurnitureConfig): string[] => {
  const errors: string[] = [];
  if (![c.hauteur, c.largeur, c.profondeur].every(n => Number.isFinite(n) && n > 0)) errors.push('Les dimensions hors-tout doivent être positives.');
  if (!Number.isInteger(c.nombreRayons) || c.nombreRayons < 0) errors.push('Le nombre de rayons doit être un entier positif ou nul.');
  if (![c.retraitRayons, c.decalageDos].every(n => Number.isFinite(n) && n >= 0)) errors.push('Les retraits et décalages ne peuvent pas être négatifs.');
  if (c.montantsTouteHauteur === c.traversesTouteLargeur) errors.push('Choisissez un seul montage.');
  if (![8,16,19,22].includes(c.epaisseurMontants) || ![8,16,19,22].includes(c.epaisseurTraverses) || ![8,16,19,22].includes(c.epaisseurRayons) || ![3,8,16,19,22].includes(c.epaisseurDos) || ![16,19,22].includes(c.epaisseurPortes)) errors.push('Épaisseur de panneau non autorisée.');
  if (c.largeur <= 2*c.epaisseurMontants || c.hauteur <= 2*c.epaisseurTraverses) errors.push('Les panneaux ne laissent pas une ouverture intérieure positive.');
  if (c.dosType === 'en-rainure' && Math.min(c.epaisseurMontants,c.epaisseurTraverses) <= 10) errors.push('Une rainure de 10 mm exige des montants et traverses de plus de 10 mm.');
  if (c.nombreRayons*c.epaisseurRayons >= c.hauteur - 2*c.epaisseurTraverses && c.nombreRayons > 0) errors.push('Les rayons ne tiennent pas dans la hauteur disponible.');
  if (generateMeubleItems(c).some(i => ![i.longueur,i.largeur,i.epaisseur].every(n => Number.isFinite(n) && n > 0))) errors.push('Une pièce aurait une dimension nulle ou négative : réduisez les retraits ou augmentez le meuble.');
  return errors;
};
export const compareSize = (a: CutSheetItem, b: CutSheetItem) => Math.max(b.longueur,b.largeur)-Math.max(a.longueur,a.largeur) || Math.min(b.longueur,b.largeur)-Math.min(a.longueur,a.largeur) || b.epaisseur-a.epaisseur;
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] ?? c));
export const formatMm = (n: number) => n.toLocaleString('fr-FR', {maximumFractionDigits: 2, useGrouping: false});
