import {
  D2RAutomagic,
  D2RItemExcelRecord,
  D2RProperties,
  Workspace,
} from "../../lib/workspace.ts";
import {
  MakePropertyList,
  MergePropertyLists,
  PropertyList,
  PropertyListToDescString,
} from "../items.ts";
import {
  GetStaffMods,
  IsKickDamageType,
  IsSmiteDamageType,
  ItemIsOfType,
  StringForIndex,
  StringForIndexFormatted,
} from "../lib.ts";

type DocumentedItem = {
  automagic: PropertyList;
  item: D2RItemExcelRecord;
  tmog: D2RItemExcelRecord | undefined;
};

function CreateDocumentedItems(
  ws: Workspace,
  items: D2RItemExcelRecord[],
): DocumentedItem[] {
  const documented: DocumentedItem[] = [];

  const { armor, weapons, misc, properties, autoMagic, itemStatCost, gems } =
    ws;
  if (
    armor === undefined || weapons === undefined || misc === undefined ||
    properties === undefined || autoMagic === undefined ||
    itemStatCost === undefined || gems === undefined
  ) {
    return [];
  }

  const allItems = [...weapons, ...armor, ...misc];
  const autoMagicProps: [
    keyof D2RAutomagic,
    keyof D2RAutomagic,
    keyof D2RAutomagic,
    keyof D2RAutomagic,
  ][] = [
    ["mod1code", "mod1param", "mod1min", "mod1max"],
    ["mod2code", "mod2param", "mod2min", "mod2max"],
    ["mod3code", "mod3param", "mod3min", "mod3max"],
  ];

  items.forEach((item) => {
    if (item.code === "" || item.code === "xxx" || item.skipInDocs === true) {
      return; // skip this item?
    }

    if (gems.find((gem) => gem.code === item.code)) {
      return; // skip, already covered by gems
    }

    let tmog: D2RItemExcelRecord | undefined = undefined;
    if (item.transmogrify === "1" && item.tmogtype !== "xxx") {
      tmog = allItems.find((it) => it.code === item.tmogtype);
    }

    let candidateAutomagic: PropertyList = [];

    const staffMods = GetStaffMods(ws, item);
    if (staffMods !== "") {
      candidateAutomagic.push({
        stat: properties.find((p) => p.code === staffMods),
        param: "__staff__",
        min: 0,
        max: 5,
      });
    }

    if (item["auto prefix"] !== "") {
      // get all automagic rows that match the auto prefix, make a propertylist out of them and merge
      const matching = autoMagic.filter((am) =>
        am.group === item["auto prefix"] &&
        am.skipInDocs !== true
      );
      const propLists = matching.map((m) =>
        MakePropertyList(properties, m, autoMagicProps)
      );
      candidateAutomagic = candidateAutomagic.concat(
        MergePropertyLists(...propLists),
      );
    }

    // Blunt items get a hardcoded +50% damage towards undead
    if (ItemIsOfType(ws, item, "blun")) {
      candidateAutomagic.push({
        stat: properties.find((p) => p.code === "dmg-undead"),
        param: "",
        min: 50,
        max: 50,
      });
    }

    // automagic - range needs to be fixed
    const automagic: PropertyList = [];
    candidateAutomagic.forEach((am) => {
      const { stat, param, min, max } = am;

      if (automagic.length === 0) {
        automagic.push(am); // first item always goes in
        return;
      }

      if (stat === undefined) {
        return; // bad stat?
      }

      const foundAm = properties.find((prop) => prop.code === stat.code);
      if (foundAm === undefined) {
        return;
      }

      // if ANY of the stats that are part of the prop are encoded, just bail
      const statKeys: (keyof D2RProperties)[] = [
        "stat1",
        "stat2",
        "stat3",
        "stat4",
        "stat5",
        "stat6",
        "stat7",
      ];
      if (
        statKeys.some((sk) => {
          const isc = itemStatCost.find((i) => i.stat === foundAm[sk]);
          if (isc === undefined || isc.encode === "") {
            return false;
          }
          return true;
        })
      ) {
        // no questions asked, just push it
        automagic.push(am);
        return;
      }

      const foundIndex = automagic.findIndex((amx) =>
        amx.param === param && amx.stat === stat
      );
      if (foundIndex !== -1) {
        if (min < automagic[foundIndex].min) {
          automagic[foundIndex].min = min;
        }
        if (max > automagic[foundIndex].max) {
          automagic[foundIndex].max = max;
        }
      } else {
        automagic.push(am);
        return;
      }
    });

    documented.push({
      item,
      tmog,
      automagic,
    });
  });

  return documented;
}

function MakeSpellDesc(ws: Workspace, documented: DocumentedItem): string {
  const { item, tmog } = documented;

  const colorCssTable = [
    "color-white",
    "color-red",
    "color-green",
    "color-blue",
    "color-lightgold",
    "color-grey",
    "color-black",
    "color-darkgold",
    "color-orange",
    "color-yellow",
    "color-darkgreen",
    "color-purple",
    "color-mediumgreen",
  ];

  const colorNum = Number.parseInt(item.spelldesccolor as string);
  const colorOpen = Number.isNaN(colorNum)
    ? "<span>"
    : `<span class="${colorCssTable[colorNum]}">`;

  switch (item.spelldesc) {
    case "1": {
      const baseStr = StringForIndex(ws, item.spelldescstr as string);
      let tmogStr = "";
      if (tmog !== undefined) {
        tmogStr = StringForIndex(ws, tmog.namestr as string);
      }
      return `${colorOpen}${baseStr} ${tmogStr}</span>`;
    }
    case "3": {
      const baseStr = StringForIndex(ws, item.spelldescstr as string);
      return `${colorOpen}${baseStr} ${item.spelldesccalc}</span>`;
    }
    case "2":
    case "4": {
      const baseStr = StringForIndex(ws, item.spelldescstr as string);
      return `${colorOpen}${
        baseStr.replace(/%d/, item.spelldesccalc as string).replace(/%%/, "%")
      }</span>`;
    }
    default:
      return "";
  }
}

function DocumentItem(ws: Workspace, documented: DocumentedItem): string {
  const { item, automagic } = documented;

  let itemName = StringForIndex(ws, item.namestr as string);
  let _1handDmg = "";
  let _2handDmg = "";
  let throwDmg = "";
  let reqlvl = "";
  let lvl = "";
  let durability = "";
  let reqstr = "";
  let reqdex = "";
  let ac = "";
  let block = "";

  if (
    item.mindam !== "" && item.mindam !== undefined && item.maxdam !== "" &&
    item.maxdam !== undefined &&
    (item["2handed"] !== "1" || item["1or2handed"] === "1")
  ) {
    // one handed damage
    const mindam = Number.parseInt(item.mindam as string);
    const maxdam = Number.parseInt(item.maxdam as string);

    let index = "ItemStats1l";
    if (IsSmiteDamageType(ws, item)) {
      index = "ItemStats1o";
    } else if (IsKickDamageType(ws, item)) {
      index = "ModStre10k";
    }

    if (!Number.isNaN(mindam) && !Number.isNaN(maxdam) && maxdam > 0) {
      _1handDmg = StringForIndexFormatted(ws, index, mindam, maxdam);
    }
  }

  if (
    item["2handed"] === "1" && item["2handmindam"] !== "" &&
    item["2handmindam"] !== undefined && item["2handmaxdam"] !== "" &&
    item["2handmaxdam"] !== undefined
  ) {
    // two handed damage
    const mindam = Number.parseInt(item["2handmindam"] as string);
    const maxdam = Number.parseInt(item["2handmaxdam"] as string);

    if (!Number.isNaN(mindam) && !Number.isNaN(maxdam)) {
      _2handDmg = StringForIndexFormatted(ws, "ItemStats1m", mindam, maxdam);
    }
  }

  if (
    item.minmisdam !== "" && item.minmisdam !== undefined &&
    item.maxmisdam !== "" && item.maxmisdam !== undefined
  ) {
    // throw damage
    const mindam = Number.parseInt(item.minmisdam as string);
    const maxdam = Number.parseInt(item.maxmisdam as string);

    if (!Number.isNaN(mindam) && !Number.isNaN(maxdam)) {
      throwDmg = StringForIndexFormatted(ws, "ItemStats1n", mindam, maxdam);
    }
  }

  if (item.levelreq !== "" && item.levelreq !== undefined) {
    // required level
    const _reqlvl = Number.parseInt(item.levelreq as string);

    if (!Number.isNaN(_reqlvl) && _reqlvl > 1) {
      reqlvl = StringForIndexFormatted(ws, "ItemStats1p", _reqlvl);
    }
  }

  if (item.level !== "" && item.level !== undefined) {
    // level
    const _lvl = Number.parseInt(item.level as string);

    if (!Number.isNaN(_lvl)) {
      lvl = StringForIndexFormatted(ws, "strChatLevel", _lvl);
    }
  }

  if (
    item.nodurability !== "1" && item.durability !== "" &&
    item.durability !== undefined
  ) {
    // durability
    const _durability = Number.parseInt(item.durability as string);

    if (!Number.isNaN(_durability)) {
      durability = StringForIndex(ws, "ItemStats1d").replace(
        /%i.*/,
        `${_durability}`,
      );
    }
  }

  if (item.reqstr !== "" && item.reqstr !== undefined) {
    // required strength
    const _reqstr = Number.parseInt(item.reqstr as string);

    if (!Number.isNaN(_reqstr) && _reqstr > 0) {
      reqstr = StringForIndexFormatted(ws, "ItemStats1e", _reqstr);
    }
  }

  if (item.reqdex !== "" && item.reqdex !== undefined) {
    // required dexterity
    const _reqdex = Number.parseInt(item.reqdex as string);

    if (!Number.isNaN(_reqdex) && _reqdex > 0) {
      reqdex = StringForIndexFormatted(ws, "ItemStats1f", _reqdex);
    }
  }

  if (
    item.minac !== "" && item.minac !== undefined && item.maxac !== "" &&
    item.maxac !== undefined
  ) {
    // defense
    const _minac = Number.parseInt(item.minac as string);
    const _maxac = Number.parseInt(item.maxac as string);

    if (!Number.isNaN(_minac) && !Number.isNaN(_maxac) && _maxac > 0) {
      ac = StringForIndexFormatted(
        ws,
        "ItemStats1h",
        _minac === _maxac ? _minac : `[${_minac}-${_maxac}]`,
      );
    }
  }

  if (item.block !== "" && item.block !== undefined) {
    // block chance
    const _block = Number.parseInt(item.block as string);

    if (!Number.isNaN(_block) && _block > 0) {
      block = StringForIndexFormatted(ws, "ItemStats1r", _block);
    }
  }

  // transmogrify ?

  // automagic stats
  const descStrings = PropertyListToDescString(automagic, ws).map((v, i) => {
    if (automagic[0].param === "__staff__" && i === 0) {
      return `<span class="stat"><abbr title="Random skills (staff mod)">${v}</abbr></span>`;
    }
    return `<span class="stat">${v}</span>`;
  });

  itemName = `<span class="item-name">${itemName}</span>`;
  const makeHtmlInfo = (s: string) =>
    s === "" ? "" : `<span class="item-info">${s}</span>`;
  _1handDmg = makeHtmlInfo(_1handDmg);
  _2handDmg = makeHtmlInfo(_2handDmg);
  throwDmg = makeHtmlInfo(throwDmg);
  reqlvl = makeHtmlInfo(reqlvl);
  lvl = makeHtmlInfo(lvl);
  durability = makeHtmlInfo(durability);
  reqstr = makeHtmlInfo(reqstr);
  reqdex = makeHtmlInfo(reqdex);
  ac = makeHtmlInfo(ac);
  block = makeHtmlInfo(block);

  // make spell desc

  return `<div class="base-item" id="${item.code}">
        ${itemName}
        ${lvl}
        ${ac}
        ${block}
        ${_1handDmg}
        ${_2handDmg}
        ${throwDmg}
        ${durability}
        ${reqlvl}
        ${reqstr}
        ${reqdex}
        ${MakeSpellDesc(ws, documented)}
        <div class="automagic">
          ${descStrings.join("\r\n")}
        </div>
      </div>
  `;
}

export function DocArmor(ws: Workspace): string {
  const { armor } = ws;

  if (armor === undefined) {
    return '<h1 class="error">armor.txt not found</h1>';
  }

  const documented = CreateDocumentedItems(ws, armor);
  return documented.map((doc) => DocumentItem(ws, doc)).join("\r\n");
}

type DocumentedWeapon = {};

export function DocWeapons(ws: Workspace): string {
  const { weapons } = ws;

  if (weapons === undefined) {
    return '<h1 class="error">weapons.txt not found</h1>';
  }

  const documented = CreateDocumentedItems(ws, weapons);
  return documented.map((doc) => DocumentItem(ws, doc)).join("\r\n");
}

type DocumentedMiscItem = {};

export function DocMisc(ws: Workspace): string {
  const { misc } = ws;

  if (misc === undefined) {
    return '<h1 class="error">misc.txt not found</h1>';
  }

  const documented = CreateDocumentedItems(ws, misc);
  return documented.map((doc) => DocumentItem(ws, doc)).join("\r\n");
}
