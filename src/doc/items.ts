import {
  D2RArmor,
  D2RExcelRecord,
  D2RGems,
  D2RItemStatCost,
  D2RItemTypes,
  D2RMagicBase,
  D2RMisc,
  D2RProperties,
  D2RRunes,
  D2RUniqueItems,
  D2RWeapons,
  Workspace,
} from "../lib/workspace.ts";
import {
  GetClassSkillString,
  GetItemDaylightFormatter,
  GetItemsWithCode,
  GetItemsWithTypes,
  GetItemTypeNames,
  GetItemTypes,
  GetMaxExperienceLevel,
  GetMaxRequiredLevelOfItems,
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
  const uncombined: ItemStatList = [];
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

      uncombined.push({
        stat: iscEntry,
        min: iscMin,
        max: iscMax,
        param,
        func: funcAsNum,
        val: Number.parseInt(val as string),
      });
    });
  });

  // combine any stats that share the same stat and param
  const result: ItemStatList = [];
  uncombined.forEach((property) => {
    // if there's already a combined result here, just stop.
    const same = uncombined.filter((uc) => {
      if (
        property.stat === undefined && uc.stat === undefined &&
        property.func === uc.func
      ) {
        return true;
      }
      if (property.stat === undefined || uc.stat === undefined) {
        return false;
      }
      if (property.param !== uc.param) {
        return false;
      }
      if (property.stat === "ethereal" || uc.stat === "ethereal") {
        return uc.stat === property.stat;
      }
      return property.stat.stat === uc.stat.stat;
    });

    if (same.length === 1) {
      // only one stat in this list, and it's probably ourselves.
      result.push(same[0]);
      return;
    }

    if (property.stat === "ethereal") {
      // don't push if the result already contains an ethereal stat
      if (result.find((r) => r.stat === "ethereal") === undefined) {
        result.push(property);
      }
      return;
    }

    // if stat.encode is not '', NEVER combine
    if (property.stat !== undefined && property.stat.encode !== "") {
      result.push(property);
      return;
    }

    // if result already contains this stat, don't push the result
    if (
      result.find((r) =>
        r.stat !== undefined && r.stat !== "ethereal" &&
        r.stat === property.stat
      )
    ) {
      return;
    }

    // combine same stats by adding min and max together
    result.push(same.reduce((v, current) => {
      const { min, max, ...rest } = v;
      return {
        min: min + current.min,
        max: max + current.max,
        ...rest,
      };
    }, {
      min: 0,
      max: 0,
      param: property.param,
      stat: property.stat,
      func: property.func,
      val: property.val,
    }));
  });

  return result;
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
    statName: string,
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
          return `${StringForIndex(ws, strneg, "enUS").replace(/%\+?d/, val)} ${
            descstr2 !== "" ? StringForIndex(ws, descstr2, "enUS") : ""
          }`;
        }
        return `${StringForIndex(ws, strpos, "enUS").replace(/%\+?d/, val)} ${
          descstr2 !== "" ? StringForIndex(ws, descstr2, "enUS") : ""
        }`;
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
        if (statName === "maxdurability") {
          return StringForIndex(ws, "improved durability", "enUS"); // hacky.
        }
        if (statName === "item_numsockets") {
          const sockStr = Number.isNaN(min) || Number.isNaN(max)
            ? param
            : min !== max
            ? `${min}-${max}`
            : `${min}`;
          return StringForIndex(ws, "Socketable", "enUS").replace(
            /%i/,
            sockStr,
          );
        }
        if (statName === "item_extrablood") {
          // Swordback Hold and Gorefoot have a hidden property that makes enemies 'Extra Bloody' that isn't documented properly ingame.
          // Probably it means that Open Wounds with this item has extra blood. No idea.
          // If we don't handle this special case though, we get a gross mess.
          return StringForIndex(ws, "ModStr5p", "enUS");
        }
        if (statName === "coldlength" || statName === "poisonlength") {
          return ""; // hacky.
        }
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
              stat.stat as string,
              Number.parseInt(stat.dgrpfunc as string),
              min,
              max,
              param,
              stat.dgrpstrpos as string,
              stat.dgrpstrneg as string,
              func,
              stat.dgrpstr2 as string,
              val,
            ),
            group,
            priority,
          });
          return;
        }
      }
    }

    const mergeRange = (
      stat1: string,
      stat2: string,
      group: number,
      str: string,
      strSame: string,
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
        } else if (foundLen.param === param && param !== "") {
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

      const line = minStr === maxStr
        ? StringForIndex(ws, strSame, "enUS").replace(/%\+?d/, minStr).replace(
          /%\+?d/,
          `${len}`,
        )
        : StringForIndex(ws, str, "enUS").replace(/%\+?d/, minStr).replace(
          /%\+?d/,
          maxStr,
        ).replace(/%\+?d/, `${len}`);

      statLines.push({
        line,
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
      mergeRange(
        "firemindam",
        "firemaxdam",
        -100,
        "strModFireDamageRange",
        "strModFireDamage",
      ) ||
      mergeRange(
        "lightmindam",
        "lightmaxdam",
        -101,
        "strModLightningDamageRange",
        "strModLightningDamage",
      ) ||
      mergeRange(
        "magicmindam",
        "magicmaxdam",
        -102,
        "strModMagicDamageRange",
        "strModMagicDamage",
      ) ||
      mergeRange(
        "coldmindam",
        "coldmaxdam",
        -103,
        "strModColdDamageRange",
        "strModColdDamage",
      ) ||
      mergeRange(
        "poisonmindam",
        "poisonmaxdam",
        -104,
        "strModPoisonDamageRange",
        "strModPoisonDamage",
        "poisonlength",
      ) ||
      mergeRange(
        "mindamage",
        "maxdamage",
        -105,
        "strModMinDamageRange",
        "strModMinDamage",
      )
    ) {
      return;
    }

    // nothing has told us that we should stop. so we should add a stat line here
    statLines.push({
      line: makeStatStr(
        stat.stat as string,
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
  return statLines.filter((sl) => sl.line !== "").sort((a, b) =>
    b.priority - a.priority
  ).map((sl) => sl.line);
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
        <span class="item-type">${uniqueItem}</span>
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

type DocumentedSetItem = {
  base: D2RArmor | D2RWeapons | D2RMisc | undefined;
};

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

type DocumentedMagicAffix = {
  affix: D2RMagicBase;
  mods: PropertyList;
};

function DocumentMagicAffix(doc: DocumentedMagicAffix, ws: Workspace): string {
  const { affix, mods } = doc;

  const include: (keyof D2RMagicBase)[] = [
    "itype1",
    "itype2",
    "itype3",
    "itype4",
    "itype5",
    "itype6",
    "itype7",
  ];
  const exclude: (keyof D2RMagicBase)[] = [
    "etype1",
    "etype2",
    "etype3",
    "etype4",
    "etype5",
  ];

  const affixName = StringForIndex(ws, affix.name as string, "enUS");
  const includedItemTypes = GetItemTypes(
    ws,
    ...(include.map((i) => affix[i] as string)),
  );
  const excludedItemTypes = GetItemTypes(
    ws,
    ...(exclude.map((i) => affix[i] as string)),
  );
  const includedStr = GetItemTypeNames(includedItemTypes);
  const excludedStr = GetItemTypeNames(excludedItemTypes);
  let lvltxt = "";
  let reqlvltxt = "";

  if (affix.level !== "") {
    const lvl = Number.parseInt(affix.level as string);
    if (!Number.isNaN(lvl)) {
      lvltxt = StringForIndex(ws, "strChatLevel", "enUS").replace(
        /%\+?d/,
        affix.level as string,
      );
      lvltxt = `<span class="required-level">${lvltxt}</span>`;
    }
  }

  if (affix.levelreq !== "") {
    const lvl = Number.parseInt(affix.levelreq as string);
    if (!Number.isNaN(lvl)) {
      reqlvltxt = StringForIndex(ws, "ItemStats1p", "enUS").replace(
        /%\+?d/,
        affix.levelreq as string,
      );
      reqlvltxt = `<span class="required-level">${reqlvltxt}</span>`;
    }
  }

  const descStrings = PropertyListToDescString(mods, ws).map((v) =>
    `<span class="stat">${v.replace(/%%/, "%")}</span>`
  );

  const excludedSpan = excludedItemTypes.length > 0
    ? `<span class="ex-types">NOT ${excludedStr}</span>`
    : "";
  const includedSpan = `<span class="affix-types">${includedStr}</span>`;

  return `
    <div class="magic-affix">
      <span class="affix-name">${affixName}</span>
      ${includedSpan}
      ${excludedSpan}
      ${lvltxt}
      ${reqlvltxt}
      ${descStrings.join("\r\n        ")}
    </div>
  `;
}

export function DocMagic(ws: Workspace): string {
  const { magicPrefix, magicSuffix, properties } = ws;

  if (magicPrefix === undefined || magicSuffix === undefined) {
    return '<h1 class="error">magicprefix.txt and/or magicsuffix.txt not found</h1>';
  }

  if (properties === undefined) {
    return '<h1 class="error">properties.txt not found</h1>';
  }

  const documentedPrefixes: DocumentedMagicAffix[] = [];
  const documentedSuffixes: DocumentedMagicAffix[] = [];

  const props: [
    keyof D2RMagicBase,
    keyof D2RMagicBase,
    keyof D2RMagicBase,
    keyof D2RMagicBase,
  ][] = [
    ["mod1code", "mod1param", "mod1min", "mod1max"],
    ["mod2code", "mod2param", "mod2min", "mod2max"],
    ["mod3code", "mod3param", "mod3min", "mod3max"],
  ];

  magicPrefix.forEach((affix) => {
    if (
      affix.name === "" || affix.spawnable !== "1" ||
      (affix.mod1code === "" && affix.mod2code === "" && affix.mod3code === "")
    ) {
      return;
    }
    documentedPrefixes.push({
      affix,
      mods: MakePropertyList(properties, affix, props),
    });
  });

  magicSuffix.forEach((affix) => {
    if (
      affix.name === "" || affix.spawnable !== "1" ||
      (affix.mod1code === "" && affix.mod2code === "" && affix.mod3code === "")
    ) {
      return;
    }
    documentedSuffixes.push({
      affix,
      mods: MakePropertyList(properties, affix, props),
    });
  });

  return `
    <h1>Magic Prefixes</h1>
    ${documentedPrefixes.map((doc) => DocumentMagicAffix(doc, ws)).join("\r\n")}
    <h1>Magic Suffixes</h1>
    ${documentedSuffixes.map((doc) => DocumentMagicAffix(doc, ws)).join("\r\n")}
  `;
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

type DocumentedGem = {
  helmMods: PropertyList;
  weaponMods: PropertyList;
  shieldMods: PropertyList;
  gem: D2RGems;
};

const gemWeaponProps: [
  keyof D2RGems,
  keyof D2RGems,
  keyof D2RGems,
  keyof D2RGems,
][] = [
  ["weaponmod1code", "weaponmod1param", "weaponmod1min", "weaponmod1max"],
  ["weaponmod2code", "weaponmod2param", "weaponmod2min", "weaponmod2max"],
  ["weaponmod3code", "weaponmod3param", "weaponmod3min", "weaponmod3max"],
];

const gemHelmProps: [
  keyof D2RGems,
  keyof D2RGems,
  keyof D2RGems,
  keyof D2RGems,
][] = [
  ["helmmod1code", "helmmod1param", "helmmod1min", "helmmod1max"],
  ["helmmod2code", "helmmod2param", "helmmod2min", "helmmod2max"],
  ["helmmod3code", "helmmod3param", "helmmod3min", "helmmod3max"],
];

const gemShieldProps: [
  keyof D2RGems,
  keyof D2RGems,
  keyof D2RGems,
  keyof D2RGems,
][] = [
  ["shieldmod1code", "shieldmod1param", "shieldmod1min", "shieldmod1max"],
  ["shieldmod2code", "shieldmod2param", "shieldmod2min", "shieldmod2max"],
  ["shieldmod3code", "shieldmod3param", "shieldmod3min", "shieldmod3max"],
];

const gemApplyTypeStrLookup: string[] = [
  "GemXp3",
  "GemXp4",
  "GemXp2",
  "GemXp1",
];

const gemProps = [gemWeaponProps, gemHelmProps, gemShieldProps];

function DocumentGem(theGem: DocumentedGem, ws: Workspace): string {
  const { gem, helmMods, weaponMods, shieldMods } = theGem;
  const { armor, misc, weapons } = ws;

  if (armor === undefined || misc === undefined || weapons === undefined) {
    return "";
  }

  const item = [...armor, ...misc, ...weapons].find((it) =>
    it.code === gem.code
  );
  if (item === undefined) {
    return "";
  }

  const gemName = StringForIndex(ws, item.namestr as string, "enUS");
  const requiredLevel = Number.parseInt(item.levelreq as string);

  let reqlvltxt = "";
  if (!Number.isNaN(requiredLevel) && requiredLevel > 1) {
    reqlvltxt = StringForIndex(ws, "ItemStats1p", "enUS").replace(
      /%\+?d/,
      `${requiredLevel}`,
    );
    reqlvltxt = `<span class="required-level">${reqlvltxt}</span>`;
  }

  const mods = [weaponMods, helmMods, shieldMods, helmMods];
  const subsections = mods.map((gm, i) => {
    const header = `<span class="gem-type-header">${
      StringForIndex(ws, gemApplyTypeStrLookup[i], "enUS")
    }</span>`;
    const mods = PropertyListToDescString(gm, ws).map((v) =>
      `<span class="stat">${v.replace(/%%/, "%")}</span>`
    ).join(", ");

    return `<div class="gem-statlist">
        ${header}
        ${mods}
        </div>`;
  });

  return `
      <div class="gem">
        <span class="gem-name">${gemName}</span>
        ${reqlvltxt}
        ${subsections.join("\r\n")}
      </div>
  `;
}

export function DocGems(ws: Workspace): string {
  const { gems, misc, properties } = ws;

  if (gems === undefined || misc === undefined) {
    return '<h1 class="error">gems.txt and/or misc.txt not found</h1>';
  }

  if (properties === undefined) {
    return '<h1 class="error">properties.txt not found</h1>';
  }

  const documented: DocumentedGem[] = [];
  gems.forEach((gem) => {
    if (gem.code === "") {
      return;
    }

    documented.push({
      gem,
      weaponMods: MakePropertyList(properties, gem, gemWeaponProps),
      helmMods: MakePropertyList(properties, gem, gemHelmProps),
      shieldMods: MakePropertyList(properties, gem, gemShieldProps),
    });
  });

  return documented.map((doc) => DocumentGem(doc, ws)).join("\r\n");
}

type DocumentedRuneword = {
  wordMods: PropertyList;
  letters: string[];
  gemMods: {
    gemApplyType: number;
    mods: PropertyList;
  }[];
  runes: D2RRunes;
  includedItemTypes: D2RItemTypes[];
  excludedItemTypes: D2RItemTypes[];
};

function DocumentRuneword(runeword: DocumentedRuneword, ws: Workspace): string {
  const {
    wordMods,
    gemMods,
    runes,
    includedItemTypes,
    excludedItemTypes,
    letters,
  } = runeword;

  const rwName = StringForIndex(ws, runes.name as string, "enUS");
  const includedTypes = GetItemTypeNames(includedItemTypes);
  const excludedTypes = GetItemTypeNames(excludedItemTypes);

  const runeFields: (keyof D2RRunes)[] = [
    "rune1",
    "rune2",
    "rune3",
    "rune4",
    "rune5",
    "rune6",
  ];

  const runeItems = GetItemsWithCode(
    ws,
    ...runeFields.map((rf) => runes[rf] as string),
  );
  const requiredLevel = GetMaxRequiredLevelOfItems(runeItems);

  const subsections = gemMods.map((gm) => {
    const header = gemMods.length > 1
      ? `<span class="rw-type-header">${
        StringForIndex(ws, gemApplyTypeStrLookup[gm.gemApplyType], "enUS")
      }</span>`
      : "";
    const mods = PropertyListToDescString([...wordMods, ...gm.mods], ws).map((
      v,
    ) => `
          <span class="stat">${v.replace(/%%/, "%")}</span>`).join("");

    return `<div class="rw-stat-list">
        ${header}
        ${mods}
        </div>`;
  }).join("\r\n");

  const formula = letters.map((l) => StringForIndex(ws, l, "enUS")).join(" + ");
  const excludedSpan = excludedItemTypes.length > 0
    ? `<span class="ex-types">NOT ${excludedTypes}</span>`
    : "";

  let reqlvltxt = StringForIndex(ws, "ItemStats1p", "enUS").replace(
    /%\+?d/,
    `${requiredLevel}`,
  );
  reqlvltxt = `<span class="required-level">${reqlvltxt}</span>`;

  return `
      <div class="runeword">
        <span class="runeword-name">${rwName}</span>
        <span class="runeword-formula">${formula}</span>
        <span class="runeword-types">${includedTypes}</span>
        ${excludedSpan}
        ${reqlvltxt}
        ${subsections}
      </div>
  `;
}

export function DocRunewords(ws: Workspace): string {
  const { runes, misc, gems, properties } = ws;

  if (runes === undefined || misc === undefined) {
    return '<h1 class="error">runes.txt and/or misc.txt not found</h1>';
  }

  if (properties === undefined) {
    return '<h1 class="error">properties.txt not found</h1>';
  }

  if (gems === undefined) {
    return '<h1 class="error">gems.txt not found</h1>';
  }

  const documented: DocumentedRuneword[] = [];
  const rwProps: [
    keyof D2RRunes,
    keyof D2RRunes,
    keyof D2RRunes,
    keyof D2RRunes,
  ][] = [
    ["t1code1", "t1param1", "t1min1", "t1max1"],
    ["t1code2", "t1param2", "t1min2", "t1max2"],
    ["t1code3", "t1param3", "t1min3", "t1max3"],
    ["t1code4", "t1param4", "t1min4", "t1max4"],
    ["t1code5", "t1param5", "t1min5", "t1max5"],
    ["t1code6", "t1param6", "t1min6", "t1max6"],
    ["t1code7", "t1param7", "t1min7", "t1max7"],
  ];

  const rwInclude: (keyof D2RRunes)[] = [
    "itype1",
    "itype2",
    "itype3",
    "itype4",
    "itype5",
    "itype6",
  ];
  const rwExclude: (keyof D2RRunes)[] = ["etype1", "etype2", "etype3"];

  const runeFields: (keyof D2RRunes)[] = [
    "rune1",
    "rune2",
    "rune3",
    "rune4",
    "rune5",
    "rune6",
  ];

  runes.forEach((rw) => {
    if (rw.complete !== "1") {
      return; // skip any incomplete runewords
    }

    const wordMods = MakePropertyList(properties, rw, rwProps);
    const gemItems = runeFields.filter((rf) => rw[rf] !== "").map((rf) =>
      misc.find((m) => m.code === rw[rf])
    ).filter((m) => m !== undefined).map((m) =>
      gems.find((g) => g.code === m?.code)
    ).filter((g) => g !== undefined) as D2RGems[];

    // So there's a bit of complexity here.
    // We must first find all items that the runeword can modify.
    const includedItemTypes = GetItemTypes(
      ws,
      ...(rwInclude.map((ri) => rw[ri]) as string[]),
    );
    const excludedItemTypes = GetItemTypes(
      ws,
      ...(rwExclude.map((re) => rw[re]) as string[]),
    );

    const gemmableItems = GetItemsWithTypes(
      ws,
      includedItemTypes,
      excludedItemTypes,
    );

    // Next, we need to get all of the GemApplyTypes that are covered by this runeword
    const gemApplyTypes = gemmableItems.map((gi) => gi.gemapplytype).filter((
      v,
      i,
      a,
    ) => a.indexOf(v) === i).map((gat) => Number.parseInt(gat as string));

    const gemMods = gemApplyTypes.map((gemApplyType) => {
      return {
        gemApplyType,
        mods: gemItems.flatMap((gi) =>
          MakePropertyList(properties, gi, gemProps[gemApplyType])
        ),
      };
    });

    documented.push({
      wordMods,
      gemMods,
      letters: gemItems.map((gi) => gi.letter as string),
      runes: rw,
      includedItemTypes,
      excludedItemTypes,
    });
  });

  return documented.map((doc) => DocumentRuneword(doc, ws)).join("\r\n");
}
