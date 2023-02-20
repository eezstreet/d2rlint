import * as fs from "https://deno.land/std@0.130.0/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { parse } from "https://deno.land/std/encoding/jsonc.ts";
import { ExcelColumns } from "../rules/basic.ts";

/**
 * Entries for every Excel file.
 */
export abstract class D2RExcelRecord {
  abstract GetFileName(): string;

  GetOptionalFields(): string[] {
    return [];
  }

  GetAllFields(): string[] {
    return [];
  }
}

// misc.txt, armor.txt and weapons.txt all share the same base record type.
// however, some of the fields are optional.
// for whatever reason, Blizzard didn't make them all use the same column headers
export abstract class D2RItemExcelRecord extends D2RExcelRecord {
  name: unknown;
  compactsave: unknown;
  version: unknown;
  level: unknown;
  levelreq: unknown;
  reqstr: unknown;
  reqdex: unknown;
  rarity: unknown;
  spawnable: unknown;
  speed: unknown;
  nodurability: unknown;
  cost: unknown;
  "gamble cost": unknown;
  code: unknown;
  alternategfx: unknown;
  namestr: unknown;
  component: unknown;
  invwidth: unknown;
  invheight: unknown;
  hasinv: unknown;
  gemsockets: unknown;
  gemapplytype: unknown;
  flippyfile: unknown;
  invfile: unknown;
  uniqueinvfile: unknown;
  transmogrify: unknown;
  tmogtype: unknown;
  tmogmin: unknown;
  tmogmax: unknown;
  useable: unknown;
  type: unknown;
  type2: unknown;
  dropsound: unknown;
  dropsfxframe: unknown;
  usesound: unknown;
  unique: unknown;
  transparent: unknown;
  transtbl: unknown;
  lightradius: unknown;
  belt: unknown;
  autobelt: unknown;
  stackable: unknown;
  minstack: unknown;
  maxstack: unknown;
  spawnstack: unknown;
  quest: unknown;
  questdiffcheck: unknown;
  missiletype: unknown;
  spellicon: unknown;
  pspell: unknown;
  state: unknown;
  cstate1: unknown;
  cstate2: unknown;
  len: unknown;
  stat1: unknown;
  calc1: unknown;
  stat2: unknown;
  calc2: unknown;
  stat3: unknown;
  calc3: unknown;
  spelldesc: unknown;
  spelldescstr: unknown;
  spelldesccalc: unknown;
  durwarning: unknown;
  qntwarning: unknown;
  gemoffset: unknown;
  bettergem: unknown;
  bitfield1: unknown;
  charsimin: unknown;
  charsimax: unknown;
  charsimagicmin: unknown;
  charsimagicmax: unknown;
  charsimagiclvl: unknown;
  gheedmin: unknown;
  gheedmax: unknown;
  gheedmagicmin: unknown;
  gheedmagicmax: unknown;
  gheedmagiclvl: unknown;
  akaramin: unknown;
  akaramax: unknown;
  akaramagicmin: unknown;
  akaramagicmax: unknown;
  akaramagiclvl: unknown;
  faramin: unknown;
  faramax: unknown;
  faramagicmin: unknown;
  faramagicmax: unknown;
  faramagiclvl: unknown;
  lysandermin: unknown;
  lysandermax: unknown;
  lysandermagicmin: unknown;
  lysandermagicmax: unknown;
  lysandermagiclvl: unknown;
  drognanmin: unknown;
  drognanmax: unknown;
  drognanmagicmin: unknown;
  drognanmagicmax: unknown;
  drognanmagiclvl: unknown;
  hratlimin: unknown;
  hratlimax: unknown;
  hratlimagicmin: unknown;
  hratlimagicmax: unknown;
  hratlimagiclvl: unknown;
  alkormin: unknown;
  alkormax: unknown;
  alkormagicmin: unknown;
  alkormagicmax: unknown;
  alkormagiclvl: unknown;
  ormusmin: unknown;
  ormusmax: unknown;
  ormusmagicmin: unknown;
  ormusmagicmax: unknown;
  ormusmagiclvl: unknown;
  elzixmin: unknown;
  elzixmax: unknown;
  elzixmagicmin: unknown;
  elzixmagicmax: unknown;
  elzixmagiclvl: unknown;
  ashearamin: unknown;
  ashearamax: unknown;
  ashearamagicmin: unknown;
  ashearamagicmax: unknown;
  ashearamagiclvl: unknown;
  cainmin: unknown;
  cainmax: unknown;
  cainmagicmin: unknown;
  cainmagicmax: unknown;
  cainmagiclvl: unknown;
  halbumin: unknown;
  halbumax: unknown;
  halbumagicmin: unknown;
  halbumagicmax: unknown;
  halbumagiclvl: unknown;
  malahmin: unknown;
  malahmax: unknown;
  malahmagicmin: unknown;
  malahmagicmax: unknown;
  malahmagiclvl: unknown;
  larzukmin: unknown;
  larzukmax: unknown;
  larzukmagicmin: unknown;
  larzukmagicmax: unknown;
  larzukmagiclvl: unknown;
  anyamin: unknown;
  anyamax: unknown;
  anyamagicmin: unknown;
  anyamagicmax: unknown;
  anyamagiclvl: unknown;
  jamellamin: unknown;
  jamellamax: unknown;
  jamellamagicmin: unknown;
  jamellamagicmax: unknown;
  jamellamagiclvl: unknown;
  transform: unknown;
  invtrans: unknown;
  skipname: unknown;
  nightmareupgrade: unknown;
  hellupgrade: unknown;
  mindam: unknown;
  maxdam: unknown;
  permstoreitem: unknown;
  multibuy: unknown;
  nameable: unknown;
  worldevent: unknown;
  showlevel: unknown;
  spelldescstr2: unknown;
  spelldesccolor: unknown;
  minac: unknown;
  maxac: unknown;
  block: unknown;
  durability: unknown;
  "magic lvl": unknown; // fixme: unused?
  "auto prefix": unknown;
  normcode: unknown;
  ubercode: unknown;
  ultracode: unknown;
  setinvfile: unknown;
  rarm: unknown;
  larm: unknown;
  torso: unknown;
  legs: unknown;
  rspad: unknown;
  lspad: unknown;
  strbonus: unknown;
  dexbonus: unknown;
  "1or2handed": unknown;
  "2handed": unknown;
  "2handmindam": unknown;
  "2handmaxdam": unknown;
  minmisdam: unknown;
  maxmisdam: unknown;
  rangeadder: unknown;
  wclass: unknown;
  "2handedwclass": unknown;
  "hit class": unknown;

  /// Stuff specific for documentation
  skipInDocs: unknown;

  abstract GetOptionalFields(): (keyof D2RItemExcelRecord)[];
}

export class D2RArmor extends D2RItemExcelRecord {
  GetFileName(): string {
    return "armor.txt";
  }

  GetOptionalFields(): (keyof D2RItemExcelRecord)[] {
    return [
      "autobelt",
      "spellicon",
      "pspell",
      "state",
      "cstate1",
      "cstate2",
      "len",
      "stat1",
      "stat2",
      "stat3",
      "calc1",
      "calc2",
      "calc3",
      "spelldesc",
      "spelldescstr",
      "spelldesccalc",
      "spelldesccolor",
      "spelldescstr2",
      "bettergem",
      "multibuy",
      "1or2handed",
      "2handed",
      "2handmindam",
      "2handmaxdam",
      "minmisdam",
      "maxmisdam",
      "rangeadder",
      "wclass",
      "2handedwclass",
      "hit class",
    ];
  }
}

export class D2RMisc extends D2RItemExcelRecord {
  GetFileName(): string {
    return "misc.txt";
  }

  GetOptionalFields(): (keyof D2RItemExcelRecord)[] {
    return [
      "minac",
      "maxac",
      "block",
      "durability",
      "magic lvl",
      "auto prefix",
      "normcode",
      "ubercode",
      "ultracode",
      "setinvfile",
      "rarm",
      "larm",
      "torso",
      "legs",
      "rspad",
      "lspad",
      "strbonus",
      "dexbonus",
      "1or2handed",
      "2handed",
      "2handmindam",
      "2handmaxdam",
      "minmisdam",
      "maxmisdam",
      "rangeadder",
      "wclass",
      "2handedwclass",
      "hit class",
    ];
  }
}

export class D2RWeapons extends D2RItemExcelRecord {
  GetFileName(): string {
    return "weapons.txt";
  }

  GetOptionalFields(): (keyof D2RItemExcelRecord)[] {
    return [
      "minac",
      "maxac",
      "block",
      "rarm",
      "larm",
      "torso",
      "legs",
      "rspad",
      "lspad",
      "autobelt",
      "spellicon",
      "pspell",
      "state",
      "cstate1",
      "cstate2",
      "len",
      "stat1",
      "stat2",
      "stat3",
      "spelldesc",
      "spelldescstr",
      "spelldescstr2",
      "spelldesccalc",
      "bettergem",
      "multibuy",
      "spelldesccolor",
      "calc1",
      "calc2",
      "calc3",
    ];
  }
}

export class D2RActInfo extends D2RExcelRecord {
  act: unknown;
  town: unknown;
  start: unknown;
  maxnpcitemlevel: unknown;
  classlevelrangestart: unknown;
  classlevelrangeend: unknown;
  wanderingnpcstart: unknown;
  wanderingnpcrange: unknown;
  commonactcof: unknown;
  waypoint1: unknown;
  waypoint2: unknown;
  waypoint3: unknown;
  waypoint4: unknown;
  waypoint5: unknown;
  waypoint6: unknown;
  waypoint7: unknown;
  waypoint8: unknown;
  waypoint9: unknown;
  wanderingmonsterpopulatechance: unknown;
  wanderingmonsterregiontotal: unknown;
  wanderingpopulaterandomchance: unknown;

  GetFileName(): string {
    return "actinfo.txt";
  }
}

export class D2RArmType extends D2RExcelRecord {
  name: unknown;
  token: unknown;

  GetFileName(): string {
    return "armtype.txt";
  }
}

export class D2RAutomagic extends D2RExcelRecord {
  name: unknown;
  version: unknown;
  spawnable: unknown;
  rare: unknown;
  level: unknown;
  maxlevel: unknown;
  levelreq: unknown;
  classspecific: unknown;
  class: unknown;
  classlevelreq: unknown;
  frequency: unknown;
  group: unknown;
  mod1code: unknown;
  mod1param: unknown;
  mod1min: unknown;
  mod1max: unknown;
  mod2code: unknown;
  mod2param: unknown;
  mod2min: unknown;
  mod2max: unknown;
  mod3code: unknown;
  mod3param: unknown;
  mod3min: unknown;
  mod3max: unknown;
  transformcolor: unknown;
  itype1: unknown;
  itype2: unknown;
  itype3: unknown;
  itype4: unknown;
  itype5: unknown;
  itype6: unknown;
  itype7: unknown;
  etype1: unknown;
  etype2: unknown;
  etype3: unknown;
  etype4: unknown;
  etype5: unknown;
  multiply: unknown;
  add: unknown;

  /// Internal use only
  skipInDocs: unknown;

  GetFileName(): string {
    return "automagic.txt";
  }
}

export class D2RAutomap extends D2RExcelRecord {
  levelname: unknown;
  tilename: unknown;
  style: unknown;
  startsequence: unknown;
  endsequence: unknown;
  //type1
  cel1: unknown;
  //type2
  cel2: unknown;
  //type3
  cel3: unknown;
  //type4
  cel4: unknown;

  GetFileName(): string {
    return "automap.txt";
  }
}

export class D2RBelts extends D2RExcelRecord {
  name: unknown;
  numboxes: unknown;
  box1left: unknown;
  box1right: unknown;
  box1top: unknown;
  box1bottom: unknown;
  box2left: unknown;
  box2right: unknown;
  box2top: unknown;
  box2bottom: unknown;
  box3left: unknown;
  box3right: unknown;
  box3top: unknown;
  box3bottom: unknown;
  box4left: unknown;
  box4right: unknown;
  box4top: unknown;
  box4bottom: unknown;
  box5left: unknown;
  box5right: unknown;
  box5top: unknown;
  box5bottom: unknown;
  box6left: unknown;
  box6right: unknown;
  box6top: unknown;
  box6bottom: unknown;
  box7left: unknown;
  box7right: unknown;
  box7top: unknown;
  box7bottom: unknown;
  box8left: unknown;
  box8right: unknown;
  box8top: unknown;
  box8bottom: unknown;
  box9left: unknown;
  box9right: unknown;
  box9top: unknown;
  box9bottom: unknown;
  box10left: unknown;
  box10right: unknown;
  box10top: unknown;
  box10bottom: unknown;
  box11left: unknown;
  box11right: unknown;
  box11top: unknown;
  box11bottom: unknown;
  box12left: unknown;
  box12right: unknown;
  box12top: unknown;
  box12bottom: unknown;
  box13left: unknown;
  box13right: unknown;
  box13top: unknown;
  box13bottom: unknown;
  box14left: unknown;
  box14right: unknown;
  box14top: unknown;
  box14bottom: unknown;
  box15left: unknown;
  box15right: unknown;
  box15top: unknown;
  box15bottom: unknown;
  box16left: unknown;
  box16right: unknown;
  box16top: unknown;
  box16bottom: unknown;
  // added in Diablo II: Resurrected 2.4
  defaultitemtypecol1: unknown;
  defaultitemcodecol1: unknown;
  defaultitemtypecol2: unknown;
  defaultitemcodecol2: unknown;
  defaultitemtypecol3: unknown;
  defaultitemcodecol3: unknown;
  defaultitemtypecol4: unknown;
  defaultitemcodecol4: unknown;

  GetFileName(): string {
    return "belts.txt";
  }
}

export class D2RBodyLocs extends D2RExcelRecord {
  "body location": unknown;
  code: unknown;

  GetFileName(): string {
    return "bodylocs.txt";
  }
}

export class D2RBooks extends D2RExcelRecord {
  name: unknown;
  scrollspellcode: unknown;
  bookspellcode: unknown;
  pspell: unknown;
  spellicon: unknown;
  scrollskill: unknown;
  bookskill: unknown;
  basecost: unknown;
  costpercharge: unknown;

  GetFileName(): string {
    return "books.txt";
  }
}

export class D2RCharStats extends D2RExcelRecord {
  class: unknown;
  str: unknown;
  dex: unknown;
  int: unknown;
  vit: unknown;
  stamina: unknown;
  hpadd: unknown;
  manaregen: unknown;
  tohitfactor: unknown;
  walkvelocity: unknown;
  runvelocity: unknown;
  rundrain: unknown;
  //comment
  lifeperlevel: unknown;
  staminaperlevel: unknown;
  manaperlevel: unknown;
  lifepervitality: unknown;
  staminapervitality: unknown;
  manapermagic: unknown;
  statperlevel: unknown;
  skillsperlevel: unknown;
  lightradius: unknown;
  blockfactor: unknown;
  minimumcastingdelay: unknown;
  startskill: unknown;
  "skill 1": unknown;
  "skill 2": unknown;
  "skill 3": unknown;
  "skill 4": unknown;
  "skill 5": unknown;
  "skill 6": unknown;
  "skill 7": unknown;
  "skill 8": unknown;
  "skill 9": unknown;
  "skill 10": unknown;
  strallskills: unknown;
  strskilltab1: unknown;
  strskilltab2: unknown;
  strskilltab3: unknown;
  strclassonly: unknown;
  healthpotionpercent: unknown;
  manapotionpercent: unknown;
  basewclass: unknown;
  item1: unknown;
  item1loc: unknown;
  item1count: unknown;
  item1quality: unknown;
  item2: unknown;
  item2loc: unknown;
  item2count: unknown;
  item2quality: unknown;
  item3: unknown;
  item3loc: unknown;
  item3count: unknown;
  item3quality: unknown;
  item4: unknown;
  item4loc: unknown;
  item4count: unknown;
  item4quality: unknown;
  item5: unknown;
  item5loc: unknown;
  item5count: unknown;
  item5quality: unknown;
  item6: unknown;
  item6loc: unknown;
  item6count: unknown;
  item6quality: unknown;
  item7: unknown;
  item7loc: unknown;
  item7count: unknown;
  item7quality: unknown;
  item8: unknown;
  item8loc: unknown;
  item8count: unknown;
  item8quality: unknown;
  item9: unknown;
  item9loc: unknown;
  item9count: unknown;
  item9quality: unknown;
  item10: unknown;
  item10loc: unknown;
  item10count: unknown;
  item10quality: unknown;

  GetFileName(): string {
    return "charstats.txt";
  }
}

export class D2RColors extends D2RExcelRecord {
  "transform color": unknown;
  code: unknown;

  GetFileName(): string {
    return "colors.txt";
  }
}

export class D2RCompCode extends D2RExcelRecord {
  component: unknown;
  code: unknown;

  GetFileName(): string {
    return "compcode.txt";
  }
}

export class D2RComposit extends D2RExcelRecord {
  name: unknown;
  token: unknown;

  GetFileName(): string {
    return "composit.txt";
  }
}

export class D2RCubemain extends D2RExcelRecord {
  description: unknown;
  enabled: unknown;
  //ladder: unknown;  // Removed in Diablo II: Resurrected 2.6
  "min diff": unknown;
  version: unknown;
  op: unknown;
  param: unknown;
  value: unknown;
  class: unknown;
  numinputs: unknown;
  "input 1": unknown;
  "input 2": unknown;
  "input 3": unknown;
  "input 4": unknown;
  "input 5": unknown;
  "input 6": unknown;
  "input 7": unknown;
  output: unknown;
  lvl: unknown;
  plvl: unknown;
  ilvl: unknown;
  "mod 1": unknown;
  "mod 1 chance": unknown;
  "mod 1 param": unknown;
  "mod 1 min": unknown;
  "mod 1 max": unknown;
  "mod 2": unknown;
  "mod 2 chance": unknown;
  "mod 2 param": unknown;
  "mod 2 min": unknown;
  "mod 2 max": unknown;
  "mod 3": unknown;
  "mod 3 chance": unknown;
  "mod 3 param": unknown;
  "mod 3 min": unknown;
  "mod 3 max": unknown;
  "mod 4": unknown;
  "mod 4 chance": unknown;
  "mod 4 param": unknown;
  "mod 4 min": unknown;
  "mod 4 max": unknown;
  "mod 5": unknown;
  "mod 5 chance": unknown;
  "mod 5 param": unknown;
  "mod 5 min": unknown;
  "mod 5 max": unknown;
  "output b": unknown;
  "b lvl": unknown;
  "b plvl": unknown;
  "b ilvl": unknown;
  "b mod 1": unknown;
  "b mod 1 chance": unknown;
  "b mod 1 param": unknown;
  "b mod 1 min": unknown;
  "b mod 1 max": unknown;
  "b mod 2": unknown;
  "b mod 2 chance": unknown;
  "b mod 2 param": unknown;
  "b mod 2 max": unknown;
  "b mod 2 min": unknown;
  "b mod 3": unknown;
  "b mod 3 chance": unknown;
  "b mod 3 param": unknown;
  "b mod 3 min": unknown;
  "b mod 3 max": unknown;
  "b mod 4": unknown;
  "b mod 4 chance": unknown;
  "b mod 4 param": unknown;
  "b mod 4 min": unknown;
  "b mod 4 max": unknown;
  "b mod 5": unknown;
  "b mod 5 chance": unknown;
  "b mod 5 param": unknown;
  "b mod 5 min": unknown;
  "b mod 5 max": unknown;
  "output c": unknown;
  "c lvl": unknown;
  "c plvl": unknown;
  "c ilvl": unknown;
  "c mod 1": unknown;
  "c mod 1 chance": unknown;
  "c mod 1 param": unknown;
  "c mod 1 min": unknown;
  "c mod 1 max": unknown;
  "c mod 2": unknown;
  "c mod 2 chance": unknown;
  "c mod 2 param": unknown;
  "c mod 2 max": unknown;
  "c mod 2 min": unknown;
  "c mod 3": unknown;
  "c mod 3 chance": unknown;
  "c mod 3 param": unknown;
  "c mod 3 min": unknown;
  "c mod 3 max": unknown;
  "c mod 4": unknown;
  "c mod 4 chance": unknown;
  "c mod 4 param": unknown;
  "c mod 4 min": unknown;
  "c mod 4 max": unknown;
  "c mod 5": unknown;
  "c mod 5 chance": unknown;
  "c mod 5 param": unknown;
  "c mod 5 min": unknown;
  "c mod 5 max": unknown;
  // added in Diablo II: Resurrected 2.6
  firstLadderSeason: unknown;
  lastLadderSeason: unknown;

  /// Internal use only
  skipInDocs: unknown;

  GetFileName(): string {
    return "cubemain.txt";
  }
}

export class D2RCubemod extends D2RExcelRecord {
  "cube modifier type": unknown;
  code: unknown;

  GetFileName(): string {
    return "cubemod.txt";
  }
}

export class D2RDifficultyLevels extends D2RExcelRecord {
  name: unknown;
  resistpenalty: unknown;
  resistpenaltynonexpansion: unknown;
  deathexppenalty: unknown;
  monsterskillbonus: unknown;
  monsterfreezedivisor: unknown;
  monstercolddivisor: unknown;
  aicursedivisor: unknown;
  lifestealdivisor: unknown;
  manastealdivisor: unknown;
  uniquedamagebonus: unknown;
  championdamagebonus: unknown;
  playerdamagepercentvsplayer: unknown;
  playerdamagepercentvsmercenary: unknown;
  playerdamagepercentvsprimeevil: unknown;
  mercenarydamagepercentvsplayer: unknown;
  mercenarydamagepercentvsmercenary: unknown;
  mercenarydamagepercentvsboss: unknown;
  mercenarymaxstunlength: unknown;
  primeevildamagepercentvsplayer: unknown;
  primeevildamagepercentvsmercenary: unknown;
  primeevildamagepercentvspet: unknown;
  petdamagepercentvsplayer: unknown;
  monstercedamagepercent: unknown;
  staticfieldmin: unknown;
  gamblerare: unknown;
  gambleset: unknown;
  gambleunique: unknown;
  gambleuber: unknown;
  gambleultra: unknown;
  // added in Diablo II: Resurrected 2.4
  playerhitreactbuffervsplayer: unknown;
  playerhitreactbuffervsmonster: unknown;
  monsterfireenchantexplosiondamagepercent: unknown;

  GetFileName(): string {
    return "difficultylevels.txt";
  }
}

export class D2RElemTypes extends D2RExcelRecord {
  "elemental type": unknown;
  code: unknown;

  GetFileName(): string {
    return "elemtypes.txt";
  }
}

export class D2REvents extends D2RExcelRecord {
  event: unknown;

  GetFileName(): string {
    return "events.txt";
  }
}

export class D2RExperience extends D2RExcelRecord {
  level: unknown;
  amazon: unknown;
  sorceress: unknown;
  necromancer: unknown;
  paladin: unknown;
  barbarian: unknown;
  druid: unknown;
  assassin: unknown;
  expratio: unknown;

  GetFileName(): string {
    return "experience.txt";
  }
}

export class D2RGamble extends D2RExcelRecord {
  name: unknown;
  code: unknown;

  GetFileName(): string {
    return "gamble.txt";
  }
}

export class D2RGems extends D2RExcelRecord {
  name: unknown;
  letter: unknown;
  transform: unknown;
  code: unknown;
  weaponmod1code: unknown;
  weaponmod1param: unknown;
  weaponmod1min: unknown;
  weaponmod1max: unknown;
  weaponmod2code: unknown;
  weaponmod2param: unknown;
  weaponmod2min: unknown;
  weaponmod2max: unknown;
  weaponmod3code: unknown;
  weaponmod3param: unknown;
  weaponmod3min: unknown;
  weaponmod3max: unknown;
  helmmod1code: unknown;
  helmmod1param: unknown;
  helmmod1min: unknown;
  helmmod1max: unknown;
  helmmod2code: unknown;
  helmmod2param: unknown;
  helmmod2min: unknown;
  helmmod2max: unknown;
  helmmod3code: unknown;
  helmmod3param: unknown;
  helmmod3min: unknown;
  helmmod3max: unknown;
  shieldmod1code: unknown;
  shieldmod1param: unknown;
  shieldmod1min: unknown;
  shieldmod1max: unknown;
  shieldmod2code: unknown;
  shieldmod2param: unknown;
  shieldmod2min: unknown;
  shieldmod2max: unknown;
  shieldmod3code: unknown;
  shieldmod3param: unknown;
  shieldmod3min: unknown;
  shieldmod3max: unknown;

  /// Internal use only
  skipInDocs: unknown;

  GetFileName(): string {
    return "gems.txt";
  }
}

export class D2RHireling extends D2RExcelRecord {
  hireling: unknown;
  version: unknown;
  id: unknown;
  class: unknown;
  act: unknown;
  difficulty: unknown;
  level: unknown;
  seller: unknown;
  namefirst: unknown;
  namelast: unknown;
  gold: unknown;
  "exp/lvl": unknown;
  hp: unknown;
  "hp/lvl": unknown;
  defense: unknown;
  "def/lvl": unknown;
  str: unknown;
  "str/lvl": unknown;
  dex: unknown;
  "dex/lvl": unknown;
  ar: unknown;
  "ar/lvl": unknown;
  "dmg-min": unknown;
  "dmg-max": unknown;
  "dmg/lvl": unknown;
  resistfire: unknown;
  "resistfire/lvl": unknown;
  resistcold: unknown;
  "resistcold/lvl": unknown;
  resistlightning: unknown;
  "resistlightning/lvl": unknown;
  resistpoison: unknown;
  "resistpoison/lvl": unknown;
  hiredesc: unknown;
  defaultchance: unknown;
  skill1: unknown;
  mode1: unknown;
  chance1: unknown;
  chanceperlvl1: unknown;
  level1: unknown;
  lvlperlvl1: unknown;
  skill2: unknown;
  mode2: unknown;
  chance2: unknown;
  chanceperlvl2: unknown;
  level2: unknown;
  lvlperlvl2: unknown;
  skill3: unknown;
  mode3: unknown;
  chance3: unknown;
  chanceperlvl3: unknown;
  level3: unknown;
  lvlperlvl3: unknown;
  skill4: unknown;
  mode4: unknown;
  chance4: unknown;
  chanceperlvl4: unknown;
  level4: unknown;
  lvlperlvl4: unknown;
  skill5: unknown;
  mode5: unknown;
  chance5: unknown;
  chanceperlvl5: unknown;
  level5: unknown;
  lvlperlvl5: unknown;
  skill6: unknown;
  mode6: unknown;
  chance6: unknown;
  chanceperlvl6: unknown;
  level6: unknown;
  lvlperlvl6: unknown;
  hiringmaxleveldifference: unknown;
  resurrectcostmultiplier: unknown;
  resurrectcostdivisor: unknown;
  resurrectcostmax: unknown;
  // Added in Diablo II: Resurrected 2.4
  equivalentcharclass: unknown;

  GetFileName(): string {
    return "hireling.txt";
  }
}

// Added in Diablo II: Resurrected 2.5
export class D2RHirelingDesc extends D2RExcelRecord {
  id: unknown;
  alternateVoice: unknown;

  GetFileName(): string {
    return "hiredesc.txt";
  }
}

export class D2RHitclass extends D2RExcelRecord {
  "hit class": unknown;
  code: unknown;

  GetFileName(): string {
    return "hitclass.txt";
  }
}

export class D2RInventory extends D2RExcelRecord {
  class: unknown;
  invleft: unknown;
  invright: unknown;
  invtop: unknown;
  invbottom: unknown;
  gridx: unknown;
  gridy: unknown;
  gridleft: unknown;
  gridright: unknown;
  gridtop: unknown;
  gridbottom: unknown;
  gridboxwidth: unknown;
  gridboxheight: unknown;
  rarmleft: unknown;
  rarmright: unknown;
  rarmtop: unknown;
  rarmbottom: unknown;
  rarmwidth: unknown;
  rarmheight: unknown;
  torsoleft: unknown;
  torsoright: unknown;
  torsotop: unknown;
  torsobottom: unknown;
  torsowidth: unknown;
  torsoheight: unknown;
  larmleft: unknown;
  larmright: unknown;
  larmtop: unknown;
  larmbottom: unknown;
  larmwidth: unknown;
  larmheight: unknown;
  headleft: unknown;
  headright: unknown;
  headtop: unknown;
  headbottom: unknown;
  headwidth: unknown;
  headheight: unknown;
  neckleft: unknown;
  neckright: unknown;
  necktop: unknown;
  neckbottom: unknown;
  neckwidth: unknown;
  neckheight: unknown;
  rhandleft: unknown;
  rhandright: unknown;
  rhandtop: unknown;
  rhandbottom: unknown;
  rhandwidth: unknown;
  rhandheight: unknown;
  lhandleft: unknown;
  lhandright: unknown;
  lhandtop: unknown;
  lhandbottom: unknown;
  lhandwidth: unknown;
  lhandheight: unknown;
  beltleft: unknown;
  beltright: unknown;
  belttop: unknown;
  beltbottom: unknown;
  beltwidth: unknown;
  beltheight: unknown;
  feetleft: unknown;
  feetright: unknown;
  feettop: unknown;
  feetbottom: unknown;
  feetwidth: unknown;
  feetheight: unknown;
  glovesleft: unknown;
  glovesright: unknown;
  glovestop: unknown;
  glovesbottom: unknown;
  gloveswidth: unknown;
  glovesheight: unknown;

  GetFileName(): string {
    return "inventory.txt";
  }
}

export class D2RItemRatio extends D2RExcelRecord {
  function: unknown;
  version: unknown;
  uber: unknown;
  "class specific": unknown;
  unique: unknown;
  uniquedivisor: unknown;
  uniquemin: unknown;
  rare: unknown;
  raredivisor: unknown;
  raremin: unknown;
  set: unknown;
  setdivisor: unknown;
  setmin: unknown;
  magic: unknown;
  magicdivisor: unknown;
  magicmin: unknown;
  hiquality: unknown;
  hiqualitydivisor: unknown;
  normal: unknown;
  normaldivisor: unknown;

  GetFileName(): string {
    return "itemratio.txt";
  }
}

export class D2RItemStatCost extends D2RExcelRecord {
  stat: unknown;
  "send other": unknown;
  signed: unknown;
  "send bits": unknown;
  "send param bits": unknown;
  updateanimrate: unknown;
  saved: unknown;
  csvsigned: unknown;
  csvbits: unknown;
  csvparam: unknown;
  fcallback: unknown;
  fmin: unknown;
  minaccr: unknown;
  encode: unknown;
  add: unknown;
  multiply: unknown;
  valshift: unknown;
  "1.09-save bits": unknown;
  "1.09-save add": unknown;
  "save bits": unknown;
  "save add": unknown;
  "save param bits": unknown;
  keepzero: unknown;
  op: unknown;
  "op param": unknown;
  "op base": unknown;
  "op stat1": unknown;
  "op stat2": unknown;
  "op stat3": unknown;
  direct: unknown;
  maxstat: unknown;
  damagerelated: unknown;
  itemevent1: unknown;
  itemeventfunc1: unknown;
  itemevent2: unknown;
  itemeventfunc2: unknown;
  descpriority: unknown;
  descfunc: unknown;
  descval: unknown;
  descstrpos: unknown;
  descstrneg: unknown;
  descstr2: unknown;
  dgrp: unknown;
  dgrpfunc: unknown;
  dgrpval: unknown;
  dgrpstrpos: unknown;
  dgrpstrneg: unknown;
  dgrpstr2: unknown;
  stuff: unknown;
  advdisplay: unknown;

  GetFileName(): string {
    return "itemstatcost.txt";
  }
}

export class D2RItemTypes extends D2RExcelRecord {
  itemtype: unknown;
  code: unknown;
  equiv1: unknown;
  equiv2: unknown;
  repair: unknown;
  body: unknown;
  bodyloc1: unknown;
  bodyloc2: unknown;
  shoots: unknown;
  quiver: unknown;
  throwable: unknown;
  reload: unknown;
  reequip: unknown;
  autostack: unknown;
  magic: unknown;
  rare: unknown;
  normal: unknown;
  beltable: unknown;
  maxsockets1: unknown;
  maxsocketslevelthreshold1: unknown;
  maxsockets2: unknown;
  maxsocketslevelthreshold2: unknown;
  maxsockets3: unknown;
  treasureclass: unknown;
  rarity: unknown;
  staffmods: unknown;
  class: unknown;
  varinvgfx: unknown;
  invgfx1: unknown;
  invgfx2: unknown;
  invgfx3: unknown;
  invgfx4: unknown;
  invgfx5: unknown;
  invgfx6: unknown;
  storepage: unknown;

  GetFileName(): string {
    return "itemtypes.txt";
  }
}

// Added in Diablo II: Resurrected 2.5
export class D2RLevelGroups extends D2RExcelRecord {
  name: unknown;
  id: unknown;
  groupname: unknown;

  GetFileName(): string {
    return "levelgroups.txt";
  }
}

export class D2RLevels extends D2RExcelRecord {
  name: unknown;
  id: unknown;
  pal: unknown;
  act: unknown;
  questflag: unknown;
  questflagex: unknown;
  layer: unknown;
  sizex: unknown;
  sizey: unknown;
  "sizex(n)": unknown;
  "sizey(n)": unknown;
  "sizex(h)": unknown;
  "sizey(h)": unknown;
  offsetx: unknown;
  offsety: unknown;
  depend: unknown;
  teleport: unknown;
  rain: unknown;
  mud: unknown;
  noper: unknown;
  losdraw: unknown;
  floorfilter: unknown;
  blankscreen: unknown;
  drawedges: unknown;
  drlgtype: unknown;
  leveltype: unknown;
  subtype: unknown;
  subtheme: unknown;
  subwaypoint: unknown;
  subshrine: unknown;
  vis0: unknown;
  vis1: unknown;
  vis2: unknown;
  vis3: unknown;
  vis4: unknown;
  vis5: unknown;
  vis6: unknown;
  vis7: unknown;
  warp0: unknown;
  warp1: unknown;
  warp2: unknown;
  warp3: unknown;
  warp4: unknown;
  warp5: unknown;
  warp6: unknown;
  warp7: unknown;
  intensity: unknown;
  red: unknown;
  green: unknown;
  blue: unknown;
  portal: unknown;
  position: unknown;
  savemonsters: unknown;
  quest: unknown;
  warpdist: unknown;
  monlvl: unknown;
  "monlvl(n)": unknown;
  "monlvl(h)": unknown;
  monlvlex: unknown;
  "monlvlex(n)": unknown;
  "monlvlex(h)": unknown;
  monden: unknown;
  "monden(n)": unknown;
  "monden(h)": unknown;
  monumin: unknown;
  monumax: unknown;
  "monumin(n)": unknown;
  "monumax(n)": unknown;
  "monumin(h)": unknown;
  "monumax(h)": unknown;
  monwndr: unknown;
  monspcwalk: unknown;
  nummon: unknown;
  mon1: unknown;
  mon2: unknown;
  mon3: unknown;
  mon4: unknown;
  mon5: unknown;
  mon6: unknown;
  mon7: unknown;
  mon8: unknown;
  mon9: unknown;
  mon10: unknown;
  mon11: unknown;
  mon12: unknown;
  mon13: unknown;
  mon14: unknown;
  mon15: unknown;
  mon16: unknown;
  mon17: unknown;
  mon18: unknown;
  mon19: unknown;
  mon20: unknown;
  mon21: unknown;
  mon22: unknown;
  mon23: unknown;
  mon24: unknown;
  mon25: unknown;
  rangedspawn: unknown;
  nmon1: unknown;
  nmon2: unknown;
  nmon3: unknown;
  nmon4: unknown;
  nmon5: unknown;
  nmon6: unknown;
  nmon7: unknown;
  nmon8: unknown;
  nmon9: unknown;
  nmon10: unknown;
  nmon11: unknown;
  nmon12: unknown;
  nmon13: unknown;
  nmon14: unknown;
  nmon15: unknown;
  nmon16: unknown;
  nmon17: unknown;
  nmon18: unknown;
  nmon19: unknown;
  nmon20: unknown;
  nmon21: unknown;
  nmon22: unknown;
  nmon23: unknown;
  nmon24: unknown;
  nmon25: unknown;
  umon1: unknown;
  umon2: unknown;
  umon3: unknown;
  umon4: unknown;
  umon5: unknown;
  umon6: unknown;
  umon7: unknown;
  umon8: unknown;
  umon9: unknown;
  umon10: unknown;
  umon11: unknown;
  umon12: unknown;
  umon13: unknown;
  umon14: unknown;
  umon15: unknown;
  umon16: unknown;
  umon17: unknown;
  umon18: unknown;
  umon19: unknown;
  umon20: unknown;
  umon21: unknown;
  umon22: unknown;
  umon23: unknown;
  umon24: unknown;
  umon25: unknown;
  cmon1: unknown;
  cmon2: unknown;
  cmon3: unknown;
  cmon4: unknown;
  cpct1: unknown;
  cpct2: unknown;
  cpct3: unknown;
  cpct4: unknown;
  camt1: unknown;
  camt2: unknown;
  camt3: unknown;
  camt4: unknown;
  themes: unknown;
  soundenv: unknown;
  waypoint: unknown;
  levelname: unknown;
  levelwarp: unknown;
  levelentry: unknown;
  objgrp0: unknown;
  objgrp1: unknown;
  objgrp2: unknown;
  objgrp3: unknown;
  objgrp4: unknown;
  objgrp5: unknown;
  objgrp6: unknown;
  objgrp7: unknown;
  objprb0: unknown;
  objprb1: unknown;
  objprb2: unknown;
  objprb3: unknown;
  objprb4: unknown;
  objprb5: unknown;
  objprb6: unknown;
  objprb7: unknown;
  // Added in Diablo II: Resurrected 2.5
  levelgroup: unknown;

  GetFileName(): string {
    return "levels.txt";
  }
}

export class D2RLowQualityItems extends D2RExcelRecord {
  name: unknown;

  GetFileName(): string {
    return "lowqualityitems.txt";
  }
}

export class D2RLvlMaze extends D2RExcelRecord {
  name: unknown;
  level: unknown;
  rooms: unknown;
  "rooms(n)": unknown;
  "rooms(h)": unknown;
  sizex: unknown;
  sizey: unknown;
  merge: unknown;

  GetFileName(): string {
    return "lvlmaze.txt";
  }
}

export class D2RLvlPrest extends D2RExcelRecord {
  name: unknown;
  def: unknown;
  levelid: unknown;
  populate: unknown;
  logicals: unknown;
  outdoors: unknown;
  animate: unknown;
  killedge: unknown;
  fillblanks: unknown;
  sizex: unknown;
  sizey: unknown;
  automap: unknown;
  scan: unknown;
  pops: unknown;
  poppad: unknown;
  files: unknown;
  file1: unknown;
  file2: unknown;
  file3: unknown;
  file4: unknown;
  file5: unknown;
  file6: unknown;
  dt1mask: unknown;

  GetFileName(): string {
    return "lvlprest.txt";
  }
}

export class D2RLvlSub extends D2RExcelRecord {
  name: unknown;
  type: unknown;
  file: unknown;
  checkall: unknown;
  bordtype: unknown;
  gridsize: unknown;
  dt1mask: unknown;
  prob0: unknown;
  trials0: unknown;
  max0: unknown;
  prob1: unknown;
  trials1: unknown;
  max1: unknown;
  prob2: unknown;
  trials2: unknown;
  max2: unknown;
  prob3: unknown;
  trials3: unknown;
  max3: unknown;
  prob4: unknown;
  trials4: unknown;
  max4: unknown;

  GetFileName(): string {
    return "lvlsub.txt";
  }
}

export class D2RLvlTypes extends D2RExcelRecord {
  name: unknown;
  id: unknown;
  "file 1": unknown;
  "file 2": unknown;
  "file 3": unknown;
  "file 4": unknown;
  "file 5": unknown;
  "file 6": unknown;
  "file 7": unknown;
  "file 8": unknown;
  "file 9": unknown;
  "file 10": unknown;
  "file 11": unknown;
  "file 12": unknown;
  "file 13": unknown;
  "file 14": unknown;
  "file 15": unknown;
  "file 16": unknown;
  "file 17": unknown;
  "file 18": unknown;
  "file 19": unknown;
  "file 20": unknown;
  "file 21": unknown;
  "file 22": unknown;
  "file 23": unknown;
  "file 24": unknown;
  "file 25": unknown;
  "file 26": unknown;
  "file 27": unknown;
  "file 28": unknown;
  "file 29": unknown;
  "file 30": unknown;
  "file 31": unknown;
  "file 32": unknown;
  act: unknown;

  GetFileName(): string {
    return "lvltypes.txt";
  }
}

export class D2RLvlWarp extends D2RExcelRecord {
  name: unknown;
  id: unknown;
  selectx: unknown;
  selecty: unknown;
  selectdx: unknown;
  selectdy: unknown;
  exitwalkx: unknown;
  exitwalky: unknown;
  offsetx: unknown;
  offsety: unknown;
  litversion: unknown;
  tiles: unknown;
  nointeract: unknown;
  direction: unknown;
  uniqueid: unknown;

  GetFileName(): string {
    return "lvlwarp.txt";
  }
}

export abstract class D2RMagicBase extends D2RExcelRecord {
  name: unknown;
  version: unknown;
  spawnable: unknown;
  rare: unknown;
  level: unknown;
  maxlevel: unknown;
  levelreq: unknown;
  classspecific: unknown;
  class: unknown;
  classlevelreq: unknown;
  frequency: unknown;
  group: unknown;
  mod1code: unknown;
  mod1param: unknown;
  mod1min: unknown;
  mod1max: unknown;
  mod2code: unknown;
  mod2param: unknown;
  mod2min: unknown;
  mod2max: unknown;
  mod3code: unknown;
  mod3param: unknown;
  mod3min: unknown;
  mod3max: unknown;
  transformcolor: unknown;
  itype1: unknown;
  itype2: unknown;
  itype3: unknown;
  itype4: unknown;
  itype5: unknown;
  itype6: unknown;
  itype7: unknown;
  etype1: unknown;
  etype2: unknown;
  etype3: unknown;
  etype4: unknown;
  etype5: unknown;
  multiply: unknown;
  add: unknown;

  /// Internal use only
  skipInDocs: unknown;
}

export class D2RMagicPrefix extends D2RMagicBase {
  GetFileName(): string {
    return "magicprefix.txt";
  }
}

export class D2RMagicSuffix extends D2RMagicBase {
  GetFileName(): string {
    return "magicsuffix.txt";
  }
}

export class D2RMissCalc extends D2RExcelRecord {
  code: unknown;

  GetFileName(): string {
    return "misscalc.txt";
  }
}

export class D2RMissiles extends D2RExcelRecord {
  missile: unknown;
  pcltdofunc: unknown;
  pclthitfunc: unknown;
  psrvdofunc: unknown;
  psrvhitfunc: unknown;
  psrvdmgfunc: unknown;
  srvcalc1: unknown;
  param1: unknown;
  param2: unknown;
  param3: unknown;
  param4: unknown;
  param5: unknown;
  cltcalc1: unknown;
  cltparam1: unknown;
  cltparam2: unknown;
  cltparam3: unknown;
  cltparam4: unknown;
  cltparam5: unknown;
  shitcalc1: unknown;
  shitpar1: unknown;
  shitpar2: unknown;
  shitpar3: unknown;
  chitcalc1: unknown;
  chitpar1: unknown;
  chitpar2: unknown;
  chitpar3: unknown;
  dmgcalc1: unknown;
  dparam1: unknown;
  dparam2: unknown;
  vel: unknown;
  maxvel: unknown;
  vellev: unknown;
  accel: unknown;
  range: unknown;
  levrange: unknown;
  light: unknown;
  flicker: unknown;
  red: unknown;
  green: unknown;
  blue: unknown;
  initsteps: unknown;
  activate: unknown;
  loopanim: unknown;
  celfile: unknown;
  animrate: unknown;
  animlen: unknown;
  animspeed: unknown;
  randstart: unknown;
  subloop: unknown;
  substart: unknown;
  substop: unknown;
  collidetype: unknown;
  collidekill: unknown;
  collidefriend: unknown;
  lastcollide: unknown;
  collision: unknown;
  clientcol: unknown;
  clientsend: unknown;
  nexthit: unknown;
  nextdelay: unknown;
  xoffset: unknown;
  yoffset: unknown;
  zoffset: unknown;
  size: unknown;
  srctown: unknown;
  cltsrctown: unknown;
  candestroy: unknown;
  tohit: unknown;
  alwaysexplode: unknown;
  explosion: unknown;
  town: unknown;
  nouniquemod: unknown;
  nomultishot: unknown;
  holy: unknown;
  canslow: unknown;
  returnfire: unknown;
  gethit: unknown;
  softhit: unknown;
  knockback: unknown;
  trans: unknown;
  pierce: unknown;
  missileskill: unknown;
  skill: unknown;
  resultflags: unknown;
  hitflags: unknown;
  hitshift: unknown;
  applymastery: unknown;
  srcdamage: unknown;
  half2hsrc: unknown;
  srcmissdmg: unknown;
  mindamage: unknown;
  minlevdam1: unknown;
  minlevdam2: unknown;
  minlevdam3: unknown;
  minlevdam4: unknown;
  minlevdam5: unknown;
  maxdamage: unknown;
  maxlevdam1: unknown;
  maxlevdam2: unknown;
  maxlevdam3: unknown;
  maxlevdam4: unknown;
  maxlevdam5: unknown;
  dmgsympercalc: unknown;
  etype: unknown;
  emin: unknown;
  minelev1: unknown;
  minelev2: unknown;
  minelev3: unknown;
  minelev4: unknown;
  minelev5: unknown;
  emax: unknown;
  maxelev1: unknown;
  maxelev2: unknown;
  maxelev3: unknown;
  maxelev4: unknown;
  maxelev5: unknown;
  edmgsympercalc: unknown;
  elen: unknown;
  elevlen1: unknown;
  elevlen2: unknown;
  elevlen3: unknown;
  hitclass: unknown;
  numdirections: unknown;
  localblood: unknown;
  damagerate: unknown;
  travelsound: unknown;
  hitsound: unknown;
  progsound: unknown;
  progoverlay: unknown;
  explosionmissile: unknown;
  submissile1: unknown;
  submissile2: unknown;
  submissile3: unknown;
  hitsubmissile1: unknown;
  hitsubmissile2: unknown;
  hitsubmissile3: unknown;
  hitsubmissile4: unknown;
  cltsubmissile1: unknown;
  cltsubmissile2: unknown;
  cltsubmissile3: unknown;
  clthitsubmissile1: unknown;
  clthitsubmissile2: unknown;
  clthitsubmissile3: unknown;
  clthitsubmissile4: unknown;

  GetFileName(): string {
    return "missiles.txt";
  }
}

export class D2RMonAi extends D2RExcelRecord {
  ai: unknown;

  GetFileName(): string {
    return "monai.txt";
  }
}

export class D2RMonEquip extends D2RExcelRecord {
  monster: unknown;
  oninit: unknown;
  level: unknown;
  item1: unknown;
  loc1: unknown;
  mod1: unknown;
  item2: unknown;
  loc2: unknown;
  mod2: unknown;
  item3: unknown;
  loc3: unknown;
  mod3: unknown;

  GetFileName(): string {
    return "monequip.txt";
  }
}

export class D2RMonLvl extends D2RExcelRecord {
  "level": unknown;
  "ac": unknown;
  "ac(n)": unknown;
  "ac(h)": unknown;
  "l-ac": unknown;
  "l-ac(n)": unknown;
  "l-ac(h)": unknown;
  "th": unknown;
  "th(n)": unknown;
  "th(h)": unknown;
  "l-th": unknown;
  "l-th(n)": unknown;
  "l-th(h)": unknown;
  "hp": unknown;
  "hp(n)": unknown;
  "hp(h)": unknown;
  "l-hp": unknown;
  "l-hp(n)": unknown;
  "l-hp(h)": unknown;
  "dm": unknown;
  "dm(n)": unknown;
  "dm(h)": unknown;
  "l-dm": unknown;
  "l-dm(n)": unknown;
  "l-dm(h)": unknown;
  "xp": unknown;
  "xp(n)": unknown;
  "xp(h)": unknown;
  "l-xp": unknown;
  "l-xp(n)": unknown;
  "l-xp(h)": unknown;

  GetFileName(): string {
    return "monlvl.txt";
  }
}

export class D2RMonMode extends D2RExcelRecord {
  name: unknown;
  token: unknown;
  code: unknown;

  GetFileName(): string {
    return "monmode.txt";
  }
}

export class D2RMonPlace extends D2RExcelRecord {
  code: unknown;

  GetFileName(): string {
    return "monplace.txt";
  }
}

export class D2RMonPreset extends D2RExcelRecord {
  act: unknown;
  place: unknown;

  GetFileName(): string {
    return "monpreset.txt";
  }
}

export class D2RMonProp extends D2RExcelRecord {
  id: unknown;
  prop1: unknown;
  chance1: unknown;
  par1: unknown;
  min1: unknown;
  max1: unknown;
  prop2: unknown;
  chance2: unknown;
  par2: unknown;
  min2: unknown;
  max2: unknown;
  prop3: unknown;
  chance3: unknown;
  par3: unknown;
  min3: unknown;
  max3: unknown;
  prop4: unknown;
  chance4: unknown;
  par4: unknown;
  min4: unknown;
  max4: unknown;
  prop5: unknown;
  chance5: unknown;
  par5: unknown;
  min5: unknown;
  max5: unknown;
  prop6: unknown;
  chance6: unknown;
  par6: unknown;
  min6: unknown;
  max6: unknown;
  "prop1 (n)": unknown;
  "chance1 (n)": unknown;
  "par1 (n)": unknown;
  "min1 (n)": unknown;
  "max1 (n)": unknown;
  "prop2 (n)": unknown;
  "chance2 (n)": unknown;
  "par2 (n)": unknown;
  "min2 (n)": unknown;
  "max2 (n)": unknown;
  "prop3 (n)": unknown;
  "chance3 (n)": unknown;
  "par3 (n)": unknown;
  "min3 (n)": unknown;
  "max3 (n)": unknown;
  "prop4 (n)": unknown;
  "chance4 (n)": unknown;
  "par4 (n)": unknown;
  "min4 (n)": unknown;
  "max4 (n)": unknown;
  "prop5 (n)": unknown;
  "chance5 (n)": unknown;
  "par5 (n)": unknown;
  "min5 (n)": unknown;
  "max5 (n)": unknown;
  "prop6 (n)": unknown;
  "chance6 (n)": unknown;
  "par6 (n)": unknown;
  "min6 (n)": unknown;
  "max6 (n)": unknown;
  "prop1 (h)": unknown;
  "chance1 (h)": unknown;
  "par1 (h)": unknown;
  "min1 (h)": unknown;
  "max1 (h)": unknown;
  "prop2 (h)": unknown;
  "chance2 (h)": unknown;
  "par2 (h)": unknown;
  "min2 (h)": unknown;
  "max2 (h)": unknown;
  "prop3 (h)": unknown;
  "chance3 (h)": unknown;
  "par3 (h)": unknown;
  "min3 (h)": unknown;
  "max3 (h)": unknown;
  "prop4 (h)": unknown;
  "chance4 (h)": unknown;
  "par4 (h)": unknown;
  "min4 (h)": unknown;
  "max4 (h)": unknown;
  "prop5 (h)": unknown;
  "chance5 (h)": unknown;
  "par5 (h)": unknown;
  "min5 (h)": unknown;
  "max5 (h)": unknown;
  "prop6 (h)": unknown;
  "chance6 (h)": unknown;
  "par6 (h)": unknown;
  "min6 (h)": unknown;
  "max6 (h)": unknown;

  GetFileName(): string {
    return "monprop.txt";
  }
}

export class D2RMonSeq extends D2RExcelRecord {
  sequence: unknown;
  mode: unknown;
  frame: unknown;
  dir: unknown;
  event: unknown;

  GetFileName(): string {
    return "monseq.txt";
  }
}

export class D2RMonSounds extends D2RExcelRecord {
  id: unknown;
  attack1: unknown;
  weapon1: unknown;
  att1del: unknown;
  wea1del: unknown;
  att1prb: unknown;
  wea1vol: unknown;
  attack2: unknown;
  weapon2: unknown;
  att2del: unknown;
  wea2del: unknown;
  att2prb: unknown;
  wea2vol: unknown;
  hitsound: unknown;
  deathsound: unknown;
  hitdelay: unknown;
  deadelay: unknown;
  skill1: unknown;
  skill2: unknown;
  skill3: unknown;
  skill4: unknown;
  footstep: unknown;
  footsteplayer: unknown;
  fscnt: unknown;
  fsoff: unknown;
  fsprb: unknown;
  neutral: unknown;
  neutime: unknown;
  init: unknown;
  taunt: unknown;
  flee: unknown;
  cvtmo1: unknown;
  cvtsk1: unknown;
  cvttgt1: unknown;
  cvtmo2: unknown;
  cvtsk2: unknown;
  cvttgt2: unknown;
  cvtmo3: unknown;
  cvtsk3: unknown;
  cvttgt3: unknown;
  eol: unknown;

  GetFileName(): string {
    return "monsounds.txt";
  }
}

export class D2RMonStats extends D2RExcelRecord {
  id: unknown;
  baseid: unknown;
  nextinclass: unknown;
  translvl: unknown;
  namestr: unknown;
  monstatsex: unknown;
  monprop: unknown;
  montype: unknown;
  ai: unknown;
  descstr: unknown;
  code: unknown;
  enabled: unknown;
  rangedtype: unknown;
  placespawn: unknown;
  spawn: unknown;
  spawnx: unknown;
  spawny: unknown;
  spawnmode: unknown;
  minion1: unknown;
  minion2: unknown;
  setboss: unknown;
  bossxfer: unknown;
  partymin: unknown;
  partymax: unknown;
  mingrp: unknown;
  maxgrp: unknown;
  sparsepopulate: unknown;
  velocity: unknown;
  run: unknown;
  rarity: unknown;
  level: unknown;
  "level(n)": unknown;
  "level(h)": unknown;
  monsound: unknown;
  umonsound: unknown;
  threat: unknown;
  aidel: unknown;
  "aidel(n)": unknown;
  "aidel(h)": unknown;
  aidist: unknown;
  "aidist(n)": unknown;
  "aidist(h)": unknown;
  aip1: unknown;
  "aip1(n)": unknown;
  "aip1(h)": unknown;
  aip2: unknown;
  "aip2(n)": unknown;
  "aip2(h)": unknown;
  aip3: unknown;
  "aip3(n)": unknown;
  "aip3(h)": unknown;
  aip4: unknown;
  "aip4(n)": unknown;
  "aip4(h)": unknown;
  aip5: unknown;
  "aip5(n)": unknown;
  "aip5(h)": unknown;
  aip6: unknown;
  "aip6(n)": unknown;
  "aip6(h)": unknown;
  aip7: unknown;
  "aip7(n)": unknown;
  "aip7(h)": unknown;
  aip8: unknown;
  "aip8(n)": unknown;
  "aip8(h)": unknown;
  missa1: unknown;
  missa2: unknown;
  misss1: unknown;
  misss2: unknown;
  misss3: unknown;
  misss4: unknown;
  missc: unknown;
  misssq: unknown;
  align: unknown;
  isspawn: unknown;
  ismelee: unknown;
  npc: unknown;
  interact: unknown;
  inventory: unknown;
  intown: unknown;
  lundead: unknown;
  hundead: unknown;
  demon: unknown;
  flying: unknown;
  opendoors: unknown;
  boss: unknown;
  primeevil: unknown;
  killable: unknown;
  switchai: unknown;
  noaura: unknown;
  nomultishot: unknown;
  nevercount: unknown;
  petignore: unknown;
  deathdmg: unknown;
  genericspawn: unknown;
  zoo: unknown;
  sendskills: unknown;
  skill1: unknown;
  sk1mode: unknown;
  sk1lvl: unknown;
  skill2: unknown;
  sk2mode: unknown;
  sk2lvl: unknown;
  skill3: unknown;
  sk3mode: unknown;
  sk3lvl: unknown;
  skill4: unknown;
  sk4mode: unknown;
  sk4lvl: unknown;
  skill5: unknown;
  sk5mode: unknown;
  sk5lvl: unknown;
  skill6: unknown;
  sk6mode: unknown;
  sk6lvl: unknown;
  skill7: unknown;
  sk7mode: unknown;
  sk7lvl: unknown;
  skill8: unknown;
  sk8mode: unknown;
  sk8lvl: unknown;
  drain: unknown;
  "drain(n)": unknown;
  "drain(h)": unknown;
  coldeffect: unknown;
  "coldeffect(n)": unknown;
  "coldeffect(h)": unknown;
  resdm: unknown;
  resma: unknown;
  resfi: unknown;
  resli: unknown;
  resco: unknown;
  respo: unknown;
  "resdm(n)": unknown;
  "resma(n)": unknown;
  "resfi(n)": unknown;
  "resli(n)": unknown;
  "resco(n)": unknown;
  "respo(n)": unknown;
  "resdm(h)": unknown;
  "resma(h)": unknown;
  "resfi(h)": unknown;
  "resli(h)": unknown;
  "resco(h)": unknown;
  "respo(h)": unknown;
  damageregen: unknown;
  skilldamage: unknown;
  noratio: unknown;
  shieldblockoverride: unknown; // D2R 2.5 changed this from "noshldblock"
  toblock: unknown;
  "toblock(n)": unknown;
  "toblock(h)": unknown;
  crit: unknown;
  minhp: unknown;
  maxhp: unknown;
  ac: unknown;
  exp: unknown;
  a1mind: unknown;
  a1maxd: unknown;
  a1th: unknown;
  a2mind: unknown;
  a2maxd: unknown;
  a2th: unknown;
  s1mind: unknown;
  s1maxd: unknown;
  s1th: unknown;
  "minhp(n)": unknown;
  "maxhp(n)": unknown;
  "ac(n)": unknown;
  "exp(n)": unknown;
  "a1mind(n)": unknown;
  "a1maxd(n)": unknown;
  "a1th(n)": unknown;
  "a2mind(n)": unknown;
  "a2maxd(n)": unknown;
  "a2th(n)": unknown;
  "s1mind(n)": unknown;
  "s1maxd(n)": unknown;
  "s1th(n)": unknown;
  "minhp(h)": unknown;
  "maxhp(h)": unknown;
  "ac(h)": unknown;
  "exp(h)": unknown;
  "a1mind(h)": unknown;
  "a1maxd(h)": unknown;
  "a1th(h)": unknown;
  "a2mind(h)": unknown;
  "a2maxd(h)": unknown;
  "a2th(h)": unknown;
  "s1mind(h)": unknown;
  "s1maxd(h)": unknown;
  "s1th(h)": unknown;
  el1mode: unknown;
  el1type: unknown;
  el1pct: unknown;
  el1mind: unknown;
  el1maxd: unknown;
  el1dur: unknown;
  "el1pct(n)": unknown;
  "el1mind(n)": unknown;
  "el1maxd(n)": unknown;
  "el1dur(n)": unknown;
  "el1pct(h)": unknown;
  "el1mind(h)": unknown;
  "el1maxd(h)": unknown;
  "el1dur(h)": unknown;
  el2mode: unknown;
  el2type: unknown;
  el2pct: unknown;
  el2mind: unknown;
  el2maxd: unknown;
  el2dur: unknown;
  "el2pct(n)": unknown;
  "el2mind(n)": unknown;
  "el2maxd(n)": unknown;
  "el2dur(n)": unknown;
  "el2pct(h)": unknown;
  "el2mind(h)": unknown;
  "el2maxd(h)": unknown;
  "el2dur(h)": unknown;
  el3mode: unknown;
  el3type: unknown;
  el3pct: unknown;
  el3mind: unknown;
  el3maxd: unknown;
  el3dur: unknown;
  "el3pct(n)": unknown;
  "el3mind(n)": unknown;
  "el3maxd(n)": unknown;
  "el3dur(n)": unknown;
  "el3pct(h)": unknown;
  "el3mind(h)": unknown;
  "el3maxd(h)": unknown;
  "el3dur(h)": unknown;
  treasureclass: unknown; // D2R 2.5 changed this from "treasureclass1"
  treasureclasschamp: unknown; // D2R 2.5 changed this from "treasureclass2"
  treasureclassunique: unknown; // D2R 2.5 changed this from "treasureclass3"
  treasureclassquest: unknown; // D2R 2.5 changed this from "treasureclass4"
  "treasureclass(n)": unknown; // D2R 2.5 changed this from "treasureclass1(n)"
  "treasureclasschamp(n)": unknown; // D2R 2.5 changed this from "treasureclass2(n)"
  "treasureclassunique(n)": unknown; // D2R 2.5 changed this from "treasureclass3(n)"
  "treasureclassquest(n)": unknown; // D2R 2.5 changed this from "treasureclass4(n)"
  "treasureclass(h)": unknown; // D2R 2.5 changed this from "treasureclass1(h)"
  "treasureclasschamp(h)": unknown; // D2R 2.5 changed this from "treasureclass2(h)"
  "treasureclassunique(h)": unknown; // D2R 2.5 changed this from "treasureclass3(h)"
  "treasureclassquest(h)": unknown; // D2R 2.5 changed this from "treasureclass4(h)"
  tcquestid: unknown;
  tcquestcp: unknown;
  splenddeath: unknown;
  splgetmodechart: unknown;
  splendgeneric: unknown;
  splclientend: unknown;
  // Added in Diablo II: Resurrected 2.4
  rightarmitemtype: unknown;
  leftarmitemtype: unknown;
  cannotusetwohandeditems: unknown;
  // Added in Diablo II: Resurrected 2.5
  treasureclassdesecrated: unknown;
  treasureclasschampdesecrated: unknown;
  treasureclassuniquedesecrated: unknown;
  "treasureclassdesecrated(n)": unknown;
  "treasureclasschampdesecrated(n)": unknown;
  "treasureclassuniquedesecrated(n)": unknown;
  "treasureclassdesecrated(h)": unknown;
  "treasureclasschampdesecrated(h)": unknown;
  "treasureclassuniquedesecrated(h)": unknown;
  cannotdesecrate: unknown;

  GetFileName(): string {
    return "monstats.txt";
  }
}

export class D2RMonStats2 extends D2RExcelRecord {
  id: unknown;
  height: unknown;
  overlayheight: unknown;
  pixheight: unknown;
  sizex: unknown;
  sizey: unknown;
  spawncol: unknown;
  meleerng: unknown;
  basew: unknown;
  hitclass: unknown;
  hdv: unknown;
  trv: unknown;
  lgv: unknown;
  rav: unknown;
  lav: unknown;
  rhv: unknown;
  lhv: unknown;
  shv: unknown;
  s1v: unknown;
  s2v: unknown;
  s3v: unknown;
  s4v: unknown;
  s5v: unknown;
  s6v: unknown;
  s7v: unknown;
  s8v: unknown;
  hd: unknown;
  tr: unknown;
  lg: unknown;
  ra: unknown;
  la: unknown;
  rh: unknown;
  lh: unknown;
  sh: unknown;
  s1: unknown;
  s2: unknown;
  s3: unknown;
  s4: unknown;
  s5: unknown;
  s6: unknown;
  s7: unknown;
  s8: unknown;
  totalpieces: unknown;
  mdt: unknown;
  mnu: unknown;
  mwl: unknown;
  mgh: unknown;
  ma1: unknown;
  ma2: unknown;
  mbl: unknown;
  msc: unknown;
  ms1: unknown;
  ms2: unknown;
  ms3: unknown;
  ms4: unknown;
  mdd: unknown;
  mkb: unknown;
  msq: unknown;
  mrn: unknown;
  ddt: unknown;
  dnu: unknown;
  dwl: unknown;
  dgh: unknown;
  da1: unknown;
  da2: unknown;
  dbl: unknown;
  dsc: unknown;
  ds1: unknown;
  ds2: unknown;
  ds3: unknown;
  ds4: unknown;
  ddd: unknown;
  dkb: unknown;
  dsq: unknown;
  drn: unknown;
  a1mv: unknown;
  a2mv: unknown;
  scmv: unknown;
  s1mv: unknown;
  s2mv: unknown;
  s3mv: unknown;
  s4mv: unknown;
  nogfxhittest: unknown;
  httop: unknown;
  htleft: unknown;
  htwidth: unknown;
  htheight: unknown;
  restore: unknown;
  automapcel: unknown;
  nomap: unknown;
  noovly: unknown;
  issel: unknown;
  alsel: unknown;
  nosel: unknown;
  shiftsel: unknown;
  corpsesel: unknown;
  isatt: unknown;
  revive: unknown;
  critter: unknown;
  small: unknown;
  large: unknown;
  soft: unknown;
  inert: unknown;
  objcol: unknown;
  deadcol: unknown;
  unflatdead: unknown;
  shadow: unknown;
  nouniqueshift: unknown;
  compositedeath: unknown;
  localblood: unknown;
  bleed: unknown;
  light: unknown;
  "light-r": unknown;
  "light-g": unknown;
  "light-b": unknown;
  utrans: unknown;
  "utrans(n)": unknown;
  "utrans(h)": unknown;
  infernolen: unknown;
  infernoanim: unknown;
  infernorollback: unknown;
  resurrectmode: unknown;
  resurrectskill: unknown;
  // new in retail release
  spawnuniquemod: unknown;

  GetFileName(): string {
    return "monstats2.txt";
  }
}

export class D2RMonType extends D2RExcelRecord {
  type: unknown;
  equiv1: unknown;
  equiv2: unknown;
  equiv3: unknown;
  strplur: unknown;
  element: unknown;

  GetFileName(): string {
    return "montype.txt";
  }
}

export class D2RMonUMod extends D2RExcelRecord {
  uniquemod: unknown;
  id: unknown;
  enabled: unknown;
  version: unknown;
  xfer: unknown;
  champion: unknown;
  fpick: unknown;
  exclude1: unknown;
  exclude2: unknown;
  cpick: unknown;
  "cpick (n)": unknown;
  "cpick (h)": unknown;
  upick: unknown;
  "upick (n)": unknown;
  "upick (h)": unknown;
  constants: unknown;

  GetFileName(): string {
    return "monumod.txt";
  }
}

export class D2RNPC extends D2RExcelRecord {
  npc: unknown;
  "buy mult": unknown;
  "sell mult": unknown;
  "rep mult": unknown;
  "questflag a": unknown;
  "questbuymult a": unknown;
  "questsellmult a": unknown;
  "questrepmult a": unknown;
  "questflag b": unknown;
  "questbuymult b": unknown;
  "questsellmult b": unknown;
  "questrepmult b": unknown;
  "questflag c": unknown;
  "questbuymult c": unknown;
  "questsellmult c": unknown;
  "questrepmult c": unknown;
  "max buy": unknown;
  "max buy (n)": unknown;
  "max buy (h)": unknown;

  GetFileName(): string {
    return "npc.txt";
  }
}

export class D2RObjects extends D2RExcelRecord {
  class: unknown;
  name: unknown;
  token: unknown;
  selectable0: unknown;
  selectable1: unknown;
  selectable2: unknown;
  selectable3: unknown;
  selectable4: unknown;
  selectable5: unknown;
  selectable6: unknown;
  selectable7: unknown;
  sizex: unknown;
  sizey: unknown;
  framecnt0: unknown;
  framecnt1: unknown;
  framecnt2: unknown;
  framecnt3: unknown;
  framecnt4: unknown;
  framecnt5: unknown;
  framecnt6: unknown;
  framecnt7: unknown;
  framedelta0: unknown;
  framedelta1: unknown;
  framedelta2: unknown;
  framedelta3: unknown;
  framedelta4: unknown;
  framedelta5: unknown;
  framedelta6: unknown;
  framedelta7: unknown;
  cycleanim0: unknown;
  cycleanim1: unknown;
  cycleanim2: unknown;
  cycleanim3: unknown;
  cycleanim4: unknown;
  cycleanim5: unknown;
  cycleanim6: unknown;
  cycleanim7: unknown;
  lit0: unknown;
  lit1: unknown;
  lit2: unknown;
  lit3: unknown;
  lit4: unknown;
  lit5: unknown;
  lit6: unknown;
  lit7: unknown;
  blockslight0: unknown;
  blockslight1: unknown;
  blockslight2: unknown;
  blockslight3: unknown;
  blockslight4: unknown;
  blockslight5: unknown;
  blockslight6: unknown;
  blockslight7: unknown;
  hascollision0: unknown;
  hascollision1: unknown;
  hascollision2: unknown;
  hascollision3: unknown;
  hascollision4: unknown;
  hascollision5: unknown;
  hascollision6: unknown;
  hascollision7: unknown;
  isattackable0: unknown;
  start0: unknown;
  start1: unknown;
  start2: unknown;
  start3: unknown;
  start4: unknown;
  start5: unknown;
  start6: unknown;
  start7: unknown;
  enveffect: unknown;
  isdoor: unknown;
  blocksvis: unknown;
  orientation: unknown;
  orderflag0: unknown;
  orderflag1: unknown;
  orderflag2: unknown;
  orderflag3: unknown;
  orderflag4: unknown;
  orderflag5: unknown;
  orderflag6: unknown;
  orderflag7: unknown;
  preoperate: unknown;
  mode0: unknown;
  mode1: unknown;
  mode2: unknown;
  mode3: unknown;
  mode4: unknown;
  mode5: unknown;
  mode6: unknown;
  mode7: unknown;
  yoffset: unknown;
  xoffset: unknown;
  draw: unknown;
  red: unknown;
  green: unknown;
  blue: unknown;
  hd: unknown;
  tr: unknown;
  lg: unknown;
  ra: unknown;
  la: unknown;
  rh: unknown;
  lh: unknown;
  sh: unknown;
  s1: unknown;
  s2: unknown;
  s3: unknown;
  s4: unknown;
  s5: unknown;
  s6: unknown;
  s7: unknown;
  s8: unknown;
  totalpieces: unknown;
  subclass: unknown;
  xspace: unknown;
  yspace: unknown;
  nameoffset: unknown;
  monsterok: unknown;
  shrinefunction: unknown;
  restore: unknown;
  parm0: unknown;
  parm1: unknown;
  parm2: unknown;
  parm3: unknown;
  parm4: unknown;
  lockable: unknown;
  gore: unknown;
  sync: unknown;
  damage: unknown;
  overlay: unknown;
  collisionsubst: unknown;
  left: unknown;
  top: unknown;
  width: unknown;
  height: unknown;
  operatefn: unknown;
  populatefn: unknown;
  initfn: unknown;
  clientfn: unknown;
  restorevirgins: unknown;
  blockmissile: unknown;
  drawunder: unknown;
  openwarp: unknown;
  automap: unknown;

  GetFileName(): string {
    return "objects.txt";
  }
}

export class D2RObjGroup extends D2RExcelRecord {
  groupname: unknown;
  id0: unknown;
  density0: unknown;
  prob0: unknown;
  id1: unknown;
  density1: unknown;
  prob1: unknown;
  id2: unknown;
  density2: unknown;
  prob2: unknown;
  id3: unknown;
  density3: unknown;
  prob3: unknown;
  id4: unknown;
  density4: unknown;
  prob4: unknown;
  id5: unknown;
  density5: unknown;
  prob5: unknown;
  id6: unknown;
  density6: unknown;
  prob6: unknown;
  id7: unknown;
  density7: unknown;
  prob7: unknown;

  GetFileName(): string {
    return "objgroup.txt";
  }
}

export class D2RObjMode extends D2RExcelRecord {
  name: unknown;
  token: unknown;

  GetFileName(): string {
    return "objmode.txt";
  }
}

export class D2RObjPreset extends D2RExcelRecord {
  index: unknown;
  act: unknown;
  objectclass: unknown;

  GetFileName(): string {
    return "objpreset.txt";
  }
}

export class D2RObjType extends D2RExcelRecord {
  name: unknown;
  token: unknown;

  GetFileName(): string {
    return "objtype.txt";
  }
}

export class D2ROverlay extends D2RExcelRecord {
  overlay: unknown;
  filename: unknown;
  version: unknown;
  character: unknown;
  predraw: unknown;
  "1ofn": unknown;
  xoffset: unknown;
  yoffset: unknown;
  height1: unknown;
  height2: unknown;
  height3: unknown;
  height4: unknown;
  animrate: unknown;
  loopwaittime: unknown;
  trans: unknown;
  initradius: unknown;
  radius: unknown;
  red: unknown;
  green: unknown;
  blue: unknown;
  numdirections: unknown;
  localblood: unknown;

  GetFileName(): string {
    return "overlay.txt";
  }
}

export class D2RPetType extends D2RExcelRecord {
  "pet type": unknown;
  group: unknown;
  basemax: unknown;
  warp: unknown;
  range: unknown;
  partysend: unknown;
  unsummon: unknown;
  automap: unknown;
  name: unknown;
  drawhp: unknown;
  icontype: unknown;
  baseicon: unknown;
  mclass1: unknown;
  micon1: unknown;
  mclass2: unknown;
  micon2: unknown;
  mclass3: unknown;
  micon3: unknown;
  mclass4: unknown;
  micon4: unknown;

  GetFileName(): string {
    return "pettype.txt";
  }
}

export class D2RPlayerClass extends D2RExcelRecord {
  "player class": unknown;
  code: unknown;

  GetFileName(): string {
    return "playerclass.txt";
  }
}

export class D2RPlrMode extends D2RExcelRecord {
  name: unknown;
  token: unknown;
  code: unknown;

  GetFileName(): string {
    return "plrmode.txt";
  }
}

export class D2RPlrType extends D2RExcelRecord {
  name: unknown;
  token: unknown;

  GetFileName(): string {
    return "plrtype.txt";
  }
}

export class D2RProperties extends D2RExcelRecord {
  code: unknown;
  func1: unknown;
  stat1: unknown;
  set1: unknown;
  val1: unknown;
  func2: unknown;
  stat2: unknown;
  set2: unknown;
  val2: unknown;
  func3: unknown;
  stat3: unknown;
  set3: unknown;
  val3: unknown;
  func4: unknown;
  stat4: unknown;
  set4: unknown;
  val4: unknown;
  func5: unknown;
  stat5: unknown;
  set5: unknown;
  val5: unknown;
  func6: unknown;
  stat6: unknown;
  set6: unknown;
  val6: unknown;
  func7: unknown;
  stat7: unknown;
  set7: unknown;
  val7: unknown;

  GetFileName(): string {
    return "properties.txt";
  }
}

export class D2RQualityItems extends D2RExcelRecord {
  mod1code: unknown;
  mod1param: unknown;
  mod1min: unknown;
  mod1max: unknown;
  mod2code: unknown;
  mod2param: unknown;
  mod2min: unknown;
  mod2max: unknown;
  armor: unknown;
  weapon: unknown;
  shield: unknown;
  scepter: unknown;
  wand: unknown;
  staff: unknown;
  bow: unknown;
  boots: unknown;
  gloves: unknown;
  belt: unknown;

  GetFileName(): string {
    return "qualityitems.txt";
  }
}

export abstract class D2RRareBase extends D2RExcelRecord {
  name: unknown;
  version: unknown;
  itype1: unknown;
  itype2: unknown;
  itype3: unknown;
  itype4: unknown;
  itype5: unknown;
  itype6: unknown;
  itype7: unknown;
  etype1: unknown;
  etype2: unknown;
  etype3: unknown;
  etype4: unknown;
}

export class D2RRarePrefix extends D2RRareBase {
  GetFileName(): string {
    return "rareprefix.txt";
  }
}

export class D2RRareSuffix extends D2RRareBase {
  GetFileName(): string {
    return "raresuffix.txt";
  }
}

export class D2RRunes extends D2RExcelRecord {
  name: unknown;
  complete: unknown;
  //server: unknown;    // Removed in Diablo II: Resurrected 2.6
  itype1: unknown;
  itype2: unknown;
  itype3: unknown;
  itype4: unknown;
  itype5: unknown;
  itype6: unknown;
  etype1: unknown;
  etype2: unknown;
  etype3: unknown;
  rune1: unknown;
  rune2: unknown;
  rune3: unknown;
  rune4: unknown;
  rune5: unknown;
  rune6: unknown;
  t1code1: unknown;
  t1param1: unknown;
  t1min1: unknown;
  t1max1: unknown;
  t1code2: unknown;
  t1param2: unknown;
  t1min2: unknown;
  t1max2: unknown;
  t1code3: unknown;
  t1param3: unknown;
  t1min3: unknown;
  t1max3: unknown;
  t1code4: unknown;
  t1param4: unknown;
  t1min4: unknown;
  t1max4: unknown;
  t1code5: unknown;
  t1param5: unknown;
  t1min5: unknown;
  t1max5: unknown;
  t1code6: unknown;
  t1param6: unknown;
  t1min6: unknown;
  t1max6: unknown;
  t1code7: unknown;
  t1param7: unknown;
  t1min7: unknown;
  t1max7: unknown;
  // added in Diablo II: Resurrected 2.6
  firstLadderSeason: unknown;
  lastLadderSeason: unknown;

  /// Internal use only
  skipInDocs: unknown;

  GetFileName(): string {
    return "runes.txt";
  }
}

export class D2RSetItems extends D2RExcelRecord {
  index: unknown;
  set: unknown;
  item: unknown;
  rarity: unknown;
  lvl: unknown;
  "lvl req": unknown;
  chrtransform: unknown;
  invtransform: unknown;
  invfile: unknown;
  flippyfile: unknown;
  dropsound: unknown;
  dropsfxframe: unknown;
  usesound: unknown;
  "cost mult": unknown;
  "cost add": unknown;
  "add func": unknown;
  prop1: unknown;
  par1: unknown;
  min1: unknown;
  max1: unknown;
  prop2: unknown;
  par2: unknown;
  min2: unknown;
  max2: unknown;
  prop3: unknown;
  par3: unknown;
  min3: unknown;
  max3: unknown;
  prop4: unknown;
  par4: unknown;
  min4: unknown;
  max4: unknown;
  prop5: unknown;
  par5: unknown;
  min5: unknown;
  max5: unknown;
  prop6: unknown;
  par6: unknown;
  min6: unknown;
  max6: unknown;
  prop7: unknown;
  par7: unknown;
  min7: unknown;
  max7: unknown;
  prop8: unknown;
  par8: unknown;
  min8: unknown;
  max8: unknown;
  prop9: unknown;
  par9: unknown;
  min9: unknown;
  max9: unknown;
  aprop1a: unknown;
  apar1a: unknown;
  amin1a: unknown;
  amax1a: unknown;
  aprop1b: unknown;
  apar1b: unknown;
  amin1b: unknown;
  amax1b: unknown;
  aprop2a: unknown;
  apar2a: unknown;
  amin2a: unknown;
  amax2a: unknown;
  aprop2b: unknown;
  apar2b: unknown;
  amin2b: unknown;
  amax2b: unknown;
  aprop3a: unknown;
  apar3a: unknown;
  amin3a: unknown;
  amax3a: unknown;
  aprop3b: unknown;
  apar3b: unknown;
  amin3b: unknown;
  amax3b: unknown;
  aprop4a: unknown;
  apar4a: unknown;
  amin4a: unknown;
  amax4a: unknown;
  aprop4b: unknown;
  apar4b: unknown;
  amin4b: unknown;
  amax4b: unknown;
  aprop5a: unknown;
  apar5a: unknown;
  amin5a: unknown;
  amax5a: unknown;
  aprop5b: unknown;
  apar5b: unknown;
  amin5b: unknown;
  amax5b: unknown;
  worldevent: unknown;

  GetFileName(): string {
    return "setitems.txt";
  }
}

export class D2RSets extends D2RExcelRecord {
  index: unknown;
  name: unknown;
  version: unknown;
  pcode2a: unknown;
  pparam2a: unknown;
  pmin2a: unknown;
  pmax2a: unknown;
  pcode2b: unknown;
  pparam2b: unknown;
  pmin2b: unknown;
  pmax2b: unknown;
  pcode3a: unknown;
  pparam3a: unknown;
  pmin3a: unknown;
  pmax3a: unknown;
  pcode3b: unknown;
  pparam3b: unknown;
  pmin3b: unknown;
  pmax3b: unknown;
  pcode4a: unknown;
  pparam4a: unknown;
  pmin4a: unknown;
  pmax4a: unknown;
  pcode4b: unknown;
  pparam4b: unknown;
  pmin4b: unknown;
  pmax4b: unknown;
  pcode5a: unknown;
  pparam5a: unknown;
  pmin5a: unknown;
  pmax5a: unknown;
  pcode5b: unknown;
  pparam5b: unknown;
  pmin5b: unknown;
  pmax5b: unknown;
  fcode1: unknown;
  fparam1: unknown;
  fmin1: unknown;
  fmax1: unknown;
  fcode2: unknown;
  fparam2: unknown;
  fmin2: unknown;
  fmax2: unknown;
  fcode3: unknown;
  fparam3: unknown;
  fmin3: unknown;
  fmax3: unknown;
  fcode4: unknown;
  fparam4: unknown;
  fmin4: unknown;
  fmax4: unknown;
  fcode5: unknown;
  fparam5: unknown;
  fmin5: unknown;
  fmax5: unknown;
  fcode6: unknown;
  fparam6: unknown;
  fmin6: unknown;
  fmax6: unknown;
  fcode7: unknown;
  fparam7: unknown;
  fmin7: unknown;
  fmax7: unknown;
  fcode8: unknown;
  fparam8: unknown;
  fmin8: unknown;
  fmax8: unknown;

  /// Internal use only
  skipInDocs: unknown;

  GetFileName(): string {
    return "sets.txt";
  }
}

export class D2RShrines extends D2RExcelRecord {
  name: unknown;
  code: unknown;
  arg0: unknown;
  arg1: unknown;
  "duration in frames": unknown;
  "reset time in minutes": unknown;
  rarity: unknown;
  stringname: unknown;
  stringphrase: unknown;
  effectclass: unknown;
  levelmin: unknown;

  GetFileName(): string {
    return "shrines.txt";
  }
}

export class D2RSkillCalc extends D2RExcelRecord {
  code: unknown;

  GetFileName(): string {
    return "skillcalc.txt";
  }
}

export class D2RSkillDesc extends D2RExcelRecord {
  skilldesc: unknown;
  skillpage: unknown;
  skillrow: unknown;
  skillcolumn: unknown;
  listrow: unknown;
  iconcel: unknown;
  "str name": unknown;
  "str short": unknown;
  "str long": unknown;
  "str alt": unknown;
  descdam: unknown;
  "ddam calc1": unknown;
  "ddam calc2": unknown;
  p1dmelem: unknown;
  p1dmmin: unknown;
  p1dmmax: unknown;
  p2dmelem: unknown;
  p2dmmin: unknown;
  p2dmmax: unknown;
  p3dmelem: unknown;
  p3dmmin: unknown;
  p3dmmax: unknown;
  descatt: unknown;
  descmissile1: unknown;
  descmissile2: unknown;
  descmissile3: unknown;
  descline1: unknown;
  desctexta1: unknown;
  desctextb1: unknown;
  desccalca1: unknown;
  desccalcb1: unknown;
  descline2: unknown;
  desctexta2: unknown;
  desctextb2: unknown;
  desccalca2: unknown;
  desccalcb2: unknown;
  descline3: unknown;
  desctexta3: unknown;
  desctextb3: unknown;
  desccalca3: unknown;
  desccalcb3: unknown;
  descline4: unknown;
  desctexta4: unknown;
  desctextb4: unknown;
  desccalca4: unknown;
  desccalcb4: unknown;
  descline5: unknown;
  desctexta5: unknown;
  desctextb5: unknown;
  desccalca5: unknown;
  desccalcb5: unknown;
  descline6: unknown;
  desctexta6: unknown;
  desctextb6: unknown;
  desccalca6: unknown;
  desccalcb6: unknown;
  dsc2line1: unknown;
  dsc2texta1: unknown;
  dsc2textb1: unknown;
  dsc2calca1: unknown;
  dsc2calcb1: unknown;
  dsc2line2: unknown;
  dsc2texta2: unknown;
  dsc2textb2: unknown;
  dsc2calca2: unknown;
  dsc2calcb2: unknown;
  dsc2line3: unknown;
  dsc2texta3: unknown;
  dsc2textb3: unknown;
  dsc2calca3: unknown;
  dsc2calcb3: unknown;
  dsc2line4: unknown;
  dsc2texta4: unknown;
  dsc2textb4: unknown;
  dsc2calca4: unknown;
  dsc2calcb4: unknown;
  dsc2line5: unknown;
  dsc2texta5: unknown;
  dsc2textb5: unknown;
  dsc2calca5: unknown;
  dsc2calcb5: unknown;
  dsc3line1: unknown;
  dsc3texta1: unknown;
  dsc3textb1: unknown;
  dsc3calca1: unknown;
  dsc3calcb1: unknown;
  dsc3line2: unknown;
  dsc3texta2: unknown;
  dsc3textb2: unknown;
  dsc3calca2: unknown;
  dsc3calcb2: unknown;
  dsc3line3: unknown;
  dsc3texta3: unknown;
  dsc3textb3: unknown;
  dsc3calca3: unknown;
  dsc3calcb3: unknown;
  dsc3line4: unknown;
  dsc3texta4: unknown;
  dsc3textb4: unknown;
  dsc3calca4: unknown;
  dsc3calcb4: unknown;
  dsc3line5: unknown;
  dsc3texta5: unknown;
  dsc3textb5: unknown;
  dsc3calca5: unknown;
  dsc3calcb5: unknown;
  dsc3line6: unknown;
  dsc3texta6: unknown;
  dsc3textb6: unknown;
  dsc3calca6: unknown;
  dsc3calcb6: unknown;
  dsc3line7: unknown;
  dsc3texta7: unknown;
  dsc3textb7: unknown;
  dsc3calca7: unknown;
  dsc3calcb7: unknown;
  // Added in Diablo II: Resurrected 2.5
  hireableiconcel: unknown;
  // Added in Diablo II: Resurrected 2.6
  "item proc text": unknown;
  "item proc descline count": unknown;

  GetFileName(): string {
    return "skilldesc.txt";
  }
}

export class D2RSkills extends D2RExcelRecord {
  skill: unknown;
  charclass: unknown;
  skilldesc: unknown;
  srvstfunc: unknown;
  srvdofunc: unknown;
  prgstack: unknown;
  srvprgfunc1: unknown;
  srvprgfunc2: unknown;
  srvprgfunc3: unknown;
  prgcalc1: unknown;
  prgcalc2: unknown;
  prgcalc3: unknown;
  prgdam: unknown;
  srvmissile: unknown;
  decquant: unknown;
  lob: unknown;
  srvmissilea: unknown;
  srvmissileb: unknown;
  srvmissilec: unknown;
  srvoverlay: unknown;
  aurafilter: unknown;
  aurastate: unknown;
  auratargetstate: unknown;
  auralencalc: unknown;
  aurarangecalc: unknown;
  aurastat1: unknown;
  aurastatcalc1: unknown;
  aurastat2: unknown;
  aurastatcalc2: unknown;
  aurastat3: unknown;
  aurastatcalc3: unknown;
  aurastat4: unknown;
  aurastatcalc4: unknown;
  aurastat5: unknown;
  aurastatcalc5: unknown;
  aurastat6: unknown;
  aurastatcalc6: unknown;
  auraevent1: unknown;
  auraeventfunc1: unknown;
  auraevent2: unknown;
  auraeventfunc2: unknown;
  auraevent3: unknown;
  auraeventfunc3: unknown;
  passivestate: unknown;
  passiveitype: unknown;
  passivereqweaponcount: unknown;
  passivestat1: unknown;
  passivecalc1: unknown;
  passivestat2: unknown;
  passivecalc2: unknown;
  passivestat3: unknown;
  passivecalc3: unknown;
  passivestat4: unknown;
  passivecalc4: unknown;
  passivestat5: unknown;
  passivecalc5: unknown;
  summon: unknown;
  pettype: unknown;
  petmax: unknown;
  summode: unknown;
  sumskill1: unknown;
  sumsk1calc: unknown;
  sumskill2: unknown;
  sumsk2calc: unknown;
  sumskill3: unknown;
  sumsk3calc: unknown;
  sumskill4: unknown;
  sumsk4calc: unknown;
  sumskill5: unknown;
  sumsk5calc: unknown;
  sumumod: unknown;
  sumoverlay: unknown;
  stsuccessonly: unknown;
  stsound: unknown;
  stsoundclass: unknown;
  stsounddelay: unknown;
  weaponsnd: unknown;
  dosound: unknown;
  "dosound a": unknown;
  "dosound b": unknown;
  tgtoverlay: unknown;
  tgtsound: unknown;
  prgoverlay: unknown;
  prgsound: unknown;
  castoverlay: unknown;
  cltoverlaya: unknown;
  cltoverlayb: unknown;
  cltstfunc: unknown;
  cltdofunc: unknown;
  cltprgfunc1: unknown;
  cltprgfunc2: unknown;
  cltprgfunc3: unknown;
  cltmissile: unknown;
  cltmissilea: unknown;
  cltmissileb: unknown;
  cltmissilec: unknown;
  cltmissiled: unknown;
  cltcalc1: unknown;
  cltcalc2: unknown;
  cltcalc3: unknown;
  warp: unknown;
  immediate: unknown;
  enhanceable: unknown;
  attackrank: unknown;
  noammo: unknown;
  range: unknown;
  weapsel: unknown;
  itypea1: unknown;
  itypea2: unknown;
  itypea3: unknown;
  etypea1: unknown;
  etypea2: unknown;
  itypeb1: unknown;
  itypeb2: unknown;
  itypeb3: unknown;
  etypeb1: unknown;
  etypeb2: unknown;
  anim: unknown;
  seqtrans: unknown;
  monanim: unknown;
  seqnum: unknown;
  seqinput: unknown;
  durability: unknown;
  useattackrate: unknown;
  lineofsight: unknown;
  targetableonly: unknown;
  searchenemyxy: unknown;
  searchenemynear: unknown;
  searchopenxy: unknown;
  selectproc: unknown;
  targetcorpse: unknown;
  targetpet: unknown;
  targetally: unknown;
  targetitem: unknown;
  attacknomana: unknown;
  tgtplacecheck: unknown;
  keepcursorstateonkill: unknown;
  continuecastunselected: unknown;
  clearselectedonhold: unknown;
  itemeffect: unknown;
  itemclteffect: unknown;
  itemtgtdo: unknown;
  itemtarget: unknown;
  itemcheckstart: unknown;
  itemcltcheckstart: unknown;
  itemcastsound: unknown;
  itemcastoverlay: unknown;
  skpoints: unknown;
  reqlevel: unknown;
  maxlvl: unknown;
  reqstr: unknown;
  reqdex: unknown;
  reqint: unknown;
  reqvit: unknown;
  reqskill1: unknown;
  reqskill2: unknown;
  reqskill3: unknown;
  restrict: unknown;
  state1: unknown;
  state2: unknown;
  state3: unknown;
  localdelay: unknown;
  globaldelay: unknown;
  leftskill: unknown;
  rightskill: unknown;
  repeat: unknown;
  alwayshit: unknown;
  usemanaondo: unknown;
  startmana: unknown;
  minmana: unknown;
  manashift: unknown;
  mana: unknown;
  lvlmana: unknown;
  interrupt: unknown;
  intown: unknown;
  aura: unknown;
  periodic: unknown;
  perdelay: unknown;
  finishing: unknown;
  prgchargestocast: unknown;
  prgchargesconsumed: unknown;
  passive: unknown;
  progressive: unknown;
  scroll: unknown;
  calc1: unknown;
  calc2: unknown;
  calc3: unknown;
  calc4: unknown;
  param1: unknown;
  param2: unknown;
  param3: unknown;
  param4: unknown;
  param5: unknown;
  param6: unknown;
  param7: unknown;
  param8: unknown;
  ingame: unknown;
  tohit: unknown;
  levtohit: unknown;
  tohitcalc: unknown;
  resultflags: unknown;
  hitflags: unknown;
  hitclass: unknown;
  kick: unknown;
  hitshift: unknown;
  srcdam: unknown;
  mindam: unknown;
  minlevdam1: unknown;
  minlevdam2: unknown;
  minlevdam3: unknown;
  minlevdam4: unknown;
  minlevdam5: unknown;
  maxdam: unknown;
  maxlevdam1: unknown;
  maxlevdam2: unknown;
  maxlevdam3: unknown;
  maxlevdam4: unknown;
  maxlevdam5: unknown;
  dmgsympercalc: unknown;
  etype: unknown;
  emin: unknown;
  eminlev1: unknown;
  eminlev2: unknown;
  eminlev3: unknown;
  eminlev4: unknown;
  eminlev5: unknown;
  emax: unknown;
  emaxlev1: unknown;
  emaxlev2: unknown;
  emaxlev3: unknown;
  emaxlev4: unknown;
  emaxlev5: unknown;
  edmgsympercalc: unknown;
  elen: unknown;
  elevlen1: unknown;
  elevlen2: unknown;
  elevlen3: unknown;
  elensympercalc: unknown;
  aitype: unknown;
  aibonus: unknown;
  "cost mult": unknown;
  "cost add": unknown;
  // added in Diablo II: Resurrected retail release
  srvstopfunc: unknown;
  useservermissilesonremoteclients: unknown;
  cltstopfunc: unknown;
  // added in Diablo II: Resurrected 2.4
  passivestat6: unknown;
  passivecalc6: unknown;
  calc5: unknown;
  calc6: unknown;
  param9: unknown;
  param10: unknown;
  param11: unknown;
  param12: unknown;
  // added in Diablo II: Resurrected 2.5
  passivestat7: unknown;
  passivecalc7: unknown;
  passivestat8: unknown;
  passivecalc8: unknown;
  passivestat9: unknown;
  passivecalc9: unknown;
  passivestat10: unknown;
  passivecalc10: unknown;
  // added in Diablo II: Resurrected 2.6
  itemuserestrict: unknown;

  GetFileName(): string {
    return "skills.txt";
  }
}

export class D2RSoundEnviron extends D2RExcelRecord {
  handle: unknown;
  index: unknown;
  song: unknown;
  "day ambience": unknown;
  "hd day ambience": unknown;
  "night ambience": unknown;
  "hd night ambience": unknown;
  "day event": unknown;
  "hd day event": unknown;
  "night event": unknown;
  "hd night event": unknown;
  "event delay": unknown;
  "hd event delay": unknown;
  indoors: unknown;
  "material 1": unknown;
  "hd material 1": unknown;
  "material 2": unknown;
  "hd material 2": unknown;
  "sfx eax environ": unknown;
  "sfx eax room vol": unknown;
  "sfx eax room hf": unknown;
  "sfx eax decay time": unknown;
  "sfx eax decay hf": unknown;
  "sfx eax reflect": unknown;
  "sfx eax reflect delay": unknown;
  "sfx eax reverb": unknown;
  "sfx eax rev delay": unknown;
  "vox eax environ": unknown;
  "vox eax room vol": unknown;
  "vox eax room hf": unknown;
  "vox eax decay time": unknown;
  "vox eax decay hf": unknown;
  "vox eax reflect": unknown;
  "vox eax reflect delay": unknown;
  "vox eax reverb": unknown;
  "vox eax rev delay": unknown;
  // Added in Diablo II: Resurrected 2.5
  inheritenvironment: unknown;

  GetFileName(): string {
    return "soundenviron.txt";
  }
}

export class D2RSounds extends D2RExcelRecord {
  sound: unknown;
  redirect: unknown;
  channel: unknown;
  filename: unknown;
  islocal: unknown;
  ismusic: unknown;
  isambientscene: unknown;
  isambientevent: unknown;
  isui: unknown;
  "volume min": unknown;
  "volume max": unknown;
  "pitch min": unknown;
  "pitch max": unknown;
  "group size": unknown;
  "group weight": unknown;
  loop: unknown;
  "fade in": unknown;
  "fade out": unknown;
  "defer inst": unknown;
  "stop inst": unknown;
  duration: unknown;
  compound: unknown;
  falloff: unknown;
  lfemix: unknown;
  "3dspread": unknown;
  priority: unknown;
  stream: unknown;
  is2d: unknown;
  tracking: unknown;
  solo: unknown;
  "music vol": unknown;
  "block 1": unknown;
  "block 2": unknown;
  "block 3": unknown;
  hdoptout: unknown;
  delay: unknown;

  GetFileName(): string {
    return "sounds.txt";
  }
}

export class D2RStates extends D2RExcelRecord {
  state: unknown;
  group: unknown;
  remhit: unknown;
  nosend: unknown;
  transform: unknown;
  aura: unknown;
  curable: unknown;
  curse: unknown;
  active: unknown;
  restrict: unknown;
  disguise: unknown;
  attblue: unknown;
  damblue: unknown;
  armblue: unknown;
  rfblue: unknown;
  rlblue: unknown;
  rcblue: unknown;
  stambarblue: unknown;
  rpblue: unknown;
  attred: unknown;
  damred: unknown;
  armred: unknown;
  rfred: unknown;
  rlred: unknown;
  rcred: unknown;
  rpred: unknown;
  exp: unknown;
  plrstaydeath: unknown;
  monstaydeath: unknown;
  bossstaydeath: unknown;
  hide: unknown;
  shatter: unknown;
  udead: unknown;
  life: unknown;
  green: unknown;
  pgsv: unknown;
  nooverlays: unknown;
  noclear: unknown;
  bossinv: unknown;
  meleeonly: unknown;
  notondead: unknown;
  overlay1: unknown;
  overlay2: unknown;
  overlay3: unknown;
  overlay4: unknown;
  pgsvoverlay: unknown;
  castoverlay: unknown;
  removerlay: unknown;
  stat: unknown;
  setfunc: unknown;
  remfunc: unknown;
  missile: unknown;
  skill: unknown;
  itemtype: unknown;
  itemtrans: unknown;
  colorpri: unknown;
  colorshift: unknown;
  "light-r": unknown;
  "light-g": unknown;
  "light-b": unknown;
  onsound: unknown;
  offsound: unknown;
  gfxtype: unknown;
  gfxclass: unknown;
  cltevent: unknown;
  clteventfunc: unknown;
  cltactivefunc: unknown;
  srvactivefunc: unknown;
  canstack: unknown;
  // new in Diablo II: Resurrected 2.6
  "sunder-res-reduce": unknown;
  // new in retail release
  hidedead: unknown;

  GetFileName(): string {
    return "states.txt";
  }
}

export class D2RStorePage extends D2RExcelRecord {
  "store page": unknown;
  code: unknown;

  GetFileName(): string {
    return "storepage.txt";
  }
}

export class D2RSuperUniques extends D2RExcelRecord {
  superunique: unknown;
  name: unknown;
  class: unknown;
  hcidx: unknown;
  monsound: unknown;
  mod1: unknown;
  mod2: unknown;
  mod3: unknown;
  mingrp: unknown;
  maxgrp: unknown;
  autopos: unknown;
  stacks: unknown;
  replaceable: unknown;
  utrans: unknown;
  "utrans(n)": unknown;
  "utrans(h)": unknown;
  tc: unknown;
  "tc(n)": unknown;
  "tc(h)": unknown;
  // Added in Diablo II: Resurrected 2.5
  "tc desecrated": unknown;
  "tc(n) desecrated": unknown;
  "tc(h) desecrated": unknown;

  GetFileName(): string {
    return "superuniques.txt";
  }
}

export class D2RTreasureClassEx extends D2RExcelRecord {
  "treasure class": unknown;
  group: unknown;
  level: unknown;
  picks: unknown;
  unique: unknown;
  set: unknown;
  rare: unknown;
  magic: unknown;
  nodrop: unknown;
  item1: unknown;
  prob1: unknown;
  item2: unknown;
  prob2: unknown;
  item3: unknown;
  prob3: unknown;
  item4: unknown;
  prob4: unknown;
  item5: unknown;
  prob5: unknown;
  item6: unknown;
  prob6: unknown;
  item7: unknown;
  prob7: unknown;
  item8: unknown;
  prob8: unknown;
  item9: unknown;
  prob9: unknown;
  item10: unknown;
  prob10: unknown;
  // 'ladder' was added in 2.5, but was replaced by the following in 2.6
  firstLadderSeason: unknown;
  lastLadderSeason: unknown;

  GetFileName(): string {
    return "treasureclassex.txt";
  }
}

export class D2RUniqueAppellation extends D2RExcelRecord {
  name: unknown;

  GetFileName(): string {
    return "uniqueappellation.txt";
  }
}

export class D2RUniqueItems extends D2RExcelRecord {
  index: unknown;
  version: unknown;
  enabled: unknown;
  // 'firstLadderSeason' and 'lastLadderSeason' replace 'ladder' in Diablo II: Resurrected 2.6
  firstLadderSeason: unknown;
  lastLadderSeason: unknown;
  rarity: unknown;
  nolimit: unknown;
  lvl: unknown;
  "lvl req": unknown;
  code: unknown;
  carry1: unknown;
  "cost mult": unknown;
  "cost add": unknown;
  chrtransform: unknown;
  invtransform: unknown;
  flippyfile: unknown;
  invfile: unknown;
  dropsound: unknown;
  dropsfxframe: unknown;
  usesound: unknown;
  prop1: unknown;
  par1: unknown;
  min1: unknown;
  max1: unknown;
  prop2: unknown;
  par2: unknown;
  min2: unknown;
  max2: unknown;
  prop3: unknown;
  par3: unknown;
  min3: unknown;
  max3: unknown;
  prop4: unknown;
  par4: unknown;
  min4: unknown;
  max4: unknown;
  prop5: unknown;
  par5: unknown;
  min5: unknown;
  max5: unknown;
  prop6: unknown;
  par6: unknown;
  min6: unknown;
  max6: unknown;
  prop7: unknown;
  par7: unknown;
  min7: unknown;
  max7: unknown;
  prop8: unknown;
  par8: unknown;
  min8: unknown;
  max8: unknown;
  prop9: unknown;
  par9: unknown;
  min9: unknown;
  max9: unknown;
  prop10: unknown;
  par10: unknown;
  min10: unknown;
  max10: unknown;
  prop11: unknown;
  par11: unknown;
  min11: unknown;
  max11: unknown;
  prop12: unknown;
  par12: unknown;
  min12: unknown;
  max12: unknown;
  worldevent: unknown;

  /// Internal use only
  skipInDocs: unknown;

  GetFileName(): string {
    return "uniqueitems.txt";
  }
}

export class D2RUniquePrefix extends D2RExcelRecord {
  name: unknown;

  GetFileName(): string {
    return "uniqueprefix.txt";
  }
}

export class D2RUniqueSuffix extends D2RExcelRecord {
  name: unknown;

  GetFileName(): string {
    return "uniquesuffix.txt";
  }
}

export class D2RWanderingMon extends D2RExcelRecord {
  class: unknown;

  GetFileName(): string {
    return "wanderingmon.txt";
  }
}

export interface D2RStringTable {
  id: number;
  Key: string;
  enUS: string;
  zhTW: string;
  deDE: string;
  esES: string;
  frFR: string;
  itIT: string;
  koKR: string;
  plPL: string;
  esMX: string;
  jaJP: string;
  ptBR: string;
  ruRU: string;
  zhCN: string;
}

export interface D2RJsonTables {
  monsters: { [key: string]: string } | undefined;
  items: { [key: string]: { asset: string } }[] | undefined;
  sets:
    | { [key: string]: { normal: string; uber: string; ultra: string } }[]
    | undefined;
  uniques:
    | { [key: string]: { normal: string; uber: string; ultra: string } }[]
    | undefined;
  missiles:
    | ({
      dependencies: { [key: string]: unknown[] };
    } & { [key: string]: string })
    | undefined;
}

/**
 * Main workspace entry.
 */
export interface Workspace {
  actInfo?: D2RActInfo[];
  armor?: D2RArmor[];
  armType?: D2RArmType[];
  autoMagic?: D2RAutomagic[];
  autoMap?: D2RAutomap[];
  belts?: D2RBelts[];
  bodyLocs?: D2RBodyLocs[];
  books?: D2RBooks[];
  charStats?: D2RCharStats[];
  colors?: D2RColors[];
  compCode?: D2RCompCode[];
  composit?: D2RComposit[];
  cubemain?: D2RCubemain[];
  cubemod?: D2RCubemod[];
  difficultyLevels?: D2RDifficultyLevels[];
  elemTypes?: D2RElemTypes[];
  events?: D2REvents[];
  experience?: D2RExperience[];
  gamble?: D2RGamble[];
  gems?: D2RGems[];
  hireling?: D2RHireling[];
  hirelingDesc?: D2RHirelingDesc[];
  hitclass?: D2RHitclass[];
  inventory?: D2RInventory[];
  itemRatio?: D2RItemRatio[];
  itemStatCost?: D2RItemStatCost[];
  itemTypes?: D2RItemTypes[];
  levels?: D2RLevels[];
  levelGroups?: D2RLevelGroups[];
  lowQualityItems?: D2RLowQualityItems[];
  lvlMaze?: D2RLvlMaze[];
  lvlPrest?: D2RLvlPrest[];
  lvlSub?: D2RLvlSub[];
  lvlTypes?: D2RLvlTypes[];
  lvlWarp?: D2RLvlWarp[];
  magicPrefix?: D2RMagicPrefix[];
  magicSuffix?: D2RMagicSuffix[];
  misc?: D2RMisc[];
  missCalc?: D2RMissCalc[];
  missiles?: D2RMissiles[];
  monAi?: D2RMonAi[];
  monEquip?: D2RMonEquip[];
  monLvl?: D2RMonLvl[];
  monMode?: D2RMonMode[];
  monPlace?: D2RMonPlace[];
  monPreset?: D2RMonPreset[];
  monProp?: D2RMonProp[];
  monSeq?: D2RMonSeq[];
  monSounds?: D2RMonSounds[];
  monStats?: D2RMonStats[];
  monStats2?: D2RMonStats2[];
  monType?: D2RMonType[];
  monUMod?: D2RMonUMod[];
  npc?: D2RNPC[];
  objects?: D2RObjects[];
  objGroup?: D2RObjGroup[];
  objMode?: D2RObjMode[];
  objPreset?: D2RObjPreset[];
  objType?: D2RObjType[];
  overlay?: D2ROverlay[];
  petType?: D2RPetType[];
  playerClass?: D2RPlayerClass[];
  plrMode?: D2RPlrMode[];
  plrType?: D2RPlrType[];
  properties?: D2RProperties[];
  qualityItems?: D2RQualityItems[];
  rarePrefix?: D2RRarePrefix[];
  rareSuffix?: D2RRareSuffix[];
  runes?: D2RRunes[];
  setItems?: D2RSetItems[];
  sets?: D2RSets[];
  shrines?: D2RShrines[];
  skillCalc?: D2RSkillCalc[];
  skillDesc?: D2RSkillDesc[];
  skills?: D2RSkills[];
  soundEnviron?: D2RSoundEnviron[];
  sounds?: D2RSounds[];
  states?: D2RStates[];
  storePage?: D2RStorePage[];
  superUniques?: D2RSuperUniques[];
  treasureClassEx?: D2RTreasureClassEx[];
  uniqueApellation?: D2RUniqueAppellation[];
  uniqueItems?: D2RUniqueItems[];
  uniquePrefix?: D2RUniquePrefix[];
  uniqueSuffix?: D2RUniqueSuffix[];
  wanderingMon?: D2RWanderingMon[];
  weapons?: D2RWeapons[];

  strings?: { [key: string]: D2RStringTable[] | undefined };
  json?: D2RJsonTables;

  /// Docs only
  armorCategories?: { [key: number]: string };
  weaponCategories?: { [key: number]: string };
  cubeCategories?: { [key: number]: string };
  setCategories?: { [key: number]: string };
  runeCategories?: { [key: number]: string };
  uniqueCategories?: { [key: number]: string };
}

/**
 * Returns true if the specified object is an array of D2RExcelRecords.
 * @param r - the item to check
 * @returns {r is D2RExcelRecord[]}
 */
export function isExcelRecordSet(r: unknown): r is D2RExcelRecord[] {
  if (r === undefined || r === null || !Array.isArray(r) || r.length <= 0) {
    return false;
  }
  const first = r[0];
  if (typeof first !== "object" || first === null || first === undefined) {
    return false;
  }
  const keys = Object.keys(first);
  return keys.includes("GetFileName");
}

/**
 * Gets all Excel record sets from the workspace.
 * @param workspace - the workspace to get
 * @returns the set of Excel records
 */
export function GetAllWorkspaceExcelFiles(
  workspace: Workspace,
): (D2RExcelRecord[] | undefined)[] {
  const keys = Object.keys(workspace) as (keyof Workspace)[];
  return keys.map((key) => {
    const field = workspace[key];
    if (field === undefined || !isExcelRecordSet(field)) {
      return undefined;
    }
    return field;
  });
}

/**
 * Functions
 */

/**
 * Gets the text of the Excel file within the location.
 * @param location - the location to search. can be one of:
 * - root directory
 * - global directory
 * - excel directory
 * @param file - the name of the file to find. not case sensitive!
 * @returns {undefined} when no file is found
 * @returns {string} with the text of the file
 */
function FindExcelOrJson(
  location: string,
  file: string,
): BufferSource | undefined {
  const lowercased = file.toLocaleLowerCase();
  for (const entry of fs.walkSync(location)) {
    if (entry.isFile && entry.name.toLowerCase() === lowercased) {
      return Deno.readFileSync(entry.path);
    }
  }
  return undefined;
}

/**
 * Parses an excel file into an array of D2RExcelRecords.
 * @param location - the location to search for the Excel file (recurses over directories)
 * @param file - the name of the file to find. not case sensitive!
 */
function ParseExcel<T extends D2RExcelRecord = D2RExcelRecord>(
  location: string,
  fallback: string,
  type: { new (): T },
): T[] | undefined {
  const generic = new type();
  const file = generic.GetFileName();
  let fileText = FindExcelOrJson(location, generic.GetFileName());
  if (fileText === undefined && fallback !== undefined && fallback.length > 0) {
    fileText = FindExcelOrJson(fallback, generic.GetFileName());
  }

  if (fileText === undefined) {
    console.log(
      `WARNING: ${file} couldn't be found, data will be incomplete or incorrect!`,
    );
    return undefined;
  }

  const decoder = new TextDecoder("ascii");
  const decoded = decoder.decode(fileText);
  const lines = decoded.split(/(?:\r\n|\n)/gi);
  if (lines.length < 2) {
    console.log(
      `WARNING: No data in ${file}, data will be incomplete or incorrect!`,
    );
    return undefined;
  }

  const headerFields = lines[0].split("\t").map((field, idx) => {
    return { field: field.toLocaleLowerCase(), idx };
  }).filter((field) => !field.field.startsWith("*"));
  const rule = new ExcelColumns();
  rule.Check(headerFields, generic);

  // kind of a mess below, but basically what this does is:
  // - remove the first line
  // - with each remaining line, split into cells based on tabs ('\t')
  // - remove any lines that don't have AT LEAST $headerColumn.length cells
  // - map each set of cells into a new excel row
  // - return the mapped cells
  return lines.splice(1).map((line) => line.split("\t")).filter((vals) =>
    vals.length >= headerFields.length
  ).map((line) => {
    const row = new type();
    headerFields.forEach((column) => {
      const { field, idx } = column;
      const fieldName = field as keyof T;
      if (field === "@skipdocs" && line[idx] !== "") {
        (row as any)["skipInDocs"] = true;
      }

      row[fieldName] = line[idx] as unknown as T[keyof T];
    });

    return row;
  });
}

/**
 * Attempts to parse some JSON text (with C comments)
 * @param fileText - the text of the file
 * @param fileName - the name of the file (used for putting out a warning if the file could not be parsed)
 * @returns {T} if the text is valid
 * @returns {undefined} if the text is invalid
 */
function ParseJsonText<T>(
  fileText: BufferSource | undefined,
  fileName: string,
): T | undefined {
  if (fileText === undefined) {
    return undefined;
  }

  const decoder = new TextDecoder("utf-8");
  try {
    return parse(decoder.decode(fileText)) as T;
  } catch (e) {
    console.log(`Couldn't parse ${fileName}: ${e.message}`);
  }
}

/**
 * Tries to parse a string file.
 * @param filePath - the path to the file to parse
 * @returns {D2RStringTable[]} if the file was found and is valid
 * @returns {undefined} if the file is invalid
 */
function ParseJsonFile<T>(filePath: string | undefined): T | undefined {
  if (filePath === undefined) {
    return undefined;
  }

  try {
    const fileText = Deno.readFileSync(filePath);
    return ParseJsonText<T>(fileText, filePath);
  } catch (e) {
    console.log(`Couldn't load ${filePath}: ${e.message}`);
  }
}

/**
 * Loads all of the string files.
 * @param location - the place to look for string files
 * @returns {undefined} if no string files found
 * @returns { {[key]: string }: D2RStringTable[] | undefined } as the listing of keys
 */
function LoadStrings(
  location: string,
  fallback: string,
): { [key: string]: D2RStringTable[] | undefined } | undefined {
  // walk until we find the "strings" folder
  const entries: { [key: string]: D2RStringTable[] | undefined } = {};

  // look in the fallback first, the content will get replaced.
  if (fallback !== undefined && fallback.length > 0) {
    for (const entry of fs.walkSync(fallback)) {
      if (entry.isDirectory && entry.name.toLocaleLowerCase() === "strings") {
        for (const fileEntry of fs.walkSync(entry.path, { maxDepth: 1 })) {
          if (fileEntry.isFile && fileEntry.name.match(/\.json$/gi) !== null) {
            const fileName = fileEntry.name.replace(/(.*)\.json$/gi, "$1");
            entries[fileName] = ParseJsonFile<D2RStringTable[]>(fileEntry.path);
          }
        }
      }
    }
  }

  // look in the real directory next
  for (const entry of fs.walkSync(location)) {
    if (entry.isDirectory && entry.name.toLocaleLowerCase() === "strings") {
      for (const fileEntry of fs.walkSync(entry.path, { maxDepth: 1 })) {
        if (fileEntry.isFile && fileEntry.name.match(/\.json$/gi) !== null) {
          const fileName = fileEntry.name.replace(/(.*)\.json$/gi, "$1");
          entries[fileName] = ParseJsonFile<D2RStringTable[]>(fileEntry.path);
        }
      }
    }
  }
  if (Object.keys(entries).length > 0) {
    return entries;
  }
  return undefined;
}

/**
 * Attempts to find a string that matches the index.
 * @param workspace - the workspace to check
 * @param index - the matching string index
 * @returns {undefined} if the string wasn't found
 * @returns {D2RStringTable} if the string was found
 */
export function FindMatchingStringIndex(
  workspace: Workspace,
  index: string,
): D2RStringTable | undefined {
  const { strings } = workspace;
  if (strings === undefined) {
    return undefined;
  }

  const stringFiles = Object.keys(strings);
  return stringFiles.reduce((stringFile, val) => {
    const current = strings[val];
    if (current === undefined || current.find === undefined) {
      return stringFile;
    }
    const found = current.find((ls) => ls.Key === index);
    if (found !== undefined) {
      return found;
    }
    return stringFile;
  }, undefined as D2RStringTable | undefined);
}

/**
 * Attempts to load 'monsters.json', 'items.json', 'sets.json', 'uniques.json', and 'missiles.json'.
 * @param location - the first location to look for JSON files in
 * @param fallback - the fallback location to look for JSON files in
 */
function LoadJsonFiles(
  location: string,
  fallback: string,
): D2RJsonTables {
  const find = (file: string) => {
    const ret = FindExcelOrJson(location, file);
    if (ret === undefined && fallback !== undefined && fallback.length > 0) {
      return FindExcelOrJson(fallback, file);
    }
    return ret;
  };

  const monsters = find("monsters.json");
  const items = find("items.json");
  const sets = find("sets.json");
  const uniques = find("uniques.json");
  const missiles = find("missiles.json");

  return {
    monsters: ParseJsonText(monsters, "monsters.json"),
    items: ParseJsonText(items, "items.json"),
    sets: ParseJsonText(sets, "sets.json"),
    uniques: ParseJsonText(uniques, "uniques.json"),
    missiles: ParseJsonText(missiles, "missiles.json"),
  };
}

/**
 * Loads a Workspace.
 * @param location - the location of the workspace
 */
export function LoadWorkspace(
  location: string,
  fallback: string,
  legacy: boolean,
): Workspace {
  return {
    actInfo: legacy ? undefined : ParseExcel(location, fallback, D2RActInfo),
    armor: ParseExcel(location, fallback, D2RArmor),
    armType: ParseExcel(location, fallback, D2RArmType),
    autoMagic: ParseExcel(location, fallback, D2RAutomagic),
    autoMap: ParseExcel(location, fallback, D2RAutomap),
    belts: ParseExcel(location, fallback, D2RBelts),
    bodyLocs: ParseExcel(location, fallback, D2RBodyLocs),
    books: ParseExcel(location, fallback, D2RBooks),
    charStats: ParseExcel(location, fallback, D2RCharStats),
    colors: ParseExcel(location, fallback, D2RColors),
    compCode: ParseExcel(location, fallback, D2RCompCode),
    composit: ParseExcel(location, fallback, D2RComposit),
    cubemain: ParseExcel(location, fallback, D2RCubemain),
    cubemod: ParseExcel(location, fallback, D2RCubemod),
    difficultyLevels: ParseExcel(
      location,
      fallback,
      D2RDifficultyLevels,
    ),
    elemTypes: ParseExcel(location, fallback, D2RElemTypes),
    events: ParseExcel(location, fallback, D2REvents),
    experience: ParseExcel(location, fallback, D2RExperience),
    gamble: ParseExcel(location, fallback, D2RGamble),
    gems: ParseExcel(location, fallback, D2RGems),
    hireling: ParseExcel(location, fallback, D2RHireling),
    hirelingDesc: legacy
      ? undefined
      : ParseExcel(location, fallback, D2RHirelingDesc),
    hitclass: ParseExcel(location, fallback, D2RHitclass),
    inventory: ParseExcel(location, fallback, D2RInventory),
    itemRatio: ParseExcel(location, fallback, D2RItemRatio),
    itemStatCost: ParseExcel(location, fallback, D2RItemStatCost),
    itemTypes: ParseExcel(location, fallback, D2RItemTypes),
    levels: ParseExcel(location, fallback, D2RLevels),
    levelGroups: legacy
      ? undefined
      : ParseExcel(location, fallback, D2RLevelGroups),
    lowQualityItems: ParseExcel(
      location,
      fallback,
      D2RLowQualityItems,
    ),
    lvlMaze: ParseExcel(location, fallback, D2RLvlMaze),
    lvlPrest: ParseExcel(location, fallback, D2RLvlPrest),
    lvlSub: ParseExcel(location, fallback, D2RLvlSub),
    lvlTypes: ParseExcel(location, fallback, D2RLvlTypes),
    lvlWarp: ParseExcel(location, fallback, D2RLvlWarp),
    magicPrefix: ParseExcel(location, fallback, D2RMagicPrefix),
    magicSuffix: ParseExcel(location, fallback, D2RMagicSuffix),
    misc: ParseExcel(location, fallback, D2RMisc),
    missCalc: ParseExcel(location, fallback, D2RMissCalc),
    missiles: ParseExcel(location, fallback, D2RMissiles),
    monAi: ParseExcel(location, fallback, D2RMonAi),
    monEquip: ParseExcel(location, fallback, D2RMonEquip),
    monLvl: ParseExcel(location, fallback, D2RMonLvl),
    monMode: ParseExcel(location, fallback, D2RMonMode),
    monPlace: ParseExcel(location, fallback, D2RMonPlace),
    monPreset: ParseExcel(location, fallback, D2RMonPreset),
    monProp: ParseExcel(location, fallback, D2RMonProp),
    monSeq: ParseExcel(location, fallback, D2RMonSeq),
    monSounds: ParseExcel(location, fallback, D2RMonSounds),
    monStats: ParseExcel(location, fallback, D2RMonStats),
    monStats2: ParseExcel(location, fallback, D2RMonStats2),
    monType: ParseExcel(location, fallback, D2RMonType),
    monUMod: ParseExcel(location, fallback, D2RMonUMod),
    npc: ParseExcel(location, fallback, D2RNPC),
    objects: ParseExcel(location, fallback, D2RObjects),
    objGroup: ParseExcel(location, fallback, D2RObjGroup),
    objMode: ParseExcel(location, fallback, D2RObjMode),
    objPreset: legacy
      ? undefined
      : ParseExcel(location, fallback, D2RObjPreset),
    objType: ParseExcel(location, fallback, D2RObjType),
    overlay: ParseExcel(location, fallback, D2ROverlay),
    petType: ParseExcel(location, fallback, D2RPetType),
    playerClass: ParseExcel(location, fallback, D2RPlayerClass),
    plrMode: ParseExcel(location, fallback, D2RPlrMode),
    plrType: ParseExcel(location, fallback, D2RPlrType),
    properties: ParseExcel(location, fallback, D2RProperties),
    qualityItems: ParseExcel(location, fallback, D2RQualityItems),
    rarePrefix: ParseExcel(location, fallback, D2RRarePrefix),
    rareSuffix: ParseExcel(location, fallback, D2RRareSuffix),
    runes: ParseExcel(location, fallback, D2RRunes),
    setItems: ParseExcel(location, fallback, D2RSetItems),
    sets: ParseExcel(location, fallback, D2RSets),
    shrines: ParseExcel(location, fallback, D2RShrines),
    skillCalc: ParseExcel(location, fallback, D2RSkillCalc),
    skillDesc: ParseExcel(location, fallback, D2RSkillDesc),
    skills: ParseExcel(location, fallback, D2RSkills),
    soundEnviron: ParseExcel(location, fallback, D2RSoundEnviron),
    sounds: ParseExcel(location, fallback, D2RSounds),
    states: ParseExcel(location, fallback, D2RStates),
    storePage: ParseExcel(location, fallback, D2RStorePage),
    superUniques: ParseExcel(location, fallback, D2RSuperUniques),
    treasureClassEx: ParseExcel(
      location,
      fallback,
      D2RTreasureClassEx,
    ),
    uniqueApellation: ParseExcel(
      location,
      fallback,
      D2RUniqueAppellation,
    ),
    uniqueItems: ParseExcel(location, fallback, D2RUniqueItems),
    uniquePrefix: ParseExcel(location, fallback, D2RUniquePrefix),
    uniqueSuffix: ParseExcel(location, fallback, D2RUniqueSuffix),
    wanderingMon: legacy
      ? undefined
      : ParseExcel(location, fallback, D2RWanderingMon),
    weapons: ParseExcel(location, fallback, D2RWeapons),

    strings: LoadStrings(location, fallback),
    json: LoadJsonFiles(location, fallback),
  };
}
