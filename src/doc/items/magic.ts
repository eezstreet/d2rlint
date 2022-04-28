import { D2RMagicBase, Workspace } from "../../lib/workspace.ts";
import {
  MakePropertyList,
  PropertyList,
  PropertyListToDescString,
} from "../items.ts";
import { GetItemTypeNames, GetItemTypes, StringForIndex } from "../lib.ts";

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

  const affixName = StringForIndex(ws, affix.name as string);
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
      lvltxt = StringForIndex(ws, "strChatLevel").replace(
        /%\+?d/,
        affix.level as string,
      );
      lvltxt = `<span class="required-level">${lvltxt}</span>`;
    }
  }

  if (affix.levelreq !== "") {
    const lvl = Number.parseInt(affix.levelreq as string);
    if (!Number.isNaN(lvl)) {
      reqlvltxt = StringForIndex(ws, "ItemStats1p").replace(
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
