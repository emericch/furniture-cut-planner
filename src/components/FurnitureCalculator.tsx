import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileText, Plus, X, Trash2, Printer, Download, Edit2, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { generateMeubleItems, validateConfig, compareSize, escapeHtml, formatMm, type FurnitureConfig, type CutSheetItem, type MeubleGroup } from '@/lib/furniture';
import logo from '@/assets/ours-logo.png.asset.json';
import { toast } from 'sonner';
export type { FurnitureConfig } from '@/lib/furniture';
import { AssemblyIllustration } from './FurnitureIllustrations';
import { FurnitureDesigner } from './FurnitureDesigner';
import { NumberField } from './NumberField';

const FurnitureCalculator: React.FC = () => {
  const [config, setConfig] = useState<FurnitureConfig>({
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
  });

  const [meubleGroups, setMeubleGroups] = useState<MeubleGroup[]>([]);
  const [customItems, setCustomItems] = useState<CutSheetItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<CutSheetItem>>({
    nom: '',
    longueur: 0,
    largeur: 0,
    epaisseur: 19,
    quantite: 1
  });
  const [meubleCounter, setMeubleCounter] = useState(1);
  const [meubleNom, setMeubleNom] = useState('');
  const [editingMeubleId, setEditingMeubleId] = useState<string | null>(null);
  const [editingNom, setEditingNom] = useState('');

  const [order, setOrder] = useState<'meuble' | 'taille'>('meuble');
  const validationErrors = validateConfig(config);
  const sortedRows = [...meubleGroups.flatMap(g => g.items.map(item => ({item, meuble: g.nom}))), ...customItems.map(item => ({item, meuble: 'Pièces personnalisées'}))].sort((a,b) => compareSize(a.item,b.item));

  const epaisseurs = [8, 16, 19, 22];
  const epaisseursDos = [3, 8, 16, 19, 22];
  const epaisseursPortes = [16, 19, 22];

  const addMeubleToSheet = () => {
    if (validationErrors.length) { toast.error(validationErrors[0]); return; }
    const items = generateMeubleItems(config);
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

  const startEditingMeuble = (meubleId: string, currentNom: string) => {
    setEditingMeubleId(meubleId);
    setEditingNom(currentNom);
  };

  const saveEditedMeubleName = () => {
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
    setMeubleGroups(meubleGroups.filter(group => group.id !== meubleId));
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
    setCustomItems(customItems.filter((_, i) => i !== index));
  };

  const getAllItems = () => {
    const allItems: CutSheetItem[] = [];
    meubleGroups.forEach(group => {
      allItems.push(...group.items);
    });
    allItems.push(...customItems);
    return allItems;
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
    if (order === 'taille') return `<table><thead><tr><th>Meuble · Pièce</th><th>Qté</th><th>L (mm)</th><th>l (mm)</th><th>e (mm)</th></tr></thead><tbody>${sortedRows.map(({item,meuble}) => `<tr><td>${escapeHtml(meuble)} · ${escapeHtml(item.nom)}</td><td>${item.quantite}</td><td>${formatMm(item.longueur)}</td><td>${formatMm(item.largeur)}</td><td>${item.epaisseur}</td></tr>`).join('')}</tbody></table>`;
    let content = '';
    
    meubleGroups.forEach((groupe, index) => {
      content += `
        <div class="print-section" style="margin-bottom: 12px; ${index > 0 ? 'border-top: 1px solid #bbb; padding-top: 6px;' : ''}">
          <div class="print-section-title" style="font-weight: bold; font-size: 14px; margin-bottom: 6px; border-bottom: 1px solid #bbb; padding-bottom: 6px; line-height: 1.3; overflow-wrap: anywhere; word-break: break-word;">
            ${escapeHtml(groupe.nom)} (${groupe.config.hauteur}×${groupe.config.largeur}×${groupe.config.profondeur}mm)
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
              ${groupe.items.map(item => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 4px 5px; line-height: 1.4; vertical-align: middle;">${escapeHtml(item.nom)}</td>
                  <td style="padding: 4px 5px; text-align: center; line-height: 1.4; vertical-align: middle;">${item.quantite}</td>
                  <td style="padding: 4px 5px; text-align: center; line-height: 1.4; vertical-align: middle;">${item.longueur}</td>
                  <td style="padding: 4px 5px; text-align: center; line-height: 1.4; vertical-align: middle;">${item.largeur}</td>
                  <td style="padding: 4px 5px; text-align: center; line-height: 1.4; vertical-align: middle;">${item.epaisseur}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    });

    if (customItems.length > 0) {
      content += `
        <div class="print-section" style="margin-top: 12px; border-top: 1px solid #bbb; padding-top: 6px;">
          <div class="print-section-title" style="font-weight: bold; font-size: 14px; margin-bottom: 6px; border-bottom: 1px solid #bbb; padding-bottom: 6px; line-height: 1.3; overflow-wrap: anywhere; word-break: break-word;">
            Pièces personnalisées
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
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
              ${customItems.map(item => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 4px 5px; line-height: 1.4; vertical-align: middle;">${escapeHtml(item.nom)}</td>
                  <td style="padding: 4px 5px; text-align: center; line-height: 1.4; vertical-align: middle;">${item.quantite}</td>
                  <td style="padding: 4px 5px; text-align: center; line-height: 1.4; vertical-align: middle;">${item.longueur}</td>
                  <td style="padding: 4px 5px; text-align: center; line-height: 1.4; vertical-align: middle;">${item.largeur}</td>
                  <td style="padding: 4px 5px; text-align: center; line-height: 1.4; vertical-align: middle;">${item.epaisseur}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // La signature sera ajoutée plus tard dans le template principal

    return content;
  };

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const pdf = new jsPDF();
      pdf.setFontSize(16); pdf.text('FEUILLE DE DÉBIT', 14, 15);
      pdf.setFontSize(9); pdf.text(new Date().toLocaleDateString('fr-FR'), 14, 21);
      const sections = order === 'taille'
        ? [{title: 'Pièces par taille décroissante', rows: sortedRows.map(({item,meuble}) => [meuble+' · '+item.nom,item.quantite,formatMm(item.longueur),formatMm(item.largeur),item.epaisseur])}]
        : [...meubleGroups.map(g => ({title: g.nom+' — '+g.config.hauteur+' × '+g.config.largeur+' × '+g.config.profondeur+' mm',rows: g.items.map(i => [i.nom,i.quantite,formatMm(i.longueur),formatMm(i.largeur),i.epaisseur])})), ...(customItems.length ? [{title:'Pièces personnalisées',rows:customItems.map(i => [i.nom,i.quantite,formatMm(i.longueur),formatMm(i.largeur),i.epaisseur])}] : [])];
      const body = sections.flatMap(section => [[{content:section.title,colSpan:5,styles:{fontStyle:'bold' as const,fillColor:255}}], ...section.rows]);
      autoTable(pdf, {startY:27, margin:{left:14,right:14,bottom:24}, head:[['Pièce','Qté','L (mm)','l (mm)','e (mm)']], body, theme:'plain', styles:{fontSize:9,cellPadding:2,textColor:0,lineColor:210,lineWidth:0.1,overflow:'linebreak'}, headStyles:{fillColor:255,textColor:0,fontStyle:'bold'}, rowPageBreak:'avoid'});
      const page = pdf.getNumberOfPages(); pdf.setPage(page);
      pdf.setFontSize(8); pdf.text('Emeric Chenay · 2026 · superdebitcoupe@proton.me',14,285);
      pdf.addImage('/favicon.png','PNG',183,278,10,10);
      pdf.save(`feuille-debit-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch { toast.error('Impossible de créer le PDF. Réessayez ou utilisez Imprimer.'); }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* En-tête simplifié */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-2">
            <img src={logo.url} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/app-icon-192.png'; }} alt="Logo Emeric Chenay" className="h-12 w-16 shrink-0 object-contain" />
            Générateur de Débit Meuble
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
                <Button disabled={validationErrors.length > 0} onClick={addMeubleToSheet} className="w-full" size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter à la feuille de débit
                </Button>
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
                <div className="mb-4 max-w-xs">
                  <Label htmlFor="sheet-order">Classement</Label>
                  <Select value={order} onValueChange={v => setOrder(v as 'meuble' | 'taille')}>
                    <SelectTrigger id="sheet-order"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="meuble">Par meuble</SelectItem><SelectItem value="taille">Par taille · grande dimension décroissante</SelectItem></SelectContent>
                  </Select>
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
                    {order === 'taille' && <div className="divide-y divide-border">{sortedRows.map(({item,meuble},index) => <div key={index} className="py-3"><p className="text-sm text-muted-foreground break-words">{meuble}</p><p className="font-medium break-words">{item.nom}</p><p className="text-sm">{formatMm(item.longueur)} × {formatMm(item.largeur)} × {item.epaisseur} mm · Qté {item.quantite}</p></div>)}</div>}
                    {/* Groupes de meubles */}
                    {order === 'meuble' && meubleGroups.map((groupe) => (
                       <Card key={groupe.id} className="border-l-4 border-l-primary">
                         <CardHeader className="pb-2">
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
                             {groupe.config.hauteur} × {groupe.config.largeur} × {groupe.config.profondeur}mm
                           </p>
                         </CardHeader>
                        <CardContent className="space-y-2">
                          {groupe.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center bg-muted/50 rounded-lg p-2">
                              <div className="flex-1">
                                <h5 className="font-medium text-sm">{item.nom}</h5>
                                <div className="grid grid-cols-2 gap-2 text-sm text-foreground sm:grid-cols-4">
                                  <div>L: {item.longueur}mm</div>
                                  <div>l: {item.largeur}mm</div>
                                  <div>Ép: {item.epaisseur}mm</div>
                                  <div>Qté: {item.quantite}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}

                    {/* Pièces personnalisées */}
                    {order === 'meuble' && customItems.length > 0 && (
                      <Card className="border-l-4 border-l-secondary">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Pièces personnalisées</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {customItems.map((item, index) => (
                            <div key={index} className="flex justify-between items-center bg-muted/50 rounded-lg p-2">
                              <div className="flex-1">
                                <h5 className="font-medium text-sm">{item.nom}</h5>
                                <div className="grid grid-cols-2 gap-2 text-sm text-foreground sm:grid-cols-4">
                                  <div>L: {item.longueur}mm</div>
                                  <div>l: {item.largeur}mm</div>
                                  <div>Ép: {item.epaisseur}mm</div>
                                  <div>Qté: {item.quantite}</div>
                                </div>
                              </div>
                              <Button
                                aria-label={`Supprimer ${item.nom}`} onClick={() => removeCustomItem(index)}
                                size="sm"
                                variant="ghost"
                                className="h-11 w-11 shrink-0 p-0 text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
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