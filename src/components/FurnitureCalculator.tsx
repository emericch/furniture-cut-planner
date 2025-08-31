import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calculator, FileText, Plus, X, Trash2, Printer, Download, Edit2, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { AssemblyIllustration } from './FurnitureIllustrations';

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
  dosType: 'aucun' | 'toute-hauteur' | 'toute-largeur' | 'en-applique' | 'entre-montants-traverses';
  
  // Portes
  nombrePortes: 0 | 1 | 2;
  typePorte: 'applique' | 'interieur';

  // Options
  retraitRayons: number;
  decalageDos: number;
}

interface CutSheetItem {
  nom: string;
  longueur: number;
  largeur: number;
  epaisseur: number;
  quantite: number;
}

interface MeubleGroup {
  id: string;
  nom: string;
  config: FurnitureConfig;
  items: CutSheetItem[];
  dateAjout: Date;
}

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

  const epaisseurs = [8, 16, 19, 22];
  const epaisseursDos = [3, 8, 16, 19, 22];
  const epaisseursPortes = [16, 19, 22];

  const generateMeubleItems = (config: FurnitureConfig): CutSheetItem[] => {
    const items: CutSheetItem[] = [];
    
    // Calcul des profondeurs utiles (mesures totales, portes et dos compris)
    const hasDoorApplique = config.nombrePortes > 0 && config.typePorte === 'applique';
    const profondeurBase = 
      config.profondeur 
      - (hasDoorApplique ? config.epaisseurPortes : 0) 
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
      - (config.dosType === 'toute-hauteur' || config.dosType === 'toute-largeur' || config.dosType === 'entre-montants-traverses' ? config.epaisseurDos + config.decalageDos : 0)
      - (config.retraitRayons || 0)
      - (config.nombrePortes > 0 && config.typePorte === 'interieur' ? config.epaisseurPortes : 0);
    
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
        hauteurUtile = config.hauteur;
        largeurUtile = config.largeur;
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
        const jeuEntrePortes = 3;
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

  const addMeubleToSheet = () => {
    const items = generateMeubleItems(config);
    const nomMeuble = meubleNom.trim() || `Meuble ${meubleCounter}`;
    const newMeuble: MeubleGroup = {
      id: `meuble-${Date.now()}`,
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
    if (newItem.nom && newItem.longueur && newItem.largeur && newItem.epaisseur && newItem.quantite) {
      const item: CutSheetItem = {
        nom: newItem.nom,
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
    }
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
        <html>
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
              <p style="margin: 2px 0;">Développé par <strong>Emeric Chenay</strong> • 2025</p>
              <p style="margin: 2px 0;">Outil professionnel de menuiserie pour la génération de feuilles de débit</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  const generatePrintContent = () => {
    let content = '';
    
    meubleGroups.forEach((groupe, index) => {
      content += `
        <div class="print-section" style="margin-bottom: 12px; ${index > 0 ? 'border-top: 1px solid #bbb; padding-top: 6px;' : ''}">
          <div class="print-section-title" style="font-weight: bold; font-size: 14px; margin-bottom: 6px; border-bottom: 1px solid #bbb; padding-bottom: 6px; line-height: 1.3; overflow-wrap: anywhere; word-break: break-word;">
            ${groupe.nom} (${groupe.config.hauteur}×${groupe.config.largeur}×${groupe.config.profondeur}mm)
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
                  <td style="padding: 4px 5px; line-height: 1.4; vertical-align: middle;">${item.nom}</td>
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
                  <td style="padding: 4px 5px; line-height: 1.4; vertical-align: middle;">${item.nom}</td>
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
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    
    // Créer un élément temporaire avec le contenu à exporter
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
      <div style="padding: 15px; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.2; background: #ffffff; color: #000;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #bbb; padding-bottom: 10px;">
          <h1 style="font-size: 18px; font-weight: bold; margin: 0 0 5px 0;">FEUILLE DE DÉBIT</h1>
          <p style="font-size: 11px; margin: 0;">${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        ${generatePrintContent()}
        <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #bbb; text-align: center; font-size: 10px; color: #666;">
          <p style="margin: 2px 0;">Développé par <strong>Emeric Chenay</strong> • 2025</p>
          <p style="margin: 2px 0;">Outil professionnel de menuiserie pour la génération de feuilles de débit</p>
        </div>
      </div>
    `;
    
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '750px';
    tempDiv.style.backgroundColor = 'white';
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 190;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`feuille-debit-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* En-tête simplifié */}
        <div className="text-center">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Générateur de Débit Meuble
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration */}
          <div className="space-y-4">
            {/* Dimensions principales */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Dimensions hors-tout (mm)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="hauteur" className="text-sm">Hauteur</Label>
                    <Input
                      id="hauteur"
                      type="number"
                      value={config.hauteur}
                      onChange={(e) => setConfig({...config, hauteur: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="largeur" className="text-sm">Largeur</Label>
                    <Input
                      id="largeur"
                      type="number"
                      value={config.largeur}
                      onChange={(e) => setConfig({...config, largeur: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profondeur" className="text-sm">Profondeur</Label>
                    <Input
                      id="profondeur"
                      type="number"
                      value={config.profondeur}
                      onChange={(e) => setConfig({...config, profondeur: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Épaisseurs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Épaisseurs (mm)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <Label className="text-xs">Montants</Label>
                    <Select 
                      value={config.epaisseurMontants.toString()} 
                      onValueChange={(value) => setConfig({...config, epaisseurMontants: Number(value)})}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {epaisseurs.map(ep => (
                          <SelectItem key={ep} value={ep.toString()}>{ep}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Traverses</Label>
                    <Select 
                      value={config.epaisseurTraverses.toString()} 
                      onValueChange={(value) => setConfig({...config, epaisseurTraverses: Number(value)})}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {epaisseurs.map(ep => (
                          <SelectItem key={ep} value={ep.toString()}>{ep}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Rayons</Label>
                    <Select 
                      value={config.epaisseurRayons.toString()} 
                      onValueChange={(value) => setConfig({...config, epaisseurRayons: Number(value)})}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {epaisseurs.map(ep => (
                          <SelectItem key={ep} value={ep.toString()}>{ep}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Dos</Label>
                    <Select 
                      value={config.epaisseurDos.toString()} 
                      onValueChange={(value) => setConfig({...config, epaisseurDos: Number(value)})}
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
                    <Label className="text-xs">Portes</Label>
                    <Select 
                      value={config.epaisseurPortes.toString()} 
                      onValueChange={(value) => setConfig({...config, epaisseurPortes: Number(value)})}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {epaisseursPortes.map(ep => (
                          <SelectItem key={ep} value={ep.toString()}>{ep}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Options de montage */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-3">
                  Options de montage
                  <AssemblyIllustration 
                    montantsTouteHauteur={config.montantsTouteHauteur}
                    traversesTouteLargeur={config.traversesTouteLargeur}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center space-x-4">
                  <Label 
                    htmlFor="assembly-toggle" 
                    className={`text-sm font-medium transition-colors ${config.montantsTouteHauteur ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    Montants toute hauteur
                  </Label>
                  
                  <Switch 
                    id="assembly-toggle"
                    checked={config.traversesTouteLargeur}
                    onCheckedChange={(checked) => {
                      setConfig({
                        ...config, 
                        montantsTouteHauteur: !checked,
                        traversesTouteLargeur: checked
                      });
                    }}
                    className="data-[state=checked]:bg-primary"
                  />
                  
                  <Label 
                    htmlFor="assembly-toggle" 
                    className={`text-sm font-medium transition-colors ${config.traversesTouteLargeur ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    Traverses toute largeur
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Autres options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Autres éléments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rayons */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre-rayons" className="text-sm">Nombre de rayons</Label>
                    <Input
                      id="nombre-rayons"
                      type="number"
                      min="0"
                      value={config.nombreRayons}
                      onChange={(e) => setConfig({...config, nombreRayons: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="retrait-rayons" className="text-sm">Retrait rayons (mm)</Label>
                    <Input
                      id="retrait-rayons"
                      type="number"
                      min="0"
                      value={config.retraitRayons}
                      onChange={(e) => setConfig({...config, retraitRayons: Number(e.target.value)})}
                    />
                  </div>
                </div>

                {/* Dos */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Type de dos</Label>
                    <Select 
                      value={config.dosType} 
                      onValueChange={(value: any) => {
                        const newConfig = {...config, dosType: value};
                        if (value === 'en-applique') {
                          newConfig.decalageDos = 0;
                        }
                        setConfig(newConfig);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aucun">Aucun</SelectItem>
                        <SelectItem value="toute-hauteur">Toute hauteur</SelectItem>
                        <SelectItem value="toute-largeur">Toute largeur</SelectItem>
                        <SelectItem value="en-applique">En applique</SelectItem>
                        <SelectItem value="entre-montants-traverses">Entre montants et traverses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {config.dosType !== 'aucun' && config.dosType !== 'en-applique' && (
                    <div>
                      <Label htmlFor="decalage-dos" className="text-sm">Décalage dos (mm)</Label>
                      <Input
                        id="decalage-dos"
                        type="number"
                        min="0"
                        max={config.profondeur - config.epaisseurDos}
                        value={config.decalageDos}
                        onChange={(e) => setConfig({...config, decalageDos: Number(e.target.value)})}
                      />
                    </div>
                  )}
                </div>

                {/* Portes */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Nombre de portes</Label>
                    <Select 
                      value={config.nombrePortes.toString()} 
                      onValueChange={(value) => setConfig({...config, nombrePortes: Number(value) as 0 | 1 | 2})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Aucune</SelectItem>
                        <SelectItem value="1">1 porte</SelectItem>
                        <SelectItem value="2">2 portes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {config.nombrePortes > 0 && (
                    <div>
                      <Label className="text-sm">Type de pose</Label>
                      <Select 
                        value={config.typePorte} 
                        onValueChange={(value: any) => setConfig({...config, typePorte: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="interieur">En intérieur</SelectItem>
                          <SelectItem value="applique">En applique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

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

                <Button onClick={addMeubleToSheet} className="w-full" size="lg">
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
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Feuille de débit
                  </div>
                  <div className="flex items-center gap-2">
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
              <CardContent>
                {showAddForm && (
                  <Card className="mb-4 border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        Ajouter une pièce personnalisée
                        <Button
                          onClick={() => setShowAddForm(false)}
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
                      
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs">Longueur (mm)</Label>
                          <Input
                            type="number"
                            value={newItem.longueur || ''}
                            onChange={(e) => setNewItem({ ...newItem, longueur: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Largeur (mm)</Label>
                          <Input
                            type="number"
                            value={newItem.largeur || ''}
                            onChange={(e) => setNewItem({ ...newItem, largeur: Number(e.target.value) })}
                          />
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
                          <Label className="text-xs">Quantité</Label>
                          <Input
                            type="number"
                            min="1"
                            value={newItem.quantite || 1}
                            onChange={(e) => setNewItem({ ...newItem, quantite: Number(e.target.value) })}
                          />
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
                    {/* Groupes de meubles */}
                    {meubleGroups.map((groupe) => (
                       <Card key={groupe.id} className="border-l-4 border-l-primary">
                         <CardHeader className="pb-2">
                           <div className="flex items-center justify-between">
                             {editingMeubleId === groupe.id ? (
                               <div className="flex items-center gap-2 flex-1">
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
                                   onClick={saveEditedMeubleName}
                                   size="sm"
                                   variant="ghost"
                                   className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                                 >
                                   <Check className="h-3 w-3" />
                                 </Button>
                                 <Button
                                   onClick={cancelEditingMeuble}
                                   size="sm"
                                   variant="ghost"
                                   className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                                 >
                                   <X className="h-3 w-3" />
                                 </Button>
                               </div>
                             ) : (
                               <>
                                 <div className="flex items-center gap-2 flex-1">
                                   <CardTitle className="text-base">{groupe.nom}</CardTitle>
                                   <Button
                                     onClick={() => startEditingMeuble(groupe.id, groupe.nom)}
                                     size="sm"
                                     variant="ghost"
                                     className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                                   >
                                     <Edit2 className="h-3 w-3" />
                                   </Button>
                                 </div>
                                 <Button
                                   onClick={() => removeMeubleGroup(groupe.id)}
                                   size="sm"
                                   variant="ghost"
                                   className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
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
                                <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
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
                    {customItems.length > 0 && (
                      <Card className="border-l-4 border-l-secondary">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Pièces personnalisées</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {customItems.map((item, index) => (
                            <div key={index} className="flex justify-between items-center bg-muted/50 rounded-lg p-2">
                              <div className="flex-1">
                                <h5 className="font-medium text-sm">{item.nom}</h5>
                                <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                                  <div>L: {item.longueur}mm</div>
                                  <div>l: {item.largeur}mm</div>
                                  <div>Ép: {item.epaisseur}mm</div>
                                  <div>Qté: {item.quantite}</div>
                                </div>
                              </div>
                              <Button
                                onClick={() => removeCustomItem(index)}
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
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
          <p className="flex items-center justify-center gap-2">
            <span>Développé par</span>
            <span className="font-semibold text-foreground">Emeric Chenay</span>
            <span>•</span>
            <span>2025</span>
          </p>
          <p className="mt-1 text-xs">
            Outil professionnel de menuiserie pour la génération de feuilles de débit
          </p>
        </div>
      </footer>
    </div>
  );
};

export default FurnitureCalculator;