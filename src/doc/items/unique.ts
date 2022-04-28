import {
  D2RArmor,
  D2RMisc,
  D2RUniqueItems,
  D2RWeapons,
  Workspace,
} from "../../lib/workspace.ts";
import {
  MakePropertyList,
  PropertyList,
  PropertyListToDescString,
} from "../items.ts";
import { StringForIndex } from "../lib.ts";

type DocumentedUniqueItem = {
  unique: D2RUniqueItems;
  base: D2RArmor | D2RWeapons | D2RMisc | undefined;
  baseType: "armor" | "weapons" | "misc";
  mods: PropertyList;
};

/**
 * Given a unique item, emits the HTML for it.
 * @param item - the item that we are emitting
 * @param ws - the workspace we are working with
 */
function DocumentUniqueItem(item: DocumentedUniqueItem, ws: Workspace): string {
  const { base, mods, unique, baseType } = item;

  const descStrings = PropertyListToDescString(mods, ws).map((v) =>
    `<span class="stat">${v}</span>`
  );
  const uniqueName = StringForIndex(ws, unique.index as string);
  const uniqueItem = base === undefined
    ? `<${unique.code}>`
    : StringForIndex(ws, base.namestr as string);
  let lvltxt = "";
  let reqlvltxt = "";

  if (unique.lvl !== "") {
    const lvl = Number.parseInt(unique.lvl as string);
    if (!Number.isNaN(lvl)) {
      lvltxt = StringForIndex(ws, "strChatLevel").replace(
        /%\+?d/,
        unique.lvl as string,
      );
      lvltxt = `<span class="required-level">${lvltxt}</span>`;
    }
  }
  if (unique["lvl req"] !== "") {
    const lvlreq = Number.parseInt(unique["lvl req"] as string);
    if (!Number.isNaN(lvlreq)) {
      reqlvltxt = StringForIndex(ws, "ItemStats1p").replace(
        /%\+?d/,
        unique["lvl req"] as string,
      );
      reqlvltxt = `<span class="required-level">${reqlvltxt}</span>`;
    }
  }

  if (base === undefined) {
    return "";
  }

  return `
      <div class="unique-item">
        <span class="unique-name">${uniqueName}</span>
        <span class="item-type"><a href="${baseType}.html#${base.code}">${uniqueItem}</a></span>
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
    let base = weapons.find((item) => item.code === unique.code);
    let baseType: "weapons" | "armor" | "misc" = "weapons";
    if (base === undefined) {
      base = armor.find((item) => item.code === unique.code);
      baseType = "armor";
      if (base === undefined) {
        base = misc.find((item) => item.code === unique.code);
        baseType = "misc";
        if (base === undefined) {
          return;
        }
      }
    }

    documented.push({ unique, base, mods, baseType });
  });

  // TODO: group the items together somehow?

  return documented.map((doc) => DocumentUniqueItem(doc, ws)).join("\r\n");
}
