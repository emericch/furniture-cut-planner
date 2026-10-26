# Sécurité et allègement avant présentation publique

## Bilan confirmé

- **Des alertes de sécurité existent dans les bibliothèques installées.** Le contrôle des dépendances signale notamment deux alertes critiques associées à jsPDF, ainsi que des alertes élevées associées à la navigation et à plusieurs bibliothèques inutilisées. Ces alertes ne prouvent pas qu’un visiteur peut les exploiter dans cette application ; ce point n’est pas établi.
- **L’audit approfondi manque.** Les résultats enregistrés du 25 octobre sont indiqués comme non à jour et ne comprennent aucun audit approfondi. Lancez un nouveau contrôle depuis l’onglet **Sécurité** ; ses résultats devront être examinés avant de conclure le contrôle du code et de l’application. Le risque zéro ne peut pas être garanti.
- **Les versions de dépendances ne concordent pas.** Le contrôle lit jsPDF 3.0.2 dans le fichier de verrouillage npm, tandis que l’environnement installé indique 3.0.4. Il faut rendre les versions reproductibles et refaire le contrôle après correction.
- **Le démarrage charge des éléments sans usage réel :** un gestionnaire de requêtes et un deuxième système de notifications.
- **Deux anciennes images identiques, non référencées, occupent environ 2,2 Mo.** Les retirer allégera les fichiers publiés, pas nécessairement le chargement initial : elles ne sont pas utilisées à l’écran.
- **Le tableau de débit est recalculé et trié à chaque saisie**, même lorsque seule la configuration change ; cela peut ralentir les longues feuilles.
- **L’écran principal mélange formulaire, feuille, impression et PDF dans environ 635 lignes.** La présentation imprimée répète aussi ses tableaux ; leur entretien risque de diverger.
- **Les 53 tests existants passent.** Ils couvrent les calculs et la géométrie du dessin, mais pas automatiquement les interactions complètes, l’impression et le téléchargement PDF.

## Corrections proposées, dans l’ordre

### 1. Enlever ce qui ne sert pas
Supprimer les anciennes images dupliquées, les déclarations inutilisées, les bibliothèques sans usage confirmé et leurs éléments d’interface devenus inutiles. Conserver le logo, les icônes, les données de contrôle et tous les calculs.

**Vérification :** 53 tests, affichage du logo, ajout et suppression d’un meuble, changement de classement, notifications d’erreur et page inconnue. Confirmer que le démarrage ne charge plus les éléments retirés.

### 2. Corriger les bibliothèques conservées
Mettre à jour la création des PDF et la navigation vers des versions corrigées compatibles, vérifier leurs dépendances indirectes et harmoniser les versions verrouillées. Ne pas considérer une version comme corrigée sur la seule base de son numéro : refaire le contrôle des dépendances.

**Vérification :** nouveau contrôle des dépendances, tests, navigation, PDF avec plusieurs meubles et plusieurs pages, noms longs et caractères accentués, impression dans les deux classements. Présenter toute alerte restante plutôt que la masquer.

### 3. Réduire les recalculs et séparer les responsabilités
Ne recalculer la validation que lorsque la configuration change, et le classement que lorsque la feuille change. Séparer l’affichage de la feuille et les fonctions d’export ; réunir les tableaux d’impression répétés. Garder le chargement des outils PDF uniquement au clic sur Export PDF.

**Vérification :** mêmes résultats de débit avant/après, tests, feuille comportant plusieurs meubles, renommage, suppression de pièces personnalisées, impression et PDF dans les deux classements. Mesurer le poids chargé au démarrage et la fluidité sans promettre une réduction chiffrée avant mesure.

### 4. Clore le contrôle pour la présentation publique
Examiner le nouvel audit approfondi lancé dans l’onglet Sécurité et traiter ses constats confirmés. Refaire les contrôles après correction. Vérifier aussi que deux visiteurs ne voient ni ne modifient leurs feuilles respectives.

**Limite :** le contrôle de l’application ne certifie pas l’infrastructure d’hébergement et ne garantit jamais l’absence totale de risque. La publication des corrections sera une action distincte, à votre demande.

## Détails techniques

- Sources des alertes : `security.get_scan_results` et `security.dependency_scan`, pas un audit de sécurité manuel.
- Harmoniser `bun.lockb` et `package-lock.json` selon le gestionnaire de paquets du projet ; vérifier les versions effectivement installées.
- Retirer le `QueryClientProvider` sans consommateur et le Toaster Radix sans appelant ; garder Sonner.
- Retirer les bibliothèques de 3D et de capture inutilisées ; pour les bibliothèques encore référencées par des éléments inactifs, supprimer d’abord ces éléments après vérification de leurs importations.
- Extraire les exports dans un module dédié et la feuille dans un composant ciblé ; conserver `src/lib/furniture.ts` comme source des dimensions. Ajouter des tests de cohérence des données d’export, sans tests de texte ou de mise en page.
- Effectuer les changements approuvés étape par étape, en conservant le comportement et en vérifiant chaque étape dans l’application.

**Aucun code de l’application ni aucune dépendance n’a été modifié pendant cette revue.**

Méthode employée : compétence **Code review**.