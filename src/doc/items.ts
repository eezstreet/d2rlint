import {
  D2RExcelRecord,
  D2RItemStatCost,
  D2RProperties,
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
  StringForIndexFormatted,
} from "./lib.ts";

// A property list is a list of item properties
export type PropertyList = {
  stat: D2RProperties | undefined;
  param: string;
  min: number;
  max: number;
}[];

// An item stat list is a list of item stats
export type ItemStatList = {
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
export function PropertyListToItemStatList(
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
export function PropertyListToDescString(
  list: PropertyList,
  ws: Workspace,
): string[] {
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
          return StringForIndexFormatted(ws, "ModStre9t", replacement);
        }
        return StringForIndexFormatted(ws, "ModStre9u", 1, replacement);
      }
      case 12: // basic
        if (min < 0 && max < 0) {
          return StringForIndexFormatted(ws, strneg);
        }
        return StringForIndexFormatted(ws, strpos);
      case 13: // + to character class skills
        return GetClassSkillString(ws, propval).replace(/%\+?d/, val);
      case 14: // skill tab. complex logic aplenty
        return SkillTabName(ws, Number.parseInt(param)).replace(
          /%\+?d/,
          val,
        );
      case 15: // CtC.
        return StringForIndexFormatted(ws, strpos, min, max).replace(
          /%s/,
          SkillName(ws, param),
        );
      case 17: // increases by time
      case 18: // not used in vanilla game because it's bugged
        if (min < 0 && max < 0) {
          return GetItemDaylightFormatter(ws, Number.parseInt(param))
            .replace(
              /%s/,
              StringForIndexFormatted(ws, strneg, val),
            );
        }
        return GetItemDaylightFormatter(ws, Number.parseInt(param))
          .replace(
            /%s/,
            StringForIndexFormatted(ws, strpos, val),
          );
      case 5: // functionally identical
      case 19: // basic
        if (min < 0 && max < 0) {
          return `${StringForIndexFormatted(ws, strneg, val)} ${
            descstr2 !== "" ? StringForIndexFormatted(ws, descstr2) : ""
          }`;
        }
        return `${StringForIndexFormatted(ws, strpos, val)} ${
          descstr2 !== "" ? StringForIndexFormatted(ws, descstr2) : ""
        }`;
      case 22: // attack/damage vs arbitrary monster type, unused in vanilla
        if (min < 0 && max < 0) {
          return `${StringForIndexFormatted(ws, strneg, val)} ${
            MonsterTypeName(ws, param)
          }`;
        }
        return `${StringForIndexFormatted(ws, strpos, val)} ${
          MonsterTypeName(ws, param)
        }`;
      case 23: // reanimate as, %0 = val, %1 = param (monstats idx)
        if (min < 0 && max < 0) {
          return StringForIndexFormatted(
            ws,
            strneg,
            val,
            MonsterNameIdx(ws, Number.parseInt(param)),
          );
        }
        return StringForIndexFormatted(
          ws,
          strpos,
          val,
          MonsterNameIdx(ws, Number.parseInt(param)),
        );
      case 24: // charges
        return StringForIndex(ws, strpos).replace(
          /%[1s]/,
          SkillName(ws, param),
        ).replace(/%\+?[0d]/, `${max}`).replace(
          /%\+?[2d]\/%\+?[3d]/g,
          `${min}`,
        );
      case 27: // single tab skill
        if (min < 0 && max < 0) {
          return StringForIndexFormatted(ws, strneg, val)
            .replace(/%s/, SkillName(ws, param)).replace(
              /%s/,
              SkillClassOnly(ws, param),
            );
        }
        return StringForIndexFormatted(ws, strpos, val)
          .replace(/%s/, SkillName(ws, param)).replace(
            /%s/,
            SkillClassOnly(ws, param),
          );
      case 16: // aura (functionally identical)
      case 28: // oskill
        if (min < 0 && max < 0) {
          return StringForIndexFormatted(ws, strneg, val)
            .replace(/%s/g, SkillName(ws, param));
        }
        return StringForIndexFormatted(ws, strpos, val)
          .replace(/%s/g, SkillName(ws, param));
      default: // default case not handled
        if (statName === "maxdurability") {
          return StringForIndex(ws, "improved durability"); // hacky.
        }
        if (statName === "item_numsockets") {
          const sockStr = Number.isNaN(min) || Number.isNaN(max)
            ? param
            : min !== max
            ? `${min}-${max}`
            : `${min}`;
          return StringForIndexFormatted(ws, "Socketable", sockStr);
        }
        if (statName === "item_extrablood") {
          // Swordback Hold and Gorefoot have a hidden property that makes enemies 'Extra Bloody' that isn't documented properly ingame.
          // Probably it means that Open Wounds with this item has extra blood. No idea.
          // If we don't handle this special case though, we get a gross mess.
          return StringForIndex(ws, "ModStr5p");
        }
        if (statName === "item_levelreq") {
          // Special case, we can add level requirements to the item
          return StringForIndex(ws, "ItemStats1p").replace(/%d/, `+${val}`);
        }
        if (
          statName === "coldlength" || statName === "poisonlength" ||
          statName === "state" || statName === "fade"
        ) {
          return ""; // hacky.
        }
        return `author needs to handle case ${descfunc} for ${statName}`;
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
        line: StringForIndexFormatted(ws, "strModEnhancedDamage", valStr),
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
        line: StringForIndexFormatted(ws, "strethereal"),
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
        ? StringForIndexFormatted(ws, strSame, minStr, len)
        : StringForIndexFormatted(ws, str, minStr, maxStr, len);

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
export function MergePropertyLists(...args: PropertyList[]): PropertyList {
  return args.reduce((list, item) => list.concat(item), []);
}

/**
 * Given a record, props, and properties.txt, constructs a PropertyList
 * @param properties - the properties.txt
 * @param record - the record
 * @param props - the properties to create into a PropertyList
 */
export function MakePropertyList<
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
