# Hollow Knight Completionist

Tracker de complétion **112 %** pour *Hollow Knight*, inspiré de silksong-completionist.com.

**Fonction principale : la lecture de la sauvegarde.** Glissez votre `user1.dat` (à `user4.dat`) dans la page. Le fichier est déchiffré **dans le navigateur**, rien n'est envoyé sur un serveur. La page coche alors automatiquement tout ce que vous avez obtenu.

## Fonctionnalités

La sauvegarde est déchiffrée dans le navigateur (en-tête .NET BinaryFormatter + base64 + AES-256-ECB, ou JSON en clair). Le total suit exactement la formule du jeu, et une alerte prévient si le site et le jeu ne sont pas d'accord.

Les onglets :

- **Progression** : les 112 cases (1 case = 1 %), la checklist par catégorie (recherche, filtres, prérequis du 112 % comme les larves, le minerai pâle et les clés) et l'arbre de progression avec les prochains objectifs.
- **Carte** : plan schématique d'Hallownest en quatre modes : objets, Journal du chasseur, Essence (racines de rêve, rêves de guerriers, boss des rêves, paliers de la Voyante) et Geo (rochers à casser, spots de farm). Chaque zone liste son contenu, avec un lien vers le wiki.
- **Journal** : chaque créature, où la chasser et les victoires restantes ; mêmes chiffres que l'écran du jeu.
- **Défis** : succès déduits de la sauvegarde et Salle des Dieux (Attuned / Ascended / Radiant pour chaque statue).
- **Charmes** : composer un build avec ses charmes et voir les caractéristiques obtenues (dégâts, portée, vitesse, masques, Âme, sorts…).
- **Statistiques** : vitalité, ombre, statistiques de la partie, budget en Geo (112 % et complétion totale), guide pour gagner du Geo, image récapitulative et lien de partage.
- **Lore** : toile des personnages, révélations (floutées) et quêtes suivies depuis la sauvegarde.

Autour : encadré des nouveautés quand on recharge une sauvegarde, suivi en direct du fichier (Chrome / Edge) avec notifications, thème Âme d'acier, version anglaise, mode hors ligne (application installable), fond animé, mode manuel sans sauvegarde. Les réglages (langue, objets optionnels, indices, notifications) sont dans le menu ⚙ Réglages.

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

- `index.html`, `css/style.css` : la page
- `js/version.js` : numéro de version affiché (incrémenté à chaque mise à jour)
- `js/aes.js`, `js/save.js` : déchiffrement et décodage de la sauvegarde
- `js/data.js` : objets suivis, champs de la save, indices et barème du 112 %
- `js/journal-data.js` : Journal du chasseur (noms, victoires requises, comptage du jeu, zones)
- `js/achievements-data.js`, `js/features-data.js` : succès, statues, achats, effets des charmes
- `js/extras.js` : couleurs, ordre de progression, arbre, carte et statistiques
- `js/lore-data.js`, `js/lore.js` : onglet Lore (`lore.html` redirige vers cet onglet)
- `js/i18n.js` : version anglaise
- `js/app.js` : interface (chargement, onglets, rendu, suivi en direct)
- `js/background.js` : fond animé
- `sw.js`, `manifest.webmanifest` : mode hors ligne et installation

Projet de fan, non affilié à Team Cherry.
