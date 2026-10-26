import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileText, Plus, X, Trash2, Printer, Download, Edit2, Check, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { generateMeubleItems, validateConfig, getWarnings, escapeHtml, formatMm, type FurnitureConfig, type CutSheetItem, type MeubleGroup } from '@/lib/furniture';
import { buildMeubleSections, buildSizeRows, parseSheet, pivotAt, pivotMatching, reapplyPivots, serializeSheet, CUSTOM_SECTION_ID, CUSTOM_SECTION_NAME, GRAIN_LEGEND, SHEET_STORAGE_KEY, type SheetOrder } from '@/lib/sheet';
import logo from '@/assets/ours-logo.png.asset.json';
import { toast } from 'sonner';
export type { FurnitureConfig } from '@/lib/furniture';
import { FurnitureDesigner } from './FurnitureDesigner';
import { NumberField } from './NumberField';
import { CabinetThumbnail } from './CabinetDrawing';
import { getThumbnailViews, thumbnailSvgMarkup } from '@/lib/cabinet-drawing';

const defaultConfig: FurnitureConfig = {
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
  decalageDos: 0
};

const loadSavedSheet = () => {
  try {
    return parseSheet(window.localStorage.getItem(SHEET_STORAGE_KEY));
  } catch {
    return null;
  }
};

const FurnitureCalculator: React.FC = () => {
  const [saved] = useState(loadSavedSheet);
  const [config, setConfig] = useState<FurnitureConfig>(saved?.config ?? defaultConfig);
  const [meubleGroups, setMeubleGroups] = useState<MeubleGroup[]>(saved?.meubleGroups ?? []);
  const [customItems, setCustomItems] = useState<CutSheetItem[]>(saved?.customItems ?? []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<CutSheetItem>>({
    nom: '',
    longueur: 0,
    largeur: 0,
    epaisseur: 19,
    quantite: 1
  });
  const [meubleCounter, setMeubleCounter] = useState(saved?.meubleCounter ?? 1);
  const [meubleNom, setMeubleNom] = useState(saved?.meubleNom ?? '');
  const [editingMeubleId, setEditingMeubleId] = useState<string | null>(null);
  const [editingNom, setEditingNom] = useState('');
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [formBackup, setFormBackup] = useState<{ config: FurnitureConfig; meubleNom: string } | null>(null);

  const [order, setOrder] = useState<SheetOrder>(saved?.order ?? 'meuble');
  const [groupIdentical, setGroupIdentical] = useState(saved?.groupIdentical ?? false);
  const [showThumbnails, setShowThumbnails] = useState(saved?.showThumbnails ?? false);

  useEffect(() => {
    try {
      window.localStorage.setItem(SHEET_STORAGE_KEY, serializeSheet({ meubleGroups, customItems, meubleCounter, order, groupIdentical, showThumbnails, config: formBackup?.config ?? config, meubleNom: formBackup?.meubleNom ?? meubleNom }));
    } catch { /* stockage indisponible : la feuille reste en mémoire */ }
  }, [meubleGroups, customItems, meubleCounter, order, groupIdentical, showThumbnails, config, meubleNom, formBackup]);

  const validationErrors = validateConfig(config);
  const sections = buildMeubleSections(meubleGroups, customItems, groupIdentical);
  const sizeRows = buildSizeRows(meubleGroups, customItems, groupIdentical);

  const epaisseurs = [8, 16, 19, 22];
  const epaisseursDos = [3, 8, 16, 19, 22];

  const restoreFormBackup = () => {
    if (formBackup) {
      setConfig(formBackup.config);
      setMeubleNom(formBackup.meubleNom);
    } else {
      setConfig(defaultConfig);
      setMeubleNom('');
    }
    setFormBackup(null);
  };

  const cancelEditMeuble = () => {
    setEditingConfigId(null);
    restoreFormBackup();
  };

  const addMeubleToSheet = () => {
    if (validationErrors.length) { toast.error(validationErrors[0]); return; }
    const items = generateMeubleItems(config);
    if (editingConfigId) {
      const existing = meubleGroups.find(g => g.id === editingConfigId);
      if (!existing) { cancelEditMeuble(); return; }
      const nomMeuble = meubleNom.trim() || existing.nom;
      setMeubleGroups(meubleGroups.map(g => g.id === editingConfigId
        ? { ...g, nom: nomMeuble, config: { ...config }, items: reapplyPivots(g.items, items) }
        : g));
      toast.success(`${nomMeuble} mis à jour`);
      setEditingConfigId(null);
      restoreFormBackup();
      return;
    }
    const nomMeuble = meubleNom.trim() || `Meuble ${meubleCounter}`;
    const newMeuble: MeubleGroup = {
      id: crypto.randomUUID(),
      nom: nomMeuble,
      config: { ...config },
      items: items,
      dateAjout: new Date()
    };

    setMeubleGroups([...meubleGroups, newMeuble]);
    setMeubleCounter(meubleCounter + 1);
    setMeubleNom('');
  };

  const startEditMeubleConfig = (groupe: MeubleGroup) => {
    if (!editingConfigId) setFormBackup({ config, meubleNom });
    setEditingConfigId(groupe.id);
    setConfig({ ...groupe.config });
    setMeubleNom(groupe.nom);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditingMeuble = (meubleId: string, currentNom: string) => {
    setEditingMeubleId(meubleId);
    setEditingNom(currentNom);
  };

  const saveEditedMeubleName = () => {
    if (!editingNom.trim()) { cancelEditingMeuble(); return; }
    if (editingMeubleId && editingNom.trim()) {
      setMeubleGroups(meubleGroups.map(groupe =>
        groupe.id === editingMeubleId
          ? { ...groupe, nom: editingNom.trim() }
          : groupe
      ));
      setEditingMeubleId(null);
      setEditingNom('');
    }
  };

  const cancelEditingMeuble = () => {
    setEditingMeubleId(null);
    setEditingNom('');
  };

  const removeMeubleGroup = (meubleId: string) => {
    const index = meubleGroups.findIndex(g => g.id === meubleId);
    const removed = meubleGroups[index];
    if (!removed) return;
    setMeubleGroups(meubleGroups.filter(group => group.id !== meubleId));
    if (editingConfigId === meubleId) cancelEditMeuble();
    toast(`${removed.nom} supprimé`, {
      duration: 6000,
      action: {
        label: 'Annuler',
        onClick: () => setMeubleGroups(current => {
          if (current.some(g => g.id === removed.id)) return current;
          const next = [...current];
          next.splice(Math.min(index, next.length), 0, removed);
          return next;
        })
      }
    });
  };

  const addCustomItem = () => {
    if (newItem.nom?.trim() && [newItem.longueur, newItem.largeur, newItem.epaisseur].every(n => typeof n === 'number' && Number.isFinite(n) && n > 0) && typeof newItem.quantite === 'number' && Number.isInteger(newItem.quantite) && newItem.quantite > 0 && newItem.longueur && newItem.largeur && newItem.epaisseur) {
      const item: CutSheetItem = {
        nom: newItem.nom.trim(),
        longueur: newItem.longueur,
        largeur: newItem.largeur,
        epaisseur: newItem.epaisseur,
        quantite: newItem.quantite
      };
      setCustomItems([...customItems, item]);
      setNewItem({
        nom: '',
        longueur: 0,
        largeur: 0,
        epaisseur: 19,
        quantite: 1
      });
      setShowAddForm(false);
    } else { toast.error("Saisissez un nom, des dimensions positives et une quantité entière positive."); }
  };

  const removeCustomItem = (index: number) => {
    const removed = customItems[index];
    if (!removed) return;
    setCustomItems(customItems.filter((_, i) => i !== index));
    toast(`${removed.nom} supprimé`, {
      duration: 6000,
      action: {
        label: 'Annuler',
        onClick: () => setCustomItems(current => {
          const next = [...current];
          next.splice(Math.min(index, next.length), 0, removed);
          return next;
        })
      }
    });
  };

  const pivotSectionRow = (sectionId: string, row: { item: CutSheetItem; index: number }) => {
    const apply = (items: CutSheetItem[]) => row.index >= 0 ? pivotAt(items, row.index) : pivotMatching(items, row.item);
    if (sectionId === CUSTOM_SECTION_ID) setCustomItems(apply);
    else setMeubleGroups(groups => groups.map(g => g.id === sectionId ? { ...g, items: apply(g.items) } : g));
  };

  const pivotSizeRow = (row: { item: CutSheetItem; meubleId: string; index: number }) => {
    if (row.index >= 0) {
      if (row.meubleId === CUSTOM_SECTION_ID) setCustomItems(items => pivotAt(items, row.index));
      else setMeubleGroups(groups => groups.map(g => g.id === row.meubleId ? { ...g, items: pivotAt(g.items, row.index) } : g));
    } else {
      setMeubleGroups(groups => groups.map(g => ({ ...g, items: pivotMatching(g.items, row.item) })));
      setCustomItems(items => pivotMatching(items, row.item));
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(`
        <html lang="fr">
          <head>
            <title>Feuille de Débit</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                color: #000;
                font-size: 12px;
                line-height: 1.4;
              }
              .print-header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #bbb;
                padding-bottom: 10px;
              }
              .print-header h1 {
                font-size: 18px;
                font-weight: bold;
                margin: 0 0 5px 0;
              }
              .print-header p {
                font-size: 11px;
                margin: 0;
              }
              .print-section {
                margin-bottom: 15px;
                page-break-inside: avoid;
              }
              .print-section:not(:first-child) {
                border-top: 1px solid #bbb;
                padding-top: 6px;
              }
              .print-section-title {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 6px;
                border-bottom: 1px solid #bbb;
                padding-bottom: 6px;
                line-height: 1.3;
                overflow-wrap: anywhere;
                word-break: break-word;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
                margin-bottom: 10px;
              }
              th, td {
                border-bottom: 1px solid #d0d0d0;
                padding: 4px 5px;
                line-height: 1.4;
                vertical-align: middle;
              }
              th {
                border-bottom: 1px solid #bbb;
                font-weight: bold;
              }
              th:first-child, td:first-child {
                text-align: left;
              }
              th:not(:first-child), td:not(:first-child) {
                text-align: center;
              }
              @media print {
                @page {
                  margin: 15mm;
                }
                body {
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1>FEUILLE DE DÉBIT</h1>
              <p>${new Date().toLocaleDateString('fr-FR')}</p>
              <p>${GRAIN_LEGEND}</p>
            </div>
            ${generatePrintContent()}
            <div class="print-footer" style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #bbb; text-align: center; font-size: 10px; color: #666;">
              <img src="/favicon.png" width="24" height="24" alt="" /><p style="margin: 2px 0;">Créé par <strong>Emeric Chenay</strong> • 2026</p>
              <p style="margin: 2px 0;">superdebitcoupe@proton.me</p>
            </div>
          </body>
        </html>
      `);
      printWindow.onafterprint = () => printWindow.close();
      let requested = false;
      const requestPrint = () => { if (!requested && !printWindow.closed) { requested = true; printWindow.print(); } };
      printWindow.onload = requestPrint;
      printWindow.document.close();
      setTimeout(requestPrint, 500);
    } else { toast.error('Autorisez les fenêtres d’impression dans votre navigateur.'); }
  };

  const generatePrintContent = () => {
    if (order === 'taille') return `<table><thead><tr><th>Meuble · Pièce</th><th>Qté</th><th>L (mm)</th><th>l (mm)</th><th>e (mm)</th></tr></thead><tbody>${sizeRows.map(({ item, meuble }) => `<tr><td>${escapeHtml(meuble)} · ${escapeHtml(item.nom)}</td><td>${item.quantite}</td><td>${formatMm(item.longueur)}</td><td>${formatMm(item.largeur)}</td><td>${item.epaisseur}</td></tr>`).join('')}</tbody></table>`;
    return sections.map((section, index) => {
      const groupe = meubleGroups.find(g => g.id === section.id);
      return `
      <div class="print-section" style="margin-bottom: 12px; ${index > 0 ? 'border-top: 1px solid #bbb; padding-top: 6px;' : ''}">
        <div class="print-section-title" style="font-weight: bold; font-size: 14px; margin-bottom: 6px; border-bottom: 1px solid #bbb; padding-bottom: 6px; line-height: 1.3; overflow-wrap: anywhere; word-break: break-word;">
          ${showThumbnails && groupe ? thumbnailSvgMarkup(groupe.config, 56) : ''}${escapeHtml(section.nom)}${section.detail ? ` (${section.detail})` : ''}
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 6px;">
          <thead>
            <tr style="border-bottom: 1px solid #bbb;">
              <th style="text-align: left; padding: 4px 5px; font-weight: bold; line-height: 1.4;">Pièce</th>
              <th style="text-align: center; padding: 4px 5px; font-weight: bold; line-height: 1.4;">Qté</th>
              <th style="text-align: center; padding: 4px 5px; font-weight: bold; line-height: 1.4;">L (mm)</th>
              <th style="text-align: center; padding: 4px 5px; font-weight: bold; line-height: 1.4;">l (mm)</th>
              <th style="text-align: center; padding: 4px 5px; font-weight: bold; line-height: 1.4;">e (mm)</th>
            </tr>
          </thead>
          <tbody>
            ${section.rows.map(({ item }) => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 4px 5px; line-height: 1.4; vertical-align: middle;">${escapeHtml(item.nom)}</td>
                <td style="padding: 4px 5px; text-align: center; line-height: 1.4; vertical-align: middle;">${item.quantite}</td>
                <td style="padding: 4px 5px; text-align: center; line-height: 1.4; vertical-align: middle;">${formatMm(item.longueur)}</td>
                <td style="padding: 4px 5px; text-align: center; line-height: 1.4; vertical-align: middle;">${formatMm(item.largeur)}</td>
                <td style="padding: 4px 5px; text-align: center; line-height: 1.4; vertical-align: middle;">${item.epaisseur}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    }).join('');
  };

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const pdf = new jsPDF();
      pdf.setFontSize(16); pdf.text('FEUILLE DE DÉBIT', 14, 15);
      pdf.setFontSize(9); pdf.text(new Date().toLocaleDateString('fr-FR'), 14, 21);
      pdf.text(GRAIN_LEGEND, 14, 26);
      const pdfSections = order === 'taille'
        ? [{ title: 'Pièces par taille décroissante', config: undefined as FurnitureConfig | undefined, rows: sizeRows.map(({ item, meuble }) => [meuble + ' · ' + item.nom, item.quantite, formatMm(item.longueur), formatMm(item.largeur), item.epaisseur]) }]
        : sections.map(s => ({ title: s.detail ? s.nom + ' — ' + s.detail : s.nom, config: meubleGroups.find(g => g.id === s.id)?.config, rows: s.rows.map(({ item }) => [item.nom, item.quantite, formatMm(item.longueur), formatMm(item.largeur), item.epaisseur]) }));
      const thumbByRow = new Map<number, FurnitureConfig>();
      let rowIndex = 0;
      const body = pdfSections.flatMap(section => {
        const withThumb = showThumbnails && section.config;
        if (withThumb) thumbByRow.set(rowIndex, section.config!);
        rowIndex += 1 + section.rows.length;
        return [[{ content: section.title, colSpan: 5, styles: { fontStyle: 'bold' as const, fillColor: 255, minCellHeight: withThumb ? 24 : undefined } }], ...section.rows];
      });
      autoTable(pdf, { startY: 31, margin: { left: 14, right: 14, bottom: 24 }, head: [['Pièce', 'Qté', 'L (mm)', 'l (mm)', 'e (mm)']], body, theme: 'plain', styles: { fontSize: 9, cellPadding: 2, textColor: 0, lineColor: 210, lineWidth: 0.1, overflow: 'linebreak' }, headStyles: { fillColor: 255, textColor: 0, fontStyle: 'bold' }, rowPageBreak: 'avoid',
        didDrawCell: (data) => {
          const cfg = thumbByRow.get(data.row.index);
          if (!cfg || data.section !== 'body' || data.column.index !== 0) return;
          const { front, side, largeur, hauteur, profondeur } = getThumbnailViews(cfg);
          const H = 18; // hauteur miniature en mm
          const s = H / Math.max(1, hauteur);
          const draw = (rects: { x: number; y: number; width: number; height: number }[], w: number, x0: number) => {
            const minT = 0.5 / s;
            pdf.setDrawColor(0); pdf.setLineWidth(0.15);
            for (const r of rects) {
              const rw = Math.max(r.width, Math.min(minT, w));
              const rh = Math.max(r.height, Math.min(minT, hauteur));
              const x = Math.max(0, Math.min(r.x, w - rw));
              const y = Math.max(0, Math.min(r.y, hauteur - rh));
              pdf.rect(x0 + x * s, data.cell.y + 3 + y * s, rw * s, rh * s);
            }
            return w * s;
          };
          const totalW = (largeur + profondeur) * s + 2;
          const x0 = data.cell.x + data.cell.width - 4 - totalW;
          const wf = draw(front, largeur, x0);
          draw(side, profondeur, x0 + wf + 2);
        } });
      const page = pdf.getNumberOfPages(); pdf.setPage(page);
      pdf.setFontSize(8); pdf.text('Emeric Chenay · 2026 · superdebitcoupe@proton.me', 14, 285);
      pdf.addImage('/favicon.png', 'PNG', 183, 278, 10, 10);
      pdf.save(`feuille-debit-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch { toast.error('Impossible de créer le PDF. Réessayez ou utilisez Imprimer.'); }
  };

  const pivotButton = (item: CutSheetItem, onClick: () => void) => (
    <Button
      key="pivot"
      aria-label={`Pivoter le sens du fil de ${item.nom}`}
      title={`Pivoter le sens du fil de ${item.nom}`}
      onClick={onClick}
      size="sm"
      variant="ghost"
      className="h-11 w-11 shrink-0 p-0 text-muted-foreground"
    >
      <ArrowUpDown className="h-3 w-3" />
    </Button>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* En-tête simplifié */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-2">
            <img src={logo.url} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/app-icon-192.png'; }} alt="Logo Emeric Chenay" className="h-12 w-16 shrink-0 object-contain" />
            Débit Rapide
          </h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Configuration */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Nom du meuble */}
                <div>
                  <Label htmlFor="meuble-nom" className="text-sm">Nom du meuble (optionnel)</Label>
                  <Input
                    id="meuble-nom"
                    value={meubleNom}
                    onChange={(e) => setMeubleNom(e.target.value)}
                    placeholder="Ex: Bibliothèque salon, Placard chambre..."
                  />
                </div>
                <FurnitureDesigner config={config} onChange={setConfig} />


                {validationErrors.length > 0 && <p role="alert" className="text-sm text-destructive">{validationErrors[0]}</p>}
                {getWarnings(config).length > 0 && <div role="status" className="space-y-1">{getWarnings(config).map((warning, index) => <p key={index} className="text-sm text-muted-foreground">{warning}</p>)}</div>}
                <Button disabled={validationErrors.length > 0} onClick={addMeubleToSheet} className="w-full" size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  {editingConfigId ? 'Mettre à jour le meuble' : 'Ajouter à la feuille de débit'}
                </Button>
                {editingConfigId && (
                  <Button onClick={cancelEditMeuble} variant="outline" className="w-full">
                    Annuler la modification
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Feuille de débit */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Feuille de débit
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(meubleGroups.length > 0 || customItems.length > 0) && (
                      <>
                        <Button
                          onClick={handlePrint}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Printer className="h-3 w-3" />
                          Imprimer
                        </Button>
                        <Button
                          onClick={handleExportPDF}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Export PDF
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => setShowAddForm(true)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Ajouter une pièce
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="min-w-0">
                <div className="mb-4 max-w-xs space-y-3">
                  <div>
                    <Label htmlFor="sheet-order">Classement</Label>
                    <Select value={order} onValueChange={v => setOrder(v as SheetOrder)}>
                      <SelectTrigger id="sheet-order"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="meuble">Par meuble</SelectItem><SelectItem value="taille">Par taille · grande dimension décroissante</SelectItem></SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">{GRAIN_LEGEND}</p>
                  </div>
                  <div className="flex items-center gap-3 [&>button]:shrink-0">
                    <Checkbox id="group-identical" checked={groupIdentical} onCheckedChange={checked => setGroupIdentical(checked === true)} />
                    <Label className="block leading-5" htmlFor="group-identical">Regrouper les pièces identiques</Label>
                  </div>
                  <div className="flex items-center gap-3 [&>button]:shrink-0">
                    <Checkbox id="show-thumbnails" checked={showThumbnails} onCheckedChange={checked => setShowThumbnails(checked === true)} />
                    <Label className="block leading-5" htmlFor="show-thumbnails">Vues du meuble en miniature</Label>
                  </div>
                </div>
                {showAddForm && (
                  <Card className="mb-4 border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        Ajouter une pièce personnalisée
                        <Button
                          aria-label="Fermer le formulaire" onClick={() => setShowAddForm(false)}
                          size="sm"
                          variant="ghost"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm">Nom de la pièce</Label>
                        <Input
                          value={newItem.nom || ''}
                          onChange={(e) => setNewItem({ ...newItem, nom: e.target.value })}
                          placeholder="Ex: Tablette, Tiroir..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div>
                          <NumberField id="custom-longueur" label="Longueur (mm)" labelClassName="text-xs" value={newItem.longueur || undefined} onCommit={v => setNewItem({ ...newItem, longueur: v })} />
                        </div>
                        <div>
                          <NumberField id="custom-largeur" label="Largeur (mm)" labelClassName="text-xs" value={newItem.largeur || undefined} onCommit={v => setNewItem({ ...newItem, largeur: v })} />
                        </div>
                        <div>
                          <Label className="text-xs">Épaisseur</Label>
                          <Select
                            value={newItem.epaisseur?.toString() || '19'}
                            onValueChange={(value) => setNewItem({ ...newItem, epaisseur: Number(value) })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {epaisseursDos.map(ep => (
                                <SelectItem key={ep} value={ep.toString()}>{ep}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <NumberField id="custom-quantite" label="Quantité" labelClassName="text-xs" value={newItem.quantite} min="1" onCommit={v => setNewItem({ ...newItem, quantite: v })} />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={addCustomItem} className="flex-1">
                          Ajouter
                        </Button>
                        <Button
                          onClick={() => setShowAddForm(false)}
                          variant="outline"
                          className="flex-1"
                        >
                          Annuler
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(meubleGroups.length > 0 || customItems.length > 0) ? (
                  <div className="space-y-4">
                    {order === 'taille' && <div className="divide-y divide-border">{sizeRows.map((row, index) => <div key={index} className="flex items-center justify-between gap-2 py-3"><div className="min-w-0 flex-1"><p className="text-sm text-muted-foreground break-words">{row.meuble}</p><p className="font-medium break-words">{row.item.nom}</p><p className="text-sm">{formatMm(row.item.longueur)} × {formatMm(row.item.largeur)} × {row.item.epaisseur} mm · Qté {row.item.quantite}</p></div>{pivotButton(row.item, () => pivotSizeRow(row))}</div>)}</div>}
                    {/* Groupes de meubles */}
                    {order === 'meuble' && sections.map((section) => {
                      const groupe = meubleGroups.find(g => g.id === section.id);
                      return (
                      <Card key={section.id} className={`border-l-4 ${section.id === CUSTOM_SECTION_ID ? 'border-l-secondary' : 'border-l-primary'}`}>
                        <CardHeader className="pb-2">
                          {section.id === CUSTOM_SECTION_ID ? (
                            <CardTitle className="text-base">{CUSTOM_SECTION_NAME}</CardTitle>
                          ) : groupe && (
                            <>
                            <div className="flex items-center justify-between">
                              {editingMeubleId === groupe.id ? (
                                <div className="flex min-w-0 items-center gap-2 flex-1">
                                  <Input
                                    value={editingNom}
                                    onChange={(e) => setEditingNom(e.target.value)}
                                    className="h-8"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEditedMeubleName();
                                      if (e.key === 'Escape') cancelEditingMeuble();
                                    }}
                                    autoFocus
                                  />
                                  <Button
                                    aria-label="Enregistrer le nom" onClick={saveEditedMeubleName}
                                    size="sm"
                                    variant="ghost"
                                    className="h-11 w-11 shrink-0 p-0 text-primary"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    aria-label="Annuler le renommage" onClick={cancelEditingMeuble}
                                    size="sm"
                                    variant="ghost"
                                    className="h-11 w-11 shrink-0 p-0 text-muted-foreground"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex min-w-0 items-center gap-2 flex-1">
                                    <CardTitle className="min-w-0 break-all text-base">{groupe.nom}</CardTitle>
                                    <Button
                                      aria-label={`Renommer ${groupe.nom}`} title="Renommer"
                                      onClick={() => startEditingMeuble(groupe.id, groupe.nom)}
                                      size="sm"
                                      variant="ghost"
                                      className="h-11 w-11 shrink-0 p-0 text-muted-foreground"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      aria-label={`Modifier ${groupe.nom}`} title={`Modifier ${groupe.nom}`}
                                      onClick={() => startEditMeubleConfig(groupe)}
                                      size="sm"
                                      variant="ghost"
                                      className="h-11 w-11 shrink-0 p-0 text-muted-foreground"
                                    >
                                      <SlidersHorizontal className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <Button
                                    aria-label={`Supprimer ${groupe.nom}`} title={`Supprimer ${groupe.nom}`}
                                    onClick={() => removeMeubleGroup(groupe.id)}
                                    size="sm"
                                    variant="ghost"
                                    className="h-11 w-11 shrink-0 p-0 text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {section.detail}
                            </p>
                            {showThumbnails && <CabinetThumbnail config={groupe.config} className="mt-2" />}
                            </>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {section.rows.map((row, index) => (
                            <div key={index} className="flex justify-between items-center bg-muted/50 rounded-lg p-2">
                              <div className="flex-1">
                                <h5 className="font-medium text-sm">{row.item.nom}</h5>
                                <div className="grid grid-cols-2 gap-2 text-sm text-foreground sm:grid-cols-4">
                                  <div>L: {formatMm(row.item.longueur)}mm</div>
                                  <div>l: {formatMm(row.item.largeur)}mm</div>
                                  <div>Ép: {row.item.epaisseur}mm</div>
                                  <div>Qté: {row.item.quantite}</div>
                                </div>
                              </div>
                              {pivotButton(row.item, () => pivotSectionRow(section.id, row))}
                              {section.id === CUSTOM_SECTION_ID && !groupIdentical && (
                                <Button
                                  aria-label={`Supprimer ${row.item.nom}`} onClick={() => removeCustomItem(row.index)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-11 w-11 shrink-0 p-0 text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Configurez votre meuble et cliquez sur "Ajouter à la feuille de débit"
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer avec signature professionnelle */}
      <footer className="mt-8 pt-6 border-t border-border">
        <div className="text-center text-sm text-muted-foreground">
          <p className="flex flex-wrap items-center justify-center gap-2">
            <img src={logo.url} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/app-icon-192.png'; }} alt="" className="h-8 w-10 object-contain" /><span>Créé par</span>
            <span className="font-semibold text-foreground">Emeric Chenay</span>
            <span>•</span>
            <span>2026</span>
          </p>
          <a className="mt-2 inline-block underline text-sm" href="mailto:superdebitcoupe@proton.me">superdebitcoupe@proton.me</a>
        </div>
      </footer>
    </div>
  );
};

export default FurnitureCalculator;
