/*
 * English version of the site.
 * The site is written in French; when English is selected, this file swaps the data
 * (item names, hints, sections, zones, journal, achievements, lore) and translates the
 * interface text as it is rendered. Loaded after the data files and before app.js / lore.js.
 */
(function (global) {
  "use strict";

  let lang = "fr";
  try {
    lang = localStorage.getItem("hk.lang");
    lang = lang ? JSON.parse(lang) : null;
  } catch { lang = null; }
  if (lang !== "fr" && lang !== "en") lang = /^fr/i.test(navigator.language || "") ? "fr" : "en";

  function setLang(l) {
    try { localStorage.setItem("hk.lang", JSON.stringify(l)); } catch { /* ignore */ }
    location.reload();
  }

  global.HKI18n = { lang, setLang, t: (fr) => fr };
  document.documentElement.lang = lang;
  if (lang !== "en") return;

  /* ------------------------------ Item hints ------------------------------ */
  const HINTS = {
    "Routes Oubliées, en bas à droite": "Forgotten Crossroads, bottom right",
    "Routes Oubliées, au centre": "Forgotten Crossroads, centre",
    "Vertchemin, au-dessus de la station de Coléoptère": "Greenpath, above the Stag Station",
    "Routes Oubliées, nécessite la Pince de mante religieuse": "Forgotten Crossroads, requires Mantis Claw",
    "Voies d'Eau Royales, à droite": "Royal Waterways, right side",
    "Cité des Larmes : Sanctuaire de l'Âme": "City of Tears: Soul Sanctum",
    "Caverne Nocive : Village des Mantes": "Fungal Wastes: Mantis Village",
    "Nid-profond, à gauche de la source chaude (Coeur de cristal)": "Deepnest, left of the hot spring (Crystal Heart)",
    "Bassin Ancestral, en bas à gauche": "Ancient Basin, bottom left",
    "Cité des Larmes : Tour de l'Amour (Clé de l'amour)": "City of Tears: Tower of Love (Love Key)",
    "Brumes-canyon : Archives de l'Érudite": "Fog Canyon: Teacher's Archives",
    "Frontières du Royaume, nécessite les Ailes de monarque": "Kingdom's Edge, requires Monarch Wings",
    "Jardins de la Reine, nécessite la Cape des ombres": "Queen's Gardens, requires Shade Cloak",
    "Cité des Larmes : L'Observatoire": "City of Tears: Watcher's Spire",
    "Sly : 300 Geo": "Sly: 300 Geo", "Iselda : 220 Geo": "Iselda: 220 Geo", "Sly : 200 Geo": "Sly: 200 Geo",
    "Père des larves : 10 larves sauvées": "Grubfather: 10 grubs rescued",
    "Falaises Hurlantes, en bas, près de Vertchemin": "Howling Cliffs, bottom, near Greenpath",
    "Passe du Roi, rebondir sur les pics": "King's Pass, pogo on the spikes",
    "Salubra : 800 Geo": "Salubra: 800 Geo", "Salubra : 250 Geo": "Salubra: 250 Geo", "Salubra : 120 Geo": "Salubra: 120 Geo",
    "Salubra : 300 Geo": "Salubra: 300 Geo", "Salubra : 220 Geo": "Salubra: 220 Geo",
    "Les Abysses : porte des 15 masques sang-de-vie": "The Abyss: door requiring 15 lifeblood masks",
    "Voies d'Eau Royales : vaincre le Défenseur Bousier": "Royal Waterways: defeat Dung Defender",
    "Voies d'Eau Royales : vaincre Flukemarm": "Royal Waterways: defeat Flukemarm",
    "Vertchemin, nécessite la Cape d'ailes de papillon": "Greenpath, requires Mothwing Cloak",
    "Village des Mantes : vaincre les Dames Mante": "Mantis Village: defeat the Mantis Lords",
    "Sly : 350 Geo + Clé du marchand": "Sly: 350 Geo + Shopkeeper's Key",
    "Nid-profond, nécessite la Cape des ombres": "Deepnest, requires Shade Cloak",
    "Caverne Nocive, près des Jardins de la Reine": "Fungal Wastes, near Queen's Gardens",
    "Routes Oubliées : Butte Ancestrale": "Forgotten Crossroads: Ancestral Mound",
    "Repos Éternel, nécessite l'Élan ravageur": "Resting Grounds, requires Desolate Dive",
    "Routes Oubliées, nécessite le Coeur de cristal": "Forgotten Crossroads, requires Crystal Heart",
    "Mangepatte : 350 Geo": "Leg Eater: 350 Geo", "Mangepatte : 250 Geo": "Leg Eater: 250 Geo", "Mangepatte : 600 Geo": "Leg Eater: 600 Geo",
    "Sly : après avoir appris les 3 Arts de l'Aiguillon": "Sly: after learning all 3 Nail Arts",
    "Falaises Hurlantes : Pierre Tombale de Joni": "Howling Cliffs: Joni's Repose",
    "Vertchemin : Lac d'Unn, nécessite la Larme d'Isma": "Greenpath: Lake of Unn, requires Isma's Tear",
    "La Ruche : après le Chevalier de la Ruche": "The Hive: after the Hive Knight",
    "Voyante : 500 Essences": "Seer: 500 Essence",
    "Caverne Nocive, sous le banc près de Bretta": "Fungal Wastes, below the bench near Bretta",
    "Frontières du Royaume, nécessite l'Élan ravageur": "Kingdom's Edge, requires Desolate Dive",
    "Mont Cristal, nécessite le Coeur de cristal": "Crystal Peak, requires Crystal Heart",
    "Père des larves : les 46 larves sauvées": "Grubfather: all 46 grubs rescued",
    "Dame Blanche (Jardins de la Reine) + Palais Blanc": "White Lady (Queen's Gardens) + White Palace",
    "Sly : 400 Geo + Clé du marchand": "Sly: 400 Geo + Shopkeeper's Key",
    "Repos Éternel, à gauche sous la Voyante": "Resting Grounds, left below the Seer",
    "Nid-profond : Tanière du Tisserand": "Deepnest: Weavers' Den",
    "Dirtmouth, après avoir allumé la lanterne des Falaises Hurlantes": "Dirtmouth, after lighting the lantern in Howling Cliffs",
    "Vertchemin, vaincre Hornet": "Greenpath, defeat Hornet",
    "Mont Cristal": "Crystal Peak",
    "Bassin Ancestral, après le Vaisseau Brisé": "Ancient Basin, after Broken Vessel",
    "Voies d'Eau Royales : Bosquet d'Isma": "Royal Waterways: Isma's Grove",
    "Frontières du Royaume, vaincre Hornet": "Kingdom's Edge, defeat Hornet",
    "Les Abysses": "The Abyss",
    "Fabricant d'Aiguillons : 250 Geo": "Nailsmith: 250 Geo",
    "Fabricant d'Aiguillons : 800 Geo + 1 Minerai pâle": "Nailsmith: 800 Geo + 1 Pale Ore",
    "Fabricant d'Aiguillons : 2000 Geo + 2 Minerais pâles": "Nailsmith: 2000 Geo + 2 Pale Ore",
    "Fabricant d'Aiguillons : 4000 Geo + 3 Minerais pâles": "Nailsmith: 4000 Geo + 3 Pale Ore",
    "Mato, Maître d'Aiguillons : Falaises Hurlantes": "Nailmaster Mato: Howling Cliffs",
    "Sheo, Maître d'Aiguillons : Vertchemin": "Nailmaster Sheo: Greenpath",
    "Oro, Maître d'Aiguillons : Frontières du Royaume": "Nailmaster Oro: Kingdom's Edge",
    "Sanctuaire de l'Âme, avec la Clé élégante": "Soul Sanctum, with the Elegant Key",
    "Sanctuaire de l'Âme : vaincre le Maître de l'Âme": "Soul Sanctum: defeat Soul Master",
    "Mont Cristal : Butte Cristallisée": "Crystal Peak: Crystallised Mound",
    "Brumes-canyon : Butte Luxuriante": "Fog Canyon: Overgrown Mound",
    "Les Abysses, utiliser les Spectres hurleurs sur le piédestal": "The Abyss, use Howling Wraiths on the pedestal",
    "Sly : 150 Geo": "Sly: 150 Geo", "Sly : 500 Geo": "Sly: 500 Geo",
    "Sly : 800 Geo + Clé du marchand": "Sly: 800 Geo + Shopkeeper's Key",
    "Sly : 1500 Geo + Clé du marchand": "Sly: 1500 Geo + Shopkeeper's Key",
    "Voyante : 1500 Essences": "Seer: 1500 Essence",
    "Routes Oubliées : sous la source chaude": "Forgotten Crossroads: below the hot spring",
    "Routes Oubliées : après le Mawlek Maussade": "Forgotten Crossroads: after Brooding Mawlek",
    "Père des larves : 5 larves sauvées": "Grubfather: 5 grubs rescued",
    "Dirtmouth : chambre de Bretta (après l'avoir sauvée)": "Dirtmouth: Bretta's room (after rescuing her)",
    "Station de la Reine, nécessite la Pince de mante religieuse": "Queen's Station, requires Mantis Claw",
    "Voies d'Eau Royales : en haut à gauche, nager vers la gauche": "Royal Waterways: top left, swim left",
    "Vertchemin : Sanctuaire de Pierre (Lanterne de Lumafly)": "Greenpath: Stone Sanctuary (Lumafly Lantern)",
    "Mont Cristal : vaincre le Furieux Gardien": "Crystal Peak: defeat the Enraged Guardian",
    "Nid-profond, depuis le Coeur des Champignons (Ailes de monarque)": "Deepnest, from the Fungal Core (Monarch Wings)",
    "La Ruche : faire charger un gardien de la Ruche contre le mur": "The Hive: lure a Hive Guardian into the wall",
    "Repos Éternel : Fleur délicate pour l'Endeuillée Grise": "Resting Grounds: Delicate Flower for the Grey Mourner",
    "Sly : 550 Geo": "Sly: 550 Geo", "Sly : 900 Geo + Clé du marchand": "Sly: 900 Geo + Shopkeeper's Key",
    "Voyante : 700 Essences": "Seer: 700 Essence",
    "Tanière aux Coléoptères": "Stag Nest",
    "Vertchemin : près de la sortie vers les Jardins de la Reine": "Greenpath: near the exit to Queen's Gardens",
    "Routes Oubliées : activer l'ascenseur vers la Cité des Larmes": "Forgotten Crossroads: unlock the lift to the City of Tears",
    "Cité des Larmes : au-dessus de la Station du Roi": "City of Tears: above King's Station",
    "Nid-profond : parcours au-dessus des Goams": "Deepnest: platforming above the Goams",
    "Bassin Ancestral : fontaine, 3000 Geo": "Ancient Basin: fountain, 3000 Geo",
    "Repos Éternel": "Resting Grounds",
    "Voyante : 1800 Essences": "Seer: 1800 Essence", "Voyante : 2400 Essences": "Seer: 2400 Essence",
    "Falaises Hurlantes, en haut au centre": "Howling Cliffs, top centre",
    "Jardins de la Reine, à gauche de la station": "Queen's Gardens, left of the Stag Station",
    "Caverne Nocive, au-dessus du pont d'acide": "Fungal Wastes, above the acid bridge",
    "Nid-profond, sous le Tramway Délabré": "Deepnest, below the Failed Tramway",
    "Frontières du Royaume, nécessite la Cape des ombres": "Kingdom's Edge, requires Shade Cloak",
    "Nid-profond : L'Antre de la Bête": "Deepnest: Beast's Den",
    "Frontières du Royaume, Petit Nigaud : 100 Geo": "Kingdom's Edge, Little Fool: 100 Geo",
    "Petit Nigaud : 450 Geo, après l'Épreuve des Guerriers": "Little Fool: 450 Geo, after the Trial of the Warrior",
    "Petit Nigaud : 800 Geo, après l'Épreuve du Conquérant": "Little Fool: 800 Geo, after the Trial of the Conqueror",
    "Dirtmouth : après 6 flammes": "Dirtmouth: after 6 flames",
    "Un seul choix possible par partie": "Only one choice per save",
    "La Ruche, garde le Charme Sang-de-ruche": "The Hive, guards the Hiveblood charm",
    "Voies d'Eau Royales : Fosse à Ordures (Clé simple)": "Royal Waterways: Junk Pit (Simple Key)",
    "Maison des Dieux": "Godhome",
    "Maison des Dieux : après les Panthéons 1, 2 et 3": "Godhome: after Pantheons 1, 2 and 3",
    "Routes Oubliées, près de la station de Coléoptère": "Forgotten Crossroads, near the Stag Station",
    "Routes Oubliées, au-dessus des pics": "Forgotten Crossroads, above the spikes",
    "Routes Oubliées, près du bassin d'acide": "Forgotten Crossroads, near the acid pool",
    "Routes Oubliées, gardée par des ennemis": "Forgotten Crossroads, guarded by enemies",
    "Vertchemin, près de Cornifer": "Greenpath, near Cornifer",
    "Vertchemin, près du Journal du chasseur": "Greenpath, near the Hunter's Journal",
    "Vertchemin, près de l'Emboutisseur Moussu Massif": "Greenpath, near the Massive Moss Charger",
    "Vertchemin, près de la station de Coléoptère": "Greenpath, near the Stag Station",
    "Falaises Hurlantes": "Howling Cliffs",
    "Caverne Nocive, champignons rebondissants": "Fungal Wastes, bouncy mushrooms",
    "Caverne Nocive, près du Champi-spore": "Fungal Wastes, near Spore Shroom",
    "Brumes-canyon, près des Archives de l'Érudite": "Fog Canyon, near the Teacher's Archives",
    "Jardins de la Reine, près de la station": "Queen's Gardens, near the Stag Station",
    "Jardins de la Reine, tout en haut": "Queen's Gardens, at the very top",
    "Jardins de la Reine, près de Marmu": "Queen's Gardens, near Marmu",
    "Cité des Larmes, côté gauche": "City of Tears, left side",
    "Sanctuaire de l'Âme": "Soul Sanctum",
    "Cité des Larmes, maison gardée": "City of Tears, guarded house",
    "L'Observatoire": "Watcher's Spire",
    "Station du Roi": "King's Station",
    "Voies d'Eau Royales, partie principale": "Royal Waterways, main area",
    "Bosquet d'Isma": "Isma's Grove",
    "Voies d'Eau Royales, accès par le tramway": "Royal Waterways, reached by tram",
    "Mont Cristal, entre les pics": "Crystal Peak, among the spikes",
    "Mont Cristal, sous un coffre": "Crystal Peak, below a chest",
    "Mont Cristal, à côté d'une Larve Caméléon": "Crystal Peak, next to a Grub Mimic",
    "Mont Cristal, passage des broyeurs": "Crystal Peak, crusher passage",
    "Couronne d'Hallownest": "Hallownest's Crown",
    "Mont Cristal, près du Coeur de cristal": "Crystal Peak, near Crystal Heart",
    "Butte Cristallisée": "Crystallised Mound",
    "Repos Éternel, dans la crypte": "Resting Grounds, in the crypt",
    "Nid-profond, au-dessus des pics": "Deepnest, above the spikes",
    "Nid-profond, près de l'antre de Nosk": "Deepnest, near Nosk's lair",
    "Nid-profond, à côté d'une Larve Caméléon": "Deepnest, next to a Grub Mimic",
    "Nid-profond, zone obscure": "Deepnest, dark area",
    "L'Antre de la Bête": "Beast's Den",
    "Frontières du Royaume, près du campement": "Kingdom's Edge, near the camp",
    "Frontières du Royaume, près d'Oro": "Kingdom's Edge, near Oro",
    "La Ruche, côté extérieur": "The Hive, outer side",
    "La Ruche, à l'intérieur": "The Hive, inside",
    "Bassin Ancestral, sous un sol à briser (Élan ravageur)": "Ancient Basin, below a breakable floor (Desolate Dive)",
    "Bassin Ancestral, en hauteur (Ailes de monarque)": "Ancient Basin, up high (Monarch Wings)",
    "Tour de l'Amour, chez le Collectionneur (1/3)": "Tower of Love, the Collector's room (1/3)",
    "Tour de l'Amour, chez le Collectionneur (2/3)": "Tower of Love, the Collector's room (2/3)",
    "Tour de l'Amour, chez le Collectionneur (3/3)": "Tower of Love, the Collector's room (3/3)",
    "Bassin Ancestral, à gauche de la station du tramway": "Ancient Basin, left of the tram station",
    "Voyante : 300 Essences": "Seer: 300 Essence",
    "Sommet du Mont Cristal (Ailes de monarque)": "Top of Crystal Peak (Monarch Wings)",
    "Nid-profond : après Nosk": "Deepnest: after Nosk",
    "Père des larves : 31 larves": "Grubfather: 31 grubs",
    "Colisée des Fous : Épreuve du Conquérant": "Colosseum of Fools: Trial of the Conqueror",
    "Sly : 1800 Geo · éclaire le Sanctuaire de Pierre (éclat de masque, Sans-yeux)": "Sly: 1800 Geo · lights the Stone Sanctuary (mask shard, No Eyes)",
    "Mont Cristal · débloque la suite de la boutique de Sly (éclats, fragment, Charmes)": "Crystal Peak · unlocks the rest of Sly's shop (shards, fragment, charms)",
    "Sly : 800 Geo · nécessaire pour l'Âme d'ombre": "Sly: 800 Geo · needed for Shade Soul",
    "Jardins de la Reine · ouvre la Tour de l'Amour (Le Collectionneur)": "Queen's Gardens · opens the Tower of Love (The Collector)",
    "Une seule suffit : ouvre la Fosse à Ordures (Syntoniseur Divin)": "One is enough: opens the Junk Pit (Godtuner)",
    "Sly : 950 Geo": "Sly: 950 Geo",
    "Cité des Larmes, sous la station des Entrepôts de la Cité": "City of Tears, below the City Storerooms station",
    "Bassin Ancestral, sous l'arène du Vaisseau Brisé": "Ancient Basin, below the Broken Vessel arena",
    "Colisée des Fous : vaincre la Rôdeuse Pâle": "Colosseum of Fools: defeat the Pale Lurker",
    "Nid-profond : Tramway Délabré": "Deepnest: Failed Tramway",
    "Les Abysses, avec l'Âme-royale": "The Abyss, with Kingsoul",
    "Routes Oubliées, à droite du Père des larves · 29 Essences": "Forgotten Crossroads, right of the Grubfather · 29 Essence",
    "Butte Ancestrale · 42 Essences": "Ancestral Mound · 42 Essence",
    "Vertchemin, côté Jardins de la Reine · 44 Essences": "Greenpath, towards Queen's Gardens · 44 Essence",
    "Falaises Hurlantes, grande zone principale · 46 Essences": "Howling Cliffs, large main area · 46 Essence",
    "Caverne Nocive, au-dessus du Village des Mantes · 18 Essences": "Fungal Wastes, above Mantis Village · 18 Essence",
    "Caverne Nocive, à gauche de Mangepatte · 20 Essences": "Fungal Wastes, left of the Leg Eater · 20 Essence",
    "Jardins de la Reine, sous le banc de droite · 29 Essences": "Queen's Gardens, below the right bench · 29 Essence",
    "Cité des Larmes, sous la station de Coléoptère · 28 Essences": "City of Tears, below the Stag Station · 28 Essence",
    "Ascenseur brisé, entre la Cité des Larmes et le Bassin Ancestral · 35 Essences": "Broken elevator, between the City of Tears and the Ancient Basin · 35 Essence",
    "Couronne d'Hallownest, au sommet du Mont Cristal · 21 Essences": "Hallownest's Crown, top of Crystal Peak · 21 Essence",
    "Repos Éternel, à droite de la Voyante · 20 Essences": "Resting Grounds, right of the Seer · 20 Essence",
    "Clairière des Esprits · 34 Essences": "Spirits' Glade · 34 Essence",
    "Nid-profond, sous les Jardins de la Reine · 45 Essences": "Deepnest, below Queen's Gardens · 45 Essence",
    "Frontières du Royaume, près de la Tour de l'Amour · 51 Essences": "Kingdom's Edge, near the Tower of Love · 51 Essence",
    "La Ruche, à droite du banc · 20 Essences": "The Hive, right of the bench · 20 Essence",
    "Routes Oubliées": "Forgotten Crossroads", "Butte Ancestrale": "Ancestral Mound", "Vertchemin": "Greenpath",
    "Village des Mantes": "Mantis Village", "Caverne Nocive, près de Mangepatte": "Fungal Wastes, near the Leg Eater",
    "Jardins de la Reine": "Queen's Gardens", "Cité des Larmes, près des Entrepôts": "City of Tears, near the Storerooms",
    "Voies d'Eau Royales, côté Bassin Ancestral": "Royal Waterways, Ancient Basin side", "Clairière des Esprits": "Spirits' Glade",
    "Frontières du Royaume": "Kingdom's Edge", "La Ruche": "The Hive",
    "Rêve du Faux Chevalier": "False Knight's dream", "Rêve du Maître de l'Âme": "Soul Master's dream",
    "Rêve du Vaisseau Brisé": "Broken Vessel's dream", "Rêve du Défenseur Bousier": "Dung Defender's dream",
    "Dirtmouth : chambre de Bretta (Aiguillon des rêves)": "Dirtmouth: Bretta's room (Dream Nail)",
    "Temple de l'Oeuf Noir": "Black Egg Temple",
    "Coeur du vide + Aiguillon des rêves sur Hollow Knight": "Void Heart + Dream Nail on the Hollow Knight",
  };

  const SECTIONS_EN = {
    bosses: ["Bosses", "Each boss in this list gives 1%."],
    charms: ["Charms", "Each charm gives 1%. Fragile charms count once."],
    equipment: ["Equipment", "Each ability gives 2%."],
    nail: ["Nail upgrades", "Each upgrade from the Nailsmith gives 1%."],
    nailarts: ["Nail Arts", "Each Nail Art gives 1%."],
    spells: ["Spells", "Each spell and its upgrade give 1%."],
    masks: ["Mask Shards", "4 shards = 1 mask = 1%."],
    vessels: ["Vessel Fragments", "3 fragments = 1 Soul Vessel = 1%."],
    dreamnail: ["Dream Nail", "Each step gives 1%."],
    warriors: ["Warrior Dreams", "Each warrior spirit defeated with the Dream Nail gives 1%."],
    dreamers: ["Dreamers", "Each Dreamer gives 1%."],
    colosseum: ["Colosseum of Fools", "Each trial gives 1%."],
    grimm: ["DLC: The Grimm Troupe", "Grimm and the final choice: the Ritual or the Banishment."],
    lifeblood: ["DLC: Lifeblood", ""],
    godmaster: ["DLC: Godmaster", "The Godtuner and Pantheons 1 to 4 (the 5th does not count)."],
    grubs: ["Grubs", "They give no % directly, but all 46 are needed: the Grubfather gives a mask shard, Grubsong, a Pale Ore and Grubberfly's Elegy."],
    counters: ["Prerequisites: Essence and stations", "2400 Essence for the Seer's last words, and every station for the Stag Nest."],
    paleore: ["Pale Ore", "All 6 are needed for the Pure Nail (1 + 2 + 3 ore)."],
    keys: ["Essential keys", "They give no %, but open access to items that do."],
    others: ["Other items", "Fully optional for 112%."],
    roots: ["Whispering Roots", "Optional: each root harvested with the Dream Nail gives Essence."],
    endgame: ["Optional bosses and endings", ""],
  };
  const COUNTERS_EN = { essence: "Essence (Seer milestones)", stags: "Stag Stations" };

  const ZONES_EN = {
    cliffs: ["Howling Cliffs"], dirtmouth: ["Dirtmouth", "and King's Pass"], peak: ["Crystal Peak"], colosseum: ["Colosseum of Fools"],
    edge: ["Kingdom's Edge"], greenpath: ["Greenpath"], crossroads: ["Forgotten Crossroads"], resting: ["Resting Grounds"],
    fog: ["Fog Canyon"], gardens: ["Queen's Gardens"], city: ["City of Tears"], hive: ["The Hive"], fungal: ["Fungal Wastes"],
    waterways: ["Royal Waterways"], deepnest: ["Deepnest"], basin: ["Ancient Basin"], abyss: ["The Abyss"],
    palace: ["White Palace", "dream realm"], godhome: ["Godhome", "dream realm"],
  };
  const SHADE_ZONES_EN = {
    CROSSROADS: "Forgotten Crossroads", GREEN_PATH: "Greenpath", WASTES: "Fungal Wastes", CITY: "City of Tears", WATERWAYS: "Royal Waterways",
    MINES: "Crystal Peak", PEAK: "Hallownest's Crown", CRYSTAL_MOUND: "Crystallised Mound", RESTING_GROUNDS: "Resting Grounds",
    OUTSKIRTS: "Kingdom's Edge", DEEPNEST: "Deepnest", ABYSS: "Ancient Basin", ABYSS_DEEP: "The Abyss", FOG_CANYON: "Fog Canyon",
    ROYAL_GARDENS: "Queen's Gardens", CLIFFS: "Howling Cliffs", TOWN: "Dirtmouth", KINGS_PASS: "King's Pass", HIVE: "The Hive",
    WHITE_PALACE: "White Palace", GODS_GLORY: "Godhome", GODSEEKER_WASTE: "Junk Pit", DISTANT_VILLAGE: "Distant Village",
    SOUL_SOCIETY: "Soul Sanctum", MAGE_TOWER: "Soul Sanctum", MONOMON_ARCHIVE: "Teacher's Archives", LURIENS_TOWER: "Watcher's Spire",
    LOVE_TOWER: "Tower of Love", ISMAS_GROVE: "Isma's Grove", ACID_LAKE: "Lake of Unn", BLUE_LAKE: "Blue Lake", MANTIS_VILLAGE: "Mantis Village",
    COLOSSEUM: "Colosseum of Fools", BEASTS_DEN: "Beast's Den", SHAMAN_TEMPLE: "Ancestral Mound", OVERGROWN_MOUND: "Overgrown Mound",
    NOEYES_TEMPLE: "Stone Sanctuary", PALACE_GROUNDS: "Palace Grounds", RUINED_TRAMWAY: "Failed Tramway", QUEENS_STATION: "Queen's Station",
    KINGS_STATION: "King's Station", TRAM_UPPER: "Upper Tram", TRAM_LOWER: "Lower Tram", GLADE: "Spirits' Glade", BONE_FOREST: "Bone Forest",
    JONI_GRAVE: "Joni's Repose", ROYAL_QUARTER: "Royal Quarter", FINAL_BOSS: "Black Egg", WYRMSKIN: "Cast-Off Shell", DREAM_WORLD: "Dream",
  };

  const TREE_EN = {
    falseKnightDefeated: "False Knight", fireball1: "Vengeful Spirit", bossGruzMother: "Gruz Mother", hornet1Defeated: "Hornet",
    hasDash: "Mothwing Cloak", hasWalljump: "Mantis Claw", defeatedMantisLords: "Mantis Lords", hasSuperDash: "Crystal Heart",
    mageLordDefeated: "Soul Master", quake1: "Desolate Dive", hasDreamNail: "Dream Nail", defeatedDungDefender: "Dung Defender",
    killedInfectedKnight: "Broken Vessel", hasAcidArmour: "Isma's Tear", hasDoubleJump: "Monarch Wings", gotCharm_40: "Grimmchild",
    lurienDefeated: "Lurien", monomonDefeated: "Monomon", hegemolDefeated: "Herrah", dreamNailUpgraded: "Awoken Dream Nail",
    hasGodfinder: "Godtuner", hornetOutskirtsDefeated: "Hornet (Kingdom's Edge)", killedHiveKnight: "Hive Knight",
    colosseumBronzeCompleted: "Trial of the Warrior", killedGrimm: "Troupe Master Grimm", hasShadowDash: "Shade Cloak",
    hasKingsBrand: "King's Brand", pantheon1: "Pantheon of the Master", colosseumSilverCompleted: "Trial of the Conqueror",
    grimmChildLevel: "Nightmare King", killedTraitorLord: "Traitor Lord", gotCharm_36: "Kingsoul", pantheon2: "Pantheon of the Artist",
    colosseumGoldCompleted: "Trial of the Fool", killedHollowKnight: "Hollow Knight", gotShadeCharm: "Void Heart",
    pantheon3: "Pantheon of the Sage", killedFinalBoss: "Radiance", pantheon4: "Pantheon of the Knight", pantheon5: "Pantheon of Hallownest",
  };

  /* ------------------------------ Data swaps ------------------------------ */
  const NAME_EN = {};
  if (global.HKData) {
    for (const s of HKData.SECTIONS) {
      const se = SECTIONS_EN[s.id];
      if (se) { s.title = se[0]; s.desc = se[1] || ""; }
      for (const c of s.counters || []) if (COUNTERS_EN[c.id]) c.name = COUNTERS_EN[c.id];
      for (const it of s.items || []) {
        const fr = it.name;
        let en = it.en || fr;
        const pre = /^#(\d+) /.exec(fr);
        const num = /#(\d+)$/.exec(fr);
        if (it.id === "gotCharm_36") en = "Kingsoul (2 White Fragments)";
        if (it.id === "anySimpleKey") en = "A Simple Key";
        if (pre) en = "#" + pre[1] + " " + en;
        else if (num && !en.includes("#")) en = en + " #" + num[1];
        it.name = en;
        it.en = fr.replace(/^#\d+ /, "");
        if (it.hint && HINTS[it.hint]) it.hint = HINTS[it.hint];
        NAME_EN[fr.replace(/^#\d+ /, "")] = en.replace(/^#\d+ /, "");
      }
    }
  }
  if (global.HKExtras) {
    for (const z of HKExtras.MAP_ZONES) { const e = ZONES_EN[z.id]; if (e) { z.name = e[0]; if (z.sub) z.sub = e[1] || ""; } }
    for (const n of HKExtras.TREE) if (TREE_EN[n.id]) n.label = TREE_EN[n.id];
    Object.assign(HKExtras.ZONES, SHADE_ZONES_EN);
  }
  if (global.HKJournal) for (const e of HKJournal) { const f = e.fr; e.fr = e.en; e.en = f; }
  if (global.HKAchievements) for (const a of HKAchievements) { [a.fr, a.en] = [a.en, a.fr]; [a.frd, a.end] = [a.end, a.frd]; }
  if (global.HKFeatures) {
    for (const s of HKFeatures.STATUES) { const f = s.fr; s.fr = s.en; s.en = f; }
    const SHOPS = { "Sly (avec la Clé du marchand)": "Sly (with the Shopkeeper's Key)", "Mangepatte": "Leg Eater", "Fabricant d'Aiguillons": "Nailsmith",
      "Maîtres d'Aiguillons": "Nailmasters", "Divine (Troupe Grimm)": "Divine (Grimm Troupe)", "Colisée des Fous": "Colosseum of Fools", "Divers": "Other", "Stations de Coléoptère": "Stag Stations" };
    const LABELS = { "Éclat de masque": "Mask Shard", "Fragment de réceptacle": "Vessel Fragment", "Clé simple (si aucune autre trouvée)": "Simple Key (if none found)",
      "Entaille éclair (Oro)": "Dash Slash (Oro)", "Fontaine du Bassin Ancestral (fragment)": "Ancient Basin fountain (fragment)",
      "Ascenseur vers la Cité (fragment)": "Lift to the City (fragment)", "Routes Oubliées": "Forgotten Crossroads", "Vertchemin": "Greenpath",
      "Station de la Reine": "Queen's Station", "Entrepôts de la Cité": "City Storerooms", "Station du Roi": "King's Station",
      "Repos Éternel": "Resting Grounds", "Jardins de la Reine": "Queen's Gardens", "Village Lointain": "Distant Village", "Station Cachée": "Hidden Station",
      "Avarice incassable": "Unbreakable Greed", "Coeur incassable": "Unbreakable Heart", "Force incassable": "Unbreakable Strength",
      "Emplacement de Charme": "Charm Notch", "Bénédiction de Salubra": "Salubra's Blessing",
      "Épreuve des Guerriers": "Trial of the Warrior", "Épreuve du Conquérant": "Trial of the Conqueror", "Épreuve du Fou": "Trial of the Fool" };
    for (const g of [...HKFeatures.SHOP, ...(HKFeatures.SHOP_OPTIONAL || [])]) {
      g.shop = SHOPS[g.shop] || g.shop;
      for (const it of g.items) it.label = LABELS[it.label] || NAME_EN[it.label] || it.label;
    }
    HKFeatures.RELIC_NAMES.splice(0, 4, "Wanderer's Journal", "Hallownest Seal", "King's Idol", "Arcane Egg");
  }

  /* ------------------------------ Lore data ------------------------------ */
  if (global.HKLore) {
    const Q = {
      quirrel: ["Quirrel", "A traveller with a shell mask, met all along his exploration of Hallownest.",
        ["First meeting", "At the Black Egg Temple", "By the Lake of Unn, in Greenpath", "In the City of Tears", "In Crystal Peak", "Near Mantis Village", "At the Deepnest hot spring", "At the Teacher's Archives", "A last moment by the Blue Lake"]],
      cornifer: ["Cornifer", "The cartographer who hums while drawing his maps, area after area.",
        ["Forgotten Crossroads", "Greenpath", "Fog Canyon", "Fungal Wastes", "City of Tears", "Royal Waterways", "Crystal Peak", "Howling Cliffs", "Deepnest", "Kingdom's Edge", "Queen's Gardens", "Ancient Basin", "Back home with Iselda, in Dirtmouth"]],
      elderbug: ["Elderbug", "The last villager of Dirtmouth, always ready to talk about the past.",
        ["First meeting", "History of Dirtmouth (1/3)", "History of Dirtmouth (2/3)", "History of Dirtmouth (3/3)", "Give him the Delicate Flower"]],
      hornet: ["Hornet", "The protector of Hallownest, who tests the Knight throughout the journey.",
        ["The Greenpath duel", "Met in the City of Tears", "Encounter near the fountain", "In the Beast's Den", "The Kingdom's Edge duel"]],
      zote: ["Zote the Mighty", "A self-proclaimed knight, full of precepts and bragging.",
        ["Saved from the Vengefly King", "Found again in the City of Tears", "Saved in Deepnest", "Fought in the Colosseum of Fools", "Grey Prince Zote, in Bretta's dreams"]],
      bretta: ["Bretta", "A young bug lost in the Fungal Wastes, who dreams of heroes.",
        ["Rescued in the Fungal Wastes", "Her diary, on the bench", "Her diary, by the bed"]],
      cloth: ["Cloth", "A warrior looking for a battle worthy of her.", ["First meeting", "In Queen's Gardens", "One last conversation"]],
      tiso: ["Tiso", "A shield-bearing adventurer on his way to the Colosseum of Fools.",
        ["In Dirtmouth", "On a Forgotten Crossroads bench", "By the Blue Lake", "At the Colosseum of Fools", "Tiso's fate"]],
      nailsmith: ["The Nailsmith", "The City of Tears craftsman, obsessed with the perfect nail.",
        ["First meeting", "Forge the Pure Nail", "Spare him: he joins Sheo"]],
      nailmasters: ["The Nailmasters", "Three pupils of the Great Nailsage Sly, each keeper of a secret technique.",
        ["Mato, in Howling Cliffs", "Sheo, in Greenpath", "Oro, in Kingdom's Edge", "Oro and Mato, in Godhome", "Paintmaster Sheo, in Godhome", "Great Nailsage Sly, in Godhome"]],
      seer: ["The Seer", "The last of her moth tribe, keeper of dreams.",
        ["First meeting", "Receive the Dream Nail", "Awaken the Dream Nail", "Hear her last words"]],
      mourner: ["The Grey Mourner", "She grieves a loved one, in the Resting Grounds.", ["First meeting", "Lay down the Delicate Flower", "Receive her reward"]],
      queen: ["The White Lady", "A queen rooted at the heart of Queen's Gardens.", ["First meeting", "First conversation", "Second conversation", "Receive her White Fragment"]],
      mushroom: ["Mister Mushroom", "A mysterious traveller who appears in the most remote corners of the kingdom.",
        [1, 2, 3, 4, 5, 6, 7].map((n) => `Encounter ${n} of 7`)],
      grimm: ["The Grimm Troupe", "A travelling troupe summoned by the Nightmare Lantern.",
        ["Meet Grimm in his tent", "Meet Brumm", "Defeat Grimm", "Complete the Ritual", "Or banish the troupe: Nymm in Dirtmouth"]],
      godseeker: ["The Godseeker", "She comes from a distant land to find the gods of Hallownest.",
        ["Wake her in the Junk Pit", "Receive the Godtuner", "Complete the Pantheon of the Knight", "Complete the Pantheon of Hallownest"]],
      others: ["Other encounters", "Merchants and characters met along the way.",
        ["Iselda, the map shop", "Sly, rescued in the Forgotten Crossroads", "Salubra, the charm seller", "The Leg Eater, in the Fungal Wastes",
          "Lemm, the relic seeker", "Millibelle the banker", "Myla, in Crystal Peak", "Jiji, the Confessor", "The Hunter",
          "Emilitia, in the City of Tears", "The Midwife, in Deepnest", "Divine, of the Grimm Troupe", "The Last Stag", "The Little Fool, at the Colosseum"]],
    };
    for (const q of HKLore.QUESTS) {
      const e = Q[q.id];
      if (!e) continue;
      q.name = e[0]; q.intro = e[1];
      q.steps.forEach((s, i) => { if (e[2][i]) s.label = e[2][i]; });
    }
    const R = {
      dreamers: ["The Dreamers", "Break the three Dreamers' seals",
        "Lurien the Watcher, Monomon the Teacher and Herrah the Beast accepted an eternal sleep to hold the seals of the Black Egg Temple, where the Hollow Knight contains the Infection."],
      hornet: ["Hornet's origins", "Find Hornet in the Beast's Den",
        "Herrah agreed to become a Dreamer in exchange for a child from the Pale King: Hornet. That is why she watches over her sleeping mother and the kingdom."],
      abyss: ["The Abyss and the vessels", "Descend to the bottom of the Abyss",
        "The Abyss is the birthplace of the vessels born of the Void. The Pale King sought there a mindless vessel able to contain the Radiance. The Knight is one of them, back from that exile."],
      queen: ["The White Lady", "Receive the White Lady's White Fragment",
        "The Pale King's consort withdrew to Queen's Gardens. She knows the price of her husband's plan and entrusts the Knight with half of a royal soul."],
      king: ["The Pale King's memory", "Reach the top of the White Palace",
        "In the White Palace, you learn how the Pale King chose the Hollow Knight, whom he believed pure, to seal the Radiance, and what that choice cost the other vessels."],
      void: ["The Void Heart", "Unite Kingsoul with the Void of the Abyss",
        "By uniting the royal soul with the Void, the Knight gains authority over the shades of the Abyss: the condition to face the Radiance itself."],
      grimm: ["The troupe's Ritual", "Complete the Ritual or banish the troupe",
        "Grimm's troupe travels from kingdom to kingdom for a ritual of rebirth: its flames pass to a child who becomes the next Grimm. Brumm dreams of ending it."],
      radiance: ["The Radiance", "Face the light at the heart of the dream",
        "The Radiance is a god of light forgotten by the bugs of Hallownest in favour of the Pale King. The Infection is her way of taking back their minds through their dreams."],
      godhome: ["Godhome", "Complete the Pantheon of Hallownest",
        "The Godseekers travelled the lands to find a god worthy of worship. At the top of the Pantheon of Hallownest, they find something unexpected."],
    };
    for (const r of HKLore.REVELATIONS) { const e = R[r.id]; if (e) { r.title = e[0]; r.lock = e[1]; r.text = e[2]; } }
    const N = {
      knight: ["The Knight", "A silent vessel returned to Hallownest. Born of the Void, it shares the nature of the Hollow Knight."],
      radiance: ["The Radiance", "A god of light, forgotten when the Pale King rose. The Infection is her way of taking back minds through dreams."],
      paleKing: ["The Pale King", "The Wyrm turned king, who gave bugs their minds and the kingdom of Hallownest. To defeat the Infection, he created the vessels."],
      whiteLady: ["The White Lady", "The Pale King's consort, withdrawn to Queen's Gardens. She holds half of Kingsoul."],
      hollowKnight: ["The Hollow Knight", "The chosen vessel, sealed in the Black Egg Temple to contain the Radiance. The seal is weakening."],
      hornet: ["Hornet", "The protector of Hallownest. She tests the Knight, then helps in her own way."],
      lurien: ["Lurien", "The Watcher of the City of Tears, one of the three Dreamers holding the seal."],
      monomon: ["Monomon", "The Teacher of Fog Canyon, the second Dreamer. Quirrel served her."],
      herrah: ["Herrah", "The Beast of Deepnest, third Dreamer. She took that role in exchange for a child: Hornet."],
      seer: ["The Seer", "The last of the moth tribe, who once worshipped the Radiance before forsaking her."],
      quirrel: ["Quirrel", "A traveller without memory, who finds it again in the Teacher's Archives: he served Monomon."],
      grimm: ["Grimm", "The master of a troupe from afar, who invites the Knight to take part in his Ritual."],
    };
    for (const n of HKLore.NODES) { const e = N[n.id]; if (e) { n.name = e[0]; n.text = e[1]; } }
    const LK = { "époux": "consort", "père": "father", "mère": "mother", "l'a choisi": "chose him", "rivaux": "rivals", "la retient": "contains her",
      "nés du Vide": "born of the Void", "scelle": "seals", "l'a reniée": "forsook her", "l'a servie": "served her", "Âme-royale": "Kingsoul", "le Rituel": "the Ritual" };
    for (const l of HKLore.LINKS) l[2] = LK[l[2]] || l[2];
  }

  /* --------------------------- Interface text --------------------------- */
  const UI = {
    "Tracker 112 % : chargez votre sauvegarde, on vous dit ce qu'il manque.": "112% tracker: load your save, we tell you what's missing.",
    "Source": "Source", "% en jeu": "In-game %", "Temps de jeu": "Play time", "Manuel": "Manual", "Sauvegarde": "Save", "Save (Âme d'acier)": "Save (Steel Soul)",
    "Glissez votre fichier": "Drop your", "ici": "file here", "ou cliquez pour le choisir": "or click to choose it",
    "Tout est lu dans votre navigateur. Rien n'est envoyé sur un serveur.": "Everything is read in your browser. Nothing is sent to a server.",
    "Suivre le fichier en direct": "Watch the file live", "● Suivi en direct (arrêter)": "● Watching live (stop)",
    "Réinitialiser": "Reset", "Retirer la sauvegarde": "Remove the save",
    "Prévenir des nouveautés en direct": "Alert me about new items while watching",
    "Où trouver ma sauvegarde ?": "Where is my save file?", "Les fichiers s'appellent": "The files are named", "à": "to",
    "(un par emplacement de partie).": "(one per save slot).",
    "Astuce Windows : collez le chemin dans la barre d'adresse de l'explorateur. Sur macOS : Finder → Aller → Aller au dossier (⇧⌘G).":
      "Windows tip: paste the path in the File Explorer address bar. On macOS: Finder → Go → Go to Folder (⇧⌘G).",
    "Les 112 cases": "The 112 squares", "Chaque case vaut 1 %. Cliquez sur une couleur pour aller à sa catégorie.": "Each square is worth 1%. Click a colour to jump to its category.",
    "✓ Checklist": "✓ Checklist", "⌖ Carte d'Hallownest": "⌖ Hallownest map", "⟡ Arbre de progression": "⟡ Progression tree",
    "☰ Journal du chasseur": "☰ Hunter's Journal", "✦ Succès": "✦ Achievements", "☀ Salle des Dieux": "☀ Hall of Gods",
    "◈ Builds de charmes": "◈ Charm builds", "∑ Statistiques": "∑ Statistics", "✧ Lore et rencontres ↗": "✧ Lore & encounters ↗",
    "Objets optionnels": "Optional items", "Tout": "All", "Manquants": "Missing", "Obtenus": "Obtained", "Indices": "Hints", "Noms anglais": "French names",
    "Rechercher (ex. Nosk, Salubra, Jardins, Mantis…)": "Search (e.g. Nosk, Salubra, Gardens, Mantis…)",
    "requis": "required", "hors %": "not in %", "wiki ↗": "wiki ↗", "Ouvrir le wiki": "Open the wiki", "Rien à afficher avec ce filtre.": "Nothing to show with this filter.",
    "Carte d'Hallownest": "Hallownest map",
    "Plan schématique des zones, colorées selon votre progression. Cliquez sur une zone pour voir ce qu'il y reste à trouver.":
      "Schematic plan of the areas, coloured by your progress. Click an area to see what is left to find.",
    "Zone terminée ✦": "Area complete ✦",
    "Le chemin d'Hallownest": "The path through Hallownest",
    "Les grandes étapes de la partie, dans l'ordre où on les franchit en général.": "The main milestones of the game, in the order they are usually reached.",
    "obtenu ·": "obtained ·", "accessible maintenant ·": "reachable now ·", "à débloquer": "locked", "Prochains objectifs": "Next goals",
    "Début": "Early game", "Milieu": "Mid game", "Late game": "Late game", "Fin de partie": "Endgame",
    "Toutes les étapes clés sont franchies. Bravo !": "Every key milestone is done. Well done!",
    "Journal du chasseur": "Hunter's Journal", "Chaque créature, le nombre de victoires qu'il reste pour compléter ses notes.": "Every creature and the kills left to complete its notes.",
    "Rechercher une créature…": "Search a creature…", "Toutes": "All", "À découvrir": "Undiscovered", "À chasser": "To hunt", "Complètes": "Complete",
    "Pas encore rencontré": "Not encountered yet", "Notes complètes ✦": "Notes complete ✦", "entrées découvertes": "entries discovered", "notes complètes": "notes complete",
    "Marque du chasseur": "Hunter's Mark", "Marque du chasseur obtenue": "Hunter's Mark obtained", "Entrées supplémentaires": "Extra entries",
    "Boss secrets et contenus additionnels : ils ne comptent pas pour la Marque du chasseur.": "Secret bosses and additional content: they do not count for the Hunter's Mark.",
    "Pour obtenir la Marque du chasseur, il faut compléter les notes de toutes les entrées (vaincre chaque créature le nombre de fois demandé), puis retourner voir le Chasseur dans le Vertchemin.":
      "To get the Hunter's Mark, complete the notes of every entry (defeat each creature the required number of times), then go back to the Hunter in Greenpath.",
    "Succès": "Achievements", "Les succès du jeu, déduits de votre sauvegarde.": "The game's achievements, deduced from your save.",
    "succès obtenus d'après la sauvegarde": "achievements obtained according to the save", "restants": "remaining", "impossibles à vérifier depuis la save": "cannot be checked from the save",
    "Tous": "All", "Restants": "Remaining", "Incertains": "Uncertain", "La sauvegarde ne permet pas de le vérifier.": "The save cannot confirm this one.",
    "Les succès Steam, Xbox ou PlayStation sont liés à votre compte, pas à la sauvegarde : cette liste indique ce que la sauvegarde permet de déduire.":
      "Steam, Xbox or PlayStation achievements belong to your account, not the save: this list shows what the save lets us deduce.",
    "Salle des Dieux": "Hall of Gods", "Les statues de la Maison des Dieux et le niveau atteint contre chaque boss.": "The Godhome statues and the level reached against each boss.",
    "statues débloquées": "statues unlocked", "Attuned (difficulté 1)": "Attuned (difficulty 1)", "Ascended (difficulté 2)": "Ascended (difficulty 2)", "Radiant (difficulté 3)": "Radiant (difficulty 3)",
    "Chaque statue de la Salle des Dieux peut être vaincue à trois niveaux : Attuned, Ascended et Radiant (noms anglais du jeu). Les Panthéons sont suivis dans la checklist.":
      "Each statue in the Hall of Gods can be beaten at three levels: Attuned, Ascended and Radiant. Pantheons are tracked in the checklist.",
    "Builds de charmes": "Charm builds", "Composez un build avec les Charmes que vous possédez, en tenant compte de vos emplacements.": "Build a loadout with the charms you own, within your notches.",
    "Emplacements utilisés": "Notches used", "Build équipé en jeu": "Build equipped in game", "Vider": "Clear", "Enregistrer ce build": "Save this build",
    "Surcharge : les dégâts reçus sont doublés": "Overcharmed: you take double damage", "Mes builds": "My builds",
    "Cliquez sur des Charmes ci-dessous pour composer un build.": "Click charms below to build a loadout.",
    "Âme-royale": "Kingsoul", "Coeur du vide": "Void Heart", "L'Héritier de Grimm": "Grimmchild", "Mélodie Insouciante": "Carefree Melody",
    "Statistiques": "Statistics", "Masques": "Masks", "Réceptacles d'Âme": "Soul Vessels", "Emplacements de Charme": "Charm notches",
    "Votre ombre": "Your shade", "Aucune ombre": "No shade", "Vous n'avez rien perdu": "You lost nothing",
    "Mode classique": "Classic mode", "Mode Âme d'acier": "Steel Soul mode", "% affiché en jeu": "In-game %", "Essences": "Essence", "Voyante comblée": "Seer fulfilled",
    "Dégâts de l'Aiguillon": "Nail damage", "Charmes possédés": "Charms owned", "Larves sauvées": "Grubs rescued", "Salles visitées": "Rooms visited",
    "Reliques en poche": "Relics held", "Oeufs rances": "Rancid Eggs", "Zote le Prince Gris": "Grey Prince Zote", "Protecteur Blanc": "White Defender",
    "victoires": "wins", "Fleur délicate": "Delicate Flower", "Jamais brisée": "Never broken", "Charmes équipés": "Equipped charms", "Aucun": "None",
    "Marque du chasseur obtenue ✦": "Hunter's Mark obtained ✦",
    "Le jeu n'enregistre pas le nombre de morts : seule la position de votre ombre (votre dernière mort) est connue.": "The game does not record deaths: only your shade's location (your last death) is known.",
    "Budget en Geo pour le 112 %": "Geo budget for 112%", "restent à dépenser en achats nécessaires": "left to spend on required purchases",
    "Disponible": "Available", "en poche": "in your pocket", "en poche et à la banque": "in your pocket and at the bank", "Reliques à vendre": "Relics to sell",
    "chez Lemm": "to Lemm", "Il manque": "Missing", "Verdict": "Verdict", "Ça suffit ✦": "Enough ✦", "pas besoin de farmer": "no need to farm",
    "en vendant vos reliques, c'est bon": "selling your relics covers it", "après la vente des reliques": "after selling the relics",
    "Détail des achats restants": "Remaining purchases",
    "⇩ Image récapitulative à partager": "⇩ Shareable recap image", "🔗 Copier un lien de partage": "🔗 Copy a share link",
    "Nouveautés": "New", "Revenir à ma progression": "Back to my progress",
    "👁 Vous consultez la progression partagée par quelqu'un d'autre (lecture seule).": "👁 You are viewing someone else's shared progress (read-only).",
    "Lore d'Hallownest": "Hallownest lore", "Lore": "Lore", "d'Hallownest": "of Hallownest",
    "Quêtes, rencontres et révélations, suivies depuis votre sauvegarde.": "Quests, encounters and revelations, tracked from your save.",
    "← Retour au tracker": "← Back to the tracker", "Charger une sauvegarde": "Load a save",
    "Afficher les révélations sans flou": "Show revelations without blur",
    "Cette page montre quels personnages vous avez rencontrés et quelles conversations ont eu lieu, d'après votre sauvegarde. Les résumés sont rédigés pour ce site ; les dialogues complets du jeu sont sur le wiki (lien sur chaque carte).":
      "This page shows which characters you met and which conversations happened, according to your save. Summaries are written for this site; the game's full dialogue is on the wiki (link on each card).",
    "La toile d'Hallownest": "The web of Hallownest", "Révélations": "Revelations", "Quêtes et rencontres": "Quests and encounters",
    "Découvert": "Discovered", "Verrouillé": "Locked", "En savoir plus sur le wiki ↗": "Read more on the wiki ↗", "Dialogues et détails sur le wiki ↗": "Dialogue and details on the wiki ↗",
    "Personnage inconnu": "Unknown character", "Continuez votre exploration pour le découvrir.": "Keep exploring to discover them.", "Cliquer pour lire": "Click to read",
    "Projet de fan, non affilié à Team Cherry.": "Fan project, not affiliated with Team Cherry.",
    "Chargez une sauvegarde pour voir vos statistiques.": "Load a save to see your statistics.",
    "Chargez une sauvegarde pour voir votre Journal du chasseur.": "Load a save to see your Hunter's Journal.",
    "Chargez une sauvegarde pour voir vos succès.": "Load a save to see your achievements.",
    "Chargez une sauvegarde pour voir la Salle des Dieux.": "Load a save to see the Hall of Gods.",
    "Chargez une sauvegarde pour composer un build avec vos Charmes.": "Load a save to build a loadout with your charms.",
    "Aucune sauvegarde chargée : chargez-en une ici ou sur le tracker.": "No save loaded: load one here or on the tracker.",
    "Masquer les nouveautés": "Hide new items", "Sauvegarde retirée. Mode manuel.": "Save removed. Manual mode.",
    "Une sauvegarde est chargée : retirez-la pour cocher à la main.": "A save is loaded: remove it to tick items by hand.",
    "🔗 Lien de partage copié dans le presse-papiers.": "🔗 Share link copied to the clipboard.",
    "Suivi en direct actif : la page se met à jour à chaque sauvegarde du jeu (banc, changement de zone…).": "Live watch on: the page updates every time the game saves (bench, area change…).",
    "Hollow Knight": "Hollow Knight", "Completionist": "Completionist",
    "✧ Lore et rencontres": "✧ Lore & encounters", "Lore et rencontres": "Lore & encounters",
    "Les personnages rencontrés, les conversations qui ont eu lieu et les grandes révélations, d'après votre sauvegarde. Les résumés sont rédigés pour ce site ; les dialogues complets du jeu sont sur le wiki (lien sur chaque carte).":
      "The characters you met, the conversations that happened and the great revelations, according to your save. Summaries are written for this site; the game's full dialogue is on the wiki (link on each card).",
    "Chargez une sauvegarde pour révéler les personnages et les quêtes.": "Load a save to reveal the characters and quests.",
    "Rechercher une créature ou une zone…": "Search a creature or an area…", "Grouper par zone": "Group by area",
    "Noms des créatures non rencontrées": "Names of unmet creatures", "Aucune créature avec ce filtre.": "No creature with this filter.",
    "ne comptent pas pour la Marque du chasseur": "do not count for the Hunter's Mark",
    "Achats optionnels (complétion totale)": "Optional purchases (full completion)",
    "Charmes incassables de Divine, emplacements et bénédiction de Salubra": "Divine's unbreakable charms, Salubra's notches and blessing",
    "Il manque, avec ces achats": "Missing, with these purchases", "Avec ces achats": "With these purchases", "tout est payable": "you can afford everything",
    "Détail des achats optionnels": "Optional purchases",
    "Objets": "Items", "Essence": "Essence", "Mode de la carte": "Map mode",
    "Rien à faire dans cette zone pour ce mode.": "Nothing to do in this area for this mode.", "Chargez une sauvegarde pour ce mode.": "Load a save for this mode.",
    "Chargez une sauvegarde pour suivre votre Essence.": "Load a save to track your Essence.",
    "Racines de rêve restantes": "Whispering Roots left", "Rêves de guerriers restants": "Warrior Dreams left", "Boss des rêves restants": "Dream bosses left",
    "chacun donne beaucoup d'Essence": "each gives a lot of Essence", "optionnels, très rentables": "optional, very rewarding",
    "toutes les récompenses obtenues ✦": "every reward obtained ✦", "Notes complètes ✦": "Notes complete ✦",
    "Rêve de guerrier : beaucoup d'Essence": "Warrior Dream: a lot of Essence", "Boss des rêves : beaucoup d'Essence": "Dream boss: a lot of Essence",
    "Sceau d'Hallownest": "Hallownest Seal", "Minerai pâle": "Pale Ore", "Porteur de rêves": "Dream Wielder", "Fragment de réceptacle": "Vessel Fragment",
    "Portail des Rêves": "Dreamgate", "Oeuf arcanique": "Arcane Egg", "Éclat de masque": "Mask Shard", "Aiguillon éveillé des rêves": "Awoken Dream Nail",
    "Derniers mots de la Voyante": "The Seer's last words",
    "Astuces : récoltez chaque racine de rêve en entier (frappez les orbes avec l'Aiguillon des rêves), affrontez les rêves de guerriers et les boss des rêves, et équipez le Charme Porteur de rêves, qui fait tomber plus souvent de l'Essence des ennemis vaincus.":
      "Tips: harvest every Whispering Root fully (hit the orbs with the Dream Nail), fight the Warrior Dreams and dream bosses, and equip Dream Wielder, which makes defeated enemies drop Essence more often.",
    "Langue": "Language", "de jeu": "played", "Âme d'acier": "Steel Soul", "mode classique": "classic mode", "Progression manuelle": "Manual progress",
    "Charmes": "Charms", "Larves": "Grubs", "Journal": "Journal", "Ma progression Hollow Knight": "My Hollow Knight progress",
  };
  // Every French item name also translates on its own (lists, chips, budget…).
  for (const [fr, en] of Object.entries(NAME_EN)) if (!UI[fr]) UI[fr] = en;

  const RULES = [
    [/^Projet de fan, non affilié à Team Cherry\..*/, "Fan project, not affiliated with Team Cherry. Item names come from the game's official text; the « wiki » links lead to "],
    [/^\.\s*Sans sauvegarde, cliquez sur les éléments pour les cocher à la main.*$/s, ". Without a save, click items to tick them by hand (stored in this browser)."],
    [/^(\d+) \/ (\d+) étapes clés franchies$/, "$1 / $2 key milestones done"],
    [/^(\d+) \/ (\d+) zones complètes · (\d+) \/ (\d+) objets$/, "$1 / $2 areas complete · $3 / $4 items"],
    [/^À trouver \((\d+)\)$/, "To find ($1)"], [/^Obtenu \((\d+)\)$/, "Obtained ($1)"],
    [/^Encore (\d+) à vaincre$/, "$1 more to defeat"],
    [/^Encore (\d+) à vaincre \((\d+)\/(\d+)\)$/, "$1 more to defeat ($2/$3)"],
    [/^Pas encore rencontré · (\d+) à vaincre$/, "Not encountered yet · $1 to defeat"],
    [/^(\d+) Essences$/, "$1 Essence"],
    [/^À chasser \((\d+)\)$/, "To hunt ($1)"], [/^À récolter \((\d+)\)$/, "To harvest ($1)"],
    [/^(\d+) \/ (\d+) zones complètes · (\d+) \/ (\d+) (créatures|sources d'Essence)$/, (m, a, b, c, d, u) => `${a} / ${b} areas complete · ${c} / ${d} ${u === "créatures" ? "creatures" : "Essence sources"}`],
    [/^encore ([\d\s ]+) pour (.+)$/, (m, n, what) => `${n} more for ${UI[what] || what}`],
    [/^palier ([\d\s ]+) atteint : allez voir la Voyante !$/, "$1 reached: go see the Seer!"],
    [/^([\d\s ]+) Essences à récolter$/, "$1 Essence to harvest"],
    [/^(\d+) à compléter$/, "$1 to complete"],
    [/^Vos Charmes \((\d+)\/40\)$/, "Your charms ($1/40)"],
    [/^(\d+) vendue\(s\) à Lemm$/, "$1 sold to Lemm"], [/^(\d+) vendu\(s\) à Jinn$/, "$1 sold to Jinn"],
    [/^(\d+) fois brisée$/, "broken $1 time(s)"],
    [/^([\d\s ]+) Geo à récupérer$/, "$1 Geo to recover"],
    [/^([\d\s ]+) avant les derniers mots de la Voyante$/, "$1 more for the Seer's last words"],
    [/^(\d+) nouvel(?:s)? objet(?:s)? depuis la sauvegarde précédente$/, "$1 new item(s) since the previous save"],
    [/^(.+) · chargé le (.+)$/, "$1 · loaded on $2"],
    [/^(\d+) h (\d+) de jeu en plus$/, "$1 h $2 more play time"],
    [/^(\d+) \/ (\d+) personnages révélés$/, "$1 / $2 characters revealed"],
    [/^✔ (.+) chargé \(version (.*)\) à (.+?)( · (\d+) nouveauté\(s\) !| · rien de nouveau depuis la dernière fois)?$/,
      (m, f, v, t, x, n) => `✔ ${f} loaded (version ${v}) at ${t}` + (x ? (n ? ` · ${n} new item(s)!` : " · nothing new since last time") : "")],
    [/^✖ Impossible de lire la sauvegarde : (.*)$/, "✖ Could not read the save: $1"],
    [/^Dernière sauvegarde chargée le (.+)\. Rechargez-la pour mettre à jour\.$/, "Last save loaded on $1. Load it again to update."],
    [/^✔ Données de (.+), chargée le (.+)$/, "✔ Data from $1, loaded on $2"],
    [/^Le jeu indique (.*)$/, null],
    [/^Rencontre (\d) sur 7$/, "Encounter $1 of 7"],
    [/^✔ (.+) chargé$/, "✔ $1 loaded"],
    [/^Suivi interrompu : (.*)$/, "Watch stopped: $1"],
  ];

  function tr(text) {
    const trimmed = text.trim();
    if (!trimmed) return null;
    if (UI[trimmed] !== undefined) return text.replace(trimmed, UI[trimmed]);
    for (const [re, rep] of RULES) {
      if (rep === null) continue;
      if (re.test(trimmed)) return text.replace(trimmed, trimmed.replace(re, rep));
    }
    return null;
  }

  function translate(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentNode && /^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      const out = tr(n.nodeValue);
      if (out !== null && out !== n.nodeValue) n.nodeValue = out;
    }
    const els = root.querySelectorAll ? root.querySelectorAll("[placeholder],[title],[aria-label]") : [];
    for (const el of els) {
      for (const a of ["placeholder", "title", "aria-label"]) {
        const v = el.getAttribute(a);
        if (v) { const out = tr(v); if (out !== null) el.setAttribute(a, out); }
      }
    }
  }

  // Coherence message (built from several parts)
  function fixCoherence() {
    const el = document.getElementById("coherence");
    if (!el || el.hidden || el.dataset.en) return;
    const b = el.querySelectorAll("b");
    if (el.classList.contains("ok") && b[0]) el.innerHTML = `✔ The site and the game agree: <b>${b[0].textContent}</b>.`;
    else if (el.classList.contains("warn") && b.length >= 2) {
      el.innerHTML = `⚠ The game says <b>${b[0].textContent}</b>, the site counts <b>${b[1].textContent}</b>.
        <span>The game only updates its percentage at certain moments (for example when opening the inventory): open the inventory in game, save at a bench and load the file again. If the gap remains, it is a mistake on the site: please report it.</span>`;
    }
    el.dataset.en = "1";
  }

  global.HKI18n.t = (fr) => (UI[fr] !== undefined ? UI[fr] : fr);

  const run = () => {
    translate(document.body);
    fixCoherence();
    document.title = document.title.replace("Lore d'Hallownest", "Hallownest Lore");
  };
  const obs = new MutationObserver((muts) => {
    obs.disconnect();
    for (const m of muts) for (const n of m.addedNodes) {
      if (n.nodeType === 1) translate(n);
      else if (n.nodeType === 3) { const out = tr(n.nodeValue); if (out !== null) n.nodeValue = out; }
      if (n.nodeType === 1 && n.id === "coherence") fixCoherence();
    }
    const co = document.getElementById("coherence");
    if (co) { delete co.dataset.en; fixCoherence(); }
    obs.observe(document.body, { childList: true, subtree: true, characterData: false });
  });
  const start = () => {
    run();
    obs.observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})(typeof window !== "undefined" ? window : globalThis);
