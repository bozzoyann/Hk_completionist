# Hollow Knight Completionist

Tracker de complétion **112 %** pour *Hollow Knight*, inspiré de silksong-completionist.com.

**Fonction principale : la lecture de la sauvegarde.** Glissez votre `user1.dat` (à `user4.dat`) dans la page. Le fichier est déchiffré **dans le navigateur**, rien n'est envoyé sur un serveur. La page coche alors automatiquement tout ce que vous avez obtenu.

## Fonctionnalités

- Lecture des sauvegardes PC/Mac/Linux (en-tête .NET BinaryFormatter + base64 + AES-256-ECB) et des sauvegardes JSON en clair.
- Calcul du % par catégorie, avec le même barème que le jeu :
  - Boss 14, Charmes 36, Équipement 14, Clou 4, Arts du clou 3, Sorts 6
  - Masques 4, Réceptacles 3, Aiguillon des rêves 3, Guerriers 7, Rêveurs 3, Colisée 3
  - DLC : Troupe Grimm 6, Lifeblood 1, Godmaster 5
- Affiche aussi le % enregistré par le jeu, le temps de jeu et le Géo.
- Sections hors % : larves, essence, stations du Cerf, racines murmurantes, minerai pâle, clés, boss optionnels et fins.
- **Suivi en direct** (Chrome/Edge) : la page relit la sauvegarde toutes les 3 s et met en évidence les nouveaux objets.
- Recherche, filtres (tout / manquants / obtenus), indices masquables, sections repliables.
- Noms officiels de la version française du jeu, avec le nom anglais en dessous (masquable).
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
- `js/app.js` : interface (chargement, rendu, filtres, suivi en direct)

Projet de fan, non affilié à Team Cherry.
