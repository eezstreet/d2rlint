import { lintrule, Rule } from "../lib/rule.ts";
import {
  D2RAutomagic,
  D2RCubemain,
  D2RExcelRecord,
  D2RGems,
  D2RItemExcelRecord,
  D2RItemTypes,
  D2RMagicBase,
  D2RMonProp,
  D2RProperties,
  D2RQualityItems,
  D2RRunes,
  D2RSetItems,
  D2RSets,
  D2RUniqueItems,
  Workspace,
} from "../lib/workspace.ts";

/**
 * Gem Sockets must be <= Min(invwidth x invheight, 6)
 * MaxSockets1<=MaxSockets2<=MaxSockets3===GemSockets
 * MaxSocketLevelThreshold1<MaxSocketLevelThreshold2<MaxSocketLevelThreshold3
 */
@lintrule
export class ValidSockets extends Rule {
  GetRuleName() {
    return "Items/ValidSockets";
  }

  Evaluate(workspace: Workspace): void {
    const { armor, misc, weapons, itemTypes } = workspace;

    // Ensure that we have all of the files.
    if (
      armor === undefined || misc === undefined || weapons === undefined ||
      itemTypes === undefined
    ) {
      return;
    }

    const warn = (file: string, line: number, msg: string) => {
      this.Warn(`${file}, line ${line + 2}: ${msg}`);
    };

    // Ensure that MaxSocketLevelThreshold1/2 are all valid, first.
    itemTypes.forEach((itemType, _line) => {
      const { code, GetFileName } = itemType;
      const file = GetFileName();
      const line = _line;
      let thres1 = 0, thres2 = 0;
      let sockets1 = 0, sockets2 = 0, sockets3 = 0;

      const makeNumber = (k: keyof D2RItemTypes) => {
        try {
          return parseInt(itemType[k] as unknown as string);
        } catch {
          warn(
            file,
            line,
            `'${k}' is not a number for item type '${code}'`,
          );
          return 0;
        }
      };

      thres1 = makeNumber("maxsocketslevelthreshold1");
      thres2 = makeNumber("maxsocketslevelthreshold2");
      sockets1 = makeNumber("maxsockets1");
      sockets2 = makeNumber("maxsockets2");
      sockets3 = makeNumber("maxsockets3");

      if (thres1 > thres2) {
        warn(
          file,
          line,
          `MaxSocketsLevelThreshold1 > MaxSocketsLevelThreshold2 for item type '${code}'`,
        );
      }

      if (sockets1 > sockets2) {
        warn(
          file,
          line,
          `MaxSockets1 > MaxSockets2 for item type '${code}'`,
        );
      }
      if (sockets2 > sockets3) {
        warn(
          file,
          line,
          `MaxSockets2 > MaxSockets3 for item type '${code}'`,
        );
      }
      if (sockets1 > sockets3) {
        warn(
          file,
          line,
          `MaxSockets1 > MaxSockets3 for item type '${code}'`,
        );
      }
      if (sockets1 > 6 || sockets1 < 0) {
        warn(
          file,
          line,
          `invalid MaxSockets1 (${sockets1}) for item type '${code}'`,
        );
      }
      if (sockets2 > 6 || sockets2 < 0) {
        warn(
          file,
          line,
          `invalid MaxSockets2 (${sockets2}) for item type '${code}'`,
        );
      }
      if (sockets3 > 6 || sockets3 < 0) {
        warn(
          file,
          line,
          `invalid MaxSockets3 (${sockets3}) for item type '${code}'`,
        );
      }
    });

    [misc, armor, weapons].forEach((itemFile) =>
      itemFile.forEach((item, _line) => {
        const line = _line + 2;
        const file = item.GetFileName();
        const {
          name,
          type,
          type2,
        } = item;

        const makeNumber = (k: keyof D2RItemExcelRecord) => {
          try {
            return parseInt(item[k] as unknown as string);
          } catch {
            warn(file, line, `'${k}' for '${name}' is not a number`);
            return 0;
          }
        };

        const itemType1 = itemTypes.find((it) => it.code === type);
        const itemType2 = itemTypes.find((it) => it.code === type2);
        let itemTypeDefinedSockets = 0;

        const findMaxSocketsForItemType = (it: D2RItemTypes | undefined) => {
          if (it === undefined) {
            return 0;
          }
          const { maxsockets1, maxsockets2, maxsockets3 } = it;
          try {
            const ms1 = parseInt(maxsockets1 as unknown as string);
            const ms2 = parseInt(maxsockets2 as unknown as string);
            const ms3 = parseInt(maxsockets3 as unknown as string);
            return Math.max(ms1, ms2, ms3);
          } catch {
            return 0;
          }
        };

        itemTypeDefinedSockets = Math.max(
          findMaxSocketsForItemType(itemType1),
          findMaxSocketsForItemType(itemType2),
        );

        const gemsockets = makeNumber("gemsockets");
        const gemapplytype = makeNumber("gemapplytype");
        const hasinv = makeNumber("hasinv");
        const invwidth = makeNumber("invwidth");
        const invheight = makeNumber("invheight");

        if (hasinv !== 1) {
          return; // just bail here, this item is not supposed to have sockets
        }

        if (gemsockets > itemTypeDefinedSockets) {
          warn(
            file,
            line,
            `gemsockets (${gemsockets}) won't spawn on '${name}' because its type(s) won't allow more than ${itemTypeDefinedSockets} sockets.`,
          );
        }
        if (gemapplytype < 0 || gemapplytype > 3) {
          warn(
            file,
            line,
            `invalid gemapplytype '${gemapplytype}' for '${name}'`,
          );
        }
        if (gemsockets > invwidth * invheight) {
          warn(
            file,
            line,
            `'${name}' has more gemsockets (${gemsockets}) than inventory spaces used (${invwidth} x ${invheight} = ${
              invheight * invwidth
            })`,
          );
        }
      })
    );
  }
}

/**
 * Charms aren't allowed to be gambled.
 */
@lintrule
export class NoIllegalGambling extends Rule {
  GetRuleName() {
    return "Items/NoIllegalGambling";
  }

  Evaluate(workspace: Workspace) {
    const { gamble, misc, weapons, armor, itemTypes } = workspace;

    if (
      gamble === undefined || misc === undefined || weapons === undefined ||
      armor === undefined || itemTypes === undefined
    ) {
      return;
    }

    gamble.forEach((entry, _line) => {
      const line = _line + 2;
      const file = entry.GetFileName();
      const miscCode = misc.find((item) => item.code === entry.code);
      const armorCode = armor.find((item) => item.code === entry.code);
      const weaponCode = weapons.find((item) => item.code === entry.code);
      const realEntry = miscCode !== undefined
        ? miscCode
        : armorCode !== undefined
        ? armorCode
        : weaponCode !== undefined
        ? weaponCode
        : undefined;
      let warned = false;
      if (realEntry === undefined) {
        // not found. this will trigger other warnings, so just skip for now.
        return;
      }

      const walkItemType = (it: string) => {
        if (it === "" || warned) {
          return;
        }
        if (it === "char") {
          warned = true;
          this.Warn(
            `${file}, line ${line}: Charms, such as '${entry.code}', cannot be gambled.`,
          );
        }

        const itemTypeEntry = itemTypes.find((it2) => it2.code === it);
        if (itemTypeEntry === undefined) {
          // whole different can of worms. skip for now.
          return;
        }

        walkItemType(itemTypeEntry.equiv1 as unknown as string);
        walkItemType(itemTypeEntry.equiv2 as unknown as string);
      };

      walkItemType(realEntry.type as unknown as string);
      walkItemType(realEntry.type2 as unknown as string);
    });
  }
}

/**
 * Common data used amongst the following two rules.
 */

// An Excel file that has stat/param/min/max fields.
type ExcelWithStatKeys =
  | D2RAutomagic
  | D2RCubemain
  | D2RGems
  | D2RMagicBase
  | D2RMonProp
  | D2RQualityItems
  | D2RRunes
  | D2RSetItems
  | D2RSets
  | D2RUniqueItems;

type ExcelStatTuple<T extends ExcelWithStatKeys> = [
  string,
  (keyof T) | undefined,
  (keyof T)[],
  (keyof T)[],
  (keyof T)[],
  (keyof T)[],
];

const _AutomagicTuple: ExcelStatTuple<D2RAutomagic> = [
  "automagic.txt",
  "name",
  ["mod1code", "mod2code", "mod3code"],
  ["mod1param", "mod2param", "mod3param"],
  ["mod1min", "mod2min", "mod3min"],
  ["mod1max", "mod2max", "mod3max"],
];
const _CubemainTuple: ExcelStatTuple<D2RCubemain> = [
  "cubemain.txt",
  "description",
  [
    "mod 1",
    "mod 2",
    "mod 3",
    "mod 4",
    "mod 5",
    "b mod 1",
    "b mod 2",
    "b mod 3",
    "b mod 4",
    "b mod 5",
    "c mod 1",
    "c mod 2",
    "c mod 3",
    "c mod 4",
    "c mod 5",
  ],
  [
    "mod 1 param",
    "mod 2 param",
    "mod 3 param",
    "mod 4 param",
    "mod 5 param",
    "b mod 1 param",
    "b mod 2 param",
    "b mod 3 param",
    "b mod 4 param",
    "b mod 5 param",
    "c mod 1 param",
    "c mod 2 param",
    "c mod 3 param",
    "c mod 4 param",
    "c mod 5 param",
  ],
  [
    "mod 1 min",
    "mod 2 min",
    "mod 3 min",
    "mod 4 min",
    "mod 5 min",
    "b mod 1 min",
    "b mod 2 min",
    "b mod 3 min",
    "b mod 4 min",
    "b mod 5 min",
    "c mod 1 min",
    "c mod 2 min",
    "c mod 3 min",
    "c mod 4 min",
    "c mod 5 min",
  ],
  [
    "mod 1 max",
    "mod 2 max",
    "mod 3 max",
    "mod 4 max",
    "mod 5 max",
    "b mod 1 max",
    "b mod 2 max",
    "b mod 3 max",
    "b mod 4 max",
    "b mod 5 max",
    "c mod 1 max",
    "c mod 2 max",
    "c mod 3 max",
    "c mod 4 max",
    "c mod 5 max",
  ],
];
const _GemsTuple: ExcelStatTuple<D2RGems> = ["gems.txt", "name", [
  "weaponmod1code",
  "weaponmod2code",
  "weaponmod3code",
  "helmmod1code",
  "helmmod2code",
  "helmmod3code",
  "shieldmod1code",
  "shieldmod2code",
  "shieldmod3code",
], [
  "weaponmod1param",
  "weaponmod2param",
  "weaponmod3param",
  "helmmod1param",
  "helmmod2param",
  "helmmod3param",
  "shieldmod1param",
  "shieldmod2param",
  "shieldmod3param",
], [
  "weaponmod1min",
  "weaponmod2min",
  "weaponmod3min",
  "helmmod1min",
  "helmmod2min",
  "helmmod3min",
  "shieldmod1min",
  "shieldmod2min",
  "shieldmod3min",
], [
  "weaponmod1max",
  "weaponmod2max",
  "weaponmod3max",
  "helmmod1max",
  "helmmod2max",
  "helmmod3max",
  "shieldmod1max",
  "shieldmod2max",
  "shieldmod3max",
]];
const _MagicPrefixTuple: ExcelStatTuple<D2RMagicBase> = [
  "magicprefix.txt",
  "name",
  [
    "mod1code",
    "mod2code",
    "mod3code",
  ],
  ["mod1param", "mod2param", "mod3param"],
  ["mod1min", "mod2min", "mod3min"],
  ["mod1max", "mod2max", "mod3max"],
];
const _MagicSuffixTuple: ExcelStatTuple<D2RMagicBase> = [
  "magicsuffix.txt",
  "name",
  [
    "mod1code",
    "mod2code",
    "mod3code",
  ],
  ["mod1param", "mod2param", "mod3param"],
  ["mod1min", "mod2min", "mod3min"],
  ["mod1max", "mod2max", "mod3max"],
];
const _MonPropTuple: ExcelStatTuple<D2RMonProp> = [
  "monprop.txt",
  "id",
  [
    "prop1",
    "prop2",
    "prop3",
    "prop4",
    "prop5",
    "prop6",
    "prop1 (n)",
    "prop2 (n)",
    "prop3 (n)",
    "prop4 (n)",
    "prop5 (n)",
    "prop6 (n)",
    "prop1 (h)",
    "prop2 (h)",
    "prop3 (h)",
    "prop4 (h)",
    "prop5 (h)",
    "prop6 (h)",
  ],
  [
    "par1",
    "par2",
    "par3",
    "par4",
    "par5",
    "par6",
    "par1 (n)",
    "par2 (n)",
    "par3 (n)",
    "par4 (n)",
    "par5 (n)",
    "par6 (n)",
    "par1 (h)",
    "par2 (h)",
    "par3 (h)",
    "par4 (h)",
    "par5 (h)",
    "par6 (h)",
  ],
  [
    "min1",
    "min2",
    "min3",
    "min4",
    "min5",
    "min6",
    "min1 (n)",
    "min2 (n)",
    "min3 (n)",
    "min4 (n)",
    "min5 (n)",
    "min6 (n)",
    "min1 (h)",
    "min2 (h)",
    "min3 (h)",
    "min4 (h)",
    "min5 (h)",
    "min6 (h)",
  ],
  [
    "max1",
    "max2",
    "max3",
    "max5",
    "max5",
    "max6",
    "max1 (n)",
    "max2 (n)",
    "max3 (n)",
    "max4 (n)",
    "max5 (n)",
    "max6 (n)",
    "max1 (h)",
    "max2 (h)",
    "max3 (h)",
    "max4 (h)",
    "max5 (h)",
    "max6 (h)",
  ],
];
const _QualityItemsTuple: ExcelStatTuple<D2RQualityItems> = [
  "qualityitems.txt",
  undefined,
  ["mod1code", "mod2code"],
  ["mod1param", "mod2param"],
  ["mod1min", "mod2min"],
  ["mod1max", "mod2max"],
];
const _RunesTuple: ExcelStatTuple<D2RRunes> = [
  "runes.txt",
  "name",
  ["t1code1", "t1code2", "t1code3", "t1code4", "t1code5", "t1code6", "t1code7"],
  [
    "t1param1",
    "t1param2",
    "t1param3",
    "t1param4",
    "t1param5",
    "t1param6",
    "t1param7",
  ],
  ["t1min1", "t1min2", "t1min3", "t1min4", "t1min5", "t1min6", "t1min7"],
  ["t1max1", "t1max2", "t1max3", "t1max4", "t1max5", "t1max6", "t1max7"],
];
const _SetItemsTuple: ExcelStatTuple<D2RSetItems> = [
  "setitems.txt",
  "index",
  [
    "prop1",
    "prop2",
    "prop3",
    "prop4",
    "prop5",
    "prop6",
    "prop7",
    "prop8",
    "prop9",
    "aprop1a",
    "aprop2a",
    "aprop3a",
    "aprop4a",
    "aprop5a",
    "aprop1b",
    "aprop2b",
    "aprop3b",
    "aprop4b",
    "aprop5b",
  ],
  [
    "par1",
    "par2",
    "par3",
    "par4",
    "par5",
    "par6",
    "par7",
    "par8",
    "par9",
    "apar1a",
    "apar2a",
    "apar3a",
    "apar4a",
    "apar5a",
    "apar1b",
    "apar2b",
    "apar3b",
    "apar4b",
    "apar5b",
  ],
  [
    "min1",
    "min2",
    "min3",
    "min4",
    "min5",
    "min6",
    "min7",
    "min8",
    "min9",
    "amin1a",
    "amin2a",
    "amin3a",
    "amin4a",
    "amin5a",
    "amin1b",
    "amin2b",
    "amin3b",
    "amin4b",
    "amin5b",
  ],
  [
    "max1",
    "max2",
    "max3",
    "max4",
    "max5",
    "max6",
    "max7",
    "max8",
    "max9",
    "amax1a",
    "amax2a",
    "amax3a",
    "amax4a",
    "amax5a",
    "amax1b",
    "amax2b",
    "amax3b",
    "amax4b",
    "amax5b",
  ],
];
const _SetsTuple: ExcelStatTuple<D2RSets> = [
  "sets.txt",
  "index",
  [
    "pcode2a",
    "pcode3a",
    "pcode4a",
    "pcode5a",
    "pcode2b",
    "pcode3b",
    "pcode4b",
    "pcode5b",
    "fcode1",
    "fcode2",
    "fcode3",
    "fcode4",
    "fcode5",
    "fcode6",
    "fcode7",
    "fcode8",
  ],
  [
    "pparam2a",
    "pparam3a",
    "pparam4a",
    "pparam5a",
    "pparam2b",
    "pparam3b",
    "pparam4b",
    "pparam5b",
    "fparam1",
    "fparam2",
    "fparam3",
    "fparam4",
    "fparam5",
    "fparam6",
    "fparam7",
    "fparam8",
  ],
  [
    "pmin2a",
    "pmin3a",
    "pmin4a",
    "pmin5a",
    "pmin2b",
    "pmin3b",
    "pmin4b",
    "pmin5b",
    "fmin1",
    "fmin2",
    "fmin3",
    "fmin4",
    "fmin5",
    "fmin6",
    "fmin7",
    "fmin8",
  ],
  [
    "pmax2a",
    "pmax3a",
    "pmax4a",
    "pmax5a",
    "pmax2b",
    "pmax3b",
    "pmax4b",
    "pmax5b",
    "fmax1",
    "fmax2",
    "fmax3",
    "fmax4",
    "fmax5",
    "fmax6",
    "fmax7",
    "fmax8",
  ],
];
const _UniquesTuple: ExcelStatTuple<D2RUniqueItems> = [
  "uniqueitems.txt",
  "index",
  [
    "prop1",
    "prop2",
    "prop3",
    "prop4",
    "prop5",
    "prop6",
    "prop7",
    "prop8",
    "prop9",
    "prop10",
    "prop11",
    "prop12",
  ],
  [
    "par1",
    "par2",
    "par3",
    "par4",
    "par5",
    "par6",
    "par7",
    "par8",
    "par9",
    "par10",
    "par11",
    "par12",
  ],
  [
    "min1",
    "min2",
    "min3",
    "min4",
    "min5",
    "min6",
    "min7",
    "min8",
    "min9",
    "min10",
    "min11",
    "min12",
  ],
  [
    "max1",
    "max2",
    "max3",
    "max4",
    "max5",
    "max6",
    "max7",
    "max8",
    "max9",
    "max10",
    "max11",
    "max12",
  ],
];

const ExcelStatTuples = [
  _AutomagicTuple,
  _CubemainTuple,
  _GemsTuple,
  _MagicPrefixTuple,
  _MagicSuffixTuple,
  _MonPropTuple,
  _QualityItemsTuple,
  _RunesTuple,
  _SetItemsTuple,
  _SetsTuple,
  _UniquesTuple,
];

/**
 * Verify valid stat ranges
 */
@lintrule
export class ValidStatParameters extends Rule {
  GetRuleName() {
    return "Items/ValidStatParameters";
  }

  Evaluate(workspace: Workspace) {
    const {
      autoMagic,
      gems,
      itemStatCost,
      properties,
      magicPrefix,
      magicSuffix,
      monProp,
      qualityItems,
      runes,
      setItems,
      sets,
      skills,
      uniqueItems,
    } = workspace;

    // ensure properties and itemStatCost are valid
    if (
      itemStatCost === undefined || properties === undefined ||
      skills === undefined
    ) {
      return;
    }

    // iterate over all relevant sets of records
    [
      autoMagic,
      gems,
      magicPrefix,
      magicSuffix,
      monProp,
      qualityItems,
      runes,
      setItems,
      sets,
      uniqueItems,
    ].forEach((records) => {
      if (records === undefined || records.length === 0) {
        return;
      }

      // Find entry in tuple table that matches this file name
      const fileName = records[0].GetFileName();
      const tuple = ExcelStatTuples.find((est) => est[0] === fileName);
      if (tuple === undefined) {
        // unsure.
        return;
      }

      const nameField = tuple[1];
      const propFields = tuple[2];
      const parFields = tuple[3];
      const minFields = tuple[4];
      const maxFields = tuple[5];

      // ... for each record...
      records.forEach((record: any, lineNum) => {
        // ... iterate over each set of fields ....
        propFields.forEach((propField, idx) => {
          const parField = parFields[idx];
          const minField = minFields[idx];
          const maxField = maxFields[idx];
          const property = record[propField];
          const excelRecord = record as D2RExcelRecord;

          if (property === "" || property === undefined) {
            // just bail, the prop field isn't declared
            return;
          }

          // Look up the record in properties.txt
          const foundProperty = properties.find((prop) =>
            prop.code === property
          );
          if (foundProperty === undefined) {
            // just bail. invalid property. this will trigger another kind of rule breakage
            return;
          }

          const itemPar = record[parField];
          const itemMinLoaded = record[minField];
          const itemMaxLoaded = record[maxField];

          const itemMin = itemMinLoaded === "" ? 0 : parseInt(itemMinLoaded);
          const itemMax = itemMaxLoaded === "" ? 0 : parseInt(itemMaxLoaded);

          const warn = (msg: string) => {
            if (nameField === undefined) {
              this.Warn(
                `${excelRecord.GetFileName()}, line ${lineNum + 2}: ${msg}`,
              );
            } else {
              this.Warn(
                `${excelRecord.GetFileName()}, line ${
                  lineNum + 2
                }: ${msg} for '${record[nameField]}'`,
              );
            }
          };

          // On -each- of the stats listed on the property record, evaluate.
          [
            ["func1", "stat1"],
            ["func2", "stat2"],
            ["func3", "stat3"],
            ["func4", "stat4"],
            ["func5", "stat5"],
            ["func6", "stat6"],
            ["func7", "stat7"],
          ]
            .forEach((statField) => {
              const func = statField[0] as keyof D2RProperties;
              const stat = statField[1] as keyof D2RProperties;
              const funcValue = foundProperty[func];
              const statValue = foundProperty[stat];
              if (statValue === "") {
                return; // don't bother, it's blank.
              }
              if (funcValue === "17") {
                return; // encoded as PARAMETER, skip.
              }

              // Look up the record in itemstatcost.txt
              const foundIsc = itemStatCost.find((isc) =>
                isc.stat === statValue
              );
              if (foundIsc === undefined) {
                // again, don't trigger a warning here. it's fine. other rules will handle it
                return;
              }

              // FIRST: check to see if Encode is 1, 2, or 3
              // If it is, then we check the parameter to see if it's a valid skill.
              if (
                foundIsc.encode === "1" || foundIsc.encode === "2" ||
                foundIsc.encode === "3"
              ) {
                const itemParAsNumber = parseInt(itemPar);
                let itemParAsSkillId = itemParAsNumber;
                if (isNaN(itemParAsSkillId)) { // if is NaN, then it's text. Try loading from skills.txt
                  let newId = 0;
                  const foundSkill = skills.find((sk, id) => {
                    const skillName = sk.skill as string;
                    const skillNameLc = skillName.toLocaleLowerCase();

                    if (skillName === itemPar || skillNameLc === itemPar) {
                      newId = id;
                      return true;
                    }
                    return false;
                  });
                  if (foundSkill !== undefined) {
                    itemParAsSkillId = newId;
                  }
                }

                if (isNaN(itemParAsSkillId)) {
                  // WARN! Skill not found
                  warn(`skill with id '${itemPar}' not found on '${parField}'`);
                } else if (skills.length < itemParAsSkillId) {
                  // WARN! invalid skill id
                  warn(
                    `invalid skill id (found: ${itemParAsSkillId}, max: ${skills.length})`,
                  );
                }
                // Calculating save bits and save add don't work here
                return;
              }

              const saveBits = foundIsc["save bits"] === ""
                ? 0
                : parseInt(foundIsc["save bits"] as string);
              const saveAdd = foundIsc["save add"] === ""
                ? 0
                : parseInt(foundIsc["save add"] as string);

              if (!isNaN(saveBits) && !isNaN(saveAdd) && saveBits > 0) {
                const saveBitsMax = Math.pow(2, saveBits) - saveAdd;

                if (itemMin > saveBitsMax && funcValue !== "16") {
                  warn(
                    `'${minField}': value (${itemMin}) above save bits maximum (${saveBitsMax})`,
                  );
                }

                if (itemMax > saveBitsMax && funcValue !== "15") {
                  warn(
                    `'${maxField}': value (${itemMax}) above save bits maximum (${saveBitsMax})`,
                  );
                }

                if (
                  foundIsc.signed === "1" && funcValue !== "18" &&
                  funcValue !== "19"
                ) {
                  // also check minimum values
                  if (itemMin < -saveAdd && funcValue !== "16") {
                    warn(
                      `'${minField}': value (${itemMin}) below save add minimum (${-saveAdd})`,
                    );
                  }

                  if (itemMax < -saveAdd && funcValue !== "15") {
                    warn(
                      `'${maxField}': value (${itemMax}) below save add minimum (${-saveAdd})`,
                    );
                  }
                }
              }
            });
        });
      });
    });
  }
}
