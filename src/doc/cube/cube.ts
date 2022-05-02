import { GetConfig } from "../../lib/config.ts";
import { D2RCubemain, D2RMagicBase, Workspace } from "../../lib/workspace.ts";
import { MakePropertyList, PropertyListToDescString } from "../items.ts";
import { StringForIndex } from "../lib.ts";

function EvaluateCubeInput(input: string, ws: Workspace): string {
  const config = GetConfig();
  if (input === "") {
    return "";
  }

  const { uniqueItems, setItems, armor, weapons, misc, itemTypes } = ws;
  if (
    uniqueItems === undefined || setItems === undefined ||
    armor === undefined || weapons === undefined || misc === undefined ||
    itemTypes === undefined
  ) {
    return "";
  }

  const split = input.replace(/"?([^"]*)"?$/, "$1").split(",");
  if (split.length <= 0) {
    return "";
  }

  const itemKind = split[0];

  // check to see if it's a unique item or set item first
  const asUnique = uniqueItems.find((item) => item.index === itemKind);
  const asSet = setItems.find((item) => item.index === itemKind);
  const allItems = [...armor, ...weapons, ...misc];
  const asBaseItem = allItems.find((item) => item.code === itemKind);
  const asItemType = itemTypes.find((item) => item.code === itemKind);

  let itemName = "";
  if (asUnique !== undefined) {
    itemName = StringForIndex(ws, asUnique.index as string);
  } else if (asSet !== undefined) {
    itemName = StringForIndex(ws, asSet.index as string);
  } else if (asBaseItem !== undefined) {
    itemName = StringForIndex(ws, asBaseItem.namestr as string);
  } else if (asItemType !== undefined) {
    itemName = asItemType.itemtype as string;
  } else if (itemKind === "any") {
    itemName = config.docOptions.localizedStrings.cubeInputQualifiers.any;
  } else {
    return "";
  }

  split.forEach((qualifier, i) => {
    if (i === 0) {
      return; // skip item kind, we just did that
    }

    switch (qualifier) {
      case "low":
      case "nor":
      case "hiq":
      case "mag":
      case "set":
      case "rar":
      case "uni":
      case "crf":
      case "tmp":
      case "nos":
      case "noe":
      case "eth":
      case "bas":
      case "exc":
      case "eli":
      case "nru":
      case "sock":
        itemName = config.docOptions.localizedStrings
          .cubeInputQualifiers[qualifier].replace(/%s/, itemName);
        return;
    }

    if (qualifier.startsWith("qty=")) {
      const qtyStr = qualifier.replace(/qty=([0-9]+)/, "$1");
      const qty = Number.parseInt(qtyStr);
      if (!Number.isNaN(qty) && qty > 1) {
        itemName = config.docOptions.localizedStrings.cubeInputQualifiers.qty
          .replace(/%s/, itemName).replace(/%d/, qtyStr);
      }
    } else if (qualifier.startsWith("sock=")) {
      const sockStr = qualifier.replace(/sock=([0-9]+)/, "$1");
      const sock = Number.parseInt(sockStr);
      if (!Number.isNaN(sock) && sock > 0) {
        itemName = config.docOptions.localizedStrings.cubeInputQualifiers.sockN
          .replace(/%s/, itemName).replace(/%d/, sockStr);
      }
    }
  });

  return itemName;
}

function CreateRequirementsText(
  ws: Workspace,
  op: string,
  param: string,
  value: string,
): string {
  const { itemStatCost } = ws;

  if (itemStatCost === undefined) {
    return "";
  }

  const config = GetConfig();
  const asNumeric = Number.parseInt(op);
  if (
    asNumeric <= 0 ||
    asNumeric >= config.docOptions.localizedStrings.cubeOps.length &&
      !Number.isNaN(asNumeric)
  ) {
    return "";
  }

  const format = config.docOptions.localizedStrings.cubeOps[asNumeric];
  const numericParam = Number.parseInt(param);
  const numericValue = Number.parseInt(value);

  let datevalue = config.docOptions.localizedStrings.cubeDaysOfWeek[0];
  if (
    numericValue >= 0 &&
    numericValue < config.docOptions.localizedStrings.cubeDaysOfWeek.length
  ) {
    datevalue = config.docOptions.localizedStrings.cubeDaysOfWeek[numericValue];
  }

  let paramstat = "";
  if (numericParam >= 0 && numericParam < itemStatCost.length) {
    const isc = itemStatCost[numericParam];
    if (isc.descfunc !== "" && isc.descstrpos !== "") {
      paramstat = StringForIndex(ws, isc.descstrpos as string).replace(
        /%\+?d/,
        "X",
      );
    } else {
      paramstat = isc.stat as string;
    }
  }

  return format.replace(/%datevalue/, datevalue).replace(
    /%paramstat/,
    paramstat,
  ).replace(/%value%/, value).replace(/%param/, param);
}

function GetKeys<T extends {}>(x: T): keyof T[] {
  return Object.keys(x) as unknown as keyof T[];
}

function FromKey<T extends {}>(x: T, y: string): unknown {
  return x[y as keyof T];
}

function EvaluateCubeOutput(
  recipe: D2RCubemain,
  output: "" | "b" | "c",
  ws: Workspace,
): string[] {
  const config = GetConfig();
  const outputField = output === ""
    ? "output"
    : `output ${output}` as keyof D2RCubemain;
  const outputLvl = output === ""
    ? "lvl"
    : `${output} lvl` as keyof D2RCubemain;
  const outputPLvl = output === ""
    ? "plvl"
    : `${output} plvl` as keyof D2RCubemain;
  const outputILvl = output === ""
    ? "ilvl"
    : `${output} ilvl` as keyof D2RCubemain;
  const strOutput = recipe[outputField] as string;
  const hardcodedKeys = GetKeys(
    config.docOptions.localizedStrings.cubeHardcodedOutputs,
  );

  const {
    levels,
    uniqueItems,
    setItems,
    itemTypes,
    armor,
    weapons,
    misc,
    properties,
    magicPrefix,
    magicSuffix,
  } = ws;
  if (
    levels === undefined || uniqueItems === undefined ||
    setItems === undefined || itemTypes === undefined || armor === undefined ||
    weapons === undefined || misc === undefined || properties === undefined ||
    magicPrefix === undefined || magicSuffix === undefined
  ) {
    return [];
  }

  if (strOutput === "") {
    return [];
  }

  // handle hardcoded outputs
  const parsedOutput = strOutput.replace(/"/, "").split(",");
  if (parsedOutput.length <= 0) {
    return [];
  } else if (parsedOutput[0] === "Cow Portal") {
    // replace %s with hardcoded reference to moo moo farm
    const lvlName = StringForIndex(ws, levels[39].levelname as string);
    return [
      config.docOptions.localizedStrings.cubeHardcodedOutputs["Cow Portal"]
        .replace(/%s/, lvlName),
    ];
  } else if (parsedOutput[0] === "Red Portal") {
    // find either 'qty' or 'lvl' qualifier
    let lvlName = "";
    for (let i = 1; i < parsedOutput.length; i++) {
      if (
        parsedOutput[i].startsWith("lvl=") || parsedOutput[i].startsWith("qty=")
      ) {
        const numStr = parsedOutput[i].replace(/(lvl|qty)=([0-9]+)/, "$2");
        const num = Number.parseInt(numStr);
        if (num >= 0 && num < levels.length) {
          lvlName = StringForIndex(ws, levels[num].levelname as string);
          break;
        }
      }
    }

    return [
      config.docOptions.localizedStrings.cubeHardcodedOutputs["Red Portal"]
        .replace(/%s/, lvlName),
    ];
  } else if ((hardcodedKeys as unknown as string[]).includes(parsedOutput[0])) {
    return [FromKey(
      config.docOptions.localizedStrings.cubeHardcodedOutputs,
      parsedOutput[0],
    ) as string];
  }

  const returnValue: string[] = [];
  let isMod = false;
  let outputName = "";

  // handle item outputs
  // search for the name of the item as a unique item first
  const foundUnique = uniqueItems.find((ui) => ui.index === parsedOutput[0]);
  const foundSetItem = setItems.find((si) => si.index === parsedOutput[0]);
  const foundItemType = itemTypes.find((it) => it.code === parsedOutput[0]);
  const foundItemCode = [...armor, ...weapons, ...misc].find((it) =>
    it.code === parsedOutput[0]
  );

  if (parsedOutput[0] === "usetype" || parsedOutput[0] === "useitem") {
    outputName =
      config.docOptions.localizedStrings.cubeOutputQualifiers.usetypeitem;
    const extra: string[] = [];
    for (let i = 1; i < parsedOutput.length; i++) {
      const qual = parsedOutput[i];
      switch (qual) {
        case "low":
        case "nor":
        case "hiq":
        case "mag":
        case "set":
        case "rar":
        case "uni":
        case "crf":
        case "tmp":
        case "eth":
        case "exc":
        case "eli":
          outputName = config.docOptions.localizedStrings
            .cubeOutputQualifiers[qual].replace(/%s/, outputName);
          break;
        case "uns":
        case "rem":
        case "reg":
        case "rep":
        case "rch":
          extra.push(
            config.docOptions.localizedStrings.cubeOutputQualifiers[qual],
          );
          break;
      }

      if (qual.startsWith("sock=")) {
        const sockNum = qual.replace(/sock=([0-9]+)/, "$1");
        outputName = config.docOptions.localizedStrings.cubeOutputQualifiers
          .sockN.replace(/%s/, outputName).replace(/%d/, sockNum);
      } else if (qual.startsWith("qty=") || qual.startsWith("lvl=")) {
        const qtyNum = qual.replace(/(qty|lvl)=([0-9]+)/, "$2");
        outputName = config.docOptions.localizedStrings.cubeInputQualifiers.qty
          .replace(/%s/, outputName).replace(/%d/, qtyNum);
      }
    }
    returnValue.push(...extra);
  } else if (foundUnique !== undefined) {
    outputName = StringForIndex(ws, foundUnique.index as string);
  } else if (foundSetItem !== undefined) {
    outputName = StringForIndex(ws, foundSetItem.index as string);
  } else if (foundItemType !== undefined) {
    outputName = foundItemType.itemtype as string;
  } else if (foundItemCode !== undefined) {
    outputName = StringForIndex(ws, foundItemCode.namestr as string);
  } else {
    return [];
  }

  if (recipe[outputPLvl] !== "") {
    returnValue.push(
      config.docOptions.localizedStrings.cubeOutputQualifiers.plvl.replace(
        /%d/,
        recipe[outputPLvl] as string,
      ).replace(/%%/, "%"),
    );
  }
  if (recipe[outputILvl] !== "") {
    returnValue.push(
      config.docOptions.localizedStrings.cubeOutputQualifiers.ilvl.replace(
        /%d/,
        recipe[outputILvl] as string,
      ).replace(/%%/, "%"),
    );
  }
  if (recipe[outputLvl] !== "") {
    returnValue.push(
      StringForIndex(ws, "ItemStats1p").replace(
        /%d/,
        recipe[outputLvl] as string,
      ),
    );
  }

  // create a stat list
  const props: [
    keyof D2RCubemain,
    keyof D2RCubemain,
    keyof D2RCubemain,
    keyof D2RCubemain,
  ][] = output === ""
    ? [
      ["mod 1", "mod 1 param", "mod 1 min", "mod 1 max"],
      ["mod 2", "mod 2 param", "mod 2 min", "mod 2 max"],
      ["mod 3", "mod 3 param", "mod 3 min", "mod 3 max"],
      ["mod 4", "mod 4 param", "mod 4 min", "mod 4 max"],
      ["mod 5", "mod 5 param", "mod 5 min", "mod 5 max"],
    ]
    : [
      [
        `${output} mod 1`,
        `${output} mod 1 param`,
        `${output} mod 1 min`,
        `${output} mod 1 max`,
      ],
      [
        `${output} mod 2`,
        `${output} mod 2 param`,
        `${output} mod 2 min`,
        `${output} mod 2 max`,
      ],
      [
        `${output} mod 3`,
        `${output} mod 3 param`,
        `${output} mod 3 min`,
        `${output} mod 3 max`,
      ],
      [
        `${output} mod 4`,
        `${output} mod 4 param`,
        `${output} mod 4 min`,
        `${output} mod 4 max`,
      ],
      [
        `${output} mod 5`,
        `${output} mod 5 param`,
        `${output} mod 5 min`,
        `${output} mod 5 max`,
      ],
    ];
  const chance: (keyof D2RCubemain)[] = output === ""
    ? [
      "mod 1 chance",
      "mod 2 chance",
      "mod 3 chance",
      "mod 4 chance",
      "mod 5 chance",
    ]
    : [
      `${output} mod 1 chance`,
      `${output} mod 2 chance`,
      `${output} mod 3 chance`,
      `${output} mod 4 chance`,
      `${output} mod 5 chance`,
    ];

  const propItems: string[] = [];
  props.forEach((prop, i) => {
    const propertyList = MakePropertyList(properties, recipe, [prop]);
    if (propertyList.length <= 0) {
      return;
    }
    const descList = PropertyListToDescString(propertyList, ws);
    if (descList.length <= 0) {
      return;
    }
    if (
      recipe[chance[i]] !== "" && recipe[chance[i]] !== "0" &&
      recipe[chance[i]] !== "100"
    ) {
      propItems.push(
        ...descList.map((di) =>
          config.docOptions.localizedStrings.cubeOutputQualifiers.percentChance
            .replace(/%s/, di).replace(/%d/, recipe[chance[i]] as string)
        ),
      );
    } else {
      propItems.push(...descList);
    }
  });

  const magicProps: [
    keyof D2RMagicBase,
    keyof D2RMagicBase,
    keyof D2RMagicBase,
    keyof D2RMagicBase,
  ][] = [
    ["mod1code", "mod1param", "mod1min", "mod1max"],
    ["mod2code", "mod2param", "mod2min", "mod2max"],
    ["mod3code", "mod3param", "mod3min", "mod3max"],
  ];

  for (let i = 1; i < parsedOutput.length; i++) {
    const qual = parsedOutput[i];
    if (qual.startsWith("pre=")) {
      const prestr = qual.replace(/pre=([0-9]+)/, "$1");
      const prenum = Number.parseInt(prestr);
      if (
        prenum > 0 && prenum < magicPrefix.length && !Number.isNaN(prenum)
      ) {
        outputName = config.docOptions.localizedStrings.cubeOutputQualifiers
          .pre.replace(
            /%pre/,
            StringForIndex(ws, magicPrefix[prenum].name as string),
          ).replace(/%item/, outputName);

        // add prop items
        const magicProperties = MakePropertyList(
          properties,
          magicPrefix[prenum],
          magicProps,
        );
        propItems.push(...PropertyListToDescString(magicProperties, ws));
      }
    } else if (qual.startsWith("suf=")) {
      const sufstr = qual.replace(/suf=([0-9]+)/, "$1");
      const sufnum = Number.parseInt(sufstr);
      if (
        sufnum > 0 && sufnum < magicSuffix.length && !Number.isNaN(sufnum)
      ) {
        outputName = config.docOptions.localizedStrings.cubeOutputQualifiers
          .suf.replace(
            /%suf/,
            StringForIndex(ws, magicSuffix[sufnum].name as string),
          ).replace(/%item/, outputName);

        // add prop items
        const magicProperties = MakePropertyList(
          properties,
          magicSuffix[sufnum],
          magicProps,
        );
        propItems.push(...PropertyListToDescString(magicProperties, ws));
      }
    }
  }

  isMod = parsedOutput.includes("mod") || parsedOutput.includes("useitem");

  if (propItems.length > 0) {
    if (isMod) {
      returnValue.push(
        config.docOptions.localizedStrings.cubeOutputQualifiers.mod,
      );
    } else {
      returnValue.push(
        config.docOptions.localizedStrings.cubeOutputQualifiers.nonMod,
      );
    }
    returnValue.push(...propItems);
  } else if (isMod) {
    returnValue.push(
      config.docOptions.localizedStrings.cubeOutputQualifiers.modNoList,
    );
  }

  return [outputName, ...returnValue];
}

export default function DocCubeRecipes(ws: Workspace): string {
  const {
    cubemain,
    properties,
    uniqueItems,
    setItems,
    armor,
    weapons,
    misc,
    itemTypes,
    magicPrefix,
    magicSuffix,
  } = ws;

  if (
    cubemain === undefined || properties === undefined ||
    uniqueItems === undefined || setItems === undefined ||
    armor === undefined || weapons === undefined || misc === undefined ||
    itemTypes === undefined || magicSuffix === undefined ||
    magicPrefix === undefined
  ) {
    return "";
  }

  const inputFields: (keyof D2RCubemain)[] = [
    "input 1",
    "input 2",
    "input 3",
    "input 4",
    "input 5",
    "input 6",
    "input 7",
  ];

  return cubemain.filter((recipe) => recipe.enabled === "1").map((recipe) => {
    const inputs = inputFields.map((field) =>
      EvaluateCubeInput(recipe[field] as string, ws)
    ).filter((s) => s !== "");
    const inputListItems = inputs.map((input) =>
      `<li class="cube-input">${input}</li>`
    ).join("\r\n");
    const outputA = EvaluateCubeOutput(recipe, "", ws);
    const outputB = EvaluateCubeOutput(recipe, "b", ws);
    const outputC = EvaluateCubeOutput(recipe, "c", ws);

    const makeOutput = (s: string[]): string => {
      if (s.length === 0) {
        return "";
      }

      const [head, ...rest] = s;

      return `<div class="cube-output">
        <span class="cube-output-name">${head}</span>
        <ul>
          ${rest.map((ri) => `<li class="stat">${ri}</li>`).join("\r\n")}
        </ul>
      </div>`;
    };

    const outputAStr = makeOutput(outputA);
    const outputBStr = makeOutput(outputB);
    const outputCStr = makeOutput(outputC);

    let requirements = "";
    if (recipe.op !== "" && recipe.op !== "0") {
      requirements = CreateRequirementsText(
        ws,
        recipe.op as string,
        recipe.param as string,
        recipe.value as string,
      );
    }

    return `<div class="cube-recipe">
      <span class="cube-description">${recipe.description}</span>
      <table>
        <tr>
          <th>Input</th>
          <th>Output</th>
          <th>Requirements</th>
        </tr>
        <tr>
          <td>
            <ul>
              ${inputListItems}
            </ul>
          </td>
          <td>
            ${outputAStr}
            ${outputBStr}
            ${outputCStr}
          </td>
          <td>
            ${requirements}
          </td>
        </tr>
      </table>
    </div>`;
  }).join("\r\n");
}
