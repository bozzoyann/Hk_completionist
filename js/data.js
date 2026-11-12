/*
 * Hollow Knight completion data (112%).
 *
 * Each item: { id, name (official French name), en (English name), hint, wiki, check(pd, scene) -> boolean }
 * Each section: { id, title, max (in %), group | pctEach }
 * Sections with `extra: true` do not count toward game completion.
 *
 * French names come from the game's official French localisation text.
 * Wiki links point to the English wiki (hollowknight.wiki), whose page names are English.
 */
(function (global) {
  "use strict";

  const flag = (key) => (pd) => pd[key] === true;
  const scene = (id, sceneName) => (pd, sc) => sc(id, sceneName);
  const anyOf = (...fns) => (pd, sc) => fns.some((f) => f(pd, sc));
  const door = (n) => (pd) => !!(pd["bossDoorStateTier" + n] && pd["bossDoorStateTier" + n].completed);

  const charm = (n, name, en, hint) => ({
    id: "gotCharm_" + n,
    name: `#${n} ${name}`,
    en,
    hint,
    wiki: en.replace(/ /g, "_"),
    check: (pd) => pd["gotCharm_" + n] === true,
  });


  const has = (list, scene) => Array.isArray(list) && list.includes(scene);
  const GRUB_SCENES = [];
  const grub = (n, sceneName, zone, hint) => {
    GRUB_SCENES.push(sceneName);
    return { id: "grub_" + sceneName, name: "Larve #" + n, en: "Grub", hint, zone, wiki: "Grub", check: (pd) => has(pd.scenesGrubRescued, sceneName) };
  };
  // The three grubs in the Collector's room share one scene: count them from the total.
  const collectorGrub = (n, k) => ({
    id: "grub_Collector_" + k, name: "Larve #" + n, en: "Grub", hint: "Tour de l'Amour, chez le Collectionneur (" + k + "/3)", zone: "city", wiki: "Grub",
    check: (pd) => {
      if (!has(pd.scenesGrubRescued, "Ruins2_11")) return false;
      const others = GRUB_SCENES.filter((sc) => has(pd.scenesGrubRescued, sc)).length;
      return Math.max(1, Math.min(3, (pd.grubsCollected || 0) - others)) >= k;
    },
  });
  const root = (n, sceneName, zone, hint, essence) => ({
    id: "root_" + sceneName, name: "Racine de rêve #" + n, en: "Whispering Root", hint: hint + " · " + essence + " Essences", zone, essence, wiki: "Whispering_Root",
    check: (pd) => has(pd.scenesEncounteredDreamPlantC, sceneName),
  });

  const SECTIONS = [
    {
      id: "bosses", title: "Boss", max: 14, icon: "⚔",
      desc: "Chaque boss de cette liste rapporte 1 %.",
      items: [
        { id: "bossGruzMother", name: "Mère de Gruz", en: "Gruz Mother", hint: "Routes Oubliées, en bas à droite", wiki: "Gruz_Mother", check: flag("killedBigFly") },
        { id: "falseKnightDefeated", name: "Faux Chevalier", en: "False Knight", hint: "Routes Oubliées, au centre", wiki: "False_Knight", check: flag("killedFalseKnight") },
        { id: "hornet1Defeated", name: "Hornet (Vertchemin)", en: "Hornet Protector", hint: "Vertchemin, au-dessus de la station de Coléoptère", wiki: "Hornet_Protector", check: flag("hornet1Defeated") },
        { id: "bossBroodingMawlek", name: "Mawlek Maussade", en: "Brooding Mawlek", hint: "Routes Oubliées, nécessite la Pince de mante religieuse", wiki: "Brooding_Mawlek", check: flag("killedMawlek") },
        { id: "defeatedDungDefender", name: "Défenseur Bousier", en: "Dung Defender", hint: "Voies d'Eau Royales, à droite", wiki: "Dung_Defender", check: flag("killedDungDefender") },
        { id: "mageLordDefeated", name: "Maître de l'Âme", en: "Soul Master", hint: "Cité des Larmes : Sanctuaire de l'Âme", wiki: "Soul_Master", check: flag("killedMageLord") },
        { id: "defeatedMantisLords", name: "Dames Mante", en: "Mantis Lords", hint: "Caverne Nocive : Village des Mantes", wiki: "Mantis_Lords", check: flag("killedMantisLord") },
        { id: "killedMimicSpider", name: "Nosk", en: "Nosk", hint: "Nid-profond, à gauche de la source chaude (Coeur de cristal)", wiki: "Nosk", check: flag("killedMimicSpider") },
        { id: "killedInfectedKnight", name: "Vaisseau Brisé", en: "Broken Vessel", hint: "Bassin Ancestral, en bas à gauche", wiki: "Broken_Vessel", check: flag("killedInfectedKnight") },
        { id: "collectorDefeated", name: "Le Collectionneur", en: "The Collector", hint: "Cité des Larmes : Tour de l'Amour (Clé de l'amour)", wiki: "The_Collector", check: flag("killedJarCollector") },
        { id: "defeatedMegaJelly", name: "Uumuu", en: "Uumuu", hint: "Brumes-canyon : Archives de l'Érudite", wiki: "Uumuu", check: flag("killedMegaJellyfish") },
        { id: "hornetOutskirtsDefeated", name: "Hornet (Frontières du Royaume)", en: "Hornet Sentinel", hint: "Frontières du Royaume, nécessite les Ailes de monarque", wiki: "Hornet_Sentinel", check: flag("hornetOutskirtsDefeated") },
        { id: "killedTraitorLord", name: "Seigneur Traître", en: "Traitor Lord", hint: "Jardins de la Reine, nécessite la Cape des ombres", wiki: "Traitor_Lord", check: flag("killedTraitorLord") },
        { id: "killedBlackKnight", name: "Veilleurs", en: "Watcher Knights", hint: "Cité des Larmes : L'Observatoire", wiki: "Watcher_Knights", check: flag("killedBlackKnight") },
      ],
    },
    {
      id: "charms", title: "Charmes", max: 40, icon: "✦",
      desc: "Chaque Charme rapporte 1 %. Les Charmes fragiles comptent une seule fois.",
      items: [
        charm(1, "Essaim cueilleur", "Gathering Swarm", "Sly : 300 Geo"),
        charm(2, "Boussole murmurante", "Wayward Compass", "Iselda : 220 Geo"),
        charm(3, "Chant des larves", "Grubsong", "Père des larves : 10 larves sauvées"),
        charm(4, "Carapace infrangible", "Stalwart Shell", "Sly : 200 Geo"),
        charm(5, "Carapace de Baldur", "Baldur Shell", "Falaises Hurlantes, en bas, près de Vertchemin"),
        charm(6, "Fureur des disparus", "Fury of the Fallen", "Passe du Roi, rebondir sur les pics"),
        charm(7, "Canalisation rapide", "Quick Focus", "Salubra : 800 Geo"),
        charm(8, "Coeur sang-de-vie", "Lifeblood Heart", "Salubra : 250 Geo"),
        charm(9, "Noyau sang-de-vie", "Lifeblood Core", "Les Abysses : porte des 15 masques sang-de-vie"),
        charm(10, "Écu du défenseur", "Defender's Crest", "Voies d'Eau Royales : vaincre le Défenseur Bousier"),
        charm(11, "Nid de Flukes", "Flukenest", "Voies d'Eau Royales : vaincre Flukemarm"),
        charm(12, "Épines d'agonie", "Thorns of Agony", "Vertchemin, nécessite la Cape d'ailes de papillon"),
        charm(13, "Marque de respect", "Mark of Pride", "Village des Mantes : vaincre les Dames Mante"),
        charm(14, "Roc solide", "Steady Body", "Salubra : 120 Geo"),
        charm(15, "Coup puissant", "Heavy Blow", "Sly : 350 Geo + Clé du marchand"),
        charm(16, "Ombre tranchante", "Sharp Shadow", "Nid-profond, nécessite la Cape des ombres"),
        charm(17, "Champi-spore", "Spore Shroom", "Caverne Nocive, près des Jardins de la Reine"),
        charm(18, "Longue-lame", "Longnail", "Salubra : 300 Geo"),
        charm(19, "Pierre du shaman", "Shaman Stone", "Salubra : 220 Geo"),
        charm(20, "Capturâme", "Soul Catcher", "Routes Oubliées : Butte Ancestrale"),
        charm(21, "Mangeur d'Âme", "Soul Eater", "Repos Éternel, nécessite l'Élan ravageur"),
        charm(22, "Ventre rutilant", "Glowing Womb", "Routes Oubliées, nécessite le Coeur de cristal"),
        charm(23, "Coeur fragile", "Fragile Heart", "Mangepatte : 350 Geo"),
        charm(24, "Avarice fragile", "Fragile Greed", "Mangepatte : 250 Geo"),
        charm(25, "Force fragile", "Fragile Strength", "Mangepatte : 600 Geo"),
        charm(26, "Gloire du Maître d'Aiguillons", "Nailmaster's Glory", "Sly : après avoir appris les 3 Arts de l'Aiguillon"),
        charm(27, "Bénédiction de Joni", "Joni's Blessing", "Falaises Hurlantes : Pierre Tombale de Joni"),
        charm(28, "Forme d'Unn", "Shape of Unn", "Vertchemin : Lac d'Unn, nécessite la Larme d'Isma"),
        charm(29, "Sang-de-ruche", "Hiveblood", "La Ruche : après le Chevalier de la Ruche"),
        charm(30, "Porteur de rêves", "Dream Wielder", "Voyante : 500 Essences"),
        charm(31, "Maître de la célérité", "Dashmaster", "Caverne Nocive, sous le banc près de Bretta"),
        charm(32, "Entaille rapide", "Quick Slash", "Frontières du Royaume, nécessite l'Élan ravageur"),
        charm(33, "Tourmenteur d'Âme", "Spell Twister", "Cité des Larmes : Sanctuaire de l'Âme"),
        charm(34, "Canalisation intense", "Deep Focus", "Mont Cristal, nécessite le Coeur de cristal"),
        charm(35, "Larve-mouche élégie", "Grubberfly's Elegy", "Père des larves : les 46 larves sauvées"),
        {
          id: "gotCharm_36", name: "#36 Âme-royale (2 Fragments blancs)", en: "Kingsoul", wiki: "Kingsoul",
          hint: "Dame Blanche (Jardins de la Reine) + Palais Blanc",
          check: (pd) => pd.royalCharmState > 2,
        },
        charm(37, "Maître de la vitesse", "Sprintmaster", "Sly : 400 Geo + Clé du marchand"),
        charm(38, "Bouclier éthéré", "Dreamshield", "Repos Éternel, à gauche sous la Voyante"),
        charm(39, "Chant du Tisserand", "Weaversong", "Nid-profond : Tanière du Tisserand"),
        {
          id: "gotCharm_40", name: "#40 L'Héritier de Grimm / Mélodie Insouciante", en: "Grimmchild / Carefree Melody", hint: "Dirtmouth, après avoir allumé la lanterne des Falaises Hurlantes", wiki: "Grimmchild",
          check: (pd) => pd.gotCharm_40 === true,
        },
      ],
    },
    {
      id: "equipment", title: "Équipement", max: 14, icon: "◈",
      desc: "Chaque capacité rapporte 2 %.",
      pctEach: 2,
      items: [
        { id: "hasDash", name: "Cape d'ailes de papillon", en: "Mothwing Cloak", hint: "Vertchemin, vaincre Hornet", wiki: "Mothwing_Cloak", check: flag("hasDash") },
        { id: "hasWalljump", name: "Pince de mante religieuse", en: "Mantis Claw", hint: "Caverne Nocive : Village des Mantes", wiki: "Mantis_Claw", check: flag("hasWalljump") },
        { id: "hasSuperDash", name: "Coeur de cristal", en: "Crystal Heart", hint: "Mont Cristal", wiki: "Crystal_Heart", check: flag("hasSuperDash") },
        { id: "hasDoubleJump", name: "Ailes de monarque", en: "Monarch Wings", hint: "Bassin Ancestral, après le Vaisseau Brisé", wiki: "Monarch_Wings", check: flag("hasDoubleJump") },
        { id: "hasAcidArmour", name: "Larme d'Isma", en: "Isma's Tear", hint: "Voies d'Eau Royales : Bosquet d'Isma", wiki: "Isma's_Tear", check: flag("hasAcidArmour") },
        { id: "hasKingsBrand", name: "Marque du roi", en: "King's Brand", hint: "Frontières du Royaume, vaincre Hornet", wiki: "King's_Brand", check: flag("hasKingsBrand") },
        { id: "hasShadowDash", name: "Cape des ombres", en: "Shade Cloak", hint: "Les Abysses", wiki: "Shade_Cloak", check: flag("hasShadowDash") },
      ],
    },
    {
      id: "nail", title: "Améliorations de l'Aiguillon", max: 4, icon: "†",
      desc: "Chaque amélioration chez le Fabricant d'Aiguillons rapporte 1 %.",
      items: [
        { id: "nail1", name: "Aiguillon pointu", en: "Sharpened Nail", hint: "Fabricant d'Aiguillons : 250 Geo", wiki: "Nail", check: (pd) => pd.nailSmithUpgrades >= 1 },
        { id: "nail2", name: "Aiguillon forgé", en: "Channelled Nail", hint: "Fabricant d'Aiguillons : 800 Geo + 1 Minerai pâle", wiki: "Nail", check: (pd) => pd.nailSmithUpgrades >= 2 },
        { id: "nail3", name: "Aiguillon en spirale", en: "Coiled Nail", hint: "Fabricant d'Aiguillons : 2000 Geo + 2 Minerais pâles", wiki: "Nail", check: (pd) => pd.nailSmithUpgrades >= 3 },
        { id: "nail4", name: "Aiguillon pur", en: "Pure Nail", hint: "Fabricant d'Aiguillons : 4000 Geo + 3 Minerais pâles", wiki: "Nail", check: (pd) => pd.nailSmithUpgrades >= 4 },
      ],
    },
    {
      id: "nailarts", title: "Arts de l'Aiguillon", max: 3, icon: "⟋",
      desc: "Chaque Art de l'Aiguillon rapporte 1 %.",
      items: [
        { id: "hasCyclone", name: "Entaille cyclone", en: "Cyclone Slash", hint: "Mato, Maître d'Aiguillons : Falaises Hurlantes", wiki: "Cyclone_Slash", check: flag("hasCyclone") },
        { id: "hasDashSlash", name: "Entaille implacable", en: "Great Slash", hint: "Sheo, Maître d'Aiguillons : Vertchemin", wiki: "Great_Slash", check: flag("hasDashSlash") },
        { id: "hasUpwardSlash", name: "Entaille éclair", en: "Dash Slash", hint: "Oro, Maître d'Aiguillons : Frontières du Royaume", wiki: "Dash_Slash", check: flag("hasUpwardSlash") },
      ],
    },
    {
      id: "spells", title: "Sorts", max: 6, icon: "◉",
      desc: "Chaque sort et son amélioration rapportent 1 %.",
      items: [
        { id: "fireball1", name: "Esprit vengeur", en: "Vengeful Spirit", hint: "Routes Oubliées : Butte Ancestrale", wiki: "Vengeful_Spirit", check: (pd) => pd.fireballLevel >= 1 },
        { id: "fireball2", name: "Âme d'ombre", en: "Shade Soul", hint: "Sanctuaire de l'Âme, avec la Clé élégante", wiki: "Shade_Soul", check: (pd) => pd.fireballLevel >= 2 },
        { id: "quake1", name: "Élan ravageur", en: "Desolate Dive", hint: "Sanctuaire de l'Âme : vaincre le Maître de l'Âme", wiki: "Desolate_Dive", check: (pd) => pd.quakeLevel >= 1 },
        { id: "quake2", name: "Ténèbres descendantes", en: "Descending Dark", hint: "Mont Cristal : Butte Cristallisée", wiki: "Descending_Dark", check: (pd) => pd.quakeLevel >= 2 },
        { id: "scream1", name: "Spectres hurleurs", en: "Howling Wraiths", hint: "Brumes-canyon : Butte Luxuriante", wiki: "Howling_Wraiths", check: (pd) => pd.screamLevel >= 1 },
        { id: "scream2", name: "Cri des abysses", en: "Abyss Shriek", hint: "Les Abysses, utiliser les Spectres hurleurs sur le piédestal", wiki: "Abyss_Shriek", check: (pd) => pd.screamLevel >= 2 },
      ],
    },
    {
      id: "masks", title: "Éclats de masque", max: 4, icon: "♥",
      desc: "4 éclats = 1 masque = 1 %.",
      group: 4,
      gamePct: (pd) => (typeof pd.maxHealthBase === "number" ? Math.max(0, pd.maxHealthBase - 5) : null),
      items: [
        { id: "slyShellFrag1", name: "Éclat #1", en: "Mask Shard", hint: "Sly : 150 Geo", wiki: "Mask_Shard", check: flag("slyShellFrag1") },
        { id: "slyShellFrag2", name: "Éclat #2", en: "Mask Shard", hint: "Sly : 500 Geo", wiki: "Mask_Shard", check: flag("slyShellFrag2") },
        { id: "slyShellFrag3", name: "Éclat #3", en: "Mask Shard", hint: "Sly : 800 Geo + Clé du marchand", wiki: "Mask_Shard", check: flag("slyShellFrag3") },
        { id: "slyShellFrag4", name: "Éclat #4", en: "Mask Shard", hint: "Sly : 1500 Geo + Clé du marchand", wiki: "Mask_Shard", check: flag("slyShellFrag4") },
        { id: "dreamReward7", name: "Éclat #5", en: "Mask Shard", hint: "Voyante : 1500 Essences", wiki: "Mask_Shard", check: flag("dreamReward7") },
        { id: "ms_Crossroads_13", name: "Éclat #6", en: "Mask Shard", hint: "Routes Oubliées : sous la source chaude", wiki: "Mask_Shard", check: scene("Heart Piece", "Crossroads_13") },
        { id: "ms_Crossroads_09", name: "Éclat #7", en: "Mask Shard", hint: "Routes Oubliées : après le Mawlek Maussade", wiki: "Mask_Shard", check: scene("Heart Piece", "Crossroads_09") },
        { id: "ms_Crossroads_38", name: "Éclat #8", en: "Mask Shard", hint: "Père des larves : 5 larves sauvées", wiki: "Mask_Shard", check: scene("Heart Piece", "Crossroads_38") },
        { id: "ms_Room_Bretta", name: "Éclat #9", en: "Mask Shard", hint: "Dirtmouth : chambre de Bretta (après l'avoir sauvée)", wiki: "Mask_Shard", check: scene("Heart Piece", "Room_Bretta") },
        { id: "ms_Fungus2_01", name: "Éclat #10", en: "Mask Shard", hint: "Station de la Reine, nécessite la Pince de mante religieuse", wiki: "Mask_Shard", check: scene("Heart Piece", "Fungus2_01") },
        { id: "ms_Waterways_04b", name: "Éclat #11", en: "Mask Shard", hint: "Voies d'Eau Royales : en haut à gauche, nager vers la gauche", wiki: "Mask_Shard", check: scene("Heart Piece", "Waterways_04b") },
        { id: "ms_Fungus1_36", name: "Éclat #12", en: "Mask Shard", hint: "Vertchemin : Sanctuaire de Pierre (Lanterne de Lumafly)", wiki: "Mask_Shard", check: scene("Heart Piece", "Fungus1_36") },
        { id: "ms_Mines_32", name: "Éclat #13", en: "Mask Shard", hint: "Mont Cristal : vaincre le Furieux Gardien", wiki: "Mask_Shard", check: scene("Heart Piece", "Mines_32") },
        { id: "ms_Fungus2_25", name: "Éclat #14", en: "Mask Shard", hint: "Nid-profond, depuis le Coeur des Champignons (Ailes de monarque)", wiki: "Mask_Shard", check: scene("Heart Piece", "Fungus2_25") },
        { id: "ms_Hive_04", name: "Éclat #15", en: "Mask Shard", hint: "La Ruche : faire charger un gardien de la Ruche contre le mur", wiki: "Mask_Shard", check: scene("Heart Piece", "Hive_04") },
        { id: "ms_Room_Mansion", name: "Éclat #16", en: "Mask Shard", hint: "Repos Éternel : Fleur délicate pour l'Endeuillée Grise", wiki: "Mask_Shard", check: scene("Heart Piece", "Room_Mansion") },
      ],
    },
    {
      id: "vessels", title: "Fragments de réceptacle", max: 3, icon: "◐",
      desc: "3 fragments = 1 Réceptacle d'Âme = 1 %.",
      group: 3,
      gamePct: (pd) => (typeof pd.MPReserveMax === "number" ? Math.floor(pd.MPReserveMax / 33) : null),
      items: [
        { id: "slyVesselFrag1", name: "Fragment #1", en: "Vessel Fragment", hint: "Sly : 550 Geo", wiki: "Vessel_Fragment", check: flag("slyVesselFrag1") },
        { id: "slyVesselFrag2", name: "Fragment #2", en: "Vessel Fragment", hint: "Sly : 900 Geo + Clé du marchand", wiki: "Vessel_Fragment", check: flag("slyVesselFrag2") },
        { id: "dreamReward5", name: "Fragment #3", en: "Vessel Fragment", hint: "Voyante : 700 Essences", wiki: "Vessel_Fragment", check: flag("dreamReward5") },
        { id: "vesselFragStagNest", name: "Fragment #4", en: "Vessel Fragment", hint: "Tanière aux Coléoptères", wiki: "Vessel_Fragment", check: flag("vesselFragStagNest") },
        { id: "vf_Fungus1_13", name: "Fragment #5", en: "Vessel Fragment", hint: "Vertchemin : près de la sortie vers les Jardins de la Reine", wiki: "Vessel_Fragment", check: scene("Vessel Fragment", "Fungus1_13") },
        { id: "vf_Crossroads_37", name: "Fragment #6", en: "Vessel Fragment", hint: "Routes Oubliées : activer l'ascenseur vers la Cité des Larmes", wiki: "Vessel_Fragment", check: scene("Vessel Fragment", "Crossroads_37") },
        { id: "vf_Ruins2_09", name: "Fragment #7", en: "Vessel Fragment", hint: "Cité des Larmes : au-dessus de la Station du Roi", wiki: "Vessel_Fragment", check: scene("Vessel Fragment", "Ruins2_09") },
        { id: "vf_Deepnest_38", name: "Fragment #8", en: "Vessel Fragment", hint: "Nid-profond : parcours au-dessus des Goams", wiki: "Vessel_Fragment", check: scene("Vessel Fragment", "Deepnest_38") },
        { id: "vf_Abyss_04", name: "Fragment #9", en: "Vessel Fragment", hint: "Bassin Ancestral : fontaine, 3000 Geo", wiki: "Vessel_Fragment", check: scene("Vessel Fragment", "Abyss_04") },
      ],
    },
    {
      id: "dreamnail", title: "Aiguillon des rêves", max: 3, icon: "☾",
      desc: "Chaque étape rapporte 1 %.",
      items: [
        { id: "hasDreamNail", name: "Aiguillon des rêves", en: "Dream Nail", hint: "Repos Éternel", wiki: "Dream_Nail", check: flag("hasDreamNail") },
        { id: "dreamNailUpgraded", name: "Aiguillon éveillé des rêves", en: "Awoken Dream Nail", hint: "Voyante : 1800 Essences", wiki: "Dream_Nail", check: flag("dreamNailUpgraded") },
        { id: "mothDeparted", name: "Derniers mots de la Voyante", en: "Seer's ascension", hint: "Voyante : 2400 Essences", wiki: "Seer", check: flag("mothDeparted") },
      ],
    },
    {
      id: "warriors", title: "Rêves de guerriers", max: 7, icon: "☠",
      desc: "Chaque esprit de guerrier vaincu avec l'Aiguillon des rêves rapporte 1 %.",
      items: [
        { id: "aladarSlugDefeated", name: "Gorb", en: "Gorb", hint: "Falaises Hurlantes, en haut au centre", wiki: "Gorb", check: flag("killedGhostAladar") },
        { id: "xeroDefeated", name: "Xero", en: "Xero", hint: "Repos Éternel", wiki: "Xero", check: flag("killedGhostXero") },
        { id: "mumCaterpillarDefeated", name: "Marmu", en: "Marmu", hint: "Jardins de la Reine, à gauche de la station", wiki: "Marmu", check: flag("killedGhostMarmu") },
        { id: "elderHuDefeated", name: "Hu l'Ancien", en: "Elder Hu", hint: "Caverne Nocive, au-dessus du pont d'acide", wiki: "Elder_Hu", check: flag("killedGhostHu") },
        { id: "galienDefeated", name: "Galien", en: "Galien", hint: "Nid-profond, sous le Tramway Délabré", wiki: "Galien", check: flag("killedGhostGalien") },
        { id: "noEyesDefeated", name: "Sans-yeux", en: "No Eyes", hint: "Vertchemin : Sanctuaire de Pierre (Lanterne de Lumafly)", wiki: "No_Eyes", check: flag("killedGhostNoEyes") },
        { id: "markothDefeated", name: "Markoth", en: "Markoth", hint: "Frontières du Royaume, nécessite la Cape des ombres", wiki: "Markoth", check: flag("killedGhostMarkoth") },
      ],
    },
    {
      id: "dreamers", title: "Rêveurs", max: 3, icon: "◬",
      desc: "Chaque Rêveur rapporte 1 %.",
      items: [
        { id: "lurienDefeated", name: "Lurien le Veilleur", en: "Lurien the Watcher", hint: "Cité des Larmes : L'Observatoire", wiki: "Lurien_the_Watcher", check: flag("lurienDefeated") },
        { id: "monomonDefeated", name: "Monomon l'Érudite", en: "Monomon the Teacher", hint: "Brumes-canyon : Archives de l'Érudite", wiki: "Monomon_the_Teacher", check: flag("monomonDefeated") },
        { id: "hegemolDefeated", name: "Herrah la Bête", en: "Herrah the Beast", hint: "Nid-profond : L'Antre de la Bête", wiki: "Herrah_the_Beast", check: flag("hegemolDefeated") },
      ],
    },
    {
      id: "colosseum", title: "Colisée des Fous", max: 3, icon: "♛",
      desc: "Chaque épreuve rapporte 1 %.",
      items: [
        { id: "colosseumBronzeCompleted", name: "Épreuve des Guerriers", en: "Trial of the Warrior", hint: "Frontières du Royaume, Petit Nigaud : 100 Geo", wiki: "Colosseum_of_Fools", check: flag("colosseumBronzeCompleted") },
        { id: "colosseumSilverCompleted", name: "Épreuve du Conquérant", en: "Trial of the Conqueror", hint: "Petit Nigaud : 450 Geo, après l'Épreuve des Guerriers", wiki: "Colosseum_of_Fools", check: flag("colosseumSilverCompleted") },
        { id: "colosseumGoldCompleted", name: "Épreuve du Fou", en: "Trial of the Fool", hint: "Petit Nigaud : 800 Geo, après l'Épreuve du Conquérant", wiki: "Colosseum_of_Fools", check: flag("colosseumGoldCompleted") },
      ],
    },
    {
      id: "grimm", title: "DLC : La Troupe Grimm", max: 2, icon: "♨",
      desc: "Grimm et le choix final : le Rituel ou le bannissement.",
      items: [
        { id: "killedGrimm", name: "Maître de la troupe Grimm", en: "Troupe Master Grimm", hint: "Dirtmouth : après 6 flammes", wiki: "Grimm", check: flag("killedGrimm") },
        {
          id: "grimmChildLevel", name: "Roi des cauchemars Grimm ou bannissement", en: "Nightmare King Grimm / Banishment", hint: "Un seul choix possible par partie", wiki: "Nightmare_King_Grimm",
          check: (pd) => pd.killedNightmareGrimm === true || pd.destroyedNightmareLantern === true,
        },
      ],
    },
    {
      id: "lifeblood", title: "DLC : Lifeblood", max: 1, icon: "❖",
      items: [
        { id: "killedHiveKnight", name: "Chevalier de la Ruche", en: "Hive Knight", hint: "La Ruche, garde le Charme Sang-de-ruche", wiki: "Hive_Knight", check: flag("killedHiveKnight") },
      ],
    },
    {
      id: "godmaster", title: "DLC : Godmaster", max: 5, icon: "☀",
      desc: "Le Syntoniseur Divin et les Panthéons 1 à 4 (le 5e ne compte pas).",
      items: [
        { id: "hasGodfinder", name: "Syntoniseur Divin", en: "Godtuner", hint: "Voies d'Eau Royales : Fosse à Ordures (Clé simple)", wiki: "Godtuner", check: flag("hasGodfinder") },
        { id: "pantheon1", name: "Panthéon du Maître", en: "Pantheon of the Master", hint: "Maison des Dieux", wiki: "Pantheon_of_the_Master", check: door(1) },
        { id: "pantheon2", name: "Panthéon du Peintre", en: "Pantheon of the Artist", hint: "Maison des Dieux", wiki: "Pantheon_of_the_Artist", check: door(2) },
        { id: "pantheon3", name: "Panthéon du Grand Maître", en: "Pantheon of the Sage", hint: "Maison des Dieux", wiki: "Pantheon_of_the_Sage", check: door(3) },
        { id: "pantheon4", name: "Panthéon du Chevalier", en: "Pantheon of the Knight", hint: "Maison des Dieux : après les Panthéons 1, 2 et 3", wiki: "Pantheon_of_the_Knight", check: door(4) },
      ],
    },

    /* ------------- Not counted in %, but required to reach 112 % ------------- */
    {
      id: "grubs", title: "Larves", extra: true, required: true, icon: "❦",
      desc: "Ne rapportent pas de % directement, mais les 46 sont nécessaires : le Père des larves donne en échange un éclat de masque, le Chant des larves, un Minerai pâle et la Larve-mouche élégie.",
      items: [
        grub(1, "Crossroads_03", "crossroads", "Routes Oubliées, près de la station de Coléoptère"),
        grub(2, "Crossroads_05", "crossroads", "Routes Oubliées, au centre"),
        grub(3, "Crossroads_31", "crossroads", "Routes Oubliées, au-dessus des pics"),
        grub(4, "Crossroads_35", "crossroads", "Routes Oubliées, près du bassin d'acide"),
        grub(5, "Crossroads_48", "crossroads", "Routes Oubliées, gardée par des ennemis"),
        grub(6, "Fungus1_06", "greenpath", "Vertchemin, près de Cornifer"),
        grub(7, "Fungus1_07", "greenpath", "Vertchemin, près du Journal du chasseur"),
        grub(8, "Fungus1_13", "greenpath", "Vertchemin, près de l'Emboutisseur Moussu Massif"),
        grub(9, "Fungus1_21", "greenpath", "Vertchemin, près de la station de Coléoptère"),
        grub(10, "Fungus1_28", "cliffs", "Falaises Hurlantes"),
        grub(11, "Fungus2_18", "fungal", "Caverne Nocive, champignons rebondissants"),
        grub(12, "Fungus2_20", "fungal", "Caverne Nocive, près du Champi-spore"),
        grub(13, "Fungus3_47", "fog", "Brumes-canyon, près des Archives de l'Érudite"),
        grub(14, "Fungus3_10", "gardens", "Jardins de la Reine, près de la station"),
        grub(15, "Fungus3_22", "gardens", "Jardins de la Reine, tout en haut"),
        grub(16, "Fungus3_48", "gardens", "Jardins de la Reine, près de Marmu"),
        grub(17, "Ruins1_05", "city", "Cité des Larmes, côté gauche"),
        grub(18, "Ruins1_32", "city", "Sanctuaire de l'Âme"),
        grub(19, "Ruins_House_01", "city", "Cité des Larmes, maison gardée"),
        grub(20, "Ruins2_03", "city", "L'Observatoire"),
        grub(21, "Ruins2_07", "city", "Station du Roi"),
        grub(22, "Waterways_04", "waterways", "Voies d'Eau Royales, partie principale"),
        grub(23, "Waterways_13", "waterways", "Bosquet d'Isma"),
        grub(24, "Waterways_14", "waterways", "Voies d'Eau Royales, accès par le tramway"),
        grub(25, "Mines_03", "peak", "Mont Cristal, entre les pics"),
        grub(26, "Mines_04", "peak", "Mont Cristal, sous un coffre"),
        grub(27, "Mines_16", "peak", "Mont Cristal, à côté d'une Larve Caméléon"),
        grub(28, "Mines_19", "peak", "Mont Cristal, passage des broyeurs"),
        grub(29, "Mines_24", "peak", "Couronne d'Hallownest"),
        grub(30, "Mines_31", "peak", "Mont Cristal, près du Coeur de cristal"),
        grub(31, "Mines_35", "peak", "Butte Cristallisée"),
        grub(32, "RestingGrounds_10", "resting", "Repos Éternel, dans la crypte"),
        grub(33, "Deepnest_03", "deepnest", "Nid-profond, au-dessus des pics"),
        grub(34, "Deepnest_31", "deepnest", "Nid-profond, près de l'antre de Nosk"),
        grub(35, "Deepnest_36", "deepnest", "Nid-profond, à côté d'une Larve Caméléon"),
        grub(36, "Deepnest_39", "deepnest", "Nid-profond, zone obscure"),
        grub(37, "Deepnest_Spider_Town", "deepnest", "L'Antre de la Bête"),
        grub(38, "Deepnest_East_11", "edge", "Frontières du Royaume, près du campement"),
        grub(39, "Deepnest_East_14", "edge", "Frontières du Royaume, près d'Oro"),
        grub(40, "Hive_03", "hive", "La Ruche, côté extérieur"),
        grub(41, "Hive_04", "hive", "La Ruche, à l'intérieur"),
        grub(42, "Abyss_17", "basin", "Bassin Ancestral, sous un sol à briser (Élan ravageur)"),
        grub(43, "Abyss_19", "basin", "Bassin Ancestral, en hauteur (Ailes de monarque)"),
        collectorGrub(44, 1), collectorGrub(45, 2), collectorGrub(46, 3),
      ],
    },
    {
      id: "counters", title: "Prérequis : stations de Coléoptère", extra: true, required: true, icon: "∑",
      desc: "Toutes les stations sont nécessaires pour la Tanière aux Coléoptères. Pour l'Essence (2400 pour la Voyante), voir la carte en mode Essence.",
      counters: [
        { id: "stags", name: "Stations de Coléoptère", max: 11, wiki: "Stag_Station", value: (pd) => STAGS.filter((k) => pd[k] === true).length },
      ],
    },
    {
      id: "paleore", title: "Minerai pâle", extra: true, required: true, icon: "◇",
      desc: "Les 6 sont nécessaires pour l'Aiguillon pur (1 + 2 + 3 minerais).",
      items: [
        { id: "ore1", name: "Minerai pâle #1", en: "Pale Ore", hint: "Bassin Ancestral, à gauche de la station du tramway", wiki: "Pale_Ore", check: scene("Battle Scene Ore", "Abyss_17") },
        { id: "ore2", name: "Minerai pâle #2", en: "Pale Ore", hint: "Voyante : 300 Essences", wiki: "Pale_Ore", check: flag("dreamReward3") },
        { id: "ore3", name: "Minerai pâle #3", en: "Pale Ore", hint: "Sommet du Mont Cristal (Ailes de monarque)", wiki: "Pale_Ore", check: scene("Shiny Item Stand", "Mines_34") },
        { id: "ore4", name: "Minerai pâle #4", en: "Pale Ore", hint: "Nid-profond : après Nosk", wiki: "Pale_Ore", check: scene("Shiny Item Stand", "Deepnest_32") },
        { id: "ore5", name: "Minerai pâle #5", en: "Pale Ore", hint: "Père des larves : 31 larves", wiki: "Pale_Ore", check: scene("Shiny Item Ore", "Crossroads_38") },
        { id: "ore6", name: "Minerai pâle #6", en: "Pale Ore", hint: "Colisée des Fous : Épreuve du Conquérant", wiki: "Pale_Ore", check: scene("Shiny Item", "Room_Colosseum_Silver") },
      ],
    },
    {
      id: "keys", title: "Clés indispensables", extra: true, required: true, icon: "⚿",
      desc: "Ne rapportent pas de %, mais ouvrent l'accès à des objets qui en rapportent.",
      items: [
        { id: "hasLantern", name: "Lanterne de Lumafly", en: "Lumafly Lantern", hint: "Sly : 1800 Geo · éclaire le Sanctuaire de Pierre (éclat de masque, Sans-yeux)", wiki: "Lumafly_Lantern", check: flag("hasLantern") },
        { id: "hasShopkeepersKey", name: "Clé du marchand", en: "Shopkeeper's Key", hint: "Mont Cristal · débloque la suite de la boutique de Sly (éclats, fragment, Charmes)", wiki: "Shopkeeper's_Key", check: anyOf(flag("hasSlykey"), flag("gaveSlykey")) },
        { id: "hasWhiteKey", name: "Clé élégante", en: "Elegant Key", hint: "Sly : 800 Geo · nécessaire pour l'Âme d'ombre", wiki: "Elegant_Key", check: anyOf(flag("hasWhiteKey"), flag("usedWhiteKey")) },
        { id: "hasLoveKey", name: "Clé de l'amour", en: "Love Key", hint: "Jardins de la Reine · ouvre la Tour de l'Amour (Le Collectionneur)", wiki: "Love_Key", check: anyOf(flag("hasLoveKey"), flag("openedLoveDoor")) },
        {
          id: "anySimpleKey", name: "Une Clé simple", en: "Simple Key", hint: "Une seule suffit : ouvre la Fosse à Ordures (Syntoniseur Divin)", wiki: "Simple_Key",
          check: (pd, sc) => pd.slySimpleKey === true || pd.gotLurkerKey === true || pd.hasGodfinder === true || sc("Shiny Item", "Ruins1_17") || sc("Shiny Item Stand", "Abyss_20"),
        },
      ],
    },

    /* ------------------------------ Truly optional ------------------------------ */
    {
      id: "others", title: "Autres objets", extra: true, icon: "◌",
      desc: "Totalement optionnel pour le 112 %.",
      items: [
        { id: "slySimpleKey", name: "Clé simple #1", en: "Simple Key", hint: "Sly : 950 Geo", wiki: "Simple_Key", check: flag("slySimpleKey") },
        { id: "key2", name: "Clé simple #2", en: "Simple Key", hint: "Cité des Larmes, sous la station des Entrepôts de la Cité", wiki: "Simple_Key", check: scene("Shiny Item", "Ruins1_17") },
        { id: "key3", name: "Clé simple #3", en: "Simple Key", hint: "Bassin Ancestral, sous l'arène du Vaisseau Brisé", wiki: "Simple_Key", check: scene("Shiny Item Stand", "Abyss_20") },
        { id: "gotLurkerKey", name: "Clé simple #4", en: "Simple Key", hint: "Colisée des Fous : vaincre la Rôdeuse Pâle", wiki: "Simple_Key", check: flag("gotLurkerKey") },
        { id: "hasTramPass", name: "Laissez-passer de tramway", en: "Tram Pass", hint: "Nid-profond : Tramway Délabré", wiki: "Tram_Pass", check: flag("hasTramPass") },
        { id: "gotShadeCharm", name: "Coeur du vide", en: "Void Heart", hint: "Les Abysses, avec l'Âme-royale", wiki: "Void_Heart", check: flag("gotShadeCharm") },
      ],
    },
    {
      id: "roots", title: "Racines de rêve", extra: true, icon: "❧",
      desc: "Optionnel : chaque racine récoltée avec l'Aiguillon des rêves donne des Essences.",
      items: [
        root(1, "Crossroads_07", "crossroads", "Routes Oubliées, à droite du Père des larves", 29),
        root(2, "Crossroads_ShamanTemple", "crossroads", "Butte Ancestrale", 42),
        root(3, "Fungus1_13", "greenpath", "Vertchemin, côté Jardins de la Reine", 44),
        root(4, "Cliffs_01", "cliffs", "Falaises Hurlantes, grande zone principale", 46),
        root(5, "Fungus2_17", "fungal", "Caverne Nocive, au-dessus du Village des Mantes", 18),
        root(6, "Fungus2_33", "fungal", "Caverne Nocive, à gauche de Mangepatte", 20),
        root(7, "Fungus3_11", "gardens", "Jardins de la Reine, sous le banc de droite", 29),
        root(8, "Ruins1_17", "city", "Cité des Larmes, sous la station de Coléoptère", 28),
        root(9, "Abyss_01", "basin", "Ascenseur brisé, entre la Cité des Larmes et le Bassin Ancestral", 35),
        root(10, "Mines_23", "peak", "Couronne d'Hallownest, au sommet du Mont Cristal", 21),
        root(11, "RestingGrounds_05", "resting", "Repos Éternel, à droite de la Voyante", 20),
        root(12, "RestingGrounds_08", "resting", "Clairière des Esprits", 34),
        root(13, "Deepnest_39", "deepnest", "Nid-profond, sous les Jardins de la Reine", 45),
        root(14, "Deepnest_East_07", "edge", "Frontières du Royaume, près de la Tour de l'Amour", 51),
        root(15, "Hive_02", "hive", "La Ruche, à droite du banc", 20),
      ],
    },
    {
      id: "endgame", title: "Boss optionnels et fins", extra: true, icon: "✸",
      items: [
        { id: "falseKnightDreamDefeated", name: "Champion Raté", en: "Failed Champion", hint: "Rêve du Faux Chevalier", wiki: "Failed_Champion", check: flag("falseKnightDreamDefeated") },
        { id: "mageLordDreamDefeated", name: "Tyran de l'Âme", en: "Soul Tyrant", hint: "Rêve du Maître de l'Âme", wiki: "Soul_Tyrant", check: flag("mageLordDreamDefeated") },
        { id: "infectedKnightDreamDefeated", name: "Proche Disparu", en: "Lost Kin", hint: "Rêve du Vaisseau Brisé", wiki: "Lost_Kin", check: flag("infectedKnightDreamDefeated") },
        { id: "whiteDefenderDefeated", name: "Protecteur Blanc", en: "White Defender", hint: "Rêve du Défenseur Bousier", wiki: "White_Defender", check: flag("whiteDefenderDefeated") },
        { id: "greyPrinceDefeated", name: "Zote le Prince Gris", en: "Grey Prince Zote", hint: "Dirtmouth : chambre de Bretta (Aiguillon des rêves)", wiki: "Grey_Prince_Zote", check: flag("greyPrinceDefeated") },
        { id: "killedHollowKnight", name: "Hollow Knight", en: "The Hollow Knight", hint: "Temple de l'Oeuf Noir", wiki: "The_Hollow_Knight", check: flag("killedHollowKnight") },
        { id: "killedFinalBoss", name: "Radiance", en: "The Radiance", hint: "Coeur du vide + Aiguillon des rêves sur Hollow Knight", wiki: "The_Radiance", check: flag("killedFinalBoss") },
        { id: "pantheon5", name: "Panthéon d'Hallownest", en: "Pantheon of Hallownest", hint: "Maison des Dieux", wiki: "Pantheon_of_Hallownest", check: door(5) },
      ],
    },
  ];

  const STAGS = ["openedTownBuilding", "openedCrossroads", "openedGreenpath", "openedFungalWastes", "openedRuins1",
    "openedRestingGrounds", "openedRuins2", "openedRoyalGardens", "openedDeepnest", "openedHiddenStation", "openedStagNest"];


  // Percentage of a section given the number of done items.
  function sectionPercent(section, doneCount) {
    if (section.extra) return 0;
    if (section.group) return Math.min(section.max, Math.floor(doneCount / section.group));
    return Math.min(section.max, doneCount * (section.pctEach || 1));
  }

  global.HKData = { SECTIONS, sectionPercent, MAX_PERCENT: 112 };
})(typeof window !== "undefined" ? window : globalThis);
