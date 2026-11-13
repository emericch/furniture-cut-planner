import { afterEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { generateMeubleItems, validateConfig, getWarnings, type FurnitureConfig } from "./furniture";
import { detectLang, setLang, t, tPiece, tName, tMessage, formatMm, grainLabel, axisLabel } from "./i18n";

const base: FurnitureConfig = {
  hauteur: 765,
  largeur: 600,
  profondeur: 550,
  epaisseurMontants: 19,
  epaisseurTraverses: 19,
  epaisseurRayons: 19,
  epaisseurDos: 3,
  epaisseurPortes: 19,
  montantsTouteHauteur: true,
  traversesTouteLargeur: false,
  nombreRayons: 2,
  nombreRayonsFixes: 1,
  dosType: "en-applique",
  nombrePortes: 1,
  typePorte: "applique",
  retraitRayons: 0,
  decalageDos: 0,
};
const FRENCH = /[éèàçù]|\b(Montant|Traverse|Rayon|Dos|Porte|Bandeau|Face|tiroir|gauche|droite|haut|bas)\b/;

afterEach(() => setLang("fr"));

describe("langue détectée", () => {
  test("français pour un navigateur francophone, anglais pour les autres", () => {
    expect(detectLang(["fr-FR", "en"])).toBe("fr");
    expect(detectLang(["fr-CH"])).toBe("fr");
    expect(detectLang(["en-US", "fr"])).toBe("en");
    expect(detectLang(["de-CH", "fr-CH"])).toBe("en");
    expect(detectLang([])).toBe("en");
    expect(detectLang(undefined)).toBe("en");
  });
});

describe("français inchangé", () => {
  test("les textes, noms et cotes restent ceux du calcul", () => {
    expect(t("Feuille de débit")).toBe("Feuille de débit");
    expect(t("Annuler|suppression")).toBe("Annuler");
    expect(t("Supprimer {nom}", { nom: "Meuble 1" })).toBe("Supprimer Meuble 1");
    expect(tPiece("Montant gauche + Montant droit")).toBe("Montant gauche + Montant droit");
    expect(tName("Liste 1")).toBe("Liste 1");
    expect(formatMm(270.5)).toBe("270,5");
    expect(grainLabel({ nom: "x", longueur: 1, largeur: 1, epaisseur: 1, quantite: 1, filPivote: true })).toBe("l");
    expect(axisLabel("P")).toBe("P");
  });
});

describe("anglais", () => {
  test("textes d'interface, contexte et variables", () => {
    setLang("en");
    expect(t("Feuille de débit")).toBe("Cut list");
    expect(t("Annuler")).toBe("Cancel");
    expect(t("Annuler|suppression")).toBe("Undo");
    expect(t("En applique|dos")).not.toBe(t("En applique|porte"));
    expect(t("Supprimer {nom}", { nom: "Cabinet 1" })).toBe("Delete Cabinet 1");
    expect(formatMm(270.5)).toBe("270.5");
    expect(grainLabel({ nom: "x", longueur: 1, largeur: 1, epaisseur: 1, quantite: 1, filPivote: true })).toBe("W");
    expect([axisLabel("H"), axisLabel("L"), axisLabel("P")]).toEqual(["H", "W", "D"]);
  });

  test("seuls les noms par défaut de listes et de meubles sont traduits", () => {
    setLang("en");
    expect(tName("Liste 3")).toBe("List 3");
    expect(tName("Meuble 12")).toBe("Cabinet 12");
    expect(tName("Bibliothèque salon")).toBe("Bibliothèque salon");
    expect(tName("Pièces personnalisées")).toBe("Custom parts");
    expect(tName("Meuble 1 + Meuble 2")).toBe("Cabinet 1 + Cabinet 2");
  });

  test("toutes les pièces générées ont un nom anglais", () => {
    setLang("en");
    const band = { hauteur: 100, remplaceTraverse: true, faceApplique: true };
    const comp = { gauche: { mobiles: 1, fixes: 1 }, droite: { mobiles: 1, fixes: 1 } };
    const configs: FurnitureConfig[] = [
      base,
      { ...base, nombrePortes: 2, typePorte: "interieur" },
      { ...base, typePorte: "interieur" },
      { ...base, nombrePortes: 2, bandeauHaut: band, bandeauBas: band, tiroirs: undefined },
      { ...base, tiroirs: { position: "haut", hauteurs: [150, 150] } },
      { ...base, tiroirs: { position: "bas", hauteurs: [150] } },
      {
        ...base,
        nombreRayons: 0,
        nombreRayonsFixes: 0,
        montantIntermediaire: "entre-traverses",
        rayonsCompartiments: comp,
        tiroirsCompartiments: { position: "haut", gauche: [150], droite: [150] },
      },
    ];
    const names = new Set<string>();
    for (const c of configs) {
      expect(validateConfig(c)).toEqual([]);
      for (const i of generateMeubleItems(c)) names.add(i.nom);
    }
    expect(names.size).toBeGreaterThan(20);
    for (const nom of names) expect(tPiece(nom)).not.toMatch(FRENCH);
    expect(tPiece("Montant gauche + Montant droit")).toBe("Left side + Right side");
    expect(tPiece("Face tiroir 2 (haut)")).toBe("Drawer front 2 (top)");
    expect(tPiece("Face tiroir droite 1")).toBe("Drawer front, right 1");
    expect(tPiece("Tablette sur mesure")).toBe("Tablette sur mesure");
  });

  test("toutes les erreurs du calcul sont traduites", () => {
    setLang("en");
    const source = readFileSync(new URL("./furniture.ts", import.meta.url), "utf8");
    const messages = [...source.matchAll(/errors\.push\(\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
    expect(messages.length).toBeGreaterThan(30);
    for (const fr of messages) expect(tMessage(fr)).not.toBe(fr);
  });

  test("messages avec cotes : pièce traduite et point décimal", () => {
    setLang("en");
    expect(tMessage(validateConfig({ ...base, retraitRayons: 525.5 })[0])).toBe(
      "Adjustable shelf: 0.5 mm, minimum 30 mm per panel.",
    );
    expect(getWarnings({ ...base, largeur: 180.5 }).map(tMessage)).toContain(
      "Warning: Top panel is under 150 mm (142.5 mm).",
    );
    expect(tMessage("765 × 600,5 × 550mm")).toBe("765 × 600.5 × 550mm");
  });
});
