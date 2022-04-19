import {
  D2RArmor,
  D2RExcelRecord,
  D2RItemStatCost,
  D2RMisc,
  D2RProperties,
  D2RUniqueItems,
  D2RWeapons,
  Workspace,
} from "../lib/workspace.ts";
import {
  GetClassSkillString,
  GetItemDaylightFormatter,
  GetMaxExperienceLevel,
  MonsterNameIdx,
  MonsterTypeName,
  SkillClassOnly,
  SkillName,
  SkillTabName,
  StringForIndex,
} from "./lib.ts";

// A property list is a list of item properties
type PropertyList = {
  stat: D2RProperties | undefined;
  param: string;
  min: number;
  max: number;
}[];

// An item stat list is a list of item stats
type ItemStatList = {
  stat: D2RItemStatCost | undefined | "ethereal"; // xtreme hack
  param: string;
  min: number;
  max: number;
  func: number;
  val: number;
}[];

/**
 * Converts a list of properties into a list of stats
 * @param list - the list of properties
 * @param ws - the workspace
 * @returns {ItemStatList} - the list of item stats
 */
function PropertyListToItemStatList(
  list: PropertyList,
  ws: Workspace,
): ItemStatList {
  const result: ItemStatList = [];
  const { itemStatCost } = ws;

  if (itemStatCost === undefined) {
    return [];
  }

  list.forEach((property) => {
    const { stat, param, min, max } = property;
    if (stat === undefined) {
      return;
    }

    // iterate from func1-func7
    const fieldSets: [
      keyof D2RProperties,
      keyof D2RProperties,
      keyof D2RProperties,
    ][] = [
      ["func1", "stat1", "val1"],
      ["func2", "stat2", "val2"],
      ["func3", "stat3", "val3"],
      ["func4", "stat4", "val4"],
      ["func5", "stat5", "val5"],
      ["func6", "stat6", "val6"],
      ["func7", "stat7", "val7"],
    ];

    fieldSets.forEach((fieldSet) => {
      const func = stat[fieldSet[0]];
      const statP = stat[fieldSet[1]];
      const val = stat[fieldSet[2]]; // FIXME, unclear how this is used...

      // skip if func is blank or invalid
      if (func === "") {
        return;
      }

      const funcAsNum = Number.parseInt(func as string);
      if (Number.isNaN(funcAsNum) || funcAsNum <= 0 || funcAsNum >= 37) {
        return;
      }

      if (funcAsNum >= 25 && funcAsNum <= 35) {
        return; // these don't do anything in the vanilla game
      }

      let iscEntry: D2RItemStatCost | undefined | "ethereal" = itemStatCost
        .find((isc) => isc.stat === statP);
      let iscMin = min;
      let iscMax = max;

      // func in properties.txt modifies the value of the stat a bit
      switch (funcAsNum) {
        case 2:
        case 16:
          iscMin = iscMax;
          break;
        case 15:
          iscMax = iscMin;
          break;
        case 20: // stupid but it works
          iscEntry = itemStatCost.find((isc) =>
            isc.stat === "item_indesctructible"
          );
          break;
        case 23:
          iscEntry = "ethereal";
          break;
      }

      result.push({
        stat: iscEntry,
        min: iscMin,
        max: iscMax,
        param,
        func: funcAsNum,
        val: Number.parseInt(val as string),
      });
    });
  });

  return result;
}

/**
 * Given two ItemStatCost.txt entries (or "ethereal", or undefined), return true if they are the same.
 * @param a - the first item
 * @param b - the second item
 * @returns {true} if both stats are undefined, "ethereal", or share the same "code" from isc.txt
 * @returns {false} otherwise
 */
function StatsEqual(
  a: D2RItemStatCost | undefined | "ethereal",
  b: D2RItemStatCost | undefined | "ethereal",
): boolean {
  if (a === undefined && b === undefined) {
    return true;
  } else if (a === "ethereal" && b === "ethereal") {
    return true;
  } else if (
    a !== "ethereal" && b !== "ethereal" && a !== undefined && b !== undefined
  ) {
    return a.stat === b.stat;
  }
  return false;
}

/**
 * Converts a PropertyList into an array of item modifiers
 * @param list - the PropertyList to convert
 */
function PropertyListToDescString(list: PropertyList, ws: Workspace): string[] {
  const { properties, itemStatCost } = ws;
  if (properties === undefined || itemStatCost === undefined) {
    return ["<span>itemStatCost.txt not found</span>"];
  }

  // strip out any stats that are invalid.
  const valid = list.filter((property) => property.stat !== undefined);

  // properties are combination of ISC.txt entries.
  // we need to create a list of those ISC.txt entries
  const stats = PropertyListToItemStatList(valid, ws);

  // combine any stats together that are grouped
  type StatLine = { line: string; group?: number; priority: number };
  const statLines: StatLine[] = [];

  // creates a string, given descfunc, strpos, strneg and func
  const makeStatStr = (
    descfunc: number,
    min: number,
    max: number,
    param: string,
    strpos: string,
    strneg: string,
    func: number,
    descstr2: string,
    propval: number,
  ) => {
    let val = "";
    if (func === 17) {
      // FIXME: we should check the op column in case the user is doing funny things here
      // we default to doing this for level checks, but we really shouldn't
      min = Number.parseInt(param) / 8;
      max = Number.parseInt(param) * GetMaxExperienceLevel(ws);
    }
    if (min === max) {
      val = `${min}`;
    } else if (min < 0 || max < 0) {
      val = `[${min} to ${max}]`;
    } else {
      val = `[${min}-${max}]`;
    }

    switch (descfunc) {
      case 11: // self-repair
       {
        const repairSpeed = Number.parseInt(param);
        const replacement = Math.round(
          repairSpeed > 100 ? repairSpeed / 100 : 100 / repairSpeed,
        );
        if (repairSpeed > 100) {
          return StringForIndex(ws, "ModStre9t", "enUS").replace(
            /%\+?d/,
            `${replacement}`,
          );
        }
        return StringForIndex(ws, "ModStre9u", "enUS").replace(/%\+?d/, "1")
          .replace(/%\+?d/, `${replacement}`);
      }
      case 12: // basic
        if (min < 0 && max < 0) {
          return StringForIndex(ws, strneg, "enUS");
        }
        return StringForIndex(ws, strpos, "enUS");
      case 13: // + to character class skills
        return GetClassSkillString(ws, propval, "enUS").replace(/%\+?d/, val);
      case 14: // skill tab. complex logic aplenty
        return SkillTabName(ws, Number.parseInt(param), "enUS").replace(
          /%\+?d/,
          val,
        );
      case 15: // CtC.
        return StringForIndex(ws, strpos, "enUS").replace(/%\+?d/, `${min}`)
          .replace(/%\+?d/, `${max}`).replace(
            /%s/,
            SkillName(ws, param, "enUS"),
          );
      case 17: // increases by time
      case 18: // not used in vanilla game because it's bugged
        if (min < 0 && max < 0) {
          return GetItemDaylightFormatter(ws, Number.parseInt(param), "enUS")
            .replace(
              /%s/,
              StringForIndex(ws, strneg, "enUS").replace(/%\+?d/, val),
            );
        }
        return GetItemDaylightFormatter(ws, Number.parseInt(param), "enUS")
          .replace(
            /%s/,
            StringForIndex(ws, strpos, "enUS").replace(/%\+?d/, val),
          );
      case 5: // functionally identical
      case 19: // basic
        if (min < 0 && max < 0) {
          return `${
            StringForIndex(ws, strneg, "enUS").replace(/%\+?d/, val)
          } ${descstr2}`;
        }
        return `${
          StringForIndex(ws, strpos, "enUS").replace(/%\+?d/, val)
        } ${descstr2}`;
      case 22: // attack/damage vs arbitrary monster type, unused in vanilla
        if (min < 0 && max < 0) {
          return `${StringForIndex(ws, strneg, "enUS").replace(/%\+?d/, val)} ${
            MonsterTypeName(ws, param, "enUS")
          }`;
        }
        return `${StringForIndex(ws, strpos, "enUS").replace(/%\+?d/, val)} ${
          MonsterTypeName(ws, param, "enUS")
        }`;
      case 23: // reanimate as, %0 = val, %1 = param (monstats idx)
        if (min < 0 && max < 0) {
          return StringForIndex(ws, strneg, "enUS").replace(/%0/, val).replace(
            /%1/,
            MonsterNameIdx(ws, Number.parseInt(param), "enUS"),
          );
        }
        return StringForIndex(ws, strpos, "enUS").replace(/%0/, val).replace(
          /%1/,
          MonsterNameIdx(ws, Number.parseInt(param), "enUS"),
        );
      case 24: // charges
        return StringForIndex(ws, strpos, "enUS").replace(
          /%[1s]/,
          SkillName(ws, param, "enUS"),
        ).replace(/%\+?[0d]/, `${max}`).replace(
          /%\+?[2d]\/%\+?[3d]/g,
          `${min}`,
        );
      case 27: // single tab skill
        if (min < 0 && max < 0) {
          return StringForIndex(ws, strneg, "enUS").replace(/%\+?d/g, val)
            .replace(/%s/, SkillName(ws, param, "enUS")).replace(
              /%s/,
              SkillClassOnly(ws, param, "enUS"),
            );
        }
        return StringForIndex(ws, strpos, "enUS").replace(/%\+?d/g, val)
          .replace(/%s/, SkillName(ws, param, "enUS")).replace(
            /%s/,
            SkillClassOnly(ws, param, "enUS"),
          );
      case 16: // aura (functionally identical)
      case 28: // oskill
        if (min < 0 && max < 0) {
          return StringForIndex(ws, strneg, "enUS").replace(/%\+?d/g, val)
            .replace(/%s/g, SkillName(ws, param, "enUS"));
        }
        return StringForIndex(ws, strpos, "enUS").replace(/%\+?d/g, val)
          .replace(/%s/g, SkillName(ws, param, "enUS"));
      default: // default case not handled
        return `author needs to handle case ${descfunc}`;
    }
  };

  // iterate over all stats.
  stats.forEach((statOnItem) => {
    const { min, max, param, func, val } = statOnItem;
    let { stat } = statOnItem;
    // hardcoded, weird cases where there isn't a stat for the property
    if (func === 5) {
      // dmg-min
      stat = itemStatCost.find((isc) => isc.stat === "mindamage");
    } else if (func === 6) {
      // dmg-max
      stat = itemStatCost.find((isc) => isc.stat === "maxdamage");
    } else if (func === 7) {
      // dmg%
      const valStr = min === max ? `${min}` : `[${min}-${max}]`;
      statLines.push({
        line: StringForIndex(ws, "strModEnhancedDamage", "enUS").replace(
          /%\+?d/,
          valStr,
        ),
        priority: 1000,
      });
      return;
    }
    if (stat === undefined) {
      // this line is broken. skip.
      return;
    }

    if (stat === "ethereal") {
      // is ethereal. push ethereal string to end
      statLines.push({
        line: StringForIndex(ws, "strethereal", "enUS"),
        priority: -1,
      });
      return;
    }

    // some stats are automatically grouped, for e.g. "all resistances"
    // this is controlled by dgrp in isc.txt
    if (stat.dgrp !== "") {
      // parse numeric value
      const group = Number.parseInt(stat.dgrp as string);
      if (!Number.isNaN(group)) {
        // see if there is already a statline with this group. if so, skip.
        if (statLines.find((sl) => sl.group === group) !== undefined) {
          return;
        }

        // find all stats in itemStatCost with the same group.
        const sameGroupAllStats = itemStatCost.filter((isc) =>
          stat !== undefined && stat !== "ethereal" && isc.dgrp === stat.dgrp
        ); // all lines in isc
        const sameGroupItemStats = stats.filter((s) =>
          s.stat !== "ethereal" && s.stat !== undefined &&
          stat !== "ethereal" && stat !== undefined &&
          s.stat.dgrp === stat.dgrp
        );
        const allGroupedStatsIncluded =
          sameGroupAllStats.length === sameGroupItemStats.length;
        const allGroupSameMin = sameGroupItemStats.every((si) =>
          si.min === min
        );
        const allGroupSameMax = sameGroupItemStats.every((si) =>
          si.max === max
        );
        const priority = Math.max(
          ...sameGroupAllStats.map((as) =>
            Number.parseInt(as.descpriority as string)
          ),
        );

        // if ALL stats in this group are present, AND all stats in the group share the same min/max...
        if (allGroupedStatsIncluded && allGroupSameMin && allGroupSameMax) {
          // ...push a stat line!
          statLines.push({
            line: makeStatStr(
              Number.parseInt(stat.descfunc as string),
              min,
              max,
              param,
              stat.descstrpos as string,
              stat.descstrpos as string,
              func,
              stat.descstr2 as string,
              val,
            ),
            group,
            priority,
          });
        }
      }
    }

    const mergeRange = (
      stat1: string,
      stat2: string,
      group: number,
      str: string,
      len?: string,
    ) => {
      if (stat === undefined || stat === "ethereal") {
        return false;
      }
      if (stat.stat !== stat1 && stat.stat !== stat2) {
        return false;
      }

      if (statLines.find((sl) => sl.group === group)) {
        return true;
      }

      // see if the other grouped stat is present. if so, we need to do some work
      const otherStat = stat.stat === stat1 ? stat2 : stat1;
      const foundOtherStat = stats.find((s) =>
        s.stat !== undefined && s.stat !== "ethereal" &&
        s.stat.stat === otherStat
      );
      if (foundOtherStat === undefined) {
        return false;
      }

      if (len !== undefined) {
        // len is a bit messed up here.
        // if pois-len is defined, we use the range of it to determine the len string
        // if it is not defined, then we use the param to determine the len string
        const foundLen = stats.find((s) =>
          s.stat !== undefined && s.stat !== "ethereal" && s.stat.stat === len
        );
        if (foundLen === undefined) {
          len = "2";
        } else if (foundLen.param === param) {
          len = `${Math.round(Number.parseInt(param) / 25)}`;
        } else if (foundLen.min === foundLen.max) {
          len = `${Math.round(foundLen.min / 25)}`;
        } else {
          len = `[${Math.round(foundLen.min / 25)}-${
            Math.round(foundLen.max / 25)
          }]`;
        }
      }

      const minStat = stat.stat === stat1 ? statOnItem : foundOtherStat;
      const maxStat = stat.stat === stat2 ? statOnItem : foundOtherStat;

      let minStr = "";
      let maxStr = "";
      if (minStat.min === minStat.max) {
        minStr = `${minStat.min}`;
      } else {
        minStr = `[${minStat.min}-${minStat.max}]`;
      }

      if (maxStat.min === maxStat.max) {
        maxStr = `${maxStat.min}`;
      } else {
        maxStr = `[${maxStat.min}-${maxStat.max}]`;
      }

      statLines.push({
        line: StringForIndex(ws, str, "enUS").replace(/%\+?d/, minStr).replace(
          /%\+?d/,
          maxStr,
        ).replace(/%\+?d/, `${len}`),
        priority: Number.parseInt(stat.descpriority as string),
        group,
      });
      return true;
    };

    // there's a few hardcoded cases that we have to be aware of:
    // firemindam + firemaxdam on the same group = strModFireDamageRange
    // lightmindam + lightmaxdam on the same group = strModLightningDamageRange
    // magicmindam + magicmaxdam on the same group = strModMagicDamageRange
    // coldmindam + coldmaxdam on the same group = strModColdDamageRange
    // poisonmindam + poisonmaxdam on the same group = strModPoisonDamageRange
    // mindamage + maxdamage on the same group = strModMinDamageRange
    if (
      mergeRange("firemindam", "firemaxdam", -100, "strModFireDamageRange") ||
      mergeRange(
        "lightmindam",
        "lightmaxdam",
        -101,
        "strModLightningDamageRange",
      ) ||
      mergeRange(
        "magicmindam",
        "magicmaxdam",
        -102,
        "strModMagicDamageRange",
      ) ||
      mergeRange("coldmindam", "coldmaxdam", -103, "strModColdDamageRange") ||
      mergeRange(
        "poisonmindam",
        "poisonmaxdam",
        -104,
        "strModPoisonDamageRange",
        "poisonlen",
      ) ||
      mergeRange("mindamage", "maxdamage", -105, "strModMinDamageRange")
    ) {
      return;
    }

    // nothing has told us that we should stop. so we should add a stat line here
    statLines.push({
      line: makeStatStr(
        Number.parseInt(stat.descfunc as string),
        min,
        max,
        param,
        stat.descstrpos as string,
        stat.descstrneg as string,
        func,
        stat.descstr2 as string,
        val,
      ),
      priority: Number.parseInt(stat.descpriority as string),
    });
  });

  // sort by priority and return the lines themselves
  return statLines.sort((a, b) => a.priority - b.priority).map((sl) => sl.line);
}

/**
 * Merges multiple PropertyList items together into one giant property list
 * @param args - the property lists to merge
 * @returns {PropertyList} a merged PropertyList
 */
function MergePropertyLists(...args: PropertyList[]): PropertyList {
  return args.reduce((list, item) => list.concat(item), []);
}

/**
 * Given a record, props, and properties.txt, constructs a PropertyList
 * @param properties - the properties.txt
 * @param record - the record
 * @param props - the properties to create into a PropertyList
 */
function MakePropertyList<
  T extends D2RExcelRecord,
  U extends keyof T = keyof T,
>(properties: D2RProperties[], record: T, props: [U, U, U, U][]): PropertyList {
  const propList: PropertyList = [];

  props.forEach((prop) => {
    const property = prop[0];
    const param = prop[1];
    const min = prop[2];
    const max = prop[3];

    if (record[property] as unknown as string === "") {
      return;
    }

    propList.push({
      stat: properties.find((x) => x.code === record[property]),
      param: record[param] as unknown as string,
      min: parseInt(record[min] as unknown as string),
      max: parseInt(record[max] as unknown as string),
    });
  });

  return propList;
}

type DocumentedUniqueItem = {
  unique: D2RUniqueItems;
  base: D2RArmor | D2RWeapons | D2RMisc | undefined;
  mods: PropertyList;
};

/**
 * Given a unique item, emits the HTML for it.
 * @param item - the item that we are emitting
 * @param ws - the workspace we are working with
 */
function DocumentUniqueItem(item: DocumentedUniqueItem, ws: Workspace): string {
  const { base, mods, unique } = item;

  const descStrings = PropertyListToDescString(mods, ws).map((v) =>
    `<span class="stat">${v.replace(/%%/, "%")}</span>`
  );
  const uniqueName = StringForIndex(ws, unique.index as string, "enUS");
  const uniqueItem = base === undefined
    ? `<${unique.code}>`
    : StringForIndex(ws, base.namestr as string, "enUS");
  let lvltxt = "";
  let reqlvltxt = "";

  if (unique.lvl !== "") {
    const lvl = Number.parseInt(unique.lvl as string);
    if (!Number.isNaN(lvl)) {
      lvltxt = StringForIndex(ws, "strChatLevel", "enUS").replace(
        /%\+?d/,
        unique.lvl as string,
      );
      lvltxt = `<span class="required-level">${lvltxt}</span>`;
    }
  }
  if (unique["lvl req"] !== "") {
    const lvlreq = Number.parseInt(unique["lvl req"] as string);
    if (!Number.isNaN(lvlreq)) {
      reqlvltxt = StringForIndex(ws, "ItemStats1p", "enUS").replace(
        /%\+?d/,
        unique["lvl req"] as string,
      );
      reqlvltxt = `<span class="required-level">${reqlvltxt}</span>`;
    }
  }

  return `
      <div class="unique-item">
        <span class="unique-name">${uniqueName}</span>
        <span class="unique-item">${uniqueItem}</span>
        ${lvltxt}
        ${reqlvltxt}
        ${descStrings.join("\r\n        ")}
      </div>
  `;
}

/**
 * Creates the HTML for the unique items page.
 * @param ws - the workspace that we are working with
 * @returns {string} HTML page for unique items
 */
export function DocUniques(ws: Workspace): string {
  const { uniqueItems, properties, weapons, armor, misc } = ws;

  if (uniqueItems === undefined) {
    return '<h1 class="error">uniqueitems.txt not found</h1>';
  }

  if (properties === undefined) {
    return '<h1 class="error">properties.txt not found</h1>';
  }

  if (weapons === undefined || armor === undefined || misc === undefined) {
    return '<h1 class="error">weapons/armor/misc.txt not found</h1>';
  }

  const allItems = [...weapons, ...armor, ...misc];

  const props: [
    keyof D2RUniqueItems,
    keyof D2RUniqueItems,
    keyof D2RUniqueItems,
    keyof D2RUniqueItems,
  ][] = [
    ["prop1", "par1", "min1", "max1"],
    ["prop2", "par2", "min2", "max2"],
    ["prop3", "par3", "min3", "max3"],
    ["prop4", "par4", "min4", "max4"],
    ["prop5", "par5", "min5", "max5"],
    ["prop6", "par6", "min6", "max6"],
    ["prop7", "par7", "min7", "max7"],
    ["prop8", "par8", "min8", "max8"],
    ["prop9", "par9", "min9", "max9"],
    ["prop10", "par10", "min10", "max10"],
    ["prop11", "par11", "min11", "max11"],
    ["prop12", "par12", "min12", "max12"],
  ];

  const documented: DocumentedUniqueItem[] = [];
  uniqueItems.forEach((unique) => {
    if (unique.code === "") {
      return; // just skip this unique item, it's probably a placeholder
    }

    const mods = MakePropertyList(properties, unique, props);
    const base = allItems.find((item) => item.code === unique.code);

    documented.push({ unique, base, mods });
  });

  // TODO: group the items together somehow?

  return documented.map((doc) => DocumentUniqueItem(doc, ws)).join("\r\n");
}

type DocumentedSetItem = {};

type DocumentedSet = {};

export function DocSets(ws: Workspace): string {
  const { sets, setItems, properties } = ws;

  if (sets === undefined || setItems === undefined) {
    return '<h1 class="error">setitems.txt and/or sets.txt not found</h1>';
  }

  if (properties === undefined) {
    return '<h1 class="error">properties.txt not found</h1>';
  }

  const documented: DocumentedSet[] = [];
  return "";
}

type DocumentedMagicAffix = {};

export function DocMagic(ws: Workspace): string {
  const { magicPrefix, magicSuffix, properties } = ws;

  if (magicPrefix === undefined || magicSuffix === undefined) {
    return '<h1 class="error">magicprefix.txt and/or magicsuffix.txt not found</h1>';
  }

  if (properties === undefined) {
    return '<h1 class="error">properties.txt not found</h1>';
  }

  const documented: DocumentedMagicAffix[] = [];
  return "";
}

type DocumentedArmor = {};

export function DocArmor(ws: Workspace): string {
  const { armor } = ws;

  if (armor === undefined) {
    return '<h1 class="error">armor.txt not found</h1>';
  }

  const documented: DocumentedArmor[] = [];
  return "";
}

type DocumentedWeapon = {};

export function DocWeapons(ws: Workspace): string {
  const { weapons } = ws;

  if (weapons === undefined) {
    return '<h1 class="error">weapons.txt not found</h1>';
  }

  const documented: DocumentedWeapon[] = [];
  return "";
}

type DocumentedMiscItem = {};

export function DocMisc(ws: Workspace): string {
  const { misc } = ws;

  if (misc === undefined) {
    return '<h1 class="error">misc.txt not found</h1>';
  }

  const documented: DocumentedMiscItem[] = [];
  return "";
}

type DocumentedGem = {};

export function DocGems(ws: Workspace): string {
  const { gems, misc, properties } = ws;

  if (gems === undefined || misc === undefined) {
    return '<h1 class="error">gems.txt and/or misc.txt not found</h1>';
  }

  if (properties === undefined) {
    return '<h1 class="error">properties.txt not found</h1>';
  }

  const documented: DocumentedGem[] = [];
  return "";
}

type DocumentedRuneword = {};

export function DocRunewords(ws: Workspace): string {
  const { runes, misc, properties } = ws;

  if (runes === undefined || misc === undefined) {
    return '<h1 class="error">runes.txt and/or misc.txt not found</h1>';
  }

  if (properties === undefined) {
    return '<h1 class="error">properties.txt not found</h1>';
  }

  const documented: DocumentedRuneword[] = [];
  return "";
}
