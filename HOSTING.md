# Installation et hébergement

## Installation web

L’application possède un manifeste, des icônes et un lancement autonome. Elle fonctionne en ligne ; aucun mode hors connexion n’a été ajouté.

- iPhone/iPad : ouvrir le site publié dans Safari, puis Partager → Sur l’écran d’accueil.
- Android : ouvrir le site publié et utiliser le menu d’installation ou d’ajout à l’écran d’accueil.
- PC/Mac : utiliser l’installation proposée par Chrome ou Edge ; la disponibilité dépend du navigateur et du système.
- Les feuilles sont enregistrées dans le navigateur de l'appareil (stockage local) : elles ne sont pas partagées entre appareils. Exporter le PDF pour les conserver ailleurs.

## Hébergement

Le site est hébergé gratuitement sur **Cloudflare Pages** : https://debit-rapide.pages.dev

- Projet Pages `debit-rapide`, relié au dépôt GitHub `emericch/furniture-cut-planner`, branche `main`.
- Build : `npm run build`, dossier publié : `dist`.
- Chaque commit sur `main` déclenche automatiquement un nouveau build et la mise en ligne (1 à 2 minutes).
- Offre gratuite : 500 builds par mois. Les adresses inconnues renvoient vers l'application (comportement par défaut de Pages pour une application monopage).
- Le logo est intégré au code : aucun service d'images externe n'est nécessaire.

Sources : https://developers.cloudflare.com/pages/configuration/git-integration/ · https://developers.cloudflare.com/pages/platform/limits/

## Vérifications

Calculs : 22 tests, couvrant notamment les 60 combinaisons de montage/dos/portes.
Parcours contrôlés dans Chromium : ajout, suppression d’un meuble, classement, téléchargement PDF, nouveau dos en rainure et blocage des dimensions invalides.
Affichage contrôlé de 320 à 1280 pixels, sans débordement horizontal dans les états testés ; contrôle complémentaire sous Firefox.
Impression : document généré et demande d’impression unique vérifiés, sans impression physique.
Safari/iOS réel, AirPrint et installation sur appareil physique restent à vérifier. Le moteur WebKit n’était pas disponible dans l’environnement de contrôle.

Le classement par taille utilise la plus grande dimension décroissante puis l’autre dimension et l’épaisseur, sans tourner les pièces.
Le jeu central de deux portes utilise exactement 2 mm. Le retrait réglable des rayons est supplémentaire aux 10 mm de jeu derrière une porte intérieure. Aucun jeu de montage supplémentaire n’est ajouté au dos.

Les PDF restent compacts et en noir et blanc. Une liste trop longue passe sur plusieurs pages plutôt que de réduire le texte jusqu’à le rendre illisible.
