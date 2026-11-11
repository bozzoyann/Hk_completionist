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
    endgame: "#ffe7a3",
  };
  const DLC = { grimm: "Troupe Grimm", lifeblood: "Lifeblood", godmaster: "Godmaster" };

  /* ------------------------- Progression order ------------------------- */
  const SECTION_ORDER = ["equipment", "spells", "bosses", "dreamers", "dreamnail", "nail", "nailarts", "charms",
    "masks", "vessels", "warriors", "colosseum", "grimm", "lifeblood", "godmaster",
    "counters", "paleore", "keys", "endgame"];

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

  global.HKExtras = { COLORS, TREE, ZONES, computeStats };
})(typeof window !== "undefined" ? window : globalThis);
