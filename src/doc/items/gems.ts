import { D2RGems, Workspace } from "../../lib/workspace.ts";
import {
  MakePropertyList,
  PropertyList,
  PropertyListToDescString,
} from "../items.ts";
import { StringForIndex } from "../lib.ts";

type DocumentedGem = {
  helmMods: PropertyList;
  weaponMods: PropertyList;
  shieldMods: PropertyList;
  gem: D2RGems;
};

export const gemWeaponProps: [
  keyof D2RGems,
  keyof D2RGems,
  keyof D2RGems,
  keyof D2RGems,
][] = [
  ["weaponmod1code", "weaponmod1param", "weaponmod1min", "weaponmod1max"],
  ["weaponmod2code", "weaponmod2param", "weaponmod2min", "weaponmod2max"],
  ["weaponmod3code", "weaponmod3param", "weaponmod3min", "weaponmod3max"],
];

export const gemHelmProps: [
  keyof D2RGems,
  keyof D2RGems,
  keyof D2RGems,
  keyof D2RGems,
][] = [
  ["helmmod1code", "helmmod1param", "helmmod1min", "helmmod1max"],
  ["helmmod2code", "helmmod2param", "helmmod2min", "helmmod2max"],
  ["helmmod3code", "helmmod3param", "helmmod3min", "helmmod3max"],
];

export const gemShieldProps: [
  keyof D2RGems,
  keyof D2RGems,
  keyof D2RGems,
  keyof D2RGems,
][] = [
  ["shieldmod1code", "shieldmod1param", "shieldmod1min", "shieldmod1max"],
  ["shieldmod2code", "shieldmod2param", "shieldmod2min", "shieldmod2max"],
  ["shieldmod3code", "shieldmod3param", "shieldmod3min", "shieldmod3max"],
];

export const gemApplyTypeStrLookup: string[] = [
  "GemXp3",
  "GemXp4",
  "GemXp2",
  "GemXp1",
];

export const gemProps = [gemWeaponProps, gemHelmProps, gemShieldProps];

function DocumentGem(theGem: DocumentedGem, ws: Workspace): string {
  const { gem, helmMods, weaponMods, shieldMods } = theGem;
  const { armor, misc, weapons } = ws;

  if (armor === undefined || misc === undefined || weapons === undefined) {
    return "";
  }

  const item = [...armor, ...misc, ...weapons].find((it) =>
    it.code === gem.code
  );
  if (item === undefined || item.skipInDocs === true) {
    return "";
  }

  const gemName = StringForIndex(ws, item.namestr as string);
  const requiredLevel = Number.parseInt(item.levelreq as string);

  let reqlvltxt = "";
  if (!Number.isNaN(requiredLevel) && requiredLevel > 1) {
    reqlvltxt = StringForIndex(ws, "ItemStats1p").replace(
      /%\+?d/,
      `${requiredLevel}`,
    );
    reqlvltxt = `<span class="required-level">${reqlvltxt}</span>`;
  }

  const mods = [weaponMods, helmMods, shieldMods, helmMods];
  const subsections = mods.map((gm, i) => {
    const header = `<span class="gem-type-header">${
      StringForIndex(ws, gemApplyTypeStrLookup[i])
    }</span>`;
    const mods = PropertyListToDescString(gm, ws).map((v) =>
      `<span class="stat">${v}</span>`
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
    if (gem.code === "" || gem.skipInDocs === true) {
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
