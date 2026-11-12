/*
 * Lore page data: NPC questlines and encounters tracked by the save, and key lore revelations.
 * Steps test PlayerData fields: { k } true, { k, min } number >= min, { k, obj } object field true.
 * Summaries are short descriptions written for this site (not game text).
 */
(function (global) {
  "use strict";

  const QUESTS = [
    {
      id: "quirrel", name: "Quirrel", color: "#9fb4ff", wiki: "Quirrel",
      intro: "Un voyageur au masque de coquillage, que l'on croise tout au long de son exploration d'Hallownest.",
      steps: [
        { k: "metQuirrel", label: "Première rencontre" },
        { k: "quirrelEggTemple", min: 1, label: "Au Temple de l'Oeuf Noir" },
        { k: "quirrelSlugShrine", min: 1, label: "Au bord du Lac d'Unn, dans le Vertchemin" },
        { k: "quirrelRuins", min: 1, label: "Dans la Cité des Larmes" },
        { k: "quirrelMinesEncountered", label: "Au Mont Cristal" },
        { k: "quirrelMantisEncountered", label: "Près du Village des Mantes" },
        { k: "quirrelSpaEncountered", label: "À la source chaude du Nid-profond" },
        { k: "quirrelArchiveEncountered", label: "Aux Archives de l'Érudite" },
        { k: "quirrelEpilogueCompleted", label: "Un dernier moment au bord du Lac Bleu" },
      ],
    },
    {
      id: "cornifer", name: "Cornifer", color: "#e8d9a8", wiki: "Cornifer",
      intro: "Le cartographe qui fredonne en dessinant ses cartes, région après région.",
      steps: [
        { k: "corn_crossroadsEncountered", label: "Routes Oubliées" },
        { k: "corn_greenpathEncountered", label: "Vertchemin" },
        { k: "corn_fogCanyonEncountered", label: "Brumes-canyon" },
        { k: "corn_fungalWastesEncountered", label: "Caverne Nocive" },
        { k: "corn_cityEncountered", label: "Cité des Larmes" },
        { k: "corn_waterwaysEncountered", label: "Voies d'Eau Royales" },
        { k: "corn_minesEncountered", label: "Mont Cristal" },
        { k: "corn_cliffsEncountered", label: "Falaises Hurlantes" },
        { k: "corn_deepnestEncountered", label: "Nid-profond" },
        { k: "corn_outskirtsEncountered", label: "Frontières du Royaume" },
        { k: "corn_royalGardensEncountered", label: "Jardins de la Reine" },
        { k: "corn_abyssEncountered", label: "Bassin Ancestral" },
        { k: "corniferAtHome", label: "De retour chez Iselda, à Dirtmouth" },
      ],
    },
    {
      id: "elderbug", name: "L'Ancien", color: "#cfd6e4", wiki: "Elderbug",
      intro: "Le dernier habitant de Dirtmouth, toujours prêt à raconter le passé du village.",
      steps: [
        { k: "metElderbug", label: "Première rencontre" },
        { k: "elderbugHistory1", label: "Histoire de Dirtmouth (1/3)" },
        { k: "elderbugHistory2", label: "Histoire de Dirtmouth (2/3)" },
        { k: "elderbugHistory3", label: "Histoire de Dirtmouth (3/3)" },
        { k: "elderbugGaveFlower", label: "Lui offrir la Fleur délicate" },
      ],
    },
    {
      id: "hornet", name: "Hornet", color: "#ef8b8b", wiki: "Hornet",
      intro: "La protectrice d'Hallownest, qui jauge le Chevalier tout au long du voyage.",
      steps: [
        { k: "hornet1Defeated", label: "Le duel du Vertchemin" },
        { k: "hornetCityBridge_completed", label: "Croisée dans la Cité des Larmes" },
        { k: "hornetFountainEncounter", label: "Rencontre près de la fontaine" },
        { k: "hornetDenEncounter", label: "Dans l'Antre de la Bête" },
        { k: "hornetOutskirtsDefeated", label: "Le duel des Frontières du Royaume" },
      ],
    },
    {
      id: "zote", name: "Zote le Redoutable", color: "#f39a5a", wiki: "Zote",
      intro: "Un chevalier autoproclamé, plein de préceptes et de vantardise.",
      steps: [
        { k: "zoteRescuedBuzzer", label: "Sauvé de la Mouche Vengeresse Roi" },
        { k: "zoteSpokenCity", label: "Retrouvé dans la Cité des Larmes" },
        { k: "zoteRescuedDeepnest", label: "Sauvé dans le Nid-profond" },
        { k: "zoteDefeated", label: "Affronté au Colisée des Fous" },
        { k: "greyPrinceDefeated", label: "Zote le Prince Gris, dans les rêves de Bretta" },
      ],
    },
    {
      id: "bretta", name: "Bretta", color: "#ffb3c7", wiki: "Bretta",
      intro: "Une jeune insecte perdue dans la Caverne Nocive, qui rêve de héros.",
      steps: [
        { k: "brettaRescued", label: "Sauvée dans la Caverne Nocive" },
        { k: "brettaSeenBenchDiary", label: "Son journal, sur le banc" },
        { k: "brettaSeenBedDiary", label: "Son journal, près du lit" },
      ],
    },
    {
      id: "cloth", name: "Cloth", color: "#9fe3b5", wiki: "Cloth",
      intro: "Une guerrière qui cherche une bataille digne d'elle.",
      steps: [
        { k: "metCloth", label: "Première rencontre" },
        { k: "clothEncounteredQueensGarden", label: "Dans les Jardins de la Reine" },
        { k: "clothGhostSpoken", label: "Une dernière conversation" },
      ],
    },
    {
      id: "tiso", name: "Tiso", color: "#7fd8e8", wiki: "Tiso",
      intro: "Un aventurier au bouclier, en route vers le Colisée des Fous.",
      steps: [
        { k: "tisoEncounteredTown", label: "À Dirtmouth" },
        { k: "tisoEncounteredBench", label: "Sur un banc des Routes Oubliées" },
        { k: "tisoEncounteredLake", label: "Au bord du Lac Bleu" },
        { k: "tisoEncounteredColosseum", label: "Au Colisée des Fous" },
        { k: "tisoDead", label: "Le destin de Tiso" },
      ],
    },
    {
      id: "nailsmith", name: "Le Fabricant d'Aiguillons", color: "#cfd6e4", wiki: "Nailsmith",
      intro: "L'artisan de la Cité des Larmes, obsédé par l'aiguillon parfait.",
      steps: [
        { k: "metNailsmith", label: "Première rencontre" },
        { k: "nailSmithUpgrades", min: 4, label: "Forger l'Aiguillon pur" },
        { k: "nailsmithSpared", label: "L'épargner : il rejoint Sheo" },
      ],
    },
    {
      id: "nailmasters", name: "Les Maîtres d'Aiguillons", color: "#f2b56b", wiki: "Nailmasters",
      intro: "Trois élèves du Grand Maître Sly, chacun gardien d'une botte secrète.",
      steps: [
        { k: "metNailmasterMato", label: "Mato, aux Falaises Hurlantes" },
        { k: "metNailmasterSheo", label: "Sheo, dans le Vertchemin" },
        { k: "metNailmasterOro", label: "Oro, aux Frontières du Royaume" },
        { k: "killedNailBros", label: "Oro et Mato, dans la Maison des Dieux" },
        { k: "killedPaintmaster", label: "Maître Peintre Sheo, dans la Maison des Dieux" },
        { k: "killedNailsage", label: "Grand Maître Sly, dans la Maison des Dieux" },
      ],
    },
    {
      id: "seer", name: "La Voyante", color: "#d7a4ff", wiki: "Seer",
      intro: "La dernière de sa tribu de papillons, gardienne des rêves.",
      steps: [
        { k: "metMoth", label: "Première rencontre" },
        { k: "hasDreamNail", label: "Recevoir l'Aiguillon des rêves" },
        { k: "dreamNailUpgraded", label: "Éveiller l'Aiguillon des rêves" },
        { k: "mothDeparted", label: "Entendre ses derniers mots" },
      ],
    },
    {
      id: "mourner", name: "L'Endeuillée Grise", color: "#f4efe6", wiki: "Grey_Mourner",
      intro: "Elle pleure un être cher, aux Repos Éternel.",
      steps: [
        { k: "metXun", label: "Première rencontre" },
        { k: "xunFlowerGiven", label: "Déposer la Fleur délicate" },
        { k: "xunRewardGiven", label: "Recevoir sa récompense" },
      ],
    },
    {
      id: "queen", name: "La Dame Blanche", color: "#e9e6dc", wiki: "White_Lady",
      intro: "Une reine enracinée au cœur des Jardins de la Reine.",
      steps: [
        { k: "metQueen", label: "Première rencontre" },
        { k: "queenTalk1", label: "Premier échange" },
        { k: "queenTalk2", label: "Second échange" },
        { k: "gotQueenFragment", label: "Recevoir son Fragment blanc" },
      ],
    },
    {
      id: "mushroom", name: "Monsieur Champignon", color: "#9fe3b5", wiki: "Mister_Mushroom",
      intro: "Un mystérieux voyageur qui apparaît dans les coins les plus reculés du royaume.",
      steps: [1, 2, 3, 4, 5, 6, 7].map((n) => ({ k: "mrMushroomState", min: n + 1, label: `Rencontre ${n} sur 7` })),
    },
    {
      id: "grimm", name: "La Troupe Grimm", color: "#ff4b5c", wiki: "The_Grimm_Troupe",
      intro: "Une troupe itinérante appelée par la Lanterne du cauchemar.",
      steps: [
        { k: "metGrimm", label: "Rencontrer Grimm sous sa tente" },
        { k: "metBrum", label: "Rencontrer Brumm" },
        { k: "killedGrimm", label: "Vaincre Grimm" },
        { k: "killedNightmareGrimm", label: "Terminer le Rituel" },
        { k: "nymmInTown", label: "Ou bannir la troupe : Nymm à Dirtmouth" },
      ],
    },
    {
      id: "godseeker", name: "La Chercheuse de Dieux", color: "#f3c65a", wiki: "Godseeker",
      intro: "Elle vient d'un royaume lointain pour trouver les dieux d'Hallownest.",
      steps: [
        { k: "godseekerUnlocked", label: "La réveiller dans la Fosse à Ordures" },
        { k: "hasGodfinder", label: "Recevoir le Syntoniseur Divin" },
        { k: "bossDoorStateTier4", obj: "completed", label: "Terminer le Panthéon du Chevalier" },
        { k: "bossDoorStateTier5", obj: "completed", label: "Terminer le Panthéon d'Hallownest" },
      ],
    },
    {
      id: "others", name: "Autres rencontres", color: "#a3a9bb", wiki: "Characters_(Hollow_Knight)",
      intro: "Les marchands et personnages croisés en chemin.",
      steps: [
        { k: "metIselda", label: "Iselda, la boutique de cartes" },
        { k: "slyRescued", label: "Sly, sauvé dans les Routes Oubliées" },
        { k: "metCharmSlug", label: "Salubra, la marchande de Charmes" },
        { k: "metLegEater", label: "Mangepatte, dans la Caverne Nocive" },
        { k: "metRelicDealer", label: "Lemm, le chercheur de reliques" },
        { k: "metBanker", label: "Millibelle la banquière" },
        { k: "metMiner", label: "Myla, au Mont Cristal" },
        { k: "jijiMet", label: "Jiji, la Confesseuse" },
        { k: "metHunter", label: "Le Chasseur" },
        { k: "metEmilitia", label: "Emilitia, dans la Cité des Larmes" },
        { k: "midwifeMet", label: "La Sage-femme, dans le Nid-profond" },
        { k: "metDivine", label: "Divine, de la Troupe Grimm" },
        { k: "metStag", label: "Le Dernier Coléoptère" },
        { k: "littleFoolMet", label: "Le Petit Nigaud, au Colisée" },
      ],
    },
  ];

  const REVELATIONS = [
    {
      id: "dreamers", title: "Les Rêveurs", wiki: "Dreamers",
      when: [{ k: "lurienDefeated" }, { k: "monomonDefeated" }, { k: "hegemolDefeated" }], all: true,
      lock: "Briser les trois sceaux des Rêveurs",
      text: "Lurien le Veilleur, Monomon l'Érudite et Herrah la Bête ont accepté un sommeil éternel pour maintenir les sceaux du Temple de l'Oeuf Noir, où le Hollow Knight retient l'Infection.",
    },
    {
      id: "hornet", title: "Les origines de Hornet", wiki: "Hornet",
      when: [{ k: "hornetDenEncounter" }],
      lock: "Retrouver Hornet dans l'Antre de la Bête",
      text: "Herrah a accepté de devenir Rêveuse en échange d'un enfant du Roi pâle : Hornet. C'est pourquoi elle veille sur sa mère endormie et sur le royaume.",
    },
    {
      id: "abyss", title: "L'Abysse et les vaisseaux", wiki: "The_Abyss",
      when: [{ k: "hasShadowDash" }],
      lock: "Descendre au fond des Abysses",
      text: "Les Abysses sont le berceau des vaisseaux nés du Vide. Le Roi pâle y a cherché un réceptacle sans esprit, capable de contenir la Radiance. Le Chevalier est l'un d'eux, revenu de cet exil.",
    },
    {
      id: "queen", title: "La Dame Blanche", wiki: "White_Lady",
      when: [{ k: "gotQueenFragment" }],
      lock: "Recevoir le Fragment blanc de la Dame Blanche",
      text: "Compagne du Roi pâle, la Dame Blanche s'est retirée dans les Jardins de la Reine. Elle connaît le prix du plan de son époux et confie au Chevalier la moitié d'une âme royale.",
    },
    {
      id: "king", title: "La mémoire du Roi pâle", wiki: "White_Palace",
      when: [{ k: "gotKingFragment" }],
      lock: "Atteindre le sommet du Palais Blanc",
      text: "Dans le Palais Blanc, on découvre comment le Roi pâle a choisi le Hollow Knight, qu'il croyait pur, pour sceller la Radiance, et ce que ce choix a coûté aux autres vaisseaux.",
    },
    {
      id: "void", title: "Le Coeur du vide", wiki: "Void_Heart",
      when: [{ k: "gotShadeCharm" }],
      lock: "Unir l'Âme-royale au Vide des Abysses",
      text: "En unissant l'âme royale au Vide, le Chevalier gagne l'autorité sur les ombres des Abysses : la condition pour affronter la Radiance elle-même.",
    },
    {
      id: "grimm", title: "Le Rituel de la troupe", wiki: "The_Grimm_Troupe",
      when: [{ k: "killedNightmareGrimm" }, { k: "destroyedNightmareLantern" }],
      lock: "Terminer le Rituel ou bannir la troupe",
      text: "La troupe de Grimm voyage de royaume en royaume pour un rituel de renaissance : ses flammes se transmettent à un enfant qui deviendra le prochain Grimm. Brumm, lui, rêve d'y mettre fin.",
    },
    {
      id: "radiance", title: "La Radiance", wiki: "The_Radiance",
      when: [{ k: "killedFinalBoss" }],
      lock: "Affronter la lumière au cœur du rêve",
      text: "La Radiance est une divinité de lumière oubliée par les insectes d'Hallownest au profit du Roi pâle. L'Infection est sa manière de reprendre leurs esprits à travers leurs rêves.",
    },
    {
      id: "godhome", title: "La Maison des Dieux", wiki: "Godhome",
      when: [{ k: "bossDoorStateTier5", obj: "completed" }],
      lock: "Terminer le Panthéon d'Hallownest",
      text: "Les Chercheurs de Dieux ont parcouru les royaumes pour trouver un dieu digne d'être vénéré. Au sommet du Panthéon d'Hallownest, ils découvrent quelque chose d'inattendu.",
    },
  ];

  function test(pd, s) {
    const v = pd[s.k];
    if (s.obj) return !!(v && v[s.obj]);
    if (s.min !== undefined) return typeof v === "number" && v >= s.min;
    return v === true;
  }

  function keys() {
    const set = new Set();
    for (const q of QUESTS) for (const s of q.steps) set.add(s.k);
    for (const r of REVELATIONS) for (const s of r.when) set.add(s.k);
    return [...set];
  }

  // Keep only the fields the lore page needs, so they can be stored locally.
  function pick(pd) {
    const out = {};
    for (const k of keys()) if (pd[k] !== undefined) out[k] = pd[k];
    return out;
  }

  global.HKLore = { QUESTS, REVELATIONS, test, keys, pick };
})(typeof window !== "undefined" ? window : globalThis);
