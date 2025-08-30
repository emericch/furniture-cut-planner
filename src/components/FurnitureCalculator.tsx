import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Calculator, FileText, Settings, Ruler } from 'lucide-react';

interface FurnitureConfig {
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
  dosType: 'toute-hauteur' | 'toute-largeur' | 'entre-montants-traverses';
  
  // Portes
  nombrePortes: 1 | 2;
  sensOuverture: 'gauche' | 'droite';
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
    dosType: 'entre-montants-traverses',
    nombrePortes: 2,
    sensOuverture: 'droite'
  });

  const [cutSheet, setCutSheet] = useState<CutSheetItem[]>([]);

  const epaisseurs = [3, 8, 16, 19];

  const calculateCutSheet = () => {
    const items: CutSheetItem[] = [];
    
    // Calcul des montants
    const hauteurMontants = config.montantsTouteHauteur 
      ? config.hauteur 
      : config.hauteur - (2 * config.epaisseurTraverses);
    
    items.push({
      nom: 'Montant gauche',
      longueur: hauteurMontants,
      largeur: config.profondeur,
      epaisseur: config.epaisseurMontants,
      quantite: 1,
      chantsVisible: ['face avant', 'côté gauche']
    });
    
    items.push({
      nom: 'Montant droit',
      longueur: hauteurMontants,
      largeur: config.profondeur,
      epaisseur: config.epaisseurMontants,
      quantite: 1,
      chantsVisible: ['face avant', 'côté droit']
    });

    // Calcul des traverses
    const largeurTraverses = config.traversesTouteLargeur 
      ? config.largeur 
      : config.largeur - (2 * config.epaisseurMontants);
    
    items.push({
      nom: 'Traverse haute',
      longueur: largeurTraverses,
      largeur: config.profondeur,
      epaisseur: config.epaisseurTraverses,
      quantite: 1,
      chantsVisible: ['face avant']
    });
    
    items.push({
      nom: 'Traverse basse',
      longueur: largeurTraverses,
      largeur: config.profondeur,
      epaisseur: config.epaisseurTraverses,
      quantite: 1,
      chantsVisible: ['face avant']
    });

    // Calcul des rayons
    if (config.nombreRayons > 0) {
      const largeurRayons = config.largeur - (2 * config.epaisseurMontants);
      
      items.push({
        nom: 'Rayon',
        longueur: largeurRayons,
        largeur: config.profondeur,
        epaisseur: config.epaisseurRayons,
        quantite: config.nombreRayons,
        chantsVisible: ['face avant']
      });
    }

    // Calcul du dos
    let hauteurDos = config.hauteur;
    let largeurDos = config.largeur;
    
    switch (config.dosType) {
      case 'toute-hauteur':
        largeurDos = config.largeur - (2 * config.epaisseurMontants);
        break;
      case 'toute-largeur':
        hauteurDos = config.hauteur - (2 * config.epaisseurTraverses);
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

    // Calcul des portes
    const jeuPeripherique = 3;
    const hauteurUtile = config.hauteur - (2 * config.epaisseurTraverses) - (2 * jeuPeripherique);
    const largeurUtile = config.largeur - (2 * config.epaisseurMontants) - (2 * jeuPeripherique);
    
    if (config.nombrePortes === 1) {
      items.push({
        nom: 'Porte',
        longueur: largeurUtile,
        largeur: hauteurUtile,
        epaisseur: config.epaisseurPortes,
        quantite: 1,
        chantsVisible: ['face avant', 'côté ' + config.sensOuverture, 'haut', 'bas']
      });
    } else {
      const largeurPorte = (largeurUtile / 2) - jeuPeripherique;
      
      items.push({
        nom: 'Porte gauche',
        longueur: largeurPorte,
        largeur: hauteurUtile,
        epaisseur: config.epaisseurPortes,
        quantite: 1,
        chantsVisible: ['face avant', 'côté gauche', 'haut', 'bas']
      });
      
      items.push({
        nom: 'Porte droite',
        longueur: largeurPorte,
        largeur: hauteurUtile,
        epaisseur: config.epaisseurPortes,
        quantite: 1,
        chantsVisible: ['face avant', 'côté droit', 'haut', 'bas']
      });
    }

    setCutSheet(items);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* En-tête */}
        <Card className="interactive-hover">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Calculator className="h-6 w-6 text-accent" />
              Générateur de Débit Meuble
            </CardTitle>
            <p className="text-muted-foreground">
              Configurez votre meuble et générez automatiquement la feuille de débit
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration */}
          <div className="space-y-6">
            {/* Dimensions générales */}
            <Card className="form-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-accent" />
                  Dimensions générales (mm)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="hauteur">Hauteur</Label>
                    <Input
                      id="hauteur"
                      type="number"
                      value={config.hauteur}
                      onChange={(e) => setConfig({...config, hauteur: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="largeur">Largeur</Label>
                    <Input
                      id="largeur"
                      type="number"
                      value={config.largeur}
                      onChange={(e) => setConfig({...config, largeur: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profondeur">Profondeur</Label>
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
            <Card className="form-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-accent" />
                  Épaisseurs des panneaux
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Montants</Label>
                    <Select 
                      value={config.epaisseurMontants.toString()} 
                      onValueChange={(value) => setConfig({...config, epaisseurMontants: Number(value)})}
                    >
                      <SelectTrigger>
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
                    <Label>Traverses</Label>
                    <Select 
                      value={config.epaisseurTraverses.toString()} 
                      onValueChange={(value) => setConfig({...config, epaisseurTraverses: Number(value)})}
                    >
                      <SelectTrigger>
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
                    <Label>Rayons</Label>
                    <Select 
                      value={config.epaisseurRayons.toString()} 
                      onValueChange={(value) => setConfig({...config, epaisseurRayons: Number(value)})}
                    >
                      <SelectTrigger>
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
                    <Label>Dos</Label>
                    <Select 
                      value={config.epaisseurDos.toString()} 
                      onValueChange={(value) => setConfig({...config, epaisseurDos: Number(value)})}
                    >
                      <SelectTrigger>
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
                    <Label>Portes</Label>
                    <Select 
                      value={config.epaisseurPortes.toString()} 
                      onValueChange={(value) => setConfig({...config, epaisseurPortes: Number(value)})}
                    >
                      <SelectTrigger>
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
              </CardContent>
            </Card>

            {/* Configuration spécifique */}
            <Card className="form-section">
              <CardHeader>
                <CardTitle>Configuration spécifique</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="montants-toute-hauteur"
                    checked={config.montantsTouteHauteur}
                    onCheckedChange={(checked) => setConfig({...config, montantsTouteHauteur: checked as boolean})}
                  />
                  <Label htmlFor="montants-toute-hauteur">Montants toute hauteur</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="traverses-toute-largeur"
                    checked={config.traversesTouteLargeur}
                    onCheckedChange={(checked) => setConfig({...config, traversesTouteLargeur: checked as boolean})}
                  />
                  <Label htmlFor="traverses-toute-largeur">Traverses toute largeur</Label>
                </div>

                <div>
                  <Label htmlFor="nombre-rayons">Nombre de rayons</Label>
                  <Input
                    id="nombre-rayons"
                    type="number"
                    min="0"
                    value={config.nombreRayons}
                    onChange={(e) => setConfig({...config, nombreRayons: Number(e.target.value)})}
                  />
                </div>

                <div>
                  <Label>Type de dos</Label>
                  <Select 
                    value={config.dosType} 
                    onValueChange={(value: any) => setConfig({...config, dosType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="toute-hauteur">Toute hauteur</SelectItem>
                      <SelectItem value="toute-largeur">Toute largeur</SelectItem>
                      <SelectItem value="entre-montants-traverses">Entre montants et traverses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre de portes</Label>
                    <Select 
                      value={config.nombrePortes.toString()} 
                      onValueChange={(value) => setConfig({...config, nombrePortes: Number(value) as 1 | 2})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 porte</SelectItem>
                        <SelectItem value="2">2 portes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {config.nombrePortes === 1 && (
                    <div>
                      <Label>Sens d'ouverture</Label>
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
                  )}
                </div>
              </CardContent>
            </Card>

            <Button onClick={calculateCutSheet} className="w-full" size="lg">
              <Calculator className="mr-2 h-4 w-4" />
              Générer la feuille de débit
            </Button>
          </div>

          {/* Feuille de débit */}
          <div>
            <Card className="cut-sheet">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  Feuille de débit
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cutSheet.length > 0 ? (
                  <div className="space-y-4">
                    {cutSheet.map((item, index) => (
                      <div key={index} className="border border-border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold">{item.nom}</h4>
                          <span className="text-sm text-muted-foreground">
                            Quantité: {item.quantite}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>L: {item.longueur}mm</div>
                          <div>l: {item.largeur}mm</div>
                          <div>Ép: {item.epaisseur}mm</div>
                        </div>
                        {item.chantsVisible.length > 0 && (
                          <div className="mt-2">
                            <span className="text-sm font-medium text-accent">Chants à plaquer:</span>
                            <div className="text-sm text-muted-foreground">
                              {item.chantsVisible.join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Configurez votre meuble et cliquez sur "Générer" pour voir la feuille de débit
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