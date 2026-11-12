/*
 * Data for the extra tools: achievement rules, Hall of Gods statues and the Geo shopping list.
 * Loaded after data.js and achievements-data.js.
 */
(function (global) {
  "use strict";

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
  // Not needed for 112 %, but part of a full completion.
  const SHOP_OPTIONAL = [
    { shop: "Divine (Troupe Grimm)", items: [
      { flag: "fragileGreed_unbreakable", label: "Avarice incassable", geo: 9000 },
      { flag: "fragileHealth_unbreakable", label: "Coeur incassable", geo: 12000 },
      { flag: "fragileStrength_unbreakable", label: "Force incassable", geo: 15000 },
    ] },
    { shop: "Salubra", items: [
      { flag: "salubraNotch1", label: "Emplacement de Charme", geo: 120 },
      { flag: "salubraNotch2", label: "Emplacement de Charme", geo: 500 },
      { flag: "salubraNotch3", label: "Emplacement de Charme", geo: 900 },
      { flag: "salubraNotch4", label: "Emplacement de Charme", geo: 1400 },
      { flag: "salubraBlessing", label: "Bénédiction de Salubra", geo: 800 },
    ] },
  ];
  const SHOP_FLAGS = [...SHOP, ...SHOP_OPTIONAL].flatMap((s) => s.items).filter((i) => i.flag).map((i) => i.flag);
  const RELIC_VALUES = [200, 450, 800, 1200]; // Wanderer's Journal, Hallownest Seal, King's Idol, Arcane Egg (Lemm)
  const RELIC_NAMES = ["Journal d'un voyageur", "Sceau d'Hallownest", "Idole du roi", "Oeuf arcanique"];


  /* ------------------------------ Charm effects ------------------------------ */
  // Short description of each charm [French, English]. Numbers come from the game's code
  // where available (HeroController / NailSlash), otherwise from the community wiki.
  const CHARM_FX = {
    1: ["Ramasse automatiquement le Geo tombé", "Collects dropped Geo automatically"],
    2: ["Affiche votre position sur la carte", "Shows your position on the map"],
    3: ["15 Âme quand vous êtes touché (25 avec Larve-mouche élégie)", "15 SOUL when hit (25 with Grubberfly's Elegy)"],
    4: ["Invulnérabilité après un coup : 1,3 → 1,75 s, moins de recul", "Invulnerability after a hit: 1.3 → 1.75 s, less knockback"],
    5: ["Bouclier qui protège pendant la Canalisation (se brise après quelques coups)", "Shield while focusing (breaks after a few hits)"],
    6: ["+75 % de dégâts d'aiguillon quand il ne reste qu'un masque", "+75% nail damage on your last mask"],
    7: ["Canalisation environ 33 % plus rapide", "Focus about 33% faster"],
    8: ["+2 masques sang-de-vie à chaque repos", "+2 lifeblood masks at each rest"],
    9: ["+4 masques sang-de-vie à chaque repos", "+4 lifeblood masks at each rest"],
    10: ["Dégage un nuage nocif qui blesse les ennemis proches", "Emits a harmful cloud that hurts nearby enemies"],
    11: ["Le sort Esprit vengeur tire une nuée de flukes", "Vengeful Spirit fires a swarm of flukes"],
    12: ["Des ronces frappent autour de vous quand vous êtes touché", "Thorns strike around you when you are hit"],
    13: ["Portée de l'aiguillon ×1,25 (×1,4 avec Longue-lame)", "Nail range ×1.25 (×1.4 with Longnail)"],
    14: ["Supprime le recul quand vous frappez", "No recoil when striking"],
    15: ["Les ennemis frappés sont repoussés plus loin", "Struck enemies are knocked back further"],
    16: ["Le dash des ombres blesse les ennemis traversés", "Shadow dashing damages enemies"],
    17: ["Canaliser libère un nuage de spores", "Focusing releases a cloud of spores"],
    18: ["Portée de l'aiguillon ×1,15 (×1,4 avec Marque de respect)", "Nail range ×1.15 (×1.4 with Mark of Pride)"],
    19: ["Dégâts des sorts augmentés (+33 à +51 %)", "Spell damage increased (+33% to +51%)"],
    20: ["+3 Âme par coup d'aiguillon", "+3 SOUL per nail hit"],
    21: ["+8 Âme par coup d'aiguillon", "+8 SOUL per nail hit"],
    22: ["Dépense de l'Âme pour faire naître des larves qui attaquent", "Spends SOUL to hatch flying attackers"],
    23: ["+2 masques", "+2 masks"],
    24: ["Les ennemis lâchent plus de Geo", "Enemies drop more Geo"],
    25: ["+50 % de dégâts d'aiguillon", "+50% nail damage"],
    26: ["Charge des Arts de l'Aiguillon : 1,35 → 0,75 s", "Nail Art charge: 1.35 → 0.75 s"],
    27: ["Les masques deviennent sang-de-vie (+40 %), mais Canaliser ne soigne plus", "Masks become lifeblood (+40%), but Focus no longer heals"],
    28: ["Canaliser vous change en limace : vous pouvez bouger en vous soignant", "Focusing turns you into a slug that can move while healing"],
    29: ["Régénère un masque perdu après un moment sans être touché", "Regenerates a lost mask after a while without being hit"],
    30: ["Aiguillon des rêves plus rapide, Essence plus fréquente sur les ennemis (1 %)", "Faster Dream Nail, more frequent Essence from enemies (1%)"],
    31: ["Recharge du dash : 0,6 → 0,4 s, dash vers le bas", "Dash cooldown: 0.6 → 0.4 s, downward dash"],
    32: ["Délai entre deux attaques : 0,41 → 0,25 s", "Time between attacks: 0.41 → 0.25 s"],
    33: ["Coût des sorts : 33 → 24 Âme", "Spell cost: 33 → 24 SOUL"],
    34: ["Chaque Canalisation soigne 2 masques, mais plus lentement", "Each focus heals 2 masks, but slower"],
    35: ["À pleine vie, l'aiguillon tire un rayon d'énergie", "At full health, the nail fires an energy beam"],
    36: ["Âme-royale : régénère lentement l'Âme. Coeur du vide : les ombres du Vide deviennent alliées", "Kingsoul: slowly regenerates SOUL. Void Heart: the Void's shades become allies"],
    37: ["Vitesse de course : 8,3 → 10 (11,5 avec Maître de la célérité)", "Running speed: 8.3 → 10 (11.5 with Dashmaster)"],
    38: ["Un bouclier de rêve tourne autour de vous", "A dream shield orbits around you"],
    39: ["Fait apparaître de petites tisserandes alliées", "Summons little weaver allies"],
    40: ["L'Héritier de Grimm attaque les ennemis / Mélodie Insouciante peut annuler un coup reçu", "Grimmchild attacks enemies / Carefree Melody can block a hit"],
  };

  global.HKFeatures = { CHARM_FX, STATUES, SHOP, SHOP_OPTIONAL, SHOP_FLAGS, RELIC_VALUES, RELIC_NAMES };
})(typeof window !== "undefined" ? window : globalThis);
