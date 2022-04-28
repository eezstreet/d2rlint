import {
  D2RGems,
  D2RItemTypes,
  D2RRunes,
  Workspace,
} from "../../lib/workspace.ts";
import {
  MakePropertyList,
  PropertyList,
  PropertyListToDescString,
} from "../items.ts";
import {
  GetItemsWithCode,
  GetItemsWithTypes,
  GetItemTypeNames,
  GetItemTypes,
  GetMaxRequiredLevelOfItems,
  StringForIndex,
} from "../lib.ts";
import { gemApplyTypeStrLookup, gemProps } from "./gems.ts";

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

  const rwName = StringForIndex(ws, runes.name as string);
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
        StringForIndex(ws, gemApplyTypeStrLookup[gm.gemApplyType])
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

  const formula = letters.map((l) => StringForIndex(ws, l)).join(" + ");
  const excludedSpan = excludedItemTypes.length > 0
    ? `<span class="ex-types">NOT ${excludedTypes}</span>`
    : "";

  let reqlvltxt = StringForIndex(ws, "ItemStats1p").replace(
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
