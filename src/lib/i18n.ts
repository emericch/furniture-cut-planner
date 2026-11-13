// Traduction de l'interface. Le français reste la langue source : les clés sont les textes français,
// les noms de pièces et de listes enregistrés restent en français et ne sont traduits qu'à l'affichage.
import { useSyncExternalStore } from "react";
import { formatMm as formatMmFr, type CutSheetItem } from "./furniture";

export type Lang = "fr" | "en";
export const LANG_STORAGE_KEY = "debit-rapide:langue";

// Français pour un navigateur francophone, anglais pour tous les autres.
export const detectLang = (languages: readonly string[] | undefined): Lang =>
  (languages?.[0] ?? "").toLowerCase().startsWith("fr") ? "fr" : "en";

const initialLang = (): Lang => {
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "fr" || saved === "en") return saved;
  } catch {
    /* stockage indisponible : on se fie au navigateur */
  }
  if (typeof navigator === "undefined") return "fr";
  return detectLang(navigator.languages?.length ? navigator.languages : [navigator.language]);
};

const META: Record<Lang, { title: string; description: string }> = {
  fr: {
    title: "Débit Rapide - Outil Menuiserie",
    description:
      "Feuilles de débit de meubles, calcul des panneaux et export PDF. Un outil de menuiserie créé par Emeric Chenay.",
  },
  en: {
    title: "Débit Rapide - Cabinet Cut List Tool",
    description: "Cabinet cut lists, panel sizes and PDF export. A free woodworking tool by Emeric Chenay.",
  },
};

let lang: Lang = typeof window === "undefined" ? "fr" : initialLang();
const listeners = new Set<() => void>();

const applyToDocument = () => {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;
  document.title = META[lang].title;
  document.querySelector('meta[name="description"]')?.setAttribute("content", META[lang].description);
};
applyToDocument();

export const getLang = (): Lang => lang;
export const setLang = (next: Lang) => {
  if (next === lang) return;
  lang = next;
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, next);
  } catch {
    /* stockage indisponible : le choix vaut pour la session */
  }
  applyToDocument();
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
/** Abonne un composant à la langue : il se redessine quand elle change. */
export const useLang = (): Lang => useSyncExternalStore(subscribe, getLang, getLang);

// Clés = texte français. Un suffixe « |contexte » distingue deux sens d'un même mot français.
const EN: Record<string, string> = {
  // En-tête, formulaire principal
  "Nom du meuble (optionnel)": "Cabinet name (optional)",
  "Ex: Bibliothèque salon, Placard chambre...": "E.g. Living-room bookcase, bedroom wardrobe...",
  "Mettre à jour": "Update",
  "Ajouter à la feuille": "Add to cut list",
  "Mettre à jour le meuble": "Update cabinet",
  "Ajouter à la feuille de débit": "Add to cut list",
  "Annuler la modification": "Cancel editing",
  // Feuille de débit
  "Feuille de débit": "Cut list",
  "Choisir la liste": "Choose list",
  "Actions de la liste": "List actions",
  Renommer: "Rename",
  "Nouvelle liste": "New list",
  "Supprimer la liste": "Delete list",
  "Nom de la liste": "List name",
  "Valider le nom de la liste": "Confirm list name",
  "Annuler le renommage": "Cancel renaming",
  "Supprimer « {nom} » ?": "Delete “{nom}”?",
  "Toute la liste (meubles et pièces personnalisées) sera supprimée définitivement. Cette action est irréversible.":
    "The whole list (cabinets and custom parts) will be permanently deleted. This cannot be undone.",
  Annuler: "Cancel",
  "Annuler|suppression": "Undo",
  Supprimer: "Delete",
  Imprimer: "Print",
  "Export PDF": "Export PDF",
  "Vider la feuille": "Clear list",
  "Vider la feuille de débit ?": "Clear the cut list?",
  "Tous les meubles et pièces personnalisées seront supprimés définitivement. Cette action est irréversible.":
    "All cabinets and custom parts will be permanently deleted. This cannot be undone.",
  "Ajouter une pièce": "Add a part",
  Classement: "Sort order",
  "Par meuble": "By cabinet",
  "Par taille · grande dimension décroissante": "By size · longest side first",
  "Regrouper les pièces identiques": "Group identical parts",
  "Vues du meuble en miniature": "Cabinet thumbnail views",
  "Ajouter une pièce personnalisée": "Add a custom part",
  "Fermer le formulaire": "Close form",
  "Nom de la pièce": "Part name",
  "Ex: Tablette, Tiroir...": "E.g. Shelf, drawer...",
  "Longueur (mm)": "Length (mm)",
  "Largeur (mm)": "Width (mm)",
  Épaisseur: "Thickness",
  Quantité: "Quantity",
  Ajouter: "Add",
  "Filtrer par épaisseur": "Filter by thickness",
  Toutes: "All",
  Qté: "Qty",
  Fil: "Grain",
  "Ép": "T",
  "l|largeur de pièce": "W",
  "Tout déplier": "Expand all",
  "Tout réduire": "Collapse all",
  Déplier: "Expand",
  Réduire: "Collapse",
  pièce: "part",
  pièces: "parts",
  "Enregistrer le nom": "Save name",
  "Renommer {nom}": "Rename {nom}",
  "Modifier {nom}": "Edit {nom}",
  "Supprimer {nom}": "Delete {nom}",
  "Pivoter le sens du fil de {nom}": "Rotate the grain direction of {nom}",
  'Configurez votre meuble et cliquez sur "Ajouter à la feuille de débit"':
    'Set up your cabinet and click "Add to cut list"',
  "Créé par": "Created by",
  "© {annee} Emeric Chenay. Tous droits réservés. Reproduction ou réutilisation interdite sans autorisation.":
    "© {annee} Emeric Chenay. All rights reserved. Reproduction or reuse prohibited without permission.",
  "Pièces personnalisées": "Custom parts",
  "Fil : L = fil dans la longueur · l = fil dans la largeur": "Grain: L = along the length · W = along the width",
  // Impression et PDF
  "Feuille de Débit": "Cut List",
  "FEUILLE DE DÉBIT": "CUT LIST",
  "Meuble · Pièce": "Cabinet · Part",
  Pièce: "Part",
  "L (mm)": "L (mm)",
  "l (mm)": "W (mm)",
  "e (mm)": "T (mm)",
  "Pièces par taille décroissante": "Parts by decreasing size",
  "feuille-debit": "cut-list",
  // Messages
  "Impossible d'annuler : la liste d'origine a été supprimée.": "Cannot undo: the original list has been deleted.",
  "{nom} restauré dans {liste}": "{nom} restored in {liste}",
  "{nom} créée": "{nom} created",
  "Liste supprimée": "List deleted",
  "Le nom de la liste ne peut pas être vide": "The list name cannot be empty",
  "Liste renommée en « {nom} »": "List renamed to “{nom}”",
  "{nom} mis à jour": "{nom} updated",
  "{nom} supprimé": "{nom} deleted",
  "Saisissez un nom, des dimensions positives et une quantité entière positive.":
    "Enter a name, positive dimensions and a positive whole-number quantity.",
  "Autorisez les fenêtres d’impression dans votre navigateur.": "Allow print pop-ups in your browser.",
  "Feuille de débit vidée.": "Cut list cleared.",
  "Impossible de créer le PDF. Réessayez ou utilisez Imprimer.": "Could not create the PDF. Try again or use Print.",
  // Configuration du meuble
  "Dimensions hors-tout (mm)": "Overall dimensions (mm)",
  "Structure et dos": "Carcass and back",
  "Étagères (rayons)": "Shelves",
  "Portes, bandeaux et tiroirs": "Doors, rails and drawers",
  "sans dos": "no back",
  "dos toute hauteur": "full-height back",
  "dos toute largeur": "full-width back",
  "dos en applique": "applied back",
  "dos entre montants et traverses": "inset back",
  "dos en rainure": "grooved back",
  "Montants toute hauteur": "Full-height sides",
  "Traverses toute largeur": "Full-width top and bottom",
  séparation: "divider",
  bandeau: "rail",
  "Sans porte": "No door",
  Intérieur: "Inside",
  Façades: "Fronts",
  Hauteur: "Height",
  Largeur: "Width",
  Profondeur: "Depth",
  " hors-tout (mm)": " overall (mm)",
  "épaisseur (mm)": "thickness (mm)",
  "Valeurs courantes · {label}": "Common values · {label}",
  "Épaisseurs (mm)": "Thicknesses (mm)",
  Simplifier: "Simplify",
  Personnaliser: "Customize",
  Montants: "Sides",
  Traverses: "Top/bottom",
  " et bandeaux": " and rails",
  Rayons: "Shelves",
  Caisson: "Carcass",
  " (montants, traverses, rayons)": " (sides, top, bottom, shelves)",
  Dos: "Back",
  "Assemblage du meuble": "Carcass construction",
  "Séparation centrale": "Center divider",
  "Sans montant": "None",
  "Entre la traverse haute et basse": "Between top and bottom panels",
  "Sur toute la hauteur du meuble": "Full cabinet height",
  "Pose du dos": "Back panel fitting",
  "Sans dos": "No back",
  "Toute hauteur": "Full height",
  "Toute largeur": "Full width",
  "En applique|dos": "Applied to the rear",
  "En applique|porte": "Overlay",
  "Entre montants et traverses": "Inset between panels",
  "En rainure · 5 mm": "In a groove · 5 mm",
  "Répartition du dos": "Back layout",
  "Un dos pour tout le meuble": "One back for the whole cabinet",
  "Un dos par compartiment": "One back per compartment",
  "Retrait du dos depuis l’arrière (mm)": "Back setback from the rear (mm)",
  "Côté à régler": "Side to set",
  Gauche: "Left",
  Droite: "Right",
  gauche: "left",
  droite: "right",
  haut: "top",
  bas: "bottom",
  "Étagères mobiles": "Adjustable shelves",
  "Étagères fixes": "Fixed shelves",
  "Retrait des rayons depuis l’avant (mm)": "Shelf setback from the front (mm)",
  "Largeur fixe : {fixe} mm · mobile : {mobile} mm": "Fixed shelf: {fixe} mm · adjustable: {mobile} mm",
  "Nombre de portes": "Number of doors",
  Aucune: "None",
  "1 porte": "1 door",
  "2 portes": "2 doors",
  "Pose des portes": "Door type",
  "À l’intérieur du meuble": "Inset",
  "Répartition des tiroirs": "Drawer layout",
  "Sur toute la largeur du meuble": "Full cabinet width",
  "Séparés à gauche et à droite": "Separate left and right",
  "Position des tiroirs": "Drawer position",
  "En haut": "Top",
  "En bas": "Bottom",
  "Côté des tiroirs": "Drawer side",
  "Face {n} · hauteur (mm)": "Front {n} · height (mm)",
  "Supprimer tiroir {cote} {n}": "Delete {cote} drawer {n}",
  "Ajouter un tiroir {cote}": "Add a {cote} drawer",
  "Hauteur restante commune : {mm} mm": "Shared remaining height: {mm} mm",
  "Hauteur restante {cote} : {mm} mm": "Remaining height, {cote}: {mm} mm",
  "Compléter la dernière face {cote}": "Extend the last {cote} front to fill",
  // Bandeaux et tiroirs
  "Bandeau fixe": "Fixed rail",
  Emplacement: "Position",
  "En haut · sous évier": "Top · sink base",
  "En bas · meuble hotte": "Bottom · hood cabinet",
  "En haut et en bas": "Top and bottom",
  "Hauteur bandeau {position} (mm)": "Rail height, {position} (mm)",
  "Traverse haute": "Top panel",
  "Traverse basse": "Bottom panel",
  "Remplacée par le bandeau": "Replaced by the rail",
  "Conservée avec le bandeau": "Kept with the rail",
  "Face fixe en applique · {position}": "Overlay false front · {position}",
  "Caché derrière la porte · {position}": "Hidden behind the door · {position}",
  "Meuble à tiroirs": "Drawer cabinet",
  "Avec porte": "With door",
  "Au-dessus de la porte": "Above the door",
  "Au-dessous de la porte": "Below the door",
  "Hauteur face tiroir {n} (mm)": "Drawer front {n} height (mm)",
  "Supprimer la face tiroir {n}": "Delete drawer front {n}",
  "Hauteur restante, jeux déduits : ": "Remaining height, gaps deducted: ",
  "Ajouter une face de tiroir": "Add a drawer front",
  "Compléter avec la dernière face": "Extend the last front to fill",
  "Hauteur de porte : ": "Door height: ",
  "Retirer · {label}": "Remove · {label}",
  "Ajouter · {label}": "Add · {label}",
  // Dessins et vue 3D
  "Vue de face de la structure du meuble": "Front view of the cabinet carcass",
  "Vue de face des portes et tiroirs": "Front view of the doors and drawers",
  "Bandeaux et façades": "Rails and fronts",
  "Sélectionner les bandeaux et façades": "Select rails and fronts",
  "Rayons {cote}": "Shelves, {cote}",
  "Sélectionner les rayons {cote}": "Select shelves, {cote}",
  "Portes et tiroirs": "Doors and drawers",
  "Sélectionner les portes et tiroirs": "Select doors and drawers",
  "Vue de face": "Front view",
  "Vue de côté": "Side view",
  "Vue de côté : profondeur du meuble avec dos, rayons et façades":
    "Side view: cabinet depth with back, shelves and fronts",
  "Vue de face miniature": "Front view thumbnail",
  "Vue de côté miniature": "Side view thumbnail",
  "Vue 3D du meuble : glisser pour tourner": "3D view of the cabinet: drag to rotate",
  "La vue 3D n’est pas disponible sur cet appareil. Utilisez la vue Intérieur.":
    "The 3D view is not available on this device. Use the Inside view.",
  Zoomer: "Zoom in",
  Dézoomer: "Zoom out",
  Fermer: "Close",
  Ouvrir: "Open",
  Modifier: "Edit",
  Désélectionner: "Deselect",
  "Glissez pour tourner. Touchez une pièce pour voir ses dimensions":
    "Drag to rotate. Tap a part to see its dimensions",
  ", une porte ou un tiroir pour l’ouvrir": ", or a door or drawer to open it",
  "Angle de vue": "View angle",
  Face: "Front",
  Côté: "Side",
  Dessus: "Top",
  "Tout fermer": "Close all",
  "Tout ouvrir": "Open all",
  Cotes: "Dimensions",
  "Affichage des façades": "Front display",
  Visibles: "Visible",
  Transparentes: "Transparent",
  Masquées: "Hidden",
  "Vue éclatée": "Exploded view",
  // Erreurs et avertissements du calcul
  "Les dimensions hors-tout doivent être positives.": "Overall dimensions must be positive.",
  "Le nombre de rayons doit être un entier positif ou nul.": "The number of shelves must be a whole number, zero or more.",
  "Le nombre de rayons fixes doit être un entier positif ou nul.":
    "The number of fixed shelves must be a whole number, zero or more.",
  "La hauteur du bandeau doit être positive.": "The rail height must be positive.",
  "Saisissez une hauteur positive pour chaque face de tiroir.": "Enter a positive height for each drawer front.",
  "Les bandeaux et façades dépassent la hauteur disponible.": "The rails and fronts exceed the available height.",
  "Les façades ne laissent plus de hauteur pour la porte.": "The fronts leave no height for the door.",
  "Un dos en rainure nécessite les deux traverses horizontales.":
    "A grooved back needs both the top and bottom panels.",
  "Les retraits et décalages doivent être des nombres positifs ou nuls.": "Setbacks must be zero or positive numbers.",
  "Choisissez un seul montage.": "Choose a single construction.",
  "Un dos toute largeur nécessite l'assemblage traverses toute largeur.":
    "A full-width back needs the full-width top and bottom construction.",
  "Un dos toute hauteur nécessite l'assemblage montants toute hauteur.":
    "A full-height back needs the full-height sides construction.",
  "Un bandeau caché nécessite des portes en applique.": "A hidden rail needs overlay doors.",
  "Choisissez face fixe ou bandeau caché, pas les deux.": "Choose a false front or a hidden rail, not both.",
  "Configuration de portes ou de dos non autorisée.": "This door or back configuration is not allowed.",
  "Épaisseur de panneau hors limites : 5 à 50 mm (dos : 2 à 50 mm).":
    "Panel thickness out of range: 5 to 50 mm (back: 2 to 50 mm).",
  "Les panneaux ne laissent pas une ouverture intérieure positive.": "The panels leave no interior opening.",
  "Une rainure de 5 mm exige des panneaux de plus de 5 mm.": "A 5 mm groove needs panels thicker than 5 mm.",
  "Les deux rainures opposées du montant exigent une épaisseur supérieure à 10 mm.":
    "The two opposite grooves in the divider need a thickness over 10 mm.",
  "Montage du montant intermédiaire non autorisé.": "This divider construction is not allowed.",
  "Le montant ne laisse pas assez de largeur aux compartiments.": "The divider leaves too little width for the compartments.",
  "Choisissez des tiroirs communs ou séparés, pas les deux.": "Choose full-width or separate drawers, not both.",
  "Les tiroirs séparés nécessitent un montant intermédiaire.": "Separate drawers need a center divider.",
  "Ajoutez au moins une face de tiroir, ou choisissez des tiroirs sur toute la largeur.":
    "Add at least one drawer front, or choose full-width drawers.",
  "Avec une porte, les tiroirs gauche et droite doivent avoir la même hauteur totale, joints compris.":
    "With a door, the left and right drawers must have the same total height, gaps included.",
  "Les nombres de rayons doivent être des entiers positifs ou nuls.":
    "Shelf counts must be whole numbers, zero or more.",
  "Trop de rayons pour la place restante hors tiroirs : il faut au moins 32 mm entre deux rayons.":
    "Too many shelves for the space left outside the drawers: at least 32 mm is needed between two shelves.",
  "Le dos et son décalage dépassent la profondeur disponible du caisson.":
    "The back and its setback exceed the available carcass depth.",
  "La porte intérieure dépasse la profondeur disponible ou chevauche le dos.":
    "The inset door exceeds the available depth or overlaps the back.",
  "Le bandeau est trop épais pour la profondeur disponible.": "The rail is too thick for the available depth.",
  "Une pièce aurait une dimension nulle ou négative : réduisez les retraits ou augmentez le meuble.":
    "A part would have a zero or negative dimension: reduce the setbacks or enlarge the cabinet.",
};

// Noms de pièces générés par le calcul (enregistrés en français, traduits à l'affichage).
const PIECES: Record<string, string> = {
  "Montant gauche": "Left side",
  "Montant droit": "Right side",
  "Traverse haute": "Top panel",
  "Traverse basse": "Bottom panel",
  Rayon: "Adjustable shelf",
  "Rayon fixe": "Fixed shelf",
  "Montant intermédiaire": "Divider",
  "Rayon mobile gauche": "Adjustable shelf, left",
  "Rayon mobile droite": "Adjustable shelf, right",
  "Rayon fixe gauche": "Fixed shelf, left",
  "Rayon fixe droite": "Fixed shelf, right",
  "Bandeau haut": "Top rail",
  "Bandeau bas": "Bottom rail",
  "Face fixe haut (applique)": "Top false front (overlay)",
  "Face fixe bas (applique)": "Bottom false front (overlay)",
  Dos: "Back panel",
  "Porte (applique)": "Door (overlay)",
  "Porte (intérieur)": "Door (inset)",
  "Porte gauche (applique)": "Left door (overlay)",
  "Porte gauche (intérieur)": "Left door (inset)",
  "Porte droite (applique)": "Right door (overlay)",
  "Porte droite (intérieur)": "Right door (inset)",
  "Pièces personnalisées": "Custom parts",
};

const fill = (text: string, vars?: Record<string, string | number>) =>
  vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : text;

/** Traduit un texte d'interface. La clé est le texte français (suffixe « |contexte » facultatif). */
export const t = (key: string, vars?: Record<string, string | number>): string => {
  const fr = key.split("|")[0];
  return fill(lang === "fr" ? fr : (EN[key] ?? fr), vars);
};

const dot = (s: string) => s.replace(/(\d),(\d)/g, "$1.$2");

const piece = (nom: string): string => {
  if (PIECES[nom]) return PIECES[nom];
  let m = nom.match(/^Face tiroir (\d+) \((haut|bas)\)$/);
  if (m) return `Drawer front ${m[1]} (${m[2] === "haut" ? "top" : "bottom"})`;
  m = nom.match(/^Face tiroir (gauche|droite) (\d+)$/);
  if (m) return `Drawer front, ${m[1] === "gauche" ? "left" : "right"} ${m[2]}`;
  return nom;
};

/** Nom de pièce à afficher (gère les noms regroupés « A + B »). */
export const tPiece = (nom: string): string => (lang === "fr" ? nom : nom.split(" + ").map(piece).join(" + "));

/** Nom de liste ou de meuble : seuls les noms par défaut (« Liste 1 », « Meuble 2 ») sont traduits. */
const defaultName = (nom: string): string => {
  if (nom === "Pièces personnalisées") return PIECES[nom];
  const m = nom.match(/^(Liste|Meuble) (\d+)$/);
  return m ? `${m[1] === "Liste" ? "List" : "Cabinet"} ${m[2]}` : nom;
};
export const tName = (nom: string): string => (lang === "fr" ? nom : nom.split(" + ").map(defaultName).join(" + "));

/** Messages produits par le calcul (erreurs, avertissements, cotes) : traduits à l'affichage. */
export const tMessage = (text: string): string => {
  if (lang === "fr") return text;
  if (EN[text]) return EN[text];
  let m = text.match(/^(.*) : ([\d,]+) mm, minimum (\d+) mm par panneau\.$/);
  if (m) return `${tPiece(m[1])}: ${dot(m[2])} mm, minimum ${m[3]} mm per panel.`;
  m = text.match(/^Attention : (.*) mesure moins de 150 mm \(([\d,]+) mm\)\.$/);
  if (m) return `Warning: ${tPiece(m[1])} is under 150 mm (${dot(m[2])} mm).`;
  return dot(text);
};

/** Cotes : virgule décimale en français, point en anglais. */
export const formatMm = (n: number): string => (lang === "fr" ? formatMmFr(n) : dot(formatMmFr(n)));
/** Sens du fil d'une pièce : L / l en français, L / W en anglais. */
export const grainLabel = (item: CutSheetItem): string => (item.filPivote ? (lang === "fr" ? "l" : "W") : "L");
export const dateLocale = (): string => (lang === "fr" ? "fr-FR" : "en-GB");
/** Cotes hors-tout du meuble : H / L / P en français, H / W / D en anglais. */
export const axisLabel = (axis: "H" | "L" | "P"): string =>
  lang === "fr" ? axis : { H: "H", L: "W", P: "D" }[axis];
