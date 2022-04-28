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
import { StringForIndex } from "../lib.ts";

type DocumentedSetItem = {
  base: D2RItemExcelRecord | undefined;
  setItem: D2RSetItems;
};

type DocumentedSet = {
  set: D2RSets;
  items: DocumentedSetItem[];
  fullSetBonus: PropertyList;
};

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
      `<span class="partial-set-bonus">${
        v.replace(/%%/, "%")
      } <span class="bonus-designator">${
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
    `<span class="full-set-bonus">${v.replace(/%%/, "%")}</span>`
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
      </div>
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
    const items = setItems.filter((si) => si.set === si.index).map(
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

  return documented.map((set) => DocumentSet(ws, set)).join("\r\n");
}
