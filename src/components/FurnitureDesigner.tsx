import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { NumberField } from "./NumberField";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { Segmented, Stepper } from "./ChoiceControls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FurnitureExtras } from "./FurnitureExtras";
import { CabinetDrawing } from "./CabinetDrawing";
import { Cabinet3D } from "./Cabinet3D";
import { Checkbox } from "@/components/ui/checkbox";
import { getFurnitureLayout, type FurnitureConfig } from "@/lib/furniture";
import { t, formatMm, useLang } from "@/lib/i18n";
interface Props {
  config: FurnitureConfig;
  onChange: (c: FurnitureConfig) => void;
}
function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  const max = Math.max(...options.map((o) => o[1].length));
  if (options.length <= 2 || (options.length === 3 && max <= 12) || max <= 4)
    return <Segmented label={label} value={value} options={options} onChange={onChange} />;
  return (
    <div className="min-w-0 space-y-2">
      <Label className="block leading-5" htmlFor={label}>
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={label}
          className="h-auto min-h-11 text-left [&>span]:line-clamp-none [&>span]:whitespace-normal [&>span]:break-words [&>span]:pr-2 [&>svg]:shrink-0"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-w-[calc(100vw-2rem)]">
          {options.map(([v, text]) => (
            <SelectItem className="whitespace-normal" key={v} value={v}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
// Épaisseur compacte : saisie libre + liste des valeurs courantes, alignée sur la ligne des dimensions.
function Thickness({
  label,
  srLabel,
  value,
  presets,
  onChange,
}: {
  label: string;
  srLabel?: string;
  value: number;
  presets: number[];
  onChange: (v: number) => void;
}) {
  const id = `Épaisseur ${label}`;
  return (
    <div className="min-w-0">
      <div className="relative space-y-2">
        <NumberField
          id={id}
          label={
            <>
              {label}
              <span className="sr-only">
                {srLabel} · {t("épaisseur (mm)")}
              </span>
            </>
          }
          labelClassName="block truncate whitespace-nowrap text-[13px] leading-5 min-[360px]:text-sm"
          className="pl-2 pr-8 min-[480px]:pl-3"
          value={value}
          min="0"
          onCommit={onChange}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t("Valeurs courantes · {label}", { label })}
              className="absolute bottom-0 right-0 flex h-10 w-8 items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[6rem]">
            {presets.map((v) => (
              <DropdownMenuItem key={v} onSelect={() => onChange(v)}>
                {v} mm
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
function Numeric({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="min-w-0 flex-1 space-y-2">
      <NumberField id={label} label={label} value={value} min="0" onCommit={onChange} />
    </div>
  );
}
export function FurnitureDesigner({ config: c, onChange }: Props) {
  const en = useLang() === "en";
  const sections = useRef<Array<HTMLElement | null>>([]);
  const [side, setSide] = useState<"gauche" | "droite">("gauche");
  const [drawerSide, setDrawerSide] = useState<"gauche" | "droite">("gauche");
  const [view, setView] = useState<"interieur" | "3d">("interieur");
  const [showFronts, setShowFronts] = useState(false);
  const sameCarcass = c.epaisseurMontants === c.epaisseurTraverses && c.epaisseurMontants === c.epaisseurRayons;
  const [customTh, setCustomTh] = useState(!sameCarcass);
  const hasFronts =
    c.nombrePortes > 0 ||
    !!c.tiroirs ||
    !!c.tiroirsCompartiments ||
    !!c.bandeauHaut?.faceApplique ||
    !!c.bandeauBas?.faceApplique;
  const l = getFurnitureLayout(c);
  const update = (v: Partial<FurnitureConfig>) => onChange({ ...c, ...v });
  const steps = [
    t("Dimensions hors-tout (mm)"),
    t("Structure et dos"),
    t("Étagères (rayons)"),
    t("Portes, bandeaux et tiroirs"),
  ];
  const selectSection = (next: number, selectedSide?: "gauche" | "droite") => {
    setOpened((o) => new Set(o).add(next));
    if (next === 2 && selectedSide) setSide(selectedSide);
    sections.current[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const [opened, setOpened] = useState<Set<number>>(new Set([0]));
  const toggleOpen = (i: number) =>
    setOpened((o) => {
      const n = new Set(o);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  const dosLabel: Record<string, string> = {
    aucun: t("sans dos"),
    "toute-hauteur": t("dos toute hauteur"),
    "toute-largeur": t("dos toute largeur"),
    "en-applique": t("dos en applique"),
    "entre-montants-traverses": t("dos entre montants et traverses"),
    "en-rainure": t("dos en rainure"),
  };
  const shelfM = c.montantIntermediaire
    ? (c.rayonsCompartiments?.gauche.mobiles ?? 0) + (c.rayonsCompartiments?.droite.mobiles ?? 0)
    : c.nombreRayons;
  const shelfF = c.montantIntermediaire
    ? (c.rayonsCompartiments?.gauche.fixes ?? 0) + (c.rayonsCompartiments?.droite.fixes ?? 0)
    : (c.nombreRayonsFixes ?? 0);
  const drawerCount =
    (c.tiroirs?.hauteurs.length ?? 0) +
    (c.tiroirsCompartiments ? c.tiroirsCompartiments.gauche.length + c.tiroirsCompartiments.droite.length : 0);
  const summaries = [
    `${formatMm(c.hauteur)} × ${formatMm(c.largeur)} × ${formatMm(c.profondeur)} · ${c.epaisseurMontants} mm`,
    `${c.montantsTouteHauteur ? t("Montants toute hauteur") : t("Traverses toute largeur")}${c.montantIntermediaire ? ` · ${t("séparation")}` : ""} · ${dosLabel[c.dosType] ?? ""}`,
    en
      ? `${shelfM} adjustable · ${shelfF} fixed`
      : `${shelfM} mobile${shelfM > 1 ? "s" : ""} · ${shelfF} fixe${shelfF > 1 ? "s" : ""}`,
    [
      c.nombrePortes === 0
        ? t("Sans porte")
        : en
          ? `${c.nombrePortes} ${c.typePorte === "applique" ? "overlay" : "inset"} door${c.nombrePortes > 1 ? "s" : ""}`
          : `${c.nombrePortes} porte${c.nombrePortes > 1 ? "s" : ""} ${c.typePorte === "applique" ? "en applique" : "à l’intérieur"}`,
      drawerCount ? `${drawerCount} ${en ? "drawer" : "tiroir"}${drawerCount > 1 ? "s" : ""}` : "",
      c.bandeauHaut || c.bandeauBas ? t("bandeau") : "",
    ]
      .filter(Boolean)
      .join(" · "),
  ];
  const head = (i: number) => (
    <button
      type="button"
      aria-expanded={opened.has(i)}
      onClick={() => toggleOpen(i)}
      className="flex w-full min-w-0 items-start gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
    >
      <ChevronDown
        className={`mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform ${opened.has(i) ? "" : "-rotate-90"}`}
      />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{steps[i]}</span>
        {!opened.has(i) && <span className="block break-words text-sm text-muted-foreground">{summaries[i]}</span>}
      </span>
    </button>
  );
  const counts = c.rayonsCompartiments?.[side] ?? { mobiles: 0, fixes: 0 };
  const drawer = c.tiroirsCompartiments;
  const setCounts = (key: "mobiles" | "fixes", n: number) =>
    update({
      rayonsCompartiments: {
        gauche: c.rayonsCompartiments?.gauche ?? { mobiles: 0, fixes: 0 },
        droite: c.rayonsCompartiments?.droite ?? { mobiles: 0, fixes: 0 },
        [side]: { ...counts, [key]: n },
      },
    });
  const setHeights = (heights: number[]) => {
    if (drawer) update({ tiroirsCompartiments: { ...drawer, [drawerSide]: heights } });
  };
  return (
    <div className="space-y-5">
      <div className="grid min-w-0 gap-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:grid-cols-1">
        <aside className="min-w-0 space-y-4 md:sticky md:top-4 md:self-start xl:static">
          <div className="flex justify-center gap-2">
            <Button
              size="sm"
              variant={view === "interieur" ? "secondary" : "outline"}
              onClick={() => setView("interieur")}
            >
              {t("Intérieur")}
            </Button>
            <Button size="sm" variant={view === "3d" ? "secondary" : "outline"} onClick={() => setView("3d")}>
              3D
            </Button>
          </div>
          {view === "3d" ? (
            <Cabinet3D config={c} onSelect={selectSection} />
          ) : (
            <>
              <div className="flex items-center justify-center gap-2">
                <Checkbox id="afficher-facades" checked={showFronts} onCheckedChange={(v) => setShowFronts(v === true)} />
                <Label htmlFor="afficher-facades" className="cursor-pointer leading-5">
                  {t("Façades")}
                </Label>
              </div>
              <CabinetDrawing config={c} view={showFronts ? "facades" : "interieur"} onSelect={selectSection} />
            </>
          )}
        </aside>
        <div className="min-w-0 space-y-6">
          <section
            ref={(el) => {
              sections.current[0] = el;
            }}
            className="scroll-mt-4 space-y-4 border-t border-border pt-4"
            aria-label={steps[0]}
          >
            {head(0)}
            {opened.has(0) && (
              <>
                <div className="grid grid-cols-3 items-end gap-2 min-[480px]:gap-3">
                  {(["hauteur", "largeur", "profondeur"] as const).map((k) => {
                    const name = k[0].toUpperCase() + k.slice(1);
                    return (
                      <div key={k} className="min-w-0 space-y-2">
                        <NumberField
                          id={`${name} hors-tout (mm)`}
                          label={
                            <>
                              {t(name)}
                              <span className="sr-only">{t(" hors-tout (mm)")}</span>
                            </>
                          }
                          labelClassName="block truncate whitespace-nowrap leading-5"
                          className="px-2 min-[480px]:px-3"
                          value={c[k]}
                          min="0"
                          onCommit={(v) => update({ [k]: v })}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium">{t("Épaisseurs (mm)")}</h3>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => {
                      if (customTh) {
                        update({ epaisseurTraverses: c.epaisseurMontants, epaisseurRayons: c.epaisseurMontants });
                      }
                      setCustomTh(!customTh);
                    }}
                  >
                    {customTh ? t("Simplifier") : t("Personnaliser")}
                  </Button>
                </div>
                <div className="grid grid-cols-3 items-end gap-2 min-[480px]:gap-3">
                  {customTh ? (
                    <>
                      <Thickness
                        label={t("Montants")}
                        value={c.epaisseurMontants}
                        presets={[16, 18, 19, 22]}
                        onChange={(v) => update({ epaisseurMontants: v })}
                      />
                      <Thickness
                        label={t("Traverses")}
                        srLabel={t(" et bandeaux")}
                        value={c.epaisseurTraverses}
                        presets={[16, 18, 19, 22]}
                        onChange={(v) => update({ epaisseurTraverses: v })}
                      />
                      <Thickness
                        label={t("Rayons")}
                        value={c.epaisseurRayons}
                        presets={[16, 18, 19, 22]}
                        onChange={(v) => update({ epaisseurRayons: v })}
                      />
                    </>
                  ) : (
                    <Thickness
                      label={t("Caisson")}
                      srLabel={t(" (montants, traverses, rayons)")}
                      value={c.epaisseurMontants}
                      presets={[16, 18, 19, 22]}
                      onChange={(v) => update({ epaisseurMontants: v, epaisseurTraverses: v, epaisseurRayons: v })}
                    />
                  )}
                  {c.dosType !== "aucun" && (
                    <Thickness
                      label={t("Dos")}
                      value={c.epaisseurDos}
                      presets={[3, 5, 8, 16, 19]}
                      onChange={(v) => update({ epaisseurDos: v })}
                    />
                  )}
                  {hasFronts && (
                    <Thickness
                      label={t("Façades")}
                      value={c.epaisseurPortes}
                      presets={[16, 18, 19, 22]}
                      onChange={(v) => update({ epaisseurPortes: v })}
                    />
                  )}
                </div>
              </>
            )}
          </section>
          <section
            ref={(el) => {
              sections.current[1] = el;
            }}
            className="scroll-mt-4 space-y-4 border-t border-border pt-4"
            aria-label={steps[1]}
          >
            {head(1)}
            {opened.has(1) && (
              <>
                <Choice
                  label={t("Assemblage du meuble")}
                  value={c.montantsTouteHauteur ? "montants" : "traverses"}
                  options={[
                    ["montants", t("Montants toute hauteur")],
                    ["traverses", t("Traverses toute largeur")],
                  ]}
                  onChange={(v) =>
                    update({ montantsTouteHauteur: v === "montants", traversesTouteLargeur: v === "traverses" })
                  }
                />
                <Choice
                  label={t("Séparation centrale")}
                  value={c.montantIntermediaire ?? "aucun"}
                  options={[
                    ["aucun", t("Sans montant")],
                    ["entre-traverses", t("Entre la traverse haute et basse")],
                    ["toute-hauteur", t("Sur toute la hauteur du meuble")],
                  ]}
                  onChange={(v) =>
                    update({
                      montantIntermediaire: v === "aucun" ? undefined : (v as "entre-traverses" | "toute-hauteur"),
                      rayonsCompartiments: c.rayonsCompartiments ?? {
                        gauche: { mobiles: c.nombreRayons, fixes: c.nombreRayonsFixes ?? 0 },
                        droite: { mobiles: 0, fixes: 0 },
                      },
                      tiroirsCompartiments: v === "aucun" ? undefined : c.tiroirsCompartiments,
                    })
                  }
                />
                <Choice
                  label={t("Pose du dos")}
                  value={c.dosType}
                  options={[
                    ["aucun", t("Sans dos")],
                    ["toute-hauteur", t("Toute hauteur")],
                    ["toute-largeur", t("Toute largeur")],
                    ["en-applique", t("En applique|dos")],
                    ["entre-montants-traverses", t("Entre montants et traverses")],
                    ["en-rainure", t("En rainure · 5 mm")],
                  ]}
                  onChange={(v) =>
                    update({
                      dosType: v as FurnitureConfig["dosType"],
                      decalageDos: v === "en-applique" ? 0 : c.decalageDos,
                    })
                  }
                />
                {c.montantIntermediaire && c.dosType !== "aucun" && (
                  <Choice
                    label={t("Répartition du dos")}
                    value={c.dosParCompartiment ? "separe" : "unique"}
                    options={[
                      ["unique", t("Un dos pour tout le meuble")],
                      ["separe", t("Un dos par compartiment")],
                    ]}
                    onChange={(v) => update({ dosParCompartiment: v === "separe" })}
                  />
                )}
                {c.dosType !== "aucun" && c.dosType !== "en-applique" && (
                  <Numeric
                    label={t("Retrait du dos depuis l’arrière (mm)")}
                    value={c.decalageDos}
                    onChange={(v) => update({ decalageDos: v })}
                  />
                )}
              </>
            )}
          </section>
          <section
            ref={(el) => {
              sections.current[2] = el;
            }}
            className="scroll-mt-4 space-y-4 border-t border-border pt-4"
            aria-label={steps[2]}
          >
            {head(2)}
            {opened.has(2) && (
              <>
                {c.montantIntermediaire && (
                  <Choice
                    label={t("Côté à régler")}
                    value={side}
                    options={[
                      ["gauche", t("Gauche")],
                      ["droite", t("Droite")],
                    ]}
                    onChange={(v) => setSide(v as "gauche" | "droite")}
                  />
                )}
                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
                  <Stepper
                    label={t("Étagères mobiles")}
                    value={c.montantIntermediaire ? counts.mobiles : c.nombreRayons}
                    onChange={(v) => (c.montantIntermediaire ? setCounts("mobiles", v) : update({ nombreRayons: v }))}
                  />
                  <Stepper
                    label={t("Étagères fixes")}
                    value={c.montantIntermediaire ? counts.fixes : (c.nombreRayonsFixes ?? 0)}
                    onChange={(v) =>
                      c.montantIntermediaire ? setCounts("fixes", v) : update({ nombreRayonsFixes: v })
                    }
                  />
                </div>
                <Numeric
                  label={t("Retrait des rayons depuis l’avant (mm)")}
                  value={c.retraitRayons}
                  onChange={(v) => update({ retraitRayons: v })}
                />
                <p className="text-sm text-muted-foreground">
                  {t("Largeur fixe : {fixe} mm · mobile : {mobile} mm", {
                    fixe: formatMm(c.montantIntermediaire ? l.bayWidth : c.largeur - 2 * c.epaisseurMontants),
                    mobile: formatMm((c.montantIntermediaire ? l.bayWidth : c.largeur - 2 * c.epaisseurMontants) - 1),
                  })}
                </p>
              </>
            )}
          </section>
          <section
            ref={(el) => {
              sections.current[3] = el;
            }}
            className="scroll-mt-4 space-y-4 border-t border-border pt-4"
            aria-label={steps[3]}
          >
            {head(3)}
            {opened.has(3) && (
              <>
                <Choice
                  label={t("Nombre de portes")}
                  value={String(c.nombrePortes)}
                  options={[
                    ["0", t("Aucune")],
                    ["1", t("1 porte")],
                    ["2", t("2 portes")],
                  ]}
                  onChange={(v) => {
                    update({
                      nombrePortes: Number(v) as 0 | 1 | 2,
                      typePorte:
                        c.nombrePortes === 0 && Number(v) > 0 && (c.tiroirs || c.tiroirsCompartiments)
                          ? "applique"
                          : c.typePorte,
                    });
                    setShowFronts(true);
                  }}
                />
                {c.nombrePortes > 0 && (
                  <Choice
                    label={t("Pose des portes")}
                    value={c.typePorte}
                    options={[
                      ["applique", t("En applique|porte")],
                      ["interieur", t("À l’intérieur du meuble")],
                    ]}
                    onChange={(v) => {
                      update({ typePorte: v as "applique" | "interieur" });
                      setShowFronts(true);
                    }}
                  />
                )}
                {c.montantIntermediaire && (
                  <Choice
                    label={t("Répartition des tiroirs")}
                    value={drawer ? "separes" : "communs"}
                    options={[
                      ["communs", t("Sur toute la largeur du meuble")],
                      ["separes", t("Séparés à gauche et à droite")],
                    ]}
                    onChange={(v) =>
                      update({
                        tiroirs: v === "separes" ? undefined : c.tiroirs,
                        tiroirsCompartiments:
                          v === "separes" ? { position: "haut", gauche: [150], droite: [150] } : undefined,
                      })
                    }
                  />
                )}
                <FurnitureExtras config={c} onChange={onChange} showDrawers={!drawer} />
                {drawer && (
                  <>
                    <Choice
                      label={t("Position des tiroirs")}
                      value={drawer.position}
                      options={[
                        ["haut", t("En haut")],
                        ["bas", t("En bas")],
                      ]}
                      onChange={(v) => update({ tiroirsCompartiments: { ...drawer, position: v as "haut" | "bas" } })}
                    />
                    <Choice
                      label={t("Côté des tiroirs")}
                      value={drawerSide}
                      options={[
                        ["gauche", t("Gauche")],
                        ["droite", t("Droite")],
                      ]}
                      onChange={(v) => setDrawerSide(v as "gauche" | "droite")}
                    />
                    {drawer[drawerSide].map((h, i) => (
                      <div key={i} className="flex items-end gap-2">
                        <Numeric
                          label={t("Face {n} · hauteur (mm)", { n: i + 1 })}
                          value={h}
                          onChange={(v) => setHeights(drawer[drawerSide].map((x, j) => (j === i ? v : x)))}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("Supprimer tiroir {cote} {n}", { cote: t(drawerSide), n: i + 1 })}
                          onClick={() => setHeights(drawer[drawerSide].filter((_, j) => j !== i))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      className="h-auto min-h-11 whitespace-normal"
                      onClick={() => setHeights([...drawer[drawerSide], 150])}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("Ajouter un tiroir {cote}", { cote: t(drawerSide) })}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      {t("Hauteur restante commune : {mm} mm", { mm: formatMm(l.frontFreeHeight) })}
                    </p>
                    <p aria-live="polite" className="text-sm text-muted-foreground">
                      {t("Hauteur restante {cote} : {mm} mm", {
                        cote: t(drawerSide),
                        mm: formatMm(l.drawerRemaining[drawerSide]),
                      })}
                    </p>
                    {c.nombrePortes === 0 && drawer[drawerSide].length > 0 && (
                      <Button
                        variant="outline"
                        className="h-auto min-h-11 whitespace-normal"
                        disabled={!(l.drawerRemaining[drawerSide] > 0)}
                        onClick={() =>
                          setHeights(
                            drawer[drawerSide].map((h, i) =>
                              i === drawer[drawerSide].length - 1 ? h + l.drawerRemaining[drawerSide] : h,
                            ),
                          )
                        }
                      >
                        {t("Compléter la dernière face {cote}", { cote: t(drawerSide) })}
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
