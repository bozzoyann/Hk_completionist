/*
 * Hollow Knight completion data (112%).
 * Each item: { id, name, hint, wiki, check(pd, scene) -> boolean }
 * Each section: { id, title, max (in %), pct(doneCount, items) -> % }
 * Sections with `extra: true` do not count toward game completion.
 */
(function (global) {
  "use strict";

  const flag = (key) => (pd) => pd[key] === true;
  const scene = (id, sceneName) => (pd, sc) => sc(id, sceneName);
  const anyOf = (...fns) => (pd, sc) => fns.some((f) => f(pd, sc));

  const charm = (n, name, hint, wiki) => ({
    id: "gotCharm_" + n,
    name: `#${n} ${name}`,
    hint,
    wiki: wiki || name.replace(/ /g, "_").replace(/’/g, "'"),
    check: (pd) => pd["gotCharm_" + n] === true || pd["brokenCharm_" + n] === true,
  });

  const SECTIONS = [
    {
      id: "bosses", title: "Boss", max: 14, icon: "⚔",
      desc: "Chaque boss de cette liste rapporte 1 %.",
      items: [
        { id: "bossGruzMother", name: "Gruz Mother", hint: "Vertige oublié, zone en bas à droite", wiki: "Gruz_Mother", check: anyOf(scene("Battle Scene", "Crossroads_04"), flag("killedBigFly")) },
        { id: "falseKnightDefeated", name: "False Knight", hint: "Vertige oublié, arène centrale", wiki: "False_Knight", check: flag("falseKnightDefeated") },
        { id: "hornet1Defeated", name: "Hornet Protector", hint: "Vertchemin, au-dessus de la station du Cerf", wiki: "Hornet_Protector", check: flag("hornet1Defeated") },
        { id: "bossBroodingMawlek", name: "Brooding Mawlek", hint: "Vertige oublié, nécessite la Griffe de mante", wiki: "Brooding_Mawlek", check: anyOf(scene("Battle Scene", "Crossroads_09"), flag("killedMawlek")) },
        { id: "defeatedDungDefender", name: "Dung Defender", hint: "Égouts royaux, zone de droite", wiki: "Dung_Defender", check: flag("defeatedDungDefender") },
        { id: "mageLordDefeated", name: "Soul Master", hint: "Cité des Larmes : Sanctuaire des âmes", wiki: "Soul_Master", check: flag("mageLordDefeated") },
        { id: "defeatedMantisLords", name: "Mantis Lords", hint: "Terres fongiques : Village des mantes", wiki: "Mantis_Lords", check: flag("defeatedMantisLords") },
        { id: "killedMimicSpider", name: "Nosk", hint: "Nid-Profond, à gauche de la source chaude (Cœur de cristal)", wiki: "Nosk", check: flag("killedMimicSpider") },
        { id: "killedInfectedKnight", name: "Broken Vessel", hint: "Bassin ancien, en bas à gauche", wiki: "Broken_Vessel", check: flag("killedInfectedKnight") },
        { id: "collectorDefeated", name: "The Collector", hint: "Cité des Larmes : Tour de l'Amour (Clé de l'amour)", wiki: "The_Collector", check: flag("collectorDefeated") },
        { id: "defeatedMegaJelly", name: "Uumuu", hint: "Canyon brumeux : Archives de l'Enseignante", wiki: "Uumuu", check: flag("defeatedMegaJelly") },
        { id: "hornetOutskirtsDefeated", name: "Hornet Sentinel", hint: "Bordure du Royaume, nécessite les Ailes du Monarque", wiki: "Hornet_Sentinel", check: flag("hornetOutskirtsDefeated") },
        { id: "killedTraitorLord", name: "Traitor Lord", hint: "Jardins de la Reine, nécessite la Cape de l'ombre", wiki: "Traitor_Lord", check: flag("killedTraitorLord") },
        { id: "killedBlackKnight", name: "Watcher Knights", hint: "Cité des Larmes : Flèche du Guetteur", wiki: "Watcher_Knights", check: flag("killedBlackKnight") },
      ],
    },
    {
      id: "charms", title: "Charmes", max: 36, icon: "✦",
      desc: "Chaque charme rapporte 1 %. Les 4 charmes de la Troupe Grimm sont comptés plus bas. Les charmes fragiles comptent une seule fois.",
      items: [
        charm(1, "Gathering Swarm", "Sly : 300 Géo"),
        charm(2, "Wayward Compass", "Iselda : 220 Géo"),
        charm(3, "Grubsong", "Père Larve : 10 larves sauvées"),
        charm(4, "Stalwart Shell", "Sly : 200 Géo"),
        charm(5, "Baldur Shell", "Falaises hurlantes, en bas près de Vertchemin"),
        charm(6, "Fury of the Fallen", "Col du Roi, rebondir sur les pics"),
        charm(7, "Quick Focus", "Salubra : 800 Géo"),
        charm(8, "Lifeblood Heart", "Salubra : 250 Géo"),
        charm(9, "Lifeblood Core", "L'Abysse : porte des 15 masques de sève vitale"),
        charm(10, "Defender's Crest", "Égouts royaux : vaincre Dung Defender"),
        charm(11, "Flukenest", "Égouts royaux : vaincre Flukemarm"),
        charm(12, "Thorns of Agony", "Vertchemin, nécessite la Cape du papillon"),
        charm(13, "Mark of Pride", "Village des mantes : vaincre les Mantis Lords"),
        charm(14, "Steady Body", "Salubra : 120 Géo"),
        charm(15, "Heavy Blow", "Sly : 350 Géo + Clé du marchand"),
        charm(16, "Sharp Shadow", "Nid-Profond, nécessite la Cape de l'ombre"),
        charm(17, "Spore Shroom", "Terres fongiques, près des Jardins de la Reine"),
        charm(18, "Longnail", "Salubra : 300 Géo"),
        charm(19, "Shaman Stone", "Salubra : 220 Géo"),
        charm(20, "Soul Catcher", "Vertige oublié : Tertre ancestral"),
        charm(21, "Soul Eater", "Terres du repos, nécessite la Plongée désolée"),
        charm(22, "Glowing Womb", "Vertige oublié, nécessite le Cœur de cristal"),
        charm(23, "Fragile Heart", "Mange-jambes : 350 Géo"),
        charm(24, "Fragile Greed", "Mange-jambes : 250 Géo"),
        charm(25, "Fragile Strength", "Mange-jambes : 600 Géo"),
        charm(26, "Nailmaster's Glory", "Sly : après avoir appris les 3 arts du clou"),
        charm(27, "Joni's Blessing", "Falaises hurlantes : Repos de Joni"),
        charm(28, "Shape of Unn", "Vertchemin : Lac d'Unn, nécessite la Larme d'Isma"),
        charm(29, "Hiveblood", "La Ruche : après Hive Knight"),
        charm(30, "Dream Wielder", "Voyante : 500 Essence"),
        charm(31, "Dashmaster", "Terres fongiques, sous le banc près de Bretta"),
        charm(32, "Quick Slash", "Bordure du Royaume, nécessite la Plongée désolée"),
        charm(33, "Spell Twister", "Cité des Larmes : Sanctuaire des âmes"),
        charm(34, "Deep Focus", "Pic de cristal, nécessite le Cœur de cristal"),
        charm(35, "Grubberfly's Elegy", "Père Larve : les 46 larves sauvées"),
        {
          id: "gotCharm_36", name: "#36 Kingsoul (2 fragments)", wiki: "Kingsoul",
          hint: "Dame Blanche (Jardins de la Reine) + Palais Blanc",
          check: (pd) => (pd.gotQueenFragment === true && pd.gotKingFragment === true) || pd.gotShadeCharm === true,
        },
      ],
    },
    {
      id: "equipment", title: "Équipement", max: 14, icon: "◈",
      desc: "Chaque capacité rapporte 2 %.",
      pctEach: 2,
      items: [
        { id: "hasDash", name: "Mothwing Cloak (Cape du papillon)", hint: "Vertchemin, vaincre Hornet", wiki: "Mothwing_Cloak", check: flag("hasDash") },
        { id: "hasWalljump", name: "Mantis Claw (Griffe de mante)", hint: "Village des mantes", wiki: "Mantis_Claw", check: flag("hasWalljump") },
        { id: "hasSuperDash", name: "Crystal Heart (Cœur de cristal)", hint: "Pic de cristal", wiki: "Crystal_Heart", check: flag("hasSuperDash") },
        { id: "hasDoubleJump", name: "Monarch Wings (Ailes du Monarque)", hint: "Bassin ancien, après Broken Vessel", wiki: "Monarch_Wings", check: flag("hasDoubleJump") },
        { id: "hasAcidArmour", name: "Isma's Tear (Larme d'Isma)", hint: "Égouts royaux : Bosquet d'Isma", wiki: "Isma's_Tear", check: flag("hasAcidArmour") },
        { id: "hasKingsBrand", name: "King's Brand (Marque du Roi)", hint: "Bordure du Royaume, vaincre Hornet Sentinel", wiki: "King's_Brand", check: flag("hasKingsBrand") },
        { id: "hasShadowDash", name: "Shade Cloak (Cape de l'ombre)", hint: "L'Abysse", wiki: "Shade_Cloak", check: flag("hasShadowDash") },
      ],
    },
    {
      id: "nail", title: "Améliorations du clou", max: 4, icon: "†",
      desc: "Chaque amélioration chez le Forgeron rapporte 1 %.",
      items: [
        { id: "nail1", name: "Sharpened Nail", hint: "Forgeron : 250 Géo", wiki: "Nail", check: (pd) => pd.nailSmithUpgrades >= 1 },
        { id: "nail2", name: "Channelled Nail", hint: "Forgeron : 800 Géo + 1 Minerai pâle", wiki: "Nail", check: (pd) => pd.nailSmithUpgrades >= 2 },
        { id: "nail3", name: "Coiled Nail", hint: "Forgeron : 2000 Géo + 2 Minerais pâles", wiki: "Nail", check: (pd) => pd.nailSmithUpgrades >= 3 },
        { id: "nail4", name: "Pure Nail", hint: "Forgeron : 4000 Géo + 3 Minerais pâles", wiki: "Nail", check: (pd) => pd.nailSmithUpgrades >= 4 },
      ],
    },
    {
      id: "nailarts", title: "Arts du clou", max: 3, icon: "⟋",
      desc: "Chaque art du clou rapporte 1 %.",
      items: [
        { id: "hasCyclone", name: "Cyclone Slash", hint: "Maître Mato : Falaises hurlantes", wiki: "Cyclone_Slash", check: flag("hasCyclone") },
        { id: "hasDashSlash", name: "Great Slash", hint: "Maître Sheo : Vertchemin (Cape du papillon)", wiki: "Great_Slash", check: flag("hasDashSlash") },
        { id: "hasUpwardSlash", name: "Dash Slash", hint: "Maître Oro : Bordure du Royaume", wiki: "Dash_Slash", check: flag("hasUpwardSlash") },
      ],
    },
    {
      id: "spells", title: "Sorts", max: 6, icon: "◉",
      desc: "Chaque sort et son amélioration rapportent 1 %.",
      items: [
        { id: "fireball1", name: "Vengeful Spirit", hint: "Vertige oublié : Tertre ancestral", wiki: "Vengeful_Spirit", check: (pd) => pd.fireballLevel >= 1 },
        { id: "fireball2", name: "Shade Soul", hint: "Sanctuaire des âmes + Clé élégante", wiki: "Shade_Soul", check: (pd) => pd.fireballLevel >= 2 },
        { id: "quake1", name: "Desolate Dive", hint: "Sanctuaire des âmes : vaincre Soul Master", wiki: "Desolate_Dive", check: (pd) => pd.quakeLevel >= 1 },
        { id: "quake2", name: "Descending Dark", hint: "Pic de cristal : Tertre cristallisé", wiki: "Descending_Dark", check: (pd) => pd.quakeLevel >= 2 },
        { id: "scream1", name: "Howling Wraiths", hint: "Canyon brumeux : Tertre envahi", wiki: "Howling_Wraiths", check: (pd) => pd.screamLevel >= 1 },
        { id: "scream2", name: "Abyss Shriek", hint: "L'Abysse, utiliser Howling Wraiths sur le piédestal", wiki: "Abyss_Shriek", check: (pd) => pd.screamLevel >= 2 },
      ],
    },
    {
      id: "masks", title: "Fragments de masque", max: 4, icon: "♥",
      desc: "4 fragments = 1 masque = 1 %.",
      group: 4,
      items: [
        { id: "slyShellFrag1", name: "Fragment #1", hint: "Sly : 150 Géo", wiki: "Mask_Shard", check: flag("slyShellFrag1") },
        { id: "slyShellFrag2", name: "Fragment #2", hint: "Sly : 500 Géo", wiki: "Mask_Shard", check: flag("slyShellFrag2") },
        { id: "slyShellFrag3", name: "Fragment #3", hint: "Sly : 800 Géo + Clé du marchand", wiki: "Mask_Shard", check: flag("slyShellFrag3") },
        { id: "slyShellFrag4", name: "Fragment #4", hint: "Sly : 1500 Géo + Clé du marchand", wiki: "Mask_Shard", check: flag("slyShellFrag4") },
        { id: "dreamReward7", name: "Fragment #5", hint: "Voyante : 1500 Essence", wiki: "Mask_Shard", check: flag("dreamReward7") },
        { id: "ms_Crossroads_13", name: "Fragment #6", hint: "Vertige oublié : sous les sources chaudes", wiki: "Mask_Shard", check: scene("Heart Piece", "Crossroads_13") },
        { id: "ms_Crossroads_09", name: "Fragment #7", hint: "Vertige oublié : après Brooding Mawlek", wiki: "Mask_Shard", check: scene("Heart Piece", "Crossroads_09") },
        { id: "ms_Crossroads_38", name: "Fragment #8", hint: "Père Larve : 5 larves sauvées", wiki: "Mask_Shard", check: scene("Heart Piece", "Crossroads_38") },
        { id: "ms_Room_Bretta", name: "Fragment #9", hint: "Hameau de la Terre-Mère : chambre de Bretta (la sauver)", wiki: "Mask_Shard", check: scene("Heart Piece", "Room_Bretta") },
        { id: "ms_Fungus2_01", name: "Fragment #10", hint: "Station de la Reine, nécessite la Griffe de mante", wiki: "Mask_Shard", check: scene("Heart Piece", "Fungus2_01") },
        { id: "ms_Waterways_04b", name: "Fragment #11", hint: "Égouts royaux : en haut à gauche, nager vers la gauche", wiki: "Mask_Shard", check: scene("Heart Piece", "Waterways_04b") },
        { id: "ms_Fungus1_36", name: "Fragment #12", hint: "Vertchemin : Sanctuaire de pierre (Lanterne)", wiki: "Mask_Shard", check: scene("Heart Piece", "Fungus1_36") },
        { id: "ms_Mines_32", name: "Fragment #13", hint: "Pic de cristal : vaincre le Gardien enragé", wiki: "Mask_Shard", check: scene("Heart Piece", "Mines_32") },
        { id: "ms_Fungus2_25", name: "Fragment #14", hint: "Nid-Profond, depuis le Cœur fongique (Ailes du Monarque)", wiki: "Mask_Shard", check: scene("Heart Piece", "Fungus2_25") },
        { id: "ms_Hive_04", name: "Fragment #15", hint: "La Ruche : utiliser un Gardien de la Ruche pour casser le mur", wiki: "Mask_Shard", check: scene("Heart Piece", "Hive_04") },
        { id: "ms_Room_Mansion", name: "Fragment #16", hint: "Terres du repos : Fleur délicate (Endeuillée grise)", wiki: "Mask_Shard", check: scene("Heart Piece", "Room_Mansion") },
      ],
    },
    {
      id: "vessels", title: "Fragments de réceptacle", max: 3, icon: "◐",
      desc: "3 fragments = 1 réceptacle d'âme = 1 %.",
      group: 3,
      items: [
        { id: "slyVesselFrag1", name: "Fragment #1", hint: "Sly : 550 Géo", wiki: "Vessel_Fragment", check: flag("slyVesselFrag1") },
        { id: "slyVesselFrag2", name: "Fragment #2", hint: "Sly : 900 Géo + Clé du marchand", wiki: "Vessel_Fragment", check: flag("slyVesselFrag2") },
        { id: "dreamReward5", name: "Fragment #3", hint: "Voyante : 700 Essence", wiki: "Vessel_Fragment", check: flag("dreamReward5") },
        { id: "vesselFragStagNest", name: "Fragment #4", hint: "Nid du Cerf", wiki: "Vessel_Fragment", check: flag("vesselFragStagNest") },
        { id: "vf_Fungus1_13", name: "Fragment #5", hint: "Vertchemin : près de la sortie vers les Jardins de la Reine", wiki: "Vessel_Fragment", check: scene("Vessel Fragment", "Fungus1_13") },
        { id: "vf_Crossroads_37", name: "Fragment #6", hint: "Vertige oublié : débloquer l'ascenseur de la Cité", wiki: "Vessel_Fragment", check: scene("Vessel Fragment", "Crossroads_37") },
        { id: "vf_Ruins2_09", name: "Fragment #7", hint: "Cité des Larmes : au-dessus de la station du Roi", wiki: "Vessel_Fragment", check: scene("Vessel Fragment", "Ruins2_09") },
        { id: "vf_Deepnest_38", name: "Fragment #8", hint: "Nid-Profond : parcours des Goams", wiki: "Vessel_Fragment", check: scene("Vessel Fragment", "Deepnest_38") },
        { id: "vf_Abyss_04", name: "Fragment #9", hint: "Bassin ancien : fontaine, 3000 Géo", wiki: "Vessel_Fragment", check: scene("Vessel Fragment", "Abyss_04") },
      ],
    },
    {
      id: "dreamnail", title: "Aiguillon des rêves", max: 3, icon: "☾",
      desc: "Chaque étape rapporte 1 %.",
      items: [
        { id: "hasDreamNail", name: "Dream Nail", hint: "Terres du repos", wiki: "Dream_Nail", check: flag("hasDreamNail") },
        { id: "dreamNailUpgraded", name: "Awoken Dream Nail", hint: "Voyante : 1800 Essence", wiki: "Dream_Nail", check: flag("dreamNailUpgraded") },
        { id: "mothDeparted", name: "Dernières paroles de la Voyante", hint: "Voyante : 2400 Essence", wiki: "Seer", check: flag("mothDeparted") },
      ],
    },
    {
      id: "warriors", title: "Rêves de guerriers", max: 7, icon: "☠",
      desc: "Chaque esprit de guerrier vaincu (Aiguillon des rêves) rapporte 1 %.",
      items: [
        { id: "aladarSlugDefeated", name: "Gorb", hint: "Falaises hurlantes, en haut au milieu", wiki: "Gorb", check: (pd) => pd.aladarSlugDefeated >= 2 || pd.aladarSlugDefeated === true },
        { id: "xeroDefeated", name: "Xero", hint: "Terres du repos", wiki: "Xero", check: (pd) => pd.xeroDefeated >= 2 || pd.xeroDefeated === true },
        { id: "mumCaterpillarDefeated", name: "Marmu", hint: "Jardins de la Reine, à gauche de la station", wiki: "Marmu", check: (pd) => pd.mumCaterpillarDefeated >= 2 || pd.mumCaterpillarDefeated === true },
        { id: "elderHuDefeated", name: "Elder Hu", hint: "Terres fongiques, au-dessus du pont d'acide", wiki: "Elder_Hu", check: (pd) => pd.elderHuDefeated >= 2 || pd.elderHuDefeated === true },
        { id: "galienDefeated", name: "Galien", hint: "Nid-Profond, sous le tramway abandonné", wiki: "Galien", check: (pd) => pd.galienDefeated >= 2 || pd.galienDefeated === true },
        { id: "noEyesDefeated", name: "No Eyes", hint: "Vertchemin : Sanctuaire de pierre (Lanterne)", wiki: "No_Eyes", check: (pd) => pd.noEyesDefeated >= 2 || pd.noEyesDefeated === true },
        { id: "markothDefeated", name: "Markoth", hint: "Bordure du Royaume, nécessite la Cape de l'ombre", wiki: "Markoth", check: (pd) => pd.markothDefeated >= 2 || pd.markothDefeated === true },
      ],
    },
    {
      id: "dreamers", title: "Rêveurs", max: 3, icon: "◬",
      desc: "Chaque Rêveur rapporte 1 %.",
      items: [
        { id: "lurienDefeated", name: "Lurien le Guetteur", hint: "Cité des Larmes : Flèche du Guetteur", wiki: "Lurien_the_Watcher", check: flag("lurienDefeated") },
        { id: "monomonDefeated", name: "Monomon l'Enseignante", hint: "Canyon brumeux : Archives de l'Enseignante", wiki: "Monomon_the_Teacher", check: flag("monomonDefeated") },
        { id: "hegemolDefeated", name: "Herrah la Bête", hint: "Nid-Profond : Village lointain", wiki: "Herrah_the_Beast", check: flag("hegemolDefeated") },
      ],
    },
    {
      id: "colosseum", title: "Colisée des fous", max: 3, icon: "♛",
      desc: "Chaque épreuve rapporte 1 %.",
      items: [
        { id: "colosseumBronzeCompleted", name: "Épreuve du Guerrier", hint: "Bordure du Royaume : 100 Géo", wiki: "Colosseum_of_Fools", check: flag("colosseumBronzeCompleted") },
        { id: "colosseumSilverCompleted", name: "Épreuve du Conquérant", hint: "450 Géo, après le Guerrier", wiki: "Colosseum_of_Fools", check: flag("colosseumSilverCompleted") },
        { id: "colosseumGoldCompleted", name: "Épreuve du Fou", hint: "800 Géo, après le Conquérant", wiki: "Colosseum_of_Fools", check: flag("colosseumGoldCompleted") },
      ],
    },
    {
      id: "grimm", title: "DLC : La Troupe Grimm", max: 6, icon: "♨",
      desc: "4 charmes + Grimm + le choix final (Rituel ou Bannissement).",
      items: [
        charm(37, "Sprintmaster", "Sly : 400 Géo + Clé du marchand"),
        charm(38, "Dreamshield", "Terres du repos, à gauche sous la Voyante"),
        charm(39, "Weaversong", "Nid-Profond : Antre des Tisserandes"),
        {
          id: "gotCharm_40", name: "#40 Grimmchild / Carefree Melody", hint: "Hameau de la Terre-Mère : allumer la Lanterne du cauchemar", wiki: "Grimmchild",
          check: (pd) => pd.gotCharm_40 === true || pd.grimmChildLevel >= 5,
        },
        { id: "killedGrimm", name: "Troupe Master Grimm", hint: "Hameau de la Terre-Mère : après 6 flammes", wiki: "Grimm", check: flag("killedGrimm") },
        {
          id: "grimmChildLevel", name: "Nightmare King Grimm ou Bannissement", hint: "Un seul choix possible par partie", wiki: "Nightmare_King_Grimm",
          check: (pd) => pd.grimmChildLevel >= 4 || pd.killedNightmareGrimm === true || pd.destroyedNightmareLantern === true,
        },
      ],
    },
    {
      id: "lifeblood", title: "DLC : Lifeblood", max: 1, icon: "❖",
      items: [
        { id: "killedHiveKnight", name: "Hive Knight", hint: "La Ruche, garde le charme Hiveblood", wiki: "Hive_Knight", check: flag("killedHiveKnight") },
      ],
    },
    {
      id: "godmaster", title: "DLC : Godmaster", max: 5, icon: "☀",
      desc: "Le Diapason divin et les Panthéons 1 à 4 (le Panthéon 5 ne compte pas).",
      items: [
        { id: "hasGodfinder", name: "Godtuner (Diapason divin)", hint: "Égouts royaux : Fosse à déchets (Clé simple)", wiki: "Godtuner", check: flag("hasGodfinder") },
        { id: "pantheon1", name: "Panthéon du Maître", hint: "Demeure des dieux", wiki: "Pantheon_of_the_Master", check: (pd) => !!(pd.bossDoorStateTier1 && pd.bossDoorStateTier1.completed) },
        { id: "pantheon2", name: "Panthéon de l'Artiste", hint: "Demeure des dieux", wiki: "Pantheon_of_the_Artist", check: (pd) => !!(pd.bossDoorStateTier2 && pd.bossDoorStateTier2.completed) },
        { id: "pantheon3", name: "Panthéon du Sage", hint: "Demeure des dieux", wiki: "Pantheon_of_the_Sage", check: (pd) => !!(pd.bossDoorStateTier3 && pd.bossDoorStateTier3.completed) },
        { id: "pantheon4", name: "Panthéon du Chevalier", hint: "Demeure des dieux : après P1, P2 et P3", wiki: "Pantheon_of_the_Knight", check: (pd) => !!(pd.bossDoorStateTier4 && pd.bossDoorStateTier4.completed) },
      ],
    },

    /* ----------------------- Not counted in % ----------------------- */
    {
      id: "counters", title: "Compteurs", extra: true, icon: "∑",
      desc: "Ne compte pas dans le %, mais utile pour le 112 %.",
      counters: [
        { id: "grubs", name: "Larves sauvées", max: 46, wiki: "Grub", value: (pd) => pd.grubsCollected || 0 },
        { id: "essence", name: "Essence (paliers de la Voyante)", max: 2400, wiki: "Essence", value: (pd) => pd.dreamOrbs || 0 },
        { id: "stags", name: "Stations du Cerf", max: 11, wiki: "Stag_Station", value: (pd) => STAGS.filter((k) => pd[k] === true).length },
        { id: "roots", name: "Racines murmurantes", max: 15, wiki: "Whispering_Root", value: (pd, raw) => countRoots(raw) },
      ],
    },
    {
      id: "paleore", title: "Minerai pâle", extra: true, icon: "◇",
      items: [
        { id: "ore1", name: "Minerai #1", hint: "Bassin ancien, à gauche de la station du tram", wiki: "Pale_Ore", check: scene("Battle Scene Ore", "Abyss_17") },
        { id: "ore2", name: "Minerai #2", hint: "Voyante : 300 Essence", wiki: "Pale_Ore", check: flag("dreamReward3") },
        { id: "ore3", name: "Minerai #3", hint: "Sommet du Pic de cristal (Ailes du Monarque)", wiki: "Pale_Ore", check: scene("Shiny Item Stand", "Mines_34") },
        { id: "ore4", name: "Minerai #4", hint: "Nid-Profond : récompense de Nosk", wiki: "Pale_Ore", check: scene("Shiny Item Stand", "Deepnest_32") },
        { id: "ore5", name: "Minerai #5", hint: "Père Larve : 31 larves", wiki: "Pale_Ore", check: scene("Shiny Item Ore", "Crossroads_38") },
        { id: "ore6", name: "Minerai #6", hint: "Colisée : Épreuve du Conquérant", wiki: "Pale_Ore", check: scene("Shiny Item", "Room_Colosseum_Silver") },
      ],
    },
    {
      id: "keys", title: "Clés & objets", extra: true, icon: "⚿",
      items: [
        { id: "hasLantern", name: "Lumafly Lantern", hint: "Sly : 1800 Géo", wiki: "Lumafly_Lantern", check: flag("hasLantern") },
        { id: "hasShopkeepersKey", name: "Shopkeeper's Key", hint: "Pic de cristal", wiki: "Shopkeeper's_Key", check: anyOf(flag("hasSlykey"), flag("gaveSlykey")) },
        { id: "hasWhiteKey", name: "Elegant Key", hint: "Sly : 800 Géo", wiki: "Elegant_Key", check: anyOf(flag("hasWhiteKey"), flag("usedWhiteKey")) },
        { id: "hasLoveKey", name: "Love Key", hint: "Jardins de la Reine", wiki: "Love_Key", check: anyOf(flag("hasLoveKey"), flag("openedLoveDoor")) },
        { id: "slySimpleKey", name: "Clé simple #1", hint: "Sly : 950 Géo", wiki: "Simple_Key", check: flag("slySimpleKey") },
        { id: "key2", name: "Clé simple #2", hint: "Cité des Larmes, sous la station des entrepôts", wiki: "Simple_Key", check: scene("Shiny Item", "Ruins1_17") },
        { id: "key3", name: "Clé simple #3", hint: "Bassin ancien, sous Broken Vessel", wiki: "Simple_Key", check: scene("Shiny Item Stand", "Abyss_20") },
        { id: "gotLurkerKey", name: "Clé simple #4", hint: "Refuge du Rôdeur pâle", wiki: "Simple_Key", check: flag("gotLurkerKey") },
        { id: "hasTramPass", name: "Tram Pass", hint: "Nid-Profond : tramway abandonné", wiki: "Tram_Pass", check: flag("hasTramPass") },
        { id: "gotShadeCharm", name: "Void Heart", hint: "L'Abysse, avec Kingsoul", wiki: "Void_Heart", check: flag("gotShadeCharm") },
      ],
    },
    {
      id: "endgame", title: "Boss optionnels & fins", extra: true, icon: "✸",
      items: [
        { id: "falseKnightDreamDefeated", name: "Failed Champion", hint: "Rêve de False Knight", wiki: "Failed_Champion", check: flag("falseKnightDreamDefeated") },
        { id: "mageLordDreamDefeated", name: "Soul Tyrant", hint: "Rêve de Soul Master", wiki: "Soul_Tyrant", check: flag("mageLordDreamDefeated") },
        { id: "infectedKnightDreamDefeated", name: "Lost Kin", hint: "Rêve de Broken Vessel", wiki: "Lost_Kin", check: flag("infectedKnightDreamDefeated") },
        { id: "whiteDefenderDefeated", name: "White Defender", hint: "Rêve de Dung Defender", wiki: "White_Defender", check: flag("whiteDefenderDefeated") },
        { id: "greyPrinceDefeated", name: "Grey Prince Zote", hint: "Chambre de Bretta (Aiguillon des rêves)", wiki: "Grey_Prince_Zote", check: flag("greyPrinceDefeated") },
        { id: "killedHollowKnight", name: "The Hollow Knight", hint: "Temple de l'Œuf noir", wiki: "The_Hollow_Knight", check: flag("killedHollowKnight") },
        { id: "killedFinalBoss", name: "The Radiance", hint: "Void Heart + Aiguillon des rêves sur le Hollow Knight", wiki: "The_Radiance", check: flag("killedFinalBoss") },
        { id: "pantheon5", name: "Panthéon de Hallownest", hint: "Demeure des dieux", wiki: "Pantheon_of_Hallownest", check: (pd) => !!(pd.bossDoorStateTier5 && pd.bossDoorStateTier5.completed) },
      ],
    },
  ];

  const STAGS = ["openedTownBuilding", "openedCrossroads", "openedGreenpath", "openedFungalWastes", "openedRuins1",
    "openedRestingGrounds", "openedRuins2", "openedRoyalGardens", "openedDeepnest", "openedHiddenStation", "openedStagNest"];

  function countRoots(raw) {
    const items = (raw && raw.sceneData && raw.sceneData.persistentBoolItems) || [];
    // Whispering Roots are stored as "Dream Plant" entries once fully harvested.
    return items.filter((i) => i.id === "Dream Plant" && i.activated).length;
  }

  // Percentage of a section given the set of done item ids.
  function sectionPercent(section, doneCount) {
    if (section.extra) return 0;
    if (section.group) return Math.min(section.max, Math.floor(doneCount / section.group));
    return Math.min(section.max, doneCount * (section.pctEach || 1));
  }

  global.HKData = { SECTIONS, sectionPercent, MAX_PERCENT: 112 };
})(typeof window !== "undefined" ? window : globalThis);
