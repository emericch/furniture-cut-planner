# Installation et hébergement

## Installation web

L’application possède un manifeste, des icônes et un lancement autonome. Elle fonctionne en ligne ; aucun mode hors connexion n’a été ajouté.

- iPhone/iPad : ouvrir le site publié dans Safari, puis Partager → Sur l’écran d’accueil.
- Android : ouvrir le site publié et utiliser le menu d’installation ou d’ajout à l’écran d’accueil.
- PC/Mac : utiliser l’installation proposée par Chrome ou Edge ; la disponibilité dépend du navigateur et du système.
- Les feuilles en cours sont conservées uniquement pendant la session de page : un rechargement les efface. Exporter le PDF avant de fermer.

## Hébergement gratuit

**GitHub Pages** propose un hébergement statique gratuit pour un dépôt public sur GitHub Free, sous réserve des limites de service. L’application n’a pas besoin de serveur pour ses calculs.

La connexion Git depuis Lovable crée un dépôt privé ; GitHub Pages gratuit exige de le rendre public. Le code et le logo deviennent alors accessibles publiquement. Il faut exporter les fichiers compilés et préparer le chemin de publication. Privilégier une page utilisateur `https://UTILISATEUR.github.io/`, servie à la racine, pour conserver les chemins des icônes et du manifeste. Pour une page de projet dans un sous-dossier, adapter d’abord les chemins absolus, le manifeste et la configuration Vite.

Le logo affiché dispose d’un remplacement local à partir de l’icône de l’application lorsque le service d’images Lovable n’est pas disponible ailleurs.

Aucun hébergement externe ni compte GitHub n’a été configuré dans cette intervention.

Sources : https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages

**Lovable** : la publication depuis le dialogue est gratuite, mais la documentation actuelle indique que l’usage de l’hébergement consomme des crédits Run. Ce n’est donc pas une garantie d’hébergement illimité gratuit. Le site déjà publié ne reçoit pas ces modifications tant que l’on n’a pas cliqué sur Mettre à jour.

Source : https://docs.lovable.dev/features/publish

## Vérifications

Calculs : 22 tests, couvrant notamment les 60 combinaisons de montage/dos/portes.
Parcours contrôlés dans Chromium : ajout, suppression d’un meuble, classement, téléchargement PDF, nouveau dos en rainure et blocage des dimensions invalides.
Affichage contrôlé de 320 à 1280 pixels, sans débordement horizontal dans les états testés ; contrôle complémentaire sous Firefox.
Impression : document généré et demande d’impression unique vérifiés, sans impression physique.
Safari/iOS réel, AirPrint et installation sur appareil physique restent à vérifier. Le moteur WebKit n’était pas disponible dans l’environnement de contrôle.

Le classement par taille utilise la plus grande dimension décroissante puis l’autre dimension et l’épaisseur, sans tourner les pièces.
Le jeu central de deux portes utilise exactement 2 mm. Le retrait réglable des rayons est supplémentaire aux 10 mm de jeu derrière une porte intérieure. Aucun jeu de montage supplémentaire n’est ajouté au dos.

Les PDF restent compacts et en noir et blanc. Une liste trop longue passe sur plusieurs pages plutôt que de réduire le texte jusqu’à le rendre illisible.