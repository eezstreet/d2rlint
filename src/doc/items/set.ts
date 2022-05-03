import { GetConfig } from "../../lib/config.ts";
import {
  D2RItemExcelRecord,
  D2RSetItems,
  D2RSets,
  Workspace,
} from "../../lib/workspace.ts";
import {
  MakePropertyList,
  PropertyList,
  PropertyListToDescString,
} from "../items.ts";
import { StringForIndex, StringForIndexFormatted } from "../lib.ts";

type DocumentedSetItem = {
  base: D2RItemExcelRecord | undefined;
  setItem: D2RSetItems;
};

type DocumentedSet = {
  set: D2RSets;
  items: DocumentedSetItem[];
  fullSetBonus: PropertyList;
};

function DocumentSetItems(ws: Workspace, theSet: DocumentedSetItem[]): string {
  const config = GetConfig();
  const setItemProps: [
    keyof D2RSetItems,
    keyof D2RSetItems,
    keyof D2RSetItems,
    keyof D2RSetItems,
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
  ];

  const { properties } = ws;
  if (properties === undefined) {
    return "";
  }

  return theSet.map((item) => {
    const { base, setItem } = item;

    if (base === undefined) {
      return "";
    }

    const itemName = StringForIndex(ws, setItem.index as string);
    const baseItemName = StringForIndex(ws, base.namestr as string);
    const lvlreq = setItem["lvl req"] as string;
    const lvl = setItem.lvl as string;
    let lvlreqstr = "";
    let lvlstr = "";

    const lvlreqAsNumber = Number.parseInt(lvlreq);
    if (!Number.isNaN(lvlreqAsNumber) && lvlreqAsNumber > 1) {
      lvlreqstr = StringForIndexFormatted(ws, "ItemStats1p", lvlreqAsNumber);
      lvlreqstr = `<span class="required-level">${lvlreqstr}</span>`;
    }

    const lvlAsNumber = Number.parseInt(lvl);
    if (!Number.isNaN(lvlAsNumber)) {
      lvlstr = StringForIndexFormatted(ws, "strChatLevel", lvlAsNumber);
      lvlstr = `<span class="required-level">${lvlstr}</span>`;
    }

    const basePropertyList = MakePropertyList(
      properties,
      setItem,
      setItemProps,
    );
    const descStrings = PropertyListToDescString(basePropertyList, ws).map((
      v,
    ) => `<span class="stat">${v}</span>`);

    let partialSetBonus: string[] = [];
    if (setItem["add func"] === "1") {
      // the partial set bonuses are concocted from the indices of the set items.
      // in the vanilla game this is used by Civerb's Ward, and that item only
      const notThisItem = theSet.filter((si) =>
        si.setItem.index !== setItem.index
      );
      for (let i = 0; i < notThisItem.length && i < 5; i++) {
        const otherItem = notThisItem[i];
        const setItemPropsForThis: [
          keyof D2RSetItems,
          keyof D2RSetItems,
          keyof D2RSetItems,
          keyof D2RSetItems,
        ][] = [
          [
            `aprop${i + 1}a` as keyof D2RSetItems,
            `apar${i + 1}a` as keyof D2RSetItems,
            `amin${i + 1}a` as keyof D2RSetItems,
            `amax${i + 1}a` as keyof D2RSetItems,
          ],
          [
            `aprop${i + 1}b` as keyof D2RSetItems,
            `apar${i + 1}b` as keyof D2RSetItems,
            `amin${i + 1}b` as keyof D2RSetItems,
            `amax${i + 1}b` as keyof D2RSetItems,
          ],
        ];

        const propertyList = MakePropertyList(
          properties,
          setItem,
          setItemPropsForThis,
        );
        const itemName = StringForIndex(ws, otherItem.setItem.index as string);
        partialSetBonus = partialSetBonus.concat(
          PropertyListToDescString(propertyList, ws).map((v) =>
            `<span class="partial-set-item-bonus">${v} <span class="bonus-designator">${
              config.docOptions.localizedStrings.other.setSpecificItem.replace(
                /%s/,
                itemName,
              )
            }</span></span>`
          ),
        );
      }
    } else if (setItem["add func"] === "2") {
      // this is the partial set bonus used by the majority of set items
      // all it does is add the partial set bonus based on number of items equipped
      for (let i = 0; i < 5; i++) {
        const setItemPropsForThis: [
          keyof D2RSetItems,
          keyof D2RSetItems,
          keyof D2RSetItems,
          keyof D2RSetItems,
        ][] = [
          [
            `aprop${i + 1}a` as keyof D2RSetItems,
            `apar${i + 1}a` as keyof D2RSetItems,
            `amin${i + 1}a` as keyof D2RSetItems,
            `amax${i + 1}a` as keyof D2RSetItems,
          ],
          [
            `aprop${i + 1}b` as keyof D2RSetItems,
            `apar${i + 1}b` as keyof D2RSetItems,
            `amin${i + 1}b` as keyof D2RSetItems,
            `amax${i + 1}b` as keyof D2RSetItems,
          ],
        ];

        const propertyList = MakePropertyList(
          properties,
          setItem,
          setItemPropsForThis,
        );

        const fmt = i + 2 >= theSet.length
          ? config.docOptions.localizedStrings.other.setFull
          : config.docOptions.localizedStrings.other.setNItems;
        partialSetBonus = partialSetBonus.concat(
          PropertyListToDescString(propertyList, ws).map((v) =>
            `<span class="partial-set-bonus">${v} <span class="bonus-designator">${
              fmt.replace(/%d/, `${i + 2}`)
            }</span></span>`
          ),
        );
      }
    }

    return `<div class="set-item">
      <span class="set-item-name" id="${setItem.index}">${itemName}</span>
      <span class="set-item-base">${baseItemName}</span>
      ${lvlstr}
      ${lvlreqstr}
      ${descStrings.join("\r\n")}
      ${partialSetBonus.join("\r\n")}
    </div>`;
  }).join("\r\n");
}

function DocumentSet(ws: Workspace, theSet: DocumentedSet): string {
  const { set, items, fullSetBonus } = theSet;
  const setName = StringForIndex(ws, set.name as string);
  const config = GetConfig();
  const { properties } = ws;
  if (properties === undefined) {
    return "";
  }

  const partialSetBonus = [2, 3, 4, 5].map((num) => {
    const props: [
      keyof D2RSets,
      keyof D2RSets,
      keyof D2RSets,
      keyof D2RSets,
    ][] = [
      [
        `pcode${num}a` as keyof D2RSets,
        `pparam${num}a` as keyof D2RSets,
        `pmin${num}a` as keyof D2RSets,
        `pmax${num}a` as keyof D2RSets,
      ],
      [
        `pcode${num}b` as keyof D2RSets,
        `pparam${num}b` as keyof D2RSets,
        `pmin${num}b` as keyof D2RSets,
        `pmax${num}b` as keyof D2RSets,
      ],
    ];

    const propList = MakePropertyList(properties, set, props);
    if (propList.length <= 0) {
      return "";
    }

    const str = PropertyListToDescString(propList, ws).map((v) =>
      `<span class="partial-set-bonus">${v} <span class="bonus-designator">${
        config.docOptions.localizedStrings.other.setNItems.replace(
          /%d/,
          `${num}`,
        )
      }</span></span>`
    );

    return `<div class="bonus-item">
      ${str.join("\r\n")}
    </div>`;
  });

  const fullSetDescStr = PropertyListToDescString(fullSetBonus, ws).map((v) =>
    `<span class="full-set-bonus">${v}</span>`
  ).join("\r\n");

  return `<div class="set" id="${set.index}">
      <h1>${setName}</h1>
      <h2>${config.docOptions.localizedStrings.subPageNames.fullSetBonus}</h2>
      <div class="full-set-bonus">
        ${fullSetDescStr}
      </div>
      <h2>${config.docOptions.localizedStrings.subPageNames.partialSetBonus}</h2>
      <div class="partial-set-bonus">
        ${partialSetBonus.join("\r\n")}
      </div>
      <h2>${config.docOptions.localizedStrings.subPageNames.setItems}</h2>
      <div class="set-items">
        ${DocumentSetItems(ws, items)}
      </div>
      <a class="return-top" href="#">Return to Top</a>
    </div>`;
}

export function DocSets(ws: Workspace): string {
  const { sets, setItems, properties, armor, weapons, misc } = ws;

  if (sets === undefined || setItems === undefined) {
    return '<h1 class="error">setitems.txt and/or sets.txt not found</h1>';
  }

  if (armor === undefined || weapons === undefined || misc === undefined) {
    return '<h1 class="error">armor/weapons/misc.txt not found</h1>';
  }

  if (properties === undefined) {
    return '<h1 class="error">properties.txt not found</h1>';
  }

  const allItems = [...armor, ...weapons, ...misc];

  const fullSetProps: [
    keyof D2RSets,
    keyof D2RSets,
    keyof D2RSets,
    keyof D2RSets,
  ][] = [
    ["fcode1", "fparam1", "fmin1", "fmax1"],
    ["fcode2", "fparam2", "fmin2", "fmax2"],
    ["fcode3", "fparam3", "fmin3", "fmax3"],
    ["fcode4", "fparam4", "fmin4", "fmax4"],
    ["fcode5", "fparam5", "fmin5", "fmax5"],
    ["fcode6", "fparam6", "fmin6", "fmax6"],
    ["fcode7", "fparam7", "fmin7", "fmax7"],
    ["fcode8", "fparam8", "fmin8", "fmax8"],
  ];

  const documented: DocumentedSet[] = [];
  sets.forEach((set) => {
    if (set.name === "") {
      return;
    }

    // find all set items that belong to this set
    const items = setItems.filter((si) => si.set === set.index).map(
      (setItem) => {
        return {
          setItem,
          base: allItems.find((item) => item.code === setItem.item),
        };
      },
    );

    documented.push({
      set,
      items,
      fullSetBonus: MakePropertyList(properties, set, fullSetProps),
    });
  });

  const setHeader = documented.map((set) => `
    <a class="set-link" href="#${set.set.index}">${
    StringForIndex(ws, set.set.index as string)
  }</a>
  `).join(" | ");

  return `
    <div class="page-header">
      ${setHeader}
    </div>
    ${documented.map((set) => DocumentSet(ws, set)).join("\r\n")}
  `;
}
