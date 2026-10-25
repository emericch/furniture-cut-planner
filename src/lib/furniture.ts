export interface FixedBand {
  hauteur: number;
  remplaceTraverse: boolean;
  faceApplique: boolean;
}

export interface FurnitureConfig {
  montantIntermediaire?: 'entre-traverses' | 'toute-hauteur';
  dosParCompartiment?: boolean;
  rayonsCompartiments?: { gauche: { mobiles: number; fixes: number }; droite: { mobiles: number; fixes: number } };
  tiroirsCompartiments?: { position: 'haut' | 'bas'; gauche: number[]; droite: number[] };
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
  nombreRayonsFixes?: number;
  bandeauHaut?: FixedBand;
  bandeauBas?: FixedBand;
  tiroirs?: { position: 'haut' | 'bas'; hauteurs: number[] };
  
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

export const getFurnitureLayout = (c: FurnitureConfig) => {
  const topPanel = !c.bandeauHaut?.remplaceTraverse;
  const bottomPanel = !c.bandeauBas?.remplaceTraverse;
  const topInset = topPanel ? c.epaisseurTraverses : 0;
  const bottomInset = bottomPanel ? c.epaisseurTraverses : 0;
  const topBandEnd = c.bandeauHaut ? topInset + c.bandeauHaut.hauteur : 0;
  const bottomBandEnd = c.bandeauBas ? bottomInset + c.bandeauBas.hauteur : 0;
  const overlay = (c.nombrePortes > 0 && c.typePorte === 'applique') || !!c.bandeauHaut?.faceApplique || !!c.bandeauBas?.faceApplique || !!c.tiroirs?.hauteurs.length || !!c.tiroirsCompartiments;
  const depth = c.profondeur - (overlay ? c.epaisseurPortes + 2 : 0) - (c.dosType === 'en-applique' ? c.epaisseurDos : 0);
  const stacks = c.tiroirsCompartiments ? [c.tiroirsCompartiments.gauche,c.tiroirsCompartiments.droite] : [c.tiroirs?.hauteurs ?? []];
  const drawerHeights = stacks.reduce((largest,stack) => stack.reduce((s,h) => s+h+2,0) > largest.reduce((s,h) => s+h+2,0) ? stack : largest, [] as number[]);
  const drawerSpace = drawerHeights.reduce((sum,h) => sum+h,0)
    + Math.max(0,drawerHeights.length-1)*2
    + (drawerHeights.length > 0 && c.nombrePortes > 0 ? 2 : 0);
  // A covered band shares the 2 mm joint symmetrically with the next front.
  const topOverlay = topBandEnd ? topBandEnd + (c.bandeauHaut?.faceApplique ? 1 : 2) : 1.5;
  const bottomOverlay = bottomBandEnd ? bottomBandEnd + (c.bandeauBas?.faceApplique ? 1 : 2) : 1.5;
  const position = c.tiroirsCompartiments?.position ?? c.tiroirs?.position;
  const topDrawers = position === 'haut' ? drawerSpace : 0;
  const bottomDrawers = position === 'bas' ? drawerSpace : 0;
  const doorTop = c.typePorte === 'applique' ? topOverlay + topDrawers : Math.max(topInset + 3, topBandEnd + (topBandEnd ? 3 : 0), topDrawers ? topOverlay + topDrawers : 0);
  const doorBottom = c.typePorte === 'applique' ? bottomOverlay + bottomDrawers : Math.max(bottomInset + 3, bottomBandEnd + (bottomBandEnd ? 3 : 0), bottomDrawers ? bottomOverlay + bottomDrawers : 0);
  const bayWidth = (c.largeur-3*c.epaisseurMontants)/2;
  const innerBack = c.dosType !== 'aucun' && c.dosType !== 'en-applique' ? c.epaisseurDos+c.decalageDos : 0;
  const dividerFront = Math.max(c.nombrePortes > 0 && c.typePorte === 'interieur' ? c.epaisseurPortes : 0, c.bandeauHaut || c.bandeauBas ? c.epaisseurTraverses : 0);
  return {topPanel,bottomPanel,topInset,bottomInset,topBandEnd,bottomBandEnd,depth,overlay,drawerSpace,bayWidth,dividerDepth:depth-innerBack-dividerFront,
    doorHeight: c.hauteur - doorTop - doorBottom,
    frontFreeHeight: c.hauteur - topOverlay - bottomOverlay - drawerSpace,
    openingHeight: c.hauteur - topInset - bottomInset - (c.bandeauHaut?.hauteur ?? 0) - (c.bandeauBas?.hauteur ?? 0)};
};

export const generateMeubleItems = (config: FurnitureConfig): CutSheetItem[] => {
    const items: CutSheetItem[] = [];
    
    // Calcul des profondeurs utiles (mesures totales, portes et dos compris)
    const layout = getFurnitureLayout(config);
    const profondeurBase = layout.depth;
    
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
      : config.hauteur - layout.topInset - layout.bottomInset;
    
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
    
    const splitPanels = config.montantIntermediaire === 'toute-hauteur';
    const panelLength = splitPanels ? layout.bayWidth + (config.traversesTouteLargeur ? config.epaisseurMontants : 0) : largeurTraverses;
    if (layout.topPanel) items.push({
      nom: 'Traverse haute',
      longueur: panelLength,
      largeur: profondeurTraverses,
      epaisseur: config.epaisseurTraverses,
      quantite: splitPanels ? 2 : 1
    });
    
    if (layout.bottomPanel) items.push({
      nom: 'Traverse basse',
      longueur: panelLength,
      largeur: profondeurTraverses,
      epaisseur: config.epaisseurTraverses,
      quantite: splitPanels ? 2 : 1
    });

    // Calcul des rayons
    if (!config.montantIntermediaire && config.nombreRayons > 0) {
      const largeurRayons = config.largeur - (2 * config.epaisseurMontants) - 1;
      
      items.push({
        nom: 'Rayon',
        longueur: largeurRayons,
        largeur: profondeurRayons,
        epaisseur: config.epaisseurRayons,
        quantite: config.nombreRayons
      });
    }

    if (!config.montantIntermediaire && (config.nombreRayonsFixes ?? 0) > 0) items.push({nom:'Rayon fixe',longueur:config.largeur-2*config.epaisseurMontants,largeur:profondeurRayons,epaisseur:config.epaisseurRayons,quantite:config.nombreRayonsFixes ?? 0});
    if (config.montantIntermediaire) {
      items.push({nom:'Montant intermédiaire',longueur:config.montantIntermediaire === 'toute-hauteur' ? config.hauteur : config.hauteur-layout.topInset-layout.bottomInset,largeur:layout.dividerDepth,epaisseur:config.epaisseurMontants,quantite:1});
      for (const side of ['gauche','droite'] as const) {
        const counts=config.rayonsCompartiments?.[side] ?? {mobiles:0,fixes:0};
        if (counts.mobiles > 0) items.push({nom:`Rayon mobile ${side}`,longueur:layout.bayWidth-1,largeur:profondeurRayons,epaisseur:config.epaisseurRayons,quantite:counts.mobiles});
        if (counts.fixes > 0) items.push({nom:`Rayon fixe ${side}`,longueur:layout.bayWidth,largeur:profondeurRayons,epaisseur:config.epaisseurRayons,quantite:counts.fixes});
      }
    }

    for (const [label,band,span] of [['haut',config.bandeauHaut,layout.topBandEnd],['bas',config.bandeauBas,layout.bottomBandEnd]] as const) {
      if (!band) continue;
      items.push({nom:`Bandeau ${label}`,longueur:config.largeur-2*config.epaisseurMontants,largeur:band.hauteur,epaisseur:config.epaisseurTraverses,quantite:1});
      if (band.faceApplique) items.push({nom:`Face fixe ${label} (applique)`,longueur:config.largeur-3,largeur:span-2.5,epaisseur:config.epaisseurPortes,quantite:1});
    }
    config.tiroirs?.hauteurs.forEach((height,index) => items.push({nom:`Face tiroir ${index+1} (${config.tiroirs?.position === 'haut' ? 'haut' : 'bas'})`,longueur:config.largeur-3,largeur:height,epaisseur:config.epaisseurPortes,quantite:1}));
    if (config.tiroirsCompartiments) for (const side of ['gauche','droite'] as const) config.tiroirsCompartiments[side].forEach((height,index) => items.push({nom:`Face tiroir ${side} ${index+1}`,longueur:(config.largeur-5)/2,largeur:height,epaisseur:config.epaisseurPortes,quantite:1}));

    // Calcul du dos (si présent)
    if (config.dosType !== 'aucun') {
      let hauteurDos = config.hauteur;
      let largeurDos = config.largeur;
      
      switch (config.dosType) {
        case 'toute-hauteur':
          largeurDos = config.largeur - (2 * config.epaisseurMontants);
          break;
        case 'toute-largeur':
          hauteurDos = config.hauteur - layout.topInset - layout.bottomInset;
          break;
        case 'en-applique':
          // Aucune déduction, dimensions complètes
          break;
        case 'en-rainure':
          hauteurDos = config.hauteur - layout.topInset - layout.bottomInset + 10;
          largeurDos = config.largeur - 2 * config.epaisseurMontants + 10;
          break;
        case 'entre-montants-traverses':
          hauteurDos = config.hauteur - layout.topInset - layout.bottomInset;
          largeurDos = config.largeur - (2 * config.epaisseurMontants);
          break;
      }
      
      if (config.montantIntermediaire && config.dosParCompartiment) {
        largeurDos = config.dosType === 'en-applique' || config.dosType === 'toute-largeur' ? config.largeur/2 : layout.bayWidth + (config.dosType === 'en-rainure' ? 10 : 0);
      }
      items.push({
        nom: 'Dos',
        longueur: largeurDos,
        largeur: hauteurDos,
        epaisseur: config.epaisseurDos,
        quantite: config.montantIntermediaire && config.dosParCompartiment ? 2 : 1
      });
    }

    // Calcul des portes (si présentes)
    if (config.nombrePortes > 0) {
      const jeuPeripherique = 3;
      let hauteurUtile, largeurUtile;
      
      if (config.typePorte === 'applique') {
        // Porte en applique: dimensions extérieures du meuble
        hauteurUtile = layout.doorHeight;
        largeurUtile = config.largeur - 3;
      } else {
        // Porte en intérieur: dimensions réduites par les montants/traverses
        hauteurUtile = layout.doorHeight;
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
  const layout = getFurnitureLayout(c);
  if (![c.hauteur, c.largeur, c.profondeur].every(n => Number.isFinite(n) && n > 0)) errors.push('Les dimensions hors-tout doivent être positives.');
  if (!Number.isInteger(c.nombreRayons) || c.nombreRayons < 0) errors.push('Le nombre de rayons doit être un entier positif ou nul.');
  if (!Number.isInteger(c.nombreRayonsFixes ?? 0) || (c.nombreRayonsFixes ?? 0) < 0) errors.push('Le nombre de rayons fixes doit être un entier positif ou nul.');
  for (const band of [c.bandeauHaut,c.bandeauBas]) if (band && (!Number.isFinite(band.hauteur) || band.hauteur <= 0 || typeof band.remplaceTraverse !== 'boolean' || typeof band.faceApplique !== 'boolean')) errors.push('La hauteur du bandeau doit être positive.');
  if (c.tiroirs && (!['haut','bas'].includes(c.tiroirs.position) || !c.tiroirs.hauteurs.length || c.tiroirs.hauteurs.some(h => !Number.isFinite(h) || h <= 0))) errors.push('Saisissez une hauteur positive pour chaque face de tiroir.');
  if (layout.openingHeight <= 0 || layout.frontFreeHeight < 0) errors.push('Les bandeaux et façades dépassent la hauteur disponible.');
  if (c.nombrePortes > 0 && layout.doorHeight <= 0) errors.push('Les façades ne laissent plus de hauteur pour la porte.');
  if (c.dosType === 'en-rainure' && (!layout.topPanel || !layout.bottomPanel)) errors.push('Un dos en rainure nécessite les deux traverses horizontales.');
  if (![c.retraitRayons, c.decalageDos].every(n => Number.isFinite(n) && n >= 0)) errors.push('Les retraits et décalages ne peuvent pas être négatifs.');
  if (c.montantsTouteHauteur === c.traversesTouteLargeur) errors.push('Choisissez un seul montage.');
  if (![0,1,2].includes(c.nombrePortes) || !['applique','interieur'].includes(c.typePorte) || !['aucun','toute-hauteur','toute-largeur','en-applique','entre-montants-traverses','en-rainure'].includes(c.dosType)) errors.push('Configuration de portes ou de dos non autorisée.');
  if (![8,16,19,22].includes(c.epaisseurMontants) || ![8,16,19,22].includes(c.epaisseurTraverses) || ![8,16,19,22].includes(c.epaisseurRayons) || ![3,8,16,19,22].includes(c.epaisseurDos) || ![16,19,22].includes(c.epaisseurPortes)) errors.push('Épaisseur de panneau non autorisée.');
  if (c.largeur <= 2*c.epaisseurMontants || c.hauteur <= layout.topInset + layout.bottomInset) errors.push('Les panneaux ne laissent pas une ouverture intérieure positive.');
  if (c.dosType === 'en-rainure' && Math.min(c.epaisseurMontants,c.epaisseurTraverses) <= 5) errors.push('Une rainure de 5 mm exige des panneaux de plus de 5 mm.');
  if (c.montantIntermediaire && c.dosParCompartiment && c.dosType === 'en-rainure' && c.epaisseurMontants <= 10) errors.push('Les deux rainures opposées du montant exigent une épaisseur supérieure à 10 mm.');
  if (c.montantIntermediaire && !['entre-traverses','toute-hauteur'].includes(c.montantIntermediaire)) errors.push('Montage du montant intermédiaire non autorisé.');
  if (c.montantIntermediaire && layout.bayWidth <= 1) errors.push('Le montant ne laisse pas assez de largeur aux compartiments.');
  if (c.tiroirs && c.tiroirsCompartiments) errors.push('Choisissez des tiroirs communs ou séparés, pas les deux.');
  if (c.tiroirsCompartiments && !c.montantIntermediaire) errors.push('Les tiroirs séparés nécessitent un montant intermédiaire.');
  if (c.tiroirsCompartiments && (!['haut','bas'].includes(c.tiroirsCompartiments.position) || ![...c.tiroirsCompartiments.gauche,...c.tiroirsCompartiments.droite].length || [...c.tiroirsCompartiments.gauche,...c.tiroirsCompartiments.droite].some(h => !Number.isFinite(h) || h <= 0))) errors.push('Saisissez une hauteur positive pour chaque face de tiroir.');
  const counts = c.montantIntermediaire ? [c.rayonsCompartiments?.gauche ?? {mobiles:0,fixes:0},c.rayonsCompartiments?.droite ?? {mobiles:0,fixes:0}] : [{mobiles:c.nombreRayons,fixes:c.nombreRayonsFixes ?? 0}];
  if (counts.some(v => ![v.mobiles,v.fixes].every(n => Number.isInteger(n) && n >= 0))) errors.push('Les nombres de rayons doivent être des entiers positifs ou nuls.');
  const shelfCount = Math.max(...counts.map(v => v.mobiles+v.fixes));
  if (shelfCount*c.epaisseurRayons >= layout.openingHeight && shelfCount > 0) errors.push('Les rayons ne tiennent pas dans la hauteur disponible.');
  const profondeurCaisson = layout.depth;
  const dosInterieur = c.dosType !== 'aucun' && c.dosType !== 'en-applique';
  const profondeurLibre = profondeurCaisson - (dosInterieur ? c.epaisseurDos + c.decalageDos : 0);
  if (dosInterieur && profondeurLibre <= 0) errors.push('Le dos et son décalage dépassent la profondeur disponible du caisson.');
  if (c.nombrePortes > 0 && c.typePorte === 'interieur' && c.epaisseurPortes > profondeurLibre) errors.push('La porte intérieure dépasse la profondeur disponible ou chevauche le dos.');
  if ((c.bandeauHaut || c.bandeauBas) && c.epaisseurTraverses > profondeurLibre) errors.push('Le bandeau est trop épais pour la profondeur disponible.');
  if (generateMeubleItems(c).some(i => ![i.longueur,i.largeur,i.epaisseur].every(n => Number.isFinite(n) && n > 0))) errors.push('Une pièce aurait une dimension nulle ou négative : réduisez les retraits ou augmentez le meuble.');
  return errors;
};
export const compareSize = (a: CutSheetItem, b: CutSheetItem) => Math.max(b.longueur,b.largeur)-Math.max(a.longueur,a.largeur) || Math.min(b.longueur,b.largeur)-Math.min(a.longueur,a.largeur) || b.epaisseur-a.epaisseur;
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] ?? c));
export const formatMm = (n: number) => n.toLocaleString('fr-FR', {maximumFractionDigits: 2, useGrouping: false});
