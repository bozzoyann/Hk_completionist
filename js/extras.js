/*
 * Presentation data: colours, progression order, progression tree and save statistics.
 * Loaded after data.js.
 */
(function (global) {
  "use strict";

  const { SECTIONS } = global.HKData;

  /* ------------------------------ Colours ------------------------------ */
  const COLORS = {
    equipment: "#7fd8e8",
    spells: "#8fa8ff",
    bosses: "#ef8b8b",
    nailarts: "#f2b56b",
    nail: "#cfd6e4",
    dreamers: "#6fd3c4",
    dreamnail: "#d7a4ff",
    charms: "#b79cff",
    masks: "#f4efe6",
    vessels: "#9fb4ff",
    warriors: "#9fe3b5",
    colosseum: "#f39a5a",
    grimm: "#ff4b5c",
    lifeblood: "#3fd0ff",
    godmaster: "#f3c65a",
    counters: "#a3a9bb",
    paleore: "#dfe7f2",
    keys: "#c9b88f",
    others: "#8d93a6",
    endgame: "#ffe7a3",
  };
  const DLC = { grimm: "Troupe Grimm", lifeblood: "Lifeblood", godmaster: "Godmaster" };

  /* ------------------------- Progression order ------------------------- */
  const SECTION_ORDER = ["equipment", "spells", "bosses", "dreamers", "dreamnail", "nail", "nailarts", "charms",
    "masks", "vessels", "warriors", "colosseum", "grimm", "lifeblood", "godmaster",
    "counters", "paleore", "keys", "others", "endgame"];

  const ITEM_ORDER = {
    bosses: ["falseKnightDefeated", "hornet1Defeated", "bossGruzMother", "bossBroodingMawlek", "defeatedMantisLords",
      "mageLordDefeated", "defeatedDungDefender", "killedInfectedKnight", "killedMimicSpider", "killedBlackKnight",
      "defeatedMegaJelly", "collectorDefeated", "hornetOutskirtsDefeated", "killedTraitorLord"],
    equipment: ["hasDash", "hasWalljump", "hasSuperDash", "hasDoubleJump", "hasAcidArmour", "hasKingsBrand", "hasShadowDash"],
    spells: ["fireball1", "quake1", "scream1", "fireball2", "quake2", "scream2"],
    nailarts: ["hasDashSlash", "hasCyclone", "hasUpwardSlash"],
    dreamers: ["monomonDefeated", "lurienDefeated", "hegemolDefeated"],
    warriors: ["aladarSlugDefeated", "noEyesDefeated", "elderHuDefeated", "xeroDefeated", "mumCaterpillarDefeated", "galienDefeated", "markothDefeated"],
  };

  function applyOrder() {
    SECTIONS.sort((a, b) => SECTION_ORDER.indexOf(a.id) - SECTION_ORDER.indexOf(b.id));
    for (const s of SECTIONS) {
      s.color = COLORS[s.id] || "#cfd8ff";
      s.dlc = DLC[s.id] || null;
      const order = ITEM_ORDER[s.id];
      if (order && s.items) s.items.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    }
  }
  applyOrder();

  /* -------------------------- Progression tree -------------------------- */
  // Each node: id (item id from SECTIONS), label, cat (section id for colour), req (prerequisite node ids).
  // Rows are computed from prerequisites; `lane` gives the left-to-right placement.
  const TREE = [
    { id: "falseKnightDefeated", label: "Faux Chevalier", cat: "bosses", req: [], lane: 4 },
    { id: "fireball1", label: "Esprit vengeur", cat: "spells", req: [], lane: 2 },
    { id: "bossGruzMother", label: "Mère de Gruz", cat: "bosses", req: [], lane: 6 },
    { id: "hornet1Defeated", label: "Hornet", cat: "bosses", req: ["falseKnightDefeated"], lane: 4 },
    { id: "hasDash", label: "Cape d'ailes de papillon", cat: "equipment", req: ["hornet1Defeated"], lane: 4 },
    { id: "hasWalljump", label: "Pince de mante", cat: "equipment", req: ["hasDash"], lane: 4 },
    { id: "defeatedMantisLords", label: "Dames Mante", cat: "bosses", req: ["hasWalljump"], lane: 2 },
    { id: "hasSuperDash", label: "Coeur de cristal", cat: "equipment", req: ["hasWalljump"], lane: 6 },
    { id: "mageLordDefeated", label: "Maître de l'Âme", cat: "bosses", req: ["hasWalljump"], lane: 4 },
    { id: "quake1", label: "Élan ravageur", cat: "spells", req: ["mageLordDefeated"], lane: 4 },
    { id: "hasDreamNail", label: "Aiguillon des rêves", cat: "dreamnail", req: ["quake1"], lane: 3 },
    { id: "defeatedDungDefender", label: "Défenseur Bousier", cat: "bosses", req: ["quake1"], lane: 5 },
    { id: "killedInfectedKnight", label: "Vaisseau Brisé", cat: "bosses", req: ["hasSuperDash", "quake1"], lane: 6 },
    { id: "hasAcidArmour", label: "Larme d'Isma", cat: "equipment", req: ["defeatedDungDefender"], lane: 5 },
    { id: "hasDoubleJump", label: "Ailes de monarque", cat: "equipment", req: ["killedInfectedKnight"], lane: 6 },
    { id: "gotCharm_40", label: "L'Héritier de Grimm", cat: "grimm", req: ["hasDreamNail"], lane: 0 },
    { id: "lurienDefeated", label: "Lurien", cat: "dreamers", req: ["hasDreamNail"], lane: 3 },
    { id: "monomonDefeated", label: "Monomon", cat: "dreamers", req: ["hasDreamNail", "hasAcidArmour"], lane: 4 },
    { id: "hegemolDefeated", label: "Herrah", cat: "dreamers", req: ["hasDreamNail"], lane: 1 },
    { id: "dreamNailUpgraded", label: "Aiguillon éveillé", cat: "dreamnail", req: ["hasDreamNail"], lane: 2 },
    { id: "hasGodfinder", label: "Syntoniseur Divin", cat: "godmaster", req: ["defeatedDungDefender"], lane: 8 },
    { id: "hornetOutskirtsDefeated", label: "Hornet (Frontières)", cat: "bosses", req: ["hasDoubleJump"], lane: 6 },
    { id: "killedHiveKnight", label: "Chevalier de la Ruche", cat: "lifeblood", req: ["hasDoubleJump"], lane: 7 },
    { id: "colosseumBronzeCompleted", label: "Épreuve des Guerriers", cat: "colosseum", req: ["hasDoubleJump"], lane: 5 },
    { id: "killedGrimm", label: "Maître de la troupe Grimm", cat: "grimm", req: ["gotCharm_40"], lane: 0 },
    { id: "hasShadowDash", label: "Cape des ombres", cat: "equipment", req: ["hasDoubleJump"], lane: 3 },
    { id: "hasKingsBrand", label: "Marque du roi", cat: "equipment", req: ["hornetOutskirtsDefeated"], lane: 6 },
    { id: "pantheon1", label: "Panthéon du Maître", cat: "godmaster", req: ["hasGodfinder"], lane: 8 },
    { id: "colosseumSilverCompleted", label: "Épreuve du Conquérant", cat: "colosseum", req: ["colosseumBronzeCompleted"], lane: 5 },
    { id: "grimmChildLevel", label: "Roi des cauchemars", cat: "grimm", req: ["killedGrimm"], lane: 0 },
    { id: "killedTraitorLord", label: "Seigneur Traître", cat: "bosses", req: ["hasShadowDash"], lane: 3 },
    { id: "gotCharm_36", label: "Âme-royale", cat: "charms", req: ["hasShadowDash", "dreamNailUpgraded"], lane: 2 },
    { id: "pantheon2", label: "Panthéon du Peintre", cat: "godmaster", req: ["pantheon1"], lane: 8 },
    { id: "colosseumGoldCompleted", label: "Épreuve du Fou", cat: "colosseum", req: ["colosseumSilverCompleted"], lane: 5 },
    { id: "killedHollowKnight", label: "Hollow Knight", cat: "endgame", req: ["lurienDefeated", "monomonDefeated", "hegemolDefeated"], lane: 4 },
    { id: "gotShadeCharm", label: "Coeur du vide", cat: "endgame", req: ["gotCharm_36"], lane: 2 },
    { id: "pantheon3", label: "Panthéon du Grand Maître", cat: "godmaster", req: ["pantheon2"], lane: 8 },
    { id: "killedFinalBoss", label: "Radiance", cat: "endgame", req: ["killedHollowKnight", "gotShadeCharm"], lane: 3 },
    { id: "pantheon4", label: "Panthéon du Chevalier", cat: "godmaster", req: ["pantheon3"], lane: 8 },
    { id: "pantheon5", label: "Panthéon d'Hallownest", cat: "godmaster", req: ["pantheon4", "killedFinalBoss"], lane: 6 },
  ];

  /* ------------------------------ Map zones ----------------------------- */
  // shadeMapZone values (game enum) -> official French area names.
  const ZONES = {
    CROSSROADS: "Routes Oubliées", GREEN_PATH: "Vertchemin", WASTES: "Caverne Nocive", CITY: "Cité des Larmes",
    WATERWAYS: "Voies d'Eau Royales", MINES: "Mont Cristal", PEAK: "Couronne d'Hallownest", CRYSTAL_MOUND: "Butte Cristallisée",
    RESTING_GROUNDS: "Repos Éternel", OUTSKIRTS: "Frontières du Royaume", DEEPNEST: "Nid-profond", ABYSS: "Bassin Ancestral",
    ABYSS_DEEP: "Les Abysses", FOG_CANYON: "Brumes-canyon", ROYAL_GARDENS: "Jardins de la Reine", CLIFFS: "Falaises Hurlantes",
    TOWN: "Dirtmouth", KINGS_PASS: "Passe du Roi", HIVE: "La Ruche", WHITE_PALACE: "Palais Blanc", GODS_GLORY: "Maison des Dieux",
    GODSEEKER_WASTE: "Fosse à Ordures", DISTANT_VILLAGE: "Village Lointain", SOUL_SOCIETY: "Sanctuaire de l'Âme",
    MAGE_TOWER: "Sanctuaire de l'Âme", MONOMON_ARCHIVE: "Archives de l'Érudite", LURIENS_TOWER: "L'Observatoire",
    LOVE_TOWER: "La Tour de l'Amour", ISMAS_GROVE: "Bosquet d'Isma", ACID_LAKE: "Lac d'Unn", BLUE_LAKE: "Lac Bleu",
    MANTIS_VILLAGE: "Village des Mantes", COLOSSEUM: "Colisée des Fous", BEASTS_DEN: "L'Antre de la Bête",
    SHAMAN_TEMPLE: "Butte Ancestrale", OVERGROWN_MOUND: "Butte Luxuriante", NOEYES_TEMPLE: "Sanctuaire de Pierre",
    PALACE_GROUNDS: "L'Enceinte du Palais", RUINED_TRAMWAY: "Tramway Délabré", QUEENS_STATION: "Station de la Reine",
    KINGS_STATION: "Station du Roi", TRAM_UPPER: "Station Supérieure", TRAM_LOWER: "Station Inférieure",
    GLADE: "Clairière des Esprits", BONE_FOREST: "Forêt aux Ossements", JONI_GRAVE: "Pierre Tombale de Joni",
    ROYAL_QUARTER: "Le Quartier Royal", FINAL_BOSS: "L'Oeuf Noir", WYRMSKIN: "Carapace Abandonnée", DREAM_WORLD: "Rêve",
  };

  // Journal creatures: killed<Name> flags (from the game's PlayerData).
  const JOURNAL = ("Crawler Buzzer Bouncer Climber Hopper Worm Spitter Hatcher Hatchling ZombieRunner ZombieHornhead ZombieLeaper " +
    "ZombieBarger ZombieShield ZombieGuard BigBuzzer BigFly Mawlek FalseKnight Roller Blocker PrayerSlug MenderBug MossmanRunner " +
    "MossmanShaker Mosquito BlobFlyer FungifiedZombie PlantShooter MossCharger MegaMossCharger SnapperTrap MossKnight GrassHopper " +
    "AcidFlyer AcidWalker MossFlyer MossKnightFat MossWalker InfectedKnight LazyFlyer ZapBug Jellyfish JellyCrawler MegaJellyfish " +
    "FungoonBaby MushroomTurret Mantis MushroomRoller MushroomBrawler MushroomBaby MantisFlyerChild FungusFlyer FungCrawler MantisLord " +
    "BlackKnight ElectricMage Mage MageKnight RoyalDandy RoyalCoward RoyalPlumper FlyingSentrySword FlyingSentryJavelin Sentry SentryFat " +
    "MageBlob GreatShieldZombie JarCollector MageBalloon MageLord GorgeousHusk FlipHopper Flukeman Inflater Flukefly FlukeMother " +
    "DungDefender CrystalCrawler CrystalFlyer LaserBug BeamMiner ZombieMiner MegaBeamMiner MinesCrawler AngryBuzzer BurstingBouncer " +
    "BurstingZombie SpittingZombie BabyCentipede BigCentipede CentipedeHatcher LesserMawlek SlashSpider SpiderCorpse ShootSpider " +
    "MiniSpider SpiderFlyer MimicSpider BeeHatchling BeeStinger BigBee HiveKnight BlowFly CeilingDropper GiantHopper GrubMimic " +
    "MawlekTurret OrangeScuttler HealthScuttler Pigeon ZombieHive DreamGuard Hornet AbyssCrawler SuperSpitter Sibling PalaceFly EggSac " +
    "Mummy OrangeBalloon AbyssTendril HeavyMantis TraitorLord MantisHeavyFlyer GardenZombie RoyalGuard WhiteRoyal Oblobble Zote Blobble " +
    "ColMosquito ColRoller ColFlyingSentry ColMiner ColShield ColWorm ColHopper LobsterLancer GhostAladar GhostXero GhostHu GhostMarmu " +
    "GhostNoEyes GhostMarkoth GhostGalien WhiteDefender GreyPrince ZotelingBalloon ZotelingHopper ZotelingBuzzer HollowKnight FinalBoss " +
    "FlameBearerSmall FlameBearerMed FlameBearerLarge Grimm NightmareGrimm FatFluke PaleLurker NailBros Paintmaster Nailsage HollowKnightPrime").split(" ");

  /* ----------------------------- Statistics ----------------------------- */
  function charmName(n) {
    for (const s of SECTIONS) {
      for (const it of s.items || []) {
        if (it.id === "gotCharm_" + n) return it.name.replace(/^#\d+ /, "");
      }
    }
    return "Charme #" + n;
  }

  function computeStats(raw) {
    const pd = raw.playerData || raw;
    const num = (v) => (typeof v === "number" && isFinite(v) ? v : 0);
    const relics = [1, 2, 3, 4].reduce((a, i) => a + num(pd["trinket" + i]), 0);
    const relicsSold = [1, 2, 3, 4].reduce((a, i) => a + num(pd["soldTrinket" + i]), 0);
    const hasShade = pd.shadeScene && pd.shadeScene !== "None" && pd.shadeScene !== "";
    return {
      maxHealth: num(pd.maxHealthBase) || num(pd.maxHealth),
      soulVessels: Math.floor(num(pd.MPReserveMax) / 33),
      charmSlots: num(pd.charmSlots),
      charmsOwned: num(pd.charmsOwned),
      nailDamage: num(pd.nailDamage),
      geo: num(pd.geo),
      shadeGeo: num(pd.geoPool),
      shadeZone: hasShade ? (ZONES[pd.shadeMapZone] || pd.shadeMapZone || "?") : null,
      bank: pd.bankerAccountPurchased ? num(pd.bankerBalance) : null,
      essence: num(pd.dreamOrbs),
      relics, relicsSold,
      rancidEggs: num(pd.rancidEggs),
      eggsSold: num(pd.jinnEggsSold),
      journal: JOURNAL.filter((n) => pd["killed" + n] === true).length,
      journalTotal: JOURNAL.length,
      rooms: Array.isArray(pd.scenesVisited) ? pd.scenesVisited.length : 0,
      flowerBroken: num(pd.xunFlowerBrokeTimes),
      greyPrince: num(pd.greyPrinceDefeats),
      whiteDefender: num(pd.whiteDefenderDefeats),
      equipped: Array.isArray(pd.equippedCharms) ? pd.equippedCharms.map(charmName) : [],
      steelSoul: num(pd.permadeathMode) > 0,
      grubs: num(pd.grubsCollected),
    };
  }


  /* --------------------------- Hallownest map --------------------------- */
  // Schematic layout (not the official map): rough relative positions of areas.
  // x, y, w, h in a 1000 x 700 view box.
  const MAP_ZONES = [
    { id: "cliffs", name: "Falaises Hurlantes", x: 30, y: 30, w: 200, h: 100 },
    { id: "dirtmouth", name: "Dirtmouth", sub: "et la Passe du Roi", x: 250, y: 14, w: 190, h: 90 },
    { id: "peak", name: "Mont Cristal", x: 460, y: 20, w: 220, h: 112 },
    { id: "colosseum", name: "Colisée des Fous", x: 700, y: 20, w: 120, h: 88 },
    { id: "edge", name: "Frontières du Royaume", x: 840, y: 20, w: 140, h: 360 },
    { id: "greenpath", name: "Vertchemin", x: 30, y: 150, w: 210, h: 120 },
    { id: "crossroads", name: "Routes Oubliées", x: 260, y: 120, w: 250, h: 120 },
    { id: "resting", name: "Repos Éternel", x: 530, y: 152, w: 150, h: 96 },
    { id: "fog", name: "Brumes-canyon", x: 260, y: 260, w: 170, h: 92 },
    { id: "gardens", name: "Jardins de la Reine", x: 30, y: 290, w: 210, h: 118 },
    { id: "city", name: "Cité des Larmes", x: 450, y: 268, w: 260, h: 150 },
    { id: "hive", name: "La Ruche", x: 730, y: 400, w: 160, h: 92 },
    { id: "fungal", name: "Caverne Nocive", x: 250, y: 372, w: 180, h: 118 },
    { id: "waterways", name: "Voies d'Eau Royales", x: 450, y: 438, w: 260, h: 84 },
    { id: "deepnest", name: "Nid-profond", x: 30, y: 428, w: 200, h: 170 },
    { id: "basin", name: "Bassin Ancestral", x: 250, y: 510, w: 320, h: 82 },
    { id: "abyss", name: "Les Abysses", x: 290, y: 612, w: 260, h: 70 },
    { id: "palace", name: "Palais Blanc", sub: "royaume des rêves", x: 600, y: 540, w: 170, h: 92, dream: true },
    { id: "godhome", name: "Maison des Dieux", sub: "royaume des rêves", x: 790, y: 540, w: 190, h: 92, dream: true },
  ];

  // Passages between areas, drawn as faint tunnels.
  const MAP_LINKS = [
    ["cliffs", "dirtmouth"], ["dirtmouth", "crossroads"], ["dirtmouth", "peak"], ["cliffs", "greenpath"],
    ["greenpath", "crossroads"], ["crossroads", "resting"], ["peak", "resting"], ["crossroads", "fog"],
    ["greenpath", "gardens"], ["fog", "gardens"], ["fog", "fungal"], ["fog", "city"], ["crossroads", "city"],
    ["resting", "city"], ["city", "edge"], ["peak", "colosseum"], ["colosseum", "edge"], ["edge", "hive"],
    ["fungal", "deepnest"], ["gardens", "deepnest"], ["fungal", "city"], ["city", "waterways"], ["waterways", "edge"],
    ["deepnest", "basin"], ["fungal", "basin"], ["waterways", "basin"], ["basin", "abyss"], ["basin", "palace"],
    ["waterways", "godhome"],
  ];

  const Z = (zone, ids) => ids.split(" ").forEach((id) => { ITEM_ZONE[id] = zone; });
  const ITEM_ZONE = {};
  Z("crossroads", "bossGruzMother falseKnightDefeated bossBroodingMawlek gotCharm_3 gotCharm_7 gotCharm_8 gotCharm_14 gotCharm_18 gotCharm_19 gotCharm_20 gotCharm_22 gotCharm_35 fireball1 ms_Crossroads_13 ms_Crossroads_09 ms_Crossroads_38 vf_Crossroads_37 ore5 falseKnightDreamDefeated killedHollowKnight killedFinalBoss");
  Z("dirtmouth", "gotCharm_1 gotCharm_2 gotCharm_4 gotCharm_6 gotCharm_15 gotCharm_26 slyShellFrag1 slyShellFrag2 slyShellFrag3 slyShellFrag4 ms_Room_Bretta slyVesselFrag1 slyVesselFrag2 gotCharm_37 gotCharm_40 killedGrimm grimmChildLevel hasLantern hasWhiteKey slySimpleKey greyPrinceDefeated");
  Z("greenpath", "hornet1Defeated gotCharm_12 gotCharm_28 hasDash hasDashSlash ms_Fungus1_36 vf_Fungus1_13 noEyesDefeated");
  Z("fungal", "defeatedMantisLords gotCharm_13 gotCharm_17 gotCharm_23 gotCharm_24 gotCharm_25 gotCharm_31 hasWalljump ms_Fungus2_01 elderHuDefeated");
  Z("city", "mageLordDefeated collectorDefeated killedBlackKnight gotCharm_33 nail1 nail2 nail3 nail4 fireball2 quake1 vf_Ruins2_09 lurienDefeated key2 mageLordDreamDefeated");
  Z("waterways", "defeatedDungDefender gotCharm_10 gotCharm_11 hasAcidArmour ms_Waterways_04b whiteDefenderDefeated");
  Z("deepnest", "killedMimicSpider gotCharm_16 ms_Fungus2_25 vf_Deepnest_38 galienDefeated hegemolDefeated gotCharm_39 ore4 hasTramPass");
  Z("basin", "killedInfectedKnight hasDoubleJump vf_Abyss_04 ore1 key3 infectedKnightDreamDefeated");
  Z("fog", "defeatedMegaJelly scream1 monomonDefeated");
  Z("edge", "hornetOutskirtsDefeated gotCharm_32 hasKingsBrand hasUpwardSlash markothDefeated");
  Z("gardens", "killedTraitorLord mumCaterpillarDefeated hasLoveKey");
  Z("cliffs", "gotCharm_5 gotCharm_27 hasCyclone vesselFragStagNest aladarSlugDefeated");
  Z("peak", "gotCharm_34 hasSuperDash quake2 ms_Mines_32 ore3 hasShopkeepersKey");
  Z("resting", "gotCharm_21 gotCharm_30 dreamReward7 ms_Room_Mansion dreamReward5 hasDreamNail dreamNailUpgraded mothDeparted xeroDefeated gotCharm_38 ore2");
  Z("hive", "gotCharm_29 ms_Hive_04 killedHiveKnight");
  Z("abyss", "gotCharm_9 hasShadowDash scream2 gotShadeCharm");
  Z("colosseum", "colosseumBronzeCompleted colosseumSilverCompleted colosseumGoldCompleted ore6 gotLurkerKey");
  Z("palace", "gotCharm_36");
  Z("waterways", "anySimpleKey");
  Z("godhome", "hasGodfinder pantheon1 pantheon2 pantheon3 pantheon4 pantheon5");

  global.HKExtras = { COLORS, TREE, ZONES, computeStats, MAP_ZONES, MAP_LINKS, ITEM_ZONE };
})(typeof window !== "undefined" ? window : globalThis);
