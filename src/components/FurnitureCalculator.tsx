import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Calculator, FileText, Ruler } from 'lucide-react';
import { DimensionIllustration, AssemblyIllustration, PieceIllustration } from './FurnitureIllustrations';


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
    retraitRayons: 0,
    decalageDos: 0
  });

  const [cutSheet, setCutSheet] = useState<CutSheetItem[]>([]);

  const epaisseurs = [3, 8, 16, 19];

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
    
    // Chants visibles des montants selon la configuration
    let chantsVisiblesMontants = ['côté extérieur', 'face avant'];
    if (config.montantsTouteHauteur) {
      chantsVisiblesMontants.push('haut', 'bas');
    }
    // Si pas de dos en applique, le côté arrière est visible
    if (config.dosType !== 'en-applique') {
      chantsVisiblesMontants.push('arrière');
    }
    
    items.push({
      nom: 'Montant gauche',
      longueur: hauteurMontants,
      largeur: profondeurMontants,
      epaisseur: config.epaisseurMontants,
      quantite: 1,
      chantsVisible: chantsVisiblesMontants.map(c => c === 'côté extérieur' ? 'côté gauche' : c)
    });
    
    items.push({
      nom: 'Montant droit',
      longueur: hauteurMontants,
      largeur: profondeurMontants,
      epaisseur: config.epaisseurMontants,
      quantite: 1,
      chantsVisible: chantsVisiblesMontants.map(c => c === 'côté extérieur' ? 'côté droit' : c)
    });

    // Calcul des traverses
    const largeurTraverses = config.traversesTouteLargeur 
      ? config.largeur 
      : config.largeur - (2 * config.epaisseurMontants);
    
    // Chants visibles des traverses selon la configuration
    let chantsVisiblesTraverses = ['face avant'];
    if (config.traversesTouteLargeur) {
      chantsVisiblesTraverses.push('côté gauche', 'côté droit');
    }
    // Si pas de dos en applique, le côté arrière est visible
    if (config.dosType !== 'en-applique') {
      chantsVisiblesTraverses.push('arrière');
    }
    
    items.push({
      nom: 'Traverse haute',
      longueur: largeurTraverses,
      largeur: profondeurTraverses,
      epaisseur: config.epaisseurTraverses,
      quantite: 1,
      chantsVisible: chantsVisiblesTraverses
    });
    
    items.push({
      nom: 'Traverse basse',
      longueur: largeurTraverses,
      largeur: profondeurTraverses,
      epaisseur: config.epaisseurTraverses,
      quantite: 1,
      chantsVisible: chantsVisiblesTraverses
    });

    // Calcul des rayons
    if (config.nombreRayons > 0) {
      const largeurRayons = config.largeur - (2 * config.epaisseurMontants);
      
      // Chants visibles des rayons selon la configuration
      let chantsVisiblesRayons = ['face avant'];
      // Si pas de dos en applique, le côté arrière est visible
      if (config.dosType !== 'en-applique') {
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
      const hauteurUtile = config.hauteur - (2 * config.epaisseurTraverses) - (2 * jeuPeripherique);
      const largeurUtile = config.largeur - (2 * config.epaisseurMontants) - (2 * jeuPeripherique);
      
      // Profondeur des portes (en tenant compte de l'espace nécessaire)
      let profondeurPortes = config.epaisseurPortes;
      
      if (config.nombrePortes === 1) {
        items.push({
          nom: 'Porte',
          longueur: largeurUtile,
          largeur: hauteurUtile,
          epaisseur: profondeurPortes,
          quantite: 1,
          chantsVisible: ['haut', 'bas', 'côté gauche', 'côté droit']
        });
      } else if (config.nombrePortes === 2) {
        const largeurPorte = (largeurUtile / 2) - jeuPeripherique;
        
        items.push({
          nom: 'Porte gauche',
          longueur: largeurPorte,
          largeur: hauteurUtile,
          epaisseur: profondeurPortes,
          quantite: 1,
          chantsVisible: ['haut', 'bas', 'côté gauche', 'côté droit']
        });
        
        items.push({
          nom: 'Porte droite',
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
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* En-tête compact */}
        <Card className="interactive-hover">
          <CardHeader className="text-center py-3">
            <CardTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl">
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              Générateur de Débit Meuble
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
          {/* Configuration */}
          <div className="space-y-3">
            {/* Dimensions et épaisseurs dans une seule carte */}
            <Card className="form-section">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Ruler className="h-4 w-4 text-accent" />
                  Configuration du meuble
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-2">
                  <p className="text-xs text-accent font-medium">⚠️ Mesures totales, portes et dos compris</p>
                </div>
                
                {/* Dimensions générales */}
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <Label className="text-sm font-medium">Dimensions (mm)</Label>
                    <img 
                      src="/lovable-uploads/c338fd19-a865-43a2-80e1-658e9e0be5a4.png" 
                      alt="Schéma technique du meuble" 
                      className="flex-shrink-0 h-16 w-auto"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="hauteur" className="text-xs">Hauteur</Label>
                      <Input
                        id="hauteur"
                        type="number"
                        value={config.hauteur}
                        onChange={(e) => setConfig({...config, hauteur: Number(e.target.value)})}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="largeur" className="text-xs">Largeur</Label>
                      <Input
                        id="largeur"
                        type="number"
                        value={config.largeur}
                        onChange={(e) => setConfig({...config, largeur: Number(e.target.value)})}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="profondeur" className="text-xs">Profondeur</Label>
                      <Input
                        id="profondeur"
                        type="number"
                        value={config.profondeur}
                        onChange={(e) => setConfig({...config, profondeur: Number(e.target.value)})}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Épaisseurs */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Épaisseurs (mm)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    <div>
                      <Label className="text-xs">Montants</Label>
                      <Select 
                        value={config.epaisseurMontants.toString()} 
                        onValueChange={(value) => setConfig({...config, epaisseurMontants: Number(value)})}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {epaisseurs.map(ep => (
                            <SelectItem key={ep} value={ep.toString()}>{ep}mm</SelectItem>
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
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {epaisseurs.map(ep => (
                            <SelectItem key={ep} value={ep.toString()}>{ep}mm</SelectItem>
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
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {epaisseurs.map(ep => (
                            <SelectItem key={ep} value={ep.toString()}>{ep}mm</SelectItem>
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
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {epaisseurs.map(ep => (
                            <SelectItem key={ep} value={ep.toString()}>{ep}mm</SelectItem>
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
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {epaisseurs.map(ep => (
                            <SelectItem key={ep} value={ep.toString()}>{ep}mm</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Options de montage */}
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <Label className="text-sm font-medium">Options de montage</Label>
                    <AssemblyIllustration 
                      montantsTouteHauteur={config.montantsTouteHauteur}
                      traversesTouteLargeur={config.traversesTouteLargeur}
                      className="flex-shrink-0" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="montants-toute-hauteur"
                        checked={config.montantsTouteHauteur}
                        disabled={config.traversesTouteLargeur}
                        onCheckedChange={(checked) => setConfig({...config, montantsTouteHauteur: checked as boolean})}
                      />
                      <Label htmlFor="montants-toute-hauteur" className={`text-xs ${config.traversesTouteLargeur ? 'text-muted-foreground' : ''}`}>
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
                      <Label htmlFor="traverses-toute-largeur" className={`text-xs ${config.montantsTouteHauteur ? 'text-muted-foreground' : ''}`}>
                        Traverses toute largeur
                      </Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Rayons et options */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="nombre-rayons" className="text-xs">Nombre de rayons</Label>
                    <Input
                      id="nombre-rayons"
                      type="number"
                      min="0"
                      value={config.nombreRayons}
                      onChange={(e) => setConfig({...config, nombreRayons: Number(e.target.value)})}
                      className="h-8"
                    />
                  </div>

                  <div>
                    <Label htmlFor="retrait-rayons" className="text-xs">Retrait rayons (mm)</Label>
                    <Input
                      id="retrait-rayons"
                      type="number"
                      min="0"
                      value={config.retraitRayons}
                      onChange={(e) => setConfig({...config, retraitRayons: Number(e.target.value)})}
                      className="h-8"
                    />
                  </div>
                </div>

                <Separator />

                {/* Dos */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Type de dos</Label>
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
                      <SelectTrigger className="h-8">
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
                      <Label htmlFor="decalage-dos" className="text-xs">Décalage dos (mm)</Label>
                      <Input
                        id="decalage-dos"
                        type="number"
                        min="0"
                        max={config.profondeur - config.epaisseurDos}
                        value={config.decalageDos}
                        onChange={(e) => setConfig({...config, decalageDos: Number(e.target.value)})}
                        className="h-8"
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Portes */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nombre de portes</Label>
                    <Select 
                      value={config.nombrePortes.toString()} 
                      onValueChange={(value) => setConfig({...config, nombrePortes: Number(value) as 0 | 1 | 2})}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Aucune</SelectItem>
                        <SelectItem value="1">1 porte</SelectItem>
                        <SelectItem value="2">2 portes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {config.nombrePortes === 1 && (
                    <div>
                      <Label className="text-xs">Sens d'ouverture</Label>
                      <Select 
                        value={config.sensOuverture} 
                        onValueChange={(value: any) => setConfig({...config, sensOuverture: value})}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gauche">Gauche</SelectItem>
                          <SelectItem value="droite">Droite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Button onClick={calculateCutSheet} className="w-full mt-4" size="lg">
                  <Calculator className="mr-2 h-4 w-4" />
                  Générer la feuille de débit
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            {/* Feuille de débit */}
            <Card className="cut-sheet">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-4 w-4 text-accent" />
                  Feuille de débit
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cutSheet.length > 0 ? (
                  <div className="space-y-2">
                    {cutSheet.map((item, index) => (
                      <div key={index} className="border border-border rounded-lg p-2 space-y-1">
                        <div className="flex justify-between items-center gap-2">
                          <h4 className="font-semibold text-sm">{item.nom}</h4>
                          <span className="text-xs text-muted-foreground">
                            Qté: {item.quantite}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex-1">
                            <div className="grid grid-cols-3 gap-1 text-xs">
                              <div>L: {item.longueur}</div>
                              <div>l: {item.largeur}</div>
                              <div>Ép: {item.epaisseur}</div>
                            </div>
                          </div>
                          <PieceIllustration 
                            longueur={item.longueur}
                            largeur={item.largeur}
                            chantsVisible={item.chantsVisible}
                            className="flex-shrink-0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4 text-sm">
                    Configurez votre meuble et cliquez sur "Générer"
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