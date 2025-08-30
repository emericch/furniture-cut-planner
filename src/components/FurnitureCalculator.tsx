import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calculator, FileText } from 'lucide-react';
import { AssemblyIllustration, PieceIllustration } from './FurnitureIllustrations';

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
  sensOuverture: 'gauche' | 'droite';
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
  chantsVisible: string[];
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
    sensOuverture: 'droite',
    typePorte: 'interieur',
    retraitRayons: 0,
    decalageDos: 0
  });

  const [cutSheet, setCutSheet] = useState<CutSheetItem[]>([]);

  const epaisseurs = [8, 16, 19, 22];
  const epaisseursDos = [3, 8, 16, 19, 22];
  const epaisseursPortes = [16, 19, 22];

  const calculateCutSheet = () => {
    const items: CutSheetItem[] = [];
    
    // Calcul des profondeurs utiles (mesures totales, portes et dos compris)
    const hasDoor = config.nombrePortes > 0;
    const profondeurBase = 
      config.profondeur 
      - (hasDoor ? config.epaisseurPortes : 0) 
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
      - ((config.dosType !== 'aucun' && config.dosType !== 'en-applique') ? config.epaisseurDos + config.decalageDos : 0)
      - (config.retraitRayons || 0);
    
    // Calcul des montants
    const hauteurMontants = config.montantsTouteHauteur 
      ? config.hauteur 
      : config.hauteur - (2 * config.epaisseurTraverses);
    
    // Chants visibles des montants (face avant toujours plaquée)
    let chantsVisiblesMontants: string[] = ['face avant'];
    if (config.montantsTouteHauteur) {
      // Montants traversants: plaqués 4 côtés
      chantsVisiblesMontants.push('haut', 'bas', 'côté gauche', 'côté droit');
    }
    // Longueur arrière plaquée si pas de dos ou dos entre montants/traverses
    if (config.dosType === 'aucun' || config.dosType === 'entre-montants-traverses') {
      chantsVisiblesMontants.push('arrière');
    }
    // Cas traverses toute largeur sans dos: montants plaqués sur les 2 longueurs
    if (!config.montantsTouteHauteur && config.traversesTouteLargeur && config.dosType === 'aucun') {
      chantsVisiblesMontants.push('haut', 'bas');
    }
    
    items.push({
      nom: 'Montant gauche',
      longueur: hauteurMontants,
      largeur: profondeurMontants,
      epaisseur: config.epaisseurMontants,
      quantite: 1,
      chantsVisible: Array.from(new Set(chantsVisiblesMontants))
    });
    
    items.push({
      nom: 'Montant droit',
      longueur: hauteurMontants,
      largeur: profondeurMontants,
      epaisseur: config.epaisseurMontants,
      quantite: 1,
      chantsVisible: Array.from(new Set(chantsVisiblesMontants))
    });

    // Calcul des traverses
    const largeurTraverses = config.traversesTouteLargeur 
      ? config.largeur 
      : config.largeur - (2 * config.epaisseurMontants);
    
    // Chants visibles des traverses selon la configuration
    let chantsVisiblesTraverses: string[] = ['face avant'];
    if (config.traversesTouteLargeur) {
      // Traverses traversantes: plaqués 4 côtés
      chantsVisiblesTraverses.push('côté gauche', 'côté droit');
    }
    // Longueur arrière plaquée si pas de dos ou dos entre montants/traverses
    if (config.dosType === 'aucun' || config.dosType === 'entre-montants-traverses') {
      chantsVisiblesTraverses.push('arrière');
    }
    
    // Déterminer les chants communs pour les traverses selon les cas
    const baseTraverses = Array.from(new Set(chantsVisiblesTraverses));
    const needBothLongs = config.montantsTouteHauteur && config.dosType === 'aucun';
    const fullFourSides = config.traversesTouteLargeur && config.dosType === 'aucun';

    if (fullFourSides || needBothLongs) {
      const traversesChants = Array.from(new Set([
        ...baseTraverses,
        'haut',
        'bas',
        ...(fullFourSides ? ['côté gauche', 'côté droit'] : []),
      ]));

      items.push({
        nom: 'Traverse haute',
        longueur: largeurTraverses,
        largeur: profondeurTraverses,
        epaisseur: config.epaisseurTraverses,
        quantite: 1,
        chantsVisible: traversesChants
      });

      items.push({
        nom: 'Traverse basse',
        longueur: largeurTraverses,
        largeur: profondeurTraverses,
        epaisseur: config.epaisseurTraverses,
        quantite: 1,
        chantsVisible: traversesChants
      });
    } else {
      items.push({
        nom: 'Traverse haute',
        longueur: largeurTraverses,
        largeur: profondeurTraverses,
        epaisseur: config.epaisseurTraverses,
        quantite: 1,
        chantsVisible: [...baseTraverses, 'haut']
      });
      
      items.push({
        nom: 'Traverse basse',
        longueur: largeurTraverses,
        largeur: profondeurTraverses,
        epaisseur: config.epaisseurTraverses,
        quantite: 1,
        chantsVisible: [...baseTraverses, 'bas']
      });
    }

    // Calcul des rayons
    if (config.nombreRayons > 0) {
      const largeurRayons = config.largeur - (2 * config.epaisseurMontants);
      
      // Chants visibles des rayons: toujours plaqués devant + haut et bas + arrière si pas de dos
      let chantsVisiblesRayons = ['face avant', 'haut', 'bas'];
      if (config.dosType === 'aucun' || config.dosType === 'entre-montants-traverses') {
        chantsVisiblesRayons.push('arrière');
      }
      
      items.push({
        nom: 'Rayon',
        longueur: largeurRayons,
        largeur: profondeurRayons,
        epaisseur: config.epaisseurRayons,
        quantite: config.nombreRayons,
        chantsVisible: chantsVisiblesRayons
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
        quantite: 1,
        chantsVisible: []
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
          quantite: 1,
          chantsVisible: ['haut', 'bas', 'côté gauche', 'côté droit']
        });
      } else if (config.nombrePortes === 2) {
        const largeurPorte = config.typePorte === 'applique' 
          ? largeurUtile / 2 
          : (largeurUtile / 2) - jeuPeripherique;
        
        items.push({
          nom: config.typePorte === 'applique' ? 'Porte gauche (applique)' : 'Porte gauche (intérieur)',
          longueur: largeurPorte,
          largeur: hauteurUtile,
          epaisseur: profondeurPortes,
          quantite: 1,
          chantsVisible: ['haut', 'bas', 'côté gauche', 'côté droit']
        });
        
        items.push({
          nom: config.typePorte === 'applique' ? 'Porte droite (applique)' : 'Porte droite (intérieur)',
          longueur: largeurPorte,
          largeur: hauteurUtile,
          epaisseur: profondeurPortes,
          quantite: 1,
          chantsVisible: ['haut', 'bas', 'côté gauche', 'côté droit']
        });
      }
    }

    setCutSheet(items);
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="montants-toute-hauteur"
                      checked={config.montantsTouteHauteur}
                      disabled={config.traversesTouteLargeur}
                      onCheckedChange={(checked) => setConfig({...config, montantsTouteHauteur: checked as boolean})}
                    />
                    <Label htmlFor="montants-toute-hauteur" className={`text-sm ${config.traversesTouteLargeur ? 'text-muted-foreground' : ''}`}>
                      Montants toute hauteur
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="traverses-toute-largeur"
                      checked={config.traversesTouteLargeur}
                      disabled={config.montantsTouteHauteur}
                      onCheckedChange={(checked) => setConfig({...config, traversesTouteLargeur: checked as boolean})}
                    />
                    <Label htmlFor="traverses-toute-largeur" className={`text-sm ${config.montantsTouteHauteur ? 'text-muted-foreground' : ''}`}>
                      Traverses toute largeur
                    </Label>
                  </div>
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

                {config.nombrePortes === 1 && (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="text-sm">Sens d'ouverture</Label>
                      <Select 
                        value={config.sensOuverture} 
                        onValueChange={(value: any) => setConfig({...config, sensOuverture: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gauche">Gauche</SelectItem>
                          <SelectItem value="droite">Droite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <Button onClick={calculateCutSheet} className="w-full" size="lg">
                  <Calculator className="mr-2 h-4 w-4" />
                  Générer la feuille de débit
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Feuille de débit */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-4 w-4 text-primary" />
                  Feuille de débit
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cutSheet.length > 0 ? (
                  <div className="space-y-3">
                    {cutSheet.map((item, index) => (
                      <div key={index} className="border border-border rounded-lg p-3">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-base mb-2">{item.nom}</h4>
                            <div className="grid grid-cols-4 gap-2 text-sm text-muted-foreground">
                              <div>L: {item.longueur}</div>
                              <div>l: {item.largeur}</div>
                              <div>Ép: {item.epaisseur}</div>
                              <div>Qté: {item.quantite}</div>
                            </div>
                          </div>
                          <PieceIllustration 
                            longueur={item.longueur}
                            largeur={item.largeur}
                            chantsVisible={item.chantsVisible}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Configurez votre meuble et cliquez sur "Générer la feuille de débit"
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FurnitureCalculator;