/*
 * Data for the extra tools: achievement rules, Hall of Gods statues and the Geo shopping list.
 * Loaded after data.js and achievements-data.js.
 */
(function (global) {
  "use strict";

  /* ------------------------------ Achievements ------------------------------ */
  // Each rule returns true (obtained), false (not yet) or null (cannot be known from the save).
  // ctx: { total (tracker %), journalFound, journalTotal, stations }
  const t = (k) => (pd) => pd[k] === true;
  const door = (n) => (pd) => !!(pd["bossDoorStateTier" + n] && pd["bossDoorStateTier" + n].completed);
  const ended = (pd) => pd.killedHollowKnight === true || pd.killedFinalBoss === true;
  const MAPS = ["mapCrossroads", "mapGreenpath", "mapFogCanyon", "mapRoyalGardens", "mapFungalWastes", "mapCity", "mapWaterways",
    "mapMines", "mapDeepnest", "mapCliffs", "mapOutskirts", "mapRestingGrounds", "mapAbyss"];
  const speed = (hours, needFull) => (pd, c) => {
    if (!ended(pd)) return false;
    if (needFull && c.total < 100) return false;
    return pd.playTime < hours * 3600 ? true : null;
  };

  const ACH_RULES = {
    CHARMED: (pd) => pd.charmsOwned >= 1,
    ENCHANTED: (pd) => pd.charmsOwned >= 20,
    BLESSED: t("salubraBlessing"),
    PROTECTED: (pd) => pd.maxHealthBase >= 6,
    MASKED: (pd) => pd.maxHealthBase >= 9,
    SOULFUL: (pd) => pd.MPReserveMax >= 33,
    WORLDSOUL: (pd) => pd.MPReserveMax >= 99,
    FK_DEFEAT: t("killedFalseKnight"),
    HORNET_1: t("hornet1Defeated"),
    HORNET_2: t("hornetOutskirtsDefeated"),
    MANTIS_LORDS: t("killedMantisLord"),
    SOUL_MASTER_DEFEAT: t("killedMageLord"),
    DUNG_DEFENDER: t("killedDungDefender"),
    BROKEN_VESSEL: t("killedInfectedKnight"),
    COLLECTOR: t("killedJarCollector"),
    TRAITOR_LORD: t("killedTraitorLord"),
    WATCHER: t("lurienDefeated"),
    TEACHER: t("monomonDefeated"),
    BEAST: t("hegemolDefeated"),
    ATTUNEMENT: (pd) => pd.dreamOrbs >= 600 || pd.dreamReward4 === true,
    AWAKENING: t("dreamNailUpgraded"),
    ASCENSION: t("mothDeparted"),
    GRUBFRIEND: (pd) => pd.grubsCollected >= 23,
    METAMORPHOSIS: (pd) => pd.grubsCollected >= 46,
    STAG_STATION_HALF: (pd, c) => c.stations >= 4,
    STAG_STATION_ALL: t("openedStagNest"),
    MAP: (pd) => MAPS.every((k) => pd[k] === true),
    HUNTER_1: (pd, c) => c.journalFound >= c.journalTotal,
    HUNTER_2: t("hasHuntersMark"),
    COLOSSEUM_1: t("colosseumBronzeCompleted"),
    COLOSSEUM_2: t("colosseumSilverCompleted"),
    COLOSSEUM_3: t("colosseumGoldCompleted"),
    DREAM_FK: t("falseKnightDreamDefeated"),
    DREAM_SOUL_MASTER_DEFEAT: t("mageLordDreamDefeated"),
    DREAM_BROKEN_VESSEL: t("infectedKnightDreamDefeated"),
    WHITE_DEFENDER: t("whiteDefenderDefeated"),
    WHITE_DEFENDER2: (pd) => pd.whiteDefenderDefeats >= 5,
    GREY_PRINCE: t("greyPrinceDefeated"),
    GREY_PRINCE2: (pd) => pd.greyPrinceDefeats >= 10,
    ZOTE: t("zoteDefeated"),
    NEGLECT: t("zoteDead"),
    NAILSMITH_KILL: t("nailsmithKilled"),
    NAILSMITH_SPARE: t("nailsmithSpared"),
    MOURNER: t("xunRewardGiven"),
    QUIRREL_EPILOGUE: t("quirrelEpilogueCompleted"),
    MR_MUSHROOM: (pd) => pd.mrMushroomState >= 8,
    GRIMM: t("killedGrimm"),
    NIGHTMARE_GRIMM: t("killedNightmareGrimm"),
    BANISHMENT: t("destroyedNightmareLantern"),
    VOID: t("gotShadeCharm"),
    PANTHEON1: door(1),
    PANTHEON2: door(2),
    PANTHEON3: door(3),
    PANTHEON4: door(4),
    // The save does not record which ending was seen: only whether the bosses were beaten.
    ENDING_A: (pd) => (pd.killedHollowKnight ? null : false),
    ENDING_B: (pd) => (pd.killedHollowKnight ? null : false),
    ENDING_C: t("killedFinalBoss"),
    ENDINGD: door(5),
    COMPLETION: (pd, c) => (c.total >= 100 && ended(pd) ? true : c.total >= 100 ? null : false),
    COMPLETIONGG: (pd, c) => (c.total >= 112 && ended(pd) ? true : c.total >= 112 ? null : false),
    SPEEDRUN_1: speed(10, false),
    SPEEDRUN_2: speed(5, false),
    SPEED_COMPLETION: speed(20, true),
    // Only possible on a Steel Soul save.
    STEELSOUL: (pd) => pd.permadeathMode > 0 && ended(pd),
    STEELSOUL_COMPLETION: (pd, c) => pd.permadeathMode > 0 && ended(pd) && c.total >= 100,
  };

  /* ---------------------------- Hall of Gods statues ---------------------------- */
  // statueState<Key> = { isUnlocked, completedTier1 (Attuned), completedTier2 (Ascended), completedTier3 (Radiant) }
  const STATUES = [
    ["GruzMother", "Mère de Gruz", "Gruz Mother"], ["Vengefly", "Mouche Vengeresse Royale", "Vengefly King"],
    ["BroodingMawlek", "Mawlek Maussade", "Brooding Mawlek"], ["FalseKnight", "Faux Chevalier", "False Knight"],
    ["FailedChampion", "Champion Raté", "Failed Champion"], ["Hornet1", "Hornet Protectrice", "Hornet Protector"],
    ["Hornet2", "Hornet Sentinelle", "Hornet Sentinel"], ["MegaMossCharger", "Emboutisseur Moussu Massif", "Massive Moss Charger"],
    ["MantisLords", "Dames Mante", "Mantis Lords"], ["MantisLordsExtra", "Soeurs d'armes", "Sisters of Battle"],
    ["Oblobbles", "Oblobbles", "Oblobbles"], ["GreyPrince", "Zote le Prince Gris", "Grey Prince Zote"],
    ["BrokenVessel", "Vaisseau Brisé", "Broken Vessel"], ["LostKin", "Proche Disparu", "Lost Kin"],
    ["Nosk", "Nosk", "Nosk"], ["NoskHornet", "Nosk Ailé", "Winged Nosk"], ["Flukemarm", "Flukemarm", "Flukemarm"],
    ["Collector", "Le Collectionneur", "The Collector"], ["WatcherKnights", "Veilleurs", "Watcher Knights"],
    ["SoulMaster", "Maître de l'Âme", "Soul Master"], ["SoulTyrant", "Tyran de l'Âme", "Soul Tyrant"],
    ["MageKnight", "Guerrier de l'Âme", "Soul Warrior"], ["GodTamer", "Dompteur de dieux", "God Tamer"],
    ["CrystalGuardian1", "Gardien de cristal", "Crystal Guardian"], ["CrystalGuardian2", "Gardien Enragé", "Enraged Guardian"],
    ["Uumuu", "Uumuu", "Uumuu"], ["DungDefender", "Défenseur Bousier", "Dung Defender"],
    ["WhiteDefender", "Protecteur Blanc", "White Defender"], ["HiveKnight", "Chevalier de la Ruche", "Hive Knight"],
    ["TraitorLord", "Seigneur Traître", "Traitor Lord"], ["Grimm", "Maître de la troupe Grimm", "Troupe Master Grimm"],
    ["NightmareGrimm", "Roi des cauchemars Grimm", "Nightmare King Grimm"], ["Nailmasters", "Oro et Mato", "Brothers Oro & Mato"],
    ["Paintmaster", "Maître Peintre Sheo", "Paintmaster Sheo"], ["Sly", "Grand Maître d'Aiguillons Sly", "Great Nailsage Sly"],
    ["Gorb", "Gorb", "Gorb"], ["Xero", "Xero", "Xero"], ["Marmu", "Marmu", "Marmu"], ["ElderHu", "Hu l'Ancien", "Elder Hu"],
    ["Galien", "Galien", "Galien"], ["NoEyes", "Sans-yeux", "No Eyes"], ["Markoth", "Markoth", "Markoth"],
    ["HollowKnight", "Vaisseau pur", "Pure Vessel"], ["Radiance", "Radiance véritable", "Absolute Radiance"],
  ].map(([k, fr, en]) => ({ k, fr, en }));

  /* ------------------------------- Geo budget ------------------------------- */
  // Purchases needed for 112 %. `id` refers to a tracked item; `flag` to a PlayerData boolean.
  const SHOP = [
    { shop: "Sly", items: [
      { id: "gotCharm_1", label: "Essaim cueilleur", geo: 300 },
      { id: "gotCharm_4", label: "Carapace infrangible", geo: 200 },
      { id: "slyShellFrag1", label: "Éclat de masque", geo: 150 },
      { id: "slyShellFrag2", label: "Éclat de masque", geo: 500 },
      { id: "slyVesselFrag1", label: "Fragment de réceptacle", geo: 550 },
      { id: "hasLantern", label: "Lanterne de Lumafly", geo: 1800 },
      { id: "anySimpleKey", label: "Clé simple (si aucune autre trouvée)", geo: 950 },
    ] },
    { shop: "Sly (avec la Clé du marchand)", items: [
      { id: "gotCharm_15", label: "Coup puissant", geo: 350 },
      { id: "gotCharm_37", label: "Maître de la vitesse", geo: 400 },
      { id: "slyShellFrag3", label: "Éclat de masque", geo: 800 },
      { id: "slyShellFrag4", label: "Éclat de masque", geo: 1500 },
      { id: "slyVesselFrag2", label: "Fragment de réceptacle", geo: 900 },
      { id: "hasWhiteKey", label: "Clé élégante", geo: 800 },
    ] },
    { shop: "Iselda", items: [{ id: "gotCharm_2", label: "Boussole murmurante", geo: 220 }] },
    { shop: "Salubra", items: [
      { id: "gotCharm_14", label: "Roc solide", geo: 120 },
      { id: "gotCharm_19", label: "Pierre du shaman", geo: 220 },
      { id: "gotCharm_8", label: "Coeur sang-de-vie", geo: 250 },
      { id: "gotCharm_18", label: "Longue-lame", geo: 300 },
      { id: "gotCharm_7", label: "Canalisation rapide", geo: 800 },
    ] },
    { shop: "Mangepatte", items: [
      { id: "gotCharm_24", label: "Avarice fragile", geo: 250 },
      { id: "gotCharm_23", label: "Coeur fragile", geo: 350 },
      { id: "gotCharm_25", label: "Force fragile", geo: 600 },
    ] },
    { shop: "Fabricant d'Aiguillons", items: [
      { id: "nail1", label: "Aiguillon pointu", geo: 250 },
      { id: "nail2", label: "Aiguillon forgé", geo: 800 },
      { id: "nail3", label: "Aiguillon en spirale", geo: 2000 },
      { id: "nail4", label: "Aiguillon pur", geo: 4000 },
    ] },
    { shop: "Maîtres d'Aiguillons", items: [{ id: "hasUpwardSlash", label: "Entaille éclair (Oro)", geo: 800 }] },
    { shop: "Colisée des Fous", items: [
      { id: "colosseumBronzeCompleted", label: "Épreuve des Guerriers", geo: 100 },
      { id: "colosseumSilverCompleted", label: "Épreuve du Conquérant", geo: 450 },
      { id: "colosseumGoldCompleted", label: "Épreuve du Fou", geo: 800 },
    ] },
    { shop: "Divers", items: [
      { id: "vf_Abyss_04", label: "Fontaine du Bassin Ancestral (fragment)", geo: 3000 },
      { id: "vf_Crossroads_37", label: "Ascenseur vers la Cité (fragment)", geo: 150 },
    ] },
    { shop: "Stations de Coléoptère", items: [
      { flag: "openedCrossroads", label: "Routes Oubliées", geo: 50 },
      { flag: "openedGreenpath", label: "Vertchemin", geo: 140 },
      { flag: "openedFungalWastes", label: "Station de la Reine", geo: 120 },
      { flag: "openedRuins1", label: "Entrepôts de la Cité", geo: 200 },
      { flag: "openedRuins2", label: "Station du Roi", geo: 300 },
      { flag: "openedRestingGrounds", label: "Repos Éternel", geo: 50 },
      { flag: "openedRoyalGardens", label: "Jardins de la Reine", geo: 200 },
      { flag: "openedDeepnest", label: "Village Lointain", geo: 250 },
      { flag: "openedHiddenStation", label: "Station Cachée", geo: 300 },
    ] },
  ];
  const SHOP_FLAGS = SHOP.flatMap((s) => s.items).filter((i) => i.flag).map((i) => i.flag);
  const RELIC_VALUES = [200, 450, 800, 1200]; // Wanderer's Journal, Hallownest Seal, King's Idol, Arcane Egg (Lemm)
  const RELIC_NAMES = ["Journal d'un voyageur", "Sceau d'Hallownest", "Idole du roi", "Oeuf arcanique"];

  global.HKFeatures = { ACH_RULES, STATUES, SHOP, SHOP_FLAGS, RELIC_VALUES, RELIC_NAMES, MAPS };
})(typeof window !== "undefined" ? window : globalThis);
