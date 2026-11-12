# Hollow Knight Completionist

Tracker de complétion **112 %** pour *Hollow Knight*, inspiré de silksong-completionist.com.

**Fonction principale : la lecture de la sauvegarde.** Glissez votre `user1.dat` (à `user4.dat`) dans la page. Le fichier est déchiffré **dans le navigateur**, rien n'est envoyé sur un serveur. La page coche alors automatiquement tout ce que vous avez obtenu.

## Fonctionnalités

- Lecture des sauvegardes PC/Mac/Linux (en-tête .NET BinaryFormatter + base64 + AES-256-ECB) et des sauvegardes JSON en clair.
- Calcul du % par catégorie, avec le même barème que le jeu :
  - Boss 14, Charmes 40, Équipement 14, Clou 4, Arts du clou 3, Sorts 6
  - Masques 4, Réceptacles 3, Aiguillon des rêves 3, Guerriers 7, Rêveurs 3, Colisée 3
  - DLC : Troupe Grimm 2, Lifeblood 1, Godmaster 5 (les 40 charmes sont tous dans la section Charmes, 40 %)
- Affiche aussi le % enregistré par le jeu, le temps de jeu et le Géo.
- Prérequis du 112 % (ne rapportent pas de % mais sont indispensables) : 46 larves, 2400 Essences, stations de Coléoptère, 6 minerais pâles et clés nécessaires.
- Vraiment optionnel : clés simples en trop, laissez-passer de tramway, racines de rêve, boss optionnels et fins.
- **Suivi en direct** (Chrome/Edge) : la page relit la sauvegarde toutes les 3 s et met en évidence les nouveaux objets.
- Recherche, filtres (tout / manquants / obtenus), indices masquables, sections repliables.
- Noms officiels de la version française du jeu, avec le nom anglais en dessous (masquable).
- **Les 112 cases** : une grille où chaque case vaut 1 %, colorée par catégorie (thème propre à chaque DLC).
- **Carte d'Hallownest** : plan schématique des zones, colorées selon la progression, avec la liste de ce qu'il reste à trouver dans chaque zone.
- **Arbre de progression** : les grandes étapes de la partie reliées par leurs prérequis, avec les prochains objectifs accessibles.
- **Statistiques** : masques, réceptacles, emplacements de charme, position et Geo de l'ombre, Journal du chasseur, salles visitées, reliques, charmes équipés… (le jeu n'enregistre pas le nombre de morts).
- Objets et catégories rangés dans l'ordre de progression habituel.
- **Nouveautés** : en rechargeant une sauvegarde, un encadré liste ce qui a été obtenu depuis la précédente, avec le % gagné.
- Filtre « Objets optionnels » pour masquer ce qui n'est pas nécessaire au 112 % (les prérequis restent affichés).
- Fond animé (particules d'âme, lumaflies, brume), désactivé si le système demande moins d'animations.
- Logo : voir `img/README.md` pour utiliser une image à la place du logo dessiné.
- **Journal du chasseur** : chaque créature (noms officiels), découverte ou non, et le nombre de victoires restantes pour compléter ses notes.
- **Larves et racines de rêve** : les 46 larves et 15 racines, chacune avec sa zone, cochées depuis la sauvegarde.
- **Image récapitulative** à partager (onglet Statistiques).
- **Thème Âme d'acier** quand la sauvegarde est en mode Âme d'acier.
- **Hors ligne** : le site s'installe comme une application et fonctionne sans connexion.
- **Onglet Lore et rencontres** : toile des personnages, quêtes et rencontres suivies depuis la save, révélations résumées (floutées par défaut).
- **Succès** déduits de la sauvegarde, **Salle des Dieux** (niveau atteint pour chaque statue), **builds de charmes** avec les coûts réels.
- **Budget en Geo** : ce qu'il reste à acheter pour le 112 % comparé au Geo, à la banque et aux reliques.
- **Alerte de cohérence** si le total du site diffère du % enregistré par le jeu.
- **Lien de partage** en lecture seule et **notifications** pendant le suivi en direct.
- **Version anglaise** (bouton FR / EN).
- Mode manuel sans sauvegarde : les cases cochées sont gardées dans le `localStorage`.

## Emplacement des sauvegardes

| OS | Chemin |
| --- | --- |
| Windows | `%USERPROFILE%\AppData\LocalLow\Team Cherry\Hollow Knight` |
| macOS | `~/Library/Application Support/unity.Team Cherry.Hollow Knight` |
| Linux | `~/.config/unity3d/Team Cherry/Hollow Knight` |

## Lancer en local

Site 100 % statique, sans étape de build :

```sh
python3 -m http.server 8000
# puis http://localhost:8000
```

Pour le déployer, activez GitHub Pages sur la branche, dossier racine.

## Structure

- `js/aes.js` : déchiffrement AES-ECB minimal, sans dépendance
- `js/save.js` : décodage du fichier de sauvegarde
- `js/data.js` : liste des objets, champs de la save, indices et barème
- `js/extras.js` : couleurs, ordre de progression, arbre et statistiques
- `js/journal-data.js` : entrées du Journal du chasseur (généré depuis les données du jeu)
- `js/lore-data.js`, `js/lore.js` : onglet Lore (`lore.html` redirige vers cet onglet)
- `sw.js`, `manifest.webmanifest` : mode hors ligne
- `js/achievements-data.js`, `js/features-data.js` : succès, statues, achats
- `js/i18n.js` : version anglaise
- `js/background.js` : fond animé
- `js/app.js` : interface (chargement, rendu, filtres, suivi en direct)

Projet de fan, non affilié à Team Cherry.
