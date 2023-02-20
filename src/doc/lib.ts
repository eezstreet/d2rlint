import { GetConfig } from "../lib/config.ts";
import {
  D2RCharStats,
  D2RItemExcelRecord,
  D2RItemTypes,
  D2RStringTable,
  Workspace,
} from "../lib/workspace.ts";

/**
 * Cached results for StringForIndex so we don't hit stuff over and over again
 */
const StringCache: {
  [key: string]: string;
} = {};

const ColorCodeClasses = {
  "ÿc0": '<span class="white1">',
  "ÿc=": '<span class="white2">',
  "ÿc5": '<span class="gray1">',
  "ÿcK": '<span class="gray2">',
  "ÿcI": '<span class="gray3">',
  "ÿc6": '<span class="black1">',
  "ÿcM": '<span class="black2">',
  "ÿcE": '<span class="lightred">',
  "ÿc1": '<span class="red1">',
  "ÿcU": '<span class="red2">',
  "ÿcS": '<span class="darkred">',
  "ÿc@": '<span class="orange1">',
  "ÿc8": '<span class="orange2">',
  "ÿcJ": '<span class="orange3">',
  "ÿcL": '<span class="orange4">',
  "ÿc7": '<span class="lightgold1">',
  "ÿcH": '<span class="lightgold2">',
  "ÿc4": '<span class="gold1">',
  "ÿcD": '<span class="gold2">',
  "ÿc9": '<span class="yellow1">',
  "ÿcR": '<span class="yellow2">',
  "ÿc2": '<span class="green1">',
  "ÿcQ": '<span class="green2">',
  "ÿcC": '<span class="green3">',
  "ÿc<": '<span class="green4">',
  "ÿcA": '<span class="darkgreen1">',
  "ÿc:": '<span class="darkgreen2">',
  "ÿcN": '<span class="turquoise">',
  "ÿcT": '<span class="skyblue">',
  "ÿcF": '<span class="lightblue1">',
  "ÿcP": '<span class="lightblue2">',
  "ÿc3": '<span class="blue1">',
  "ÿcB": '<span class="blue2">',
  "ÿcG": '<span class="lightpink">',
  "ÿcO": '<span class="pink">',
  "ÿc;": '<span class="purple">',
};

/**
 * Given a string with color-codes, this converts the color codes into <span> elements.
 */
function ExtractColorCodes(str: string): string {
  const foundElements = str.match(/ÿc([0-9A-Z=@<:;])/g);
  if (foundElements === null) return str;
  for (const element of foundElements) {
    str = str.replace(
      element, // deno-lint-ignore no-explicit-any
      (ColorCodeClasses as any)[element],
    );
  }
  return str;
}

/**
 * Finds a string (for a language)
 * @param ws - the workspace to look in
 * @param index - the lookup for the string
 * @returns {string} if the string was found
 * @returns {undefined} if the string was not found
 */
export function StringForIndex(ws: Workspace, index: string): string {
  const { strings } = ws;
  if (strings === undefined) {
    return "<string jsons not found>";
  }

  if (StringCache[index] !== undefined) {
    return ExtractColorCodes(StringCache[index]);
  }

  const config = GetConfig();
  const lang = config.docOptions.language;

  const keys = Object.keys(strings);
  let result: string | undefined = undefined;

  keys.forEach((key) => {
    if (result !== undefined) {
      return;
    }

    if (
      strings[key] !== undefined && typeof strings[key]?.find === "function"
    ) {
      const tblEntry = strings[key]?.find((v) =>
        v.Key.toLocaleLowerCase() === index.toLocaleLowerCase()
      );
      if (
        tblEntry !== undefined &&
        tblEntry[lang as keyof D2RStringTable] !== undefined
      ) {
        result = tblEntry[lang as keyof D2RStringTable] as string;
      }
    }
  });

  if (result !== undefined) {
    StringCache[index] = result;
    return ExtractColorCodes(result);
  }
  StringCache[index] = `<${index}>`;
  return `<${index}>`;
}

/**
 * Like StringForIndex, but replaces some elements of the string.
 * @param ws - the workspace we are working with
 * @param index - the string index to pull
 * @param args - the arguments to insert
 * @returns {string} - the formatted string
 */
export function StringForIndexFormatted(
  ws: Workspace,
  index: string,
  ...args: unknown[]
): string {
  let base = StringForIndex(ws, index);
  args.forEach((arg, i) => {
    const regex = new RegExp(`%(\\+?)[d${i}i]`);
    base = base.replace(regex, (_, plus) => {
      if (plus === "+") {
        const argAsStr = `${arg}`;
        if (argAsStr.startsWith("-")) {
          return argAsStr;
        }
        return `+${arg}`;
      }
      return `${arg}`;
    });
  });
  base = base.replace(/%%/, "%"); // replace any %% with %
  return base;
}

/**
 * Gets the name of a skill (from skills.txt, using its desc name)
 * @param ws - the workspace to use
 * @param skill - the skill to use
 * @param lang - the language
 * @returns {string} - the name of the skill
 */
export function SkillName(ws: Workspace, skill: string): string {
  const { skills, skillDesc } = ws;
  if (skills === undefined || skillDesc === undefined) {
    return `<bad skills.txt or skillDesc.txt>`;
  }

  const asNumber = Number.parseInt(skill);

  // find skill within skills.txt
  const theSkill = !isNaN(asNumber)
    ? skills[asNumber]
    : skills.find((sk) =>
      (sk.skill as string).toLocaleLowerCase() === skill.toLocaleLowerCase()
    );
  if (theSkill === undefined) {
    return `<'${skill}'>`;
  }

  const theSkillDesc = skillDesc.find((sd) =>
    (theSkill.skilldesc as string).toLocaleLowerCase() ===
      (sd.skilldesc as string).toLocaleLowerCase()
  );
  if (theSkillDesc === undefined) {
    return `<'${skill}'>`;
  }

  return StringForIndex(ws, theSkillDesc["str name"] as string);
}

/**
 * Given a workspace, skill index and language, gets the "(X only)" string.
 * @param ws - the workspace
 * @param skill - the skill in question
 * @param lang - the language
 * @returns {string}
 */
export function SkillClassOnly(ws: Workspace, skill: string): string {
  const { skills, charStats, playerClass } = ws;
  if (
    skills === undefined || charStats === undefined || playerClass === undefined
  ) {
    return `<bad skills.txt, playerClass.txt or charStats.txt>`;
  }

  // find skill within skills.txt
  const asNum = Number.parseInt(skill);

  const theSkill = !Number.isNaN(asNum)
    ? skills[asNum]
    : skills.find((sk) =>
      (sk.skill as string).toLocaleLowerCase() === skill.toLocaleLowerCase()
    );
  if (theSkill === undefined) {
    return `<'some class only'>`;
  }

  if (theSkill.charclass === "") {
    return "";
  }

  // find class within playerClass.txt
  const theClass = playerClass.find((cls) => cls.code === theSkill.charclass);
  if (theClass === undefined) {
    return `<${theSkill.charclass} only>`;
  }

  // find charStats.txt entry from class
  const theCharStats = charStats.find((cs) =>
    cs.class === theClass["player class"]
  );
  if (theCharStats === undefined) {
    return `<${theClass["player class"]} only>`;
  }

  return StringForIndex(ws, theCharStats.strclassonly as string);
}

/**
 * Given a monster number, gets the string name for it
 * @param ws - the workspace
 * @param monster - the monster number to get the name of
 * @param lang - the language
 * @returns {string}
 */
export function MonsterNameIdx(ws: Workspace, monster: number): string {
  const { monStats } = ws;
  if (monStats === undefined) {
    return `<bad monstats.txt>`;
  }

  if (monster >= monStats.length) {
    return `<invalid id ${monster}>`;
  }

  const theMonster = monStats[monster];
  return StringForIndex(ws, theMonster.namestr as string);
}

/**
 * Given a monster type, gets the string name for it
 * @param ws - the workspace
 * @param monsterType - the monster type to get the name of
 * @param lang - the language
 * @returns {string}
 */
export function MonsterTypeName(ws: Workspace, monsterType: string): string {
  const { monType } = ws;
  if (monType === undefined) {
    return `<bad montype.txt>`;
  }

  const record = monType.find((mt) => mt.type === monsterType);
  if (record === undefined) {
    return `<${monsterType}>`;
  }

  return StringForIndex(ws, record.strplur as string);
}

/**
 * Given a skill tab, gets the format string for it.
 * @param ws - the workspace to use
 * @param tab - the skill tab
 * @param lang - the language to use
 * @returns {string}
 */
export function SkillTabName(ws: Workspace, tab: number): string {
  // the way the skill tab function works is a wonky mess, and poorly documented
  // but basically, you need to walk all entries in charStats.txt until you find the right string id
  const { charStats } = ws;
  if (charStats === undefined) {
    return `<bad charstats.txt>`;
  }

  const cycle: (keyof D2RCharStats)[] = [
    "strskilltab1",
    "strskilltab2",
    "strskilltab3",
  ];
  let str = charStats[0][cycle[0]] as string;
  let line = 0;
  do {
    if (charStats[line].class === "Expansion") { // skip expansion line
      line++;
      continue;
    }
    if (tab < 3) {
      str = charStats[line][cycle[tab]] as string;
      break;
    }
    tab -= 3;
  } while (tab > 0);

  return StringForIndex(ws, str);
}

/**
 * Gets the maximum player experience level.
 * @param ws - the workspace we are working with
 * @returns {number} the maximum experience level
 */
export function GetMaxExperienceLevel(ws: Workspace): number {
  const { experience } = ws;

  if (experience === undefined) {
    return 1;
  }

  // find 'MaxLvl' row
  for (let i = 0; i < experience.length; i++) {
    if (experience[i].level === "MaxLvl") {
      return Math.max(
        Number.parseInt(experience[i].amazon as string),
        Number.parseInt(experience[i].sorceress as string),
        Number.parseInt(experience[i].necromancer as string),
        Number.parseInt(experience[i].paladin as string),
        Number.parseInt(experience[i].barbarian as string),
        Number.parseInt(experience[i].assassin as string),
        Number.parseInt(experience[i].druid as string),
      );
    }
  }

  return 1;
}

/**
 * Given a number, gets the correct format string.
 * @param ws - the workspace to work off of
 * @param param - the parameter to use
 * @param lang - the language to use
 * @returns {string} a formatter string (%s)
 */
export function GetItemDaylightFormatter(ws: Workspace, param: number): string {
  const options = [
    "ModStre9e", // increases during daytime
    "ModStre9g", // increases near dusk
    "ModStre9d", // increases during nighttime
    "ModStre9f", // increases near dawn
  ];

  return StringForIndex(ws, options[param]);
}

/**
 * Given a workspace and a class number, gets the +to class skills format string
 * @param ws - the workspace to work off of
 * @param param - the parameter to use
 * @param lang - the language to use
 * @returns {string} the class skill format string
 */
export function GetClassSkillString(
  ws: Workspace,
  param: number,
): string {
  const { charStats } = ws;

  if (charStats === undefined) {
    return "<bad charStats.txt>";
  }

  let str = "";
  let line = 0;
  do {
    if (charStats[line].class === "Expansion") {
      line++;
      continue;
    }
    str = charStats[line].strallskills as string;
    line++;
    param--;
  } while (param >= 0);

  return StringForIndex(ws, str);
}

/**
 * Returns true if the item record belongs to a specific type.
 * @param ws - the workspace we are dealing with
 * @param item - the item excel record
 * @param theType - the type we are matching against
 * @returns {true} if the item is of the right type
 * @returns {false} if the item is not of the right type
 */
export function ItemIsOfType(
  ws: Workspace,
  item: D2RItemExcelRecord,
  theType: string,
): boolean {
  const { itemTypes } = ws;
  if (itemTypes === undefined) {
    return false;
  }

  const { type, type2 } = item;
  if (type === theType || type2 === theType) {
    return true;
  }

  const equivMatches = (xType: string): boolean => {
    if (xType === "") {
      return false;
    }

    const found = itemTypes.find((it) => it.code === xType);
    if (found === undefined) {
      return false;
    }
    if (found.equiv1 === theType) {
      return true;
    } else if (found.equiv2 === theType) {
      return true;
    }
    return equivMatches(found.equiv1 as string) ||
      equivMatches(found.equiv2 as string);
  };

  return equivMatches(type as string) || equivMatches(type2 as string);
}

/**
 * Gets all item types that match the given strings
 * @param ws - the workspace to work off of
 * @param itemTypes - the item types to look for (codes)
 */
export function GetItemTypes(
  ws: Workspace,
  ...theItemTypes: string[]
): D2RItemTypes[] {
  const { itemTypes } = ws;
  if (itemTypes === undefined) {
    return [];
  }

  const noBlanks = theItemTypes.filter((f) => f !== "");
  return itemTypes.filter((it) => noBlanks.includes(it.code as string));
}

/**
 * Gets all item records that satisfy the given inclusion and exclusion criteria.
 * @param ws - the workspace to use
 * @param includeTypes - the item types to include
 * @param excludeTypes - the item types to exclude
 */
export function GetItemsWithTypes(
  ws: Workspace,
  includeTypes: D2RItemTypes[],
  excludeTypes: D2RItemTypes[],
): D2RItemExcelRecord[] {
  const { misc, armor, weapons, itemTypes } = ws;
  if (
    misc === undefined || armor === undefined || weapons === undefined ||
    itemTypes === undefined
  ) {
    return [];
  }

  return [...misc, ...armor, ...weapons].filter((item) => {
    const { type, type2 } = item;

    // Ancient's Pledge is a good example here. It uses 'shld' as the sole item type included.
    // Shield items use only shie (equiv1 = 'shld'), ashd (equiv1 = 'shld'), etc

    const matchesCriteria = (x: string, types: D2RItemTypes[]): boolean => {
      if (x === "") {
        return false;
      }

      if (types.find((it) => it.code === x)) {
        return true; // one of the included types includes this code directly
      }

      const type = GetItemTypes(ws, x);
      if (type.length === 0) {
        return false;
      }

      const subtypes = GetItemTypes(
        ws,
        type[0].equiv1 as string,
        type[0].equiv2 as string,
      );
      return subtypes.some((st) => matchesCriteria(st.code as string, types));
    };

    if (
      matchesCriteria(type as string, excludeTypes) ||
      matchesCriteria(type2 as string, excludeTypes)
    ) {
      return false;
    }

    return matchesCriteria(type as string, includeTypes) ||
      matchesCriteria(type2 as string, includeTypes);
  });
}

/**
 * Converts an array of item types into their respective names
 * @param types - the item types to get
 * @returns {string} a comma-joined list of item type names
 */
export function GetItemTypeNames(types: D2RItemTypes[]): string {
  return types.map((t) => t.itemtype as string).join(", ");
}

/**
 * Gets all item records that match the given code.
 * @param ws - the workspace to use
 * @param items - the item codes to find
 * @returns {D2RItemExcelRecord[]} - the found item records
 */
export function GetItemsWithCode(
  ws: Workspace,
  ...items: string[]
): D2RItemExcelRecord[] {
  const { misc, armor, weapons } = ws;
  if (misc === undefined || armor === undefined || weapons === undefined) {
    return [];
  }

  const allItems = [...misc, ...armor, ...weapons];

  return items.filter((i) => i !== "").map((i) =>
    allItems.find((it) => it.code === i)
  ).filter((i) => i !== undefined) as D2RItemExcelRecord[];
}

/**
 * Gets the maximum value of the 'levelreq' field for the given items.
 * @param items - the items to look through
 * @returns {number} - the maximum required level of each specified item
 */
export function GetMaxRequiredLevelOfItems(
  items: D2RItemExcelRecord[],
): number {
  return items.reduce((val, it) => {
    const parsed = Number.parseInt(it.levelreq as string);
    if (Number.isNaN(parsed) || parsed <= val) {
      return val;
    }
    return parsed;
  }, 0);
}

/**
 * Gets the kind of staff mods that an item has.
 * @param ws - the workspace we are working with
 * @param item - the item that we are looking at
 * @returns the class string (ama, sor, ...)
 */
export function GetStaffMods(ws: Workspace, item: D2RItemExcelRecord): string {
  const { itemTypes } = ws;

  if (itemTypes === undefined) {
    return "";
  }

  const found = itemTypes.find((it) => it.code === item.type);
  const found2 = itemTypes.find((it) => it.code === item.type2);

  if (
    found !== undefined && found.staffmods !== "" &&
    found.staffmods !== undefined
  ) {
    return found.staffmods as string;
  }
  if (
    found2 !== undefined && found2.staffmods !== "" &&
    found2.staffmods !== undefined
  ) {
    return found2.staffmods as string;
  }

  return "";
}

/**
 * Returns true if we should show Smite damage instead of 1-handed damage
 * @param ws - the workspace that we are working with
 * @param item - the item record
 * @returns {true} if the item should use a Smite damage display
 * @returns {false} if the item should not use a Smite damage display
 */
export function IsSmiteDamageType(
  ws: Workspace,
  item: D2RItemExcelRecord,
): boolean {
  const { itemTypes } = ws;

  if (itemTypes === undefined) {
    return false;
  }

  return ItemIsOfType(ws, item, "shld");
}

/**
 * Returns true if we should show Kick damage instead of 1-handed damage
 * @param ws - the workspace that we are working with
 * @param item - the item record
 * @returns {true} if the item should use a Kick damage display
 * @returns {false} if the item should not use a Kick damage display
 */
export function IsKickDamageType(
  ws: Workspace,
  item: D2RItemExcelRecord,
): boolean {
  const { itemTypes } = ws;

  if (itemTypes === undefined) {
    return false;
  }

  return ItemIsOfType(ws, item, "boot");
}
