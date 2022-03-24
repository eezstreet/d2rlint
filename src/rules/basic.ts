import { seq } from "../lib/misc.ts";
import { lintrule, Rule } from "../lib/rule.ts";
import {
  D2RCharStats,
  D2RExcelRecord,
  D2RHireling,
  D2RItemTypes,
  D2RLevels,
  D2RMonEquip,
  D2RMonStats,
  D2RMonType,
  D2RMonUMod,
  D2RQualityItems,
  D2RRareBase,
  D2RRunes,
  D2RSetItems,
  D2RSets,
  D2RSkillDesc,
  D2RSkills,
  D2RStates,
  FindMatchingStringIndex,
  Workspace,
} from "../lib/workspace.ts";

/**
 * No duplicate entries allowed.
 */
@lintrule
export class NoDuplicates extends Rule {
  GetRuleName(): string {
    return "Basic/NoDuplicateExcel";
  }

  Evaluate(workspace: Workspace) {
    const anyDuplicates = <T extends D2RExcelRecord>(
      fileName: string,
      records: T[] | undefined,
      field: keyof T,
    ) => {
      if (records === undefined) {
        return;
      }

      for (let i = 0; i < records.length; i++) {
        const thisField = records[i][field];
        for (let j = i + 1; j < records.length; j++) {
          if (
            thisField === records[j][field] &&
            thisField as unknown as string !== ""
          ) {
            this.Warn(
              `${fileName} - duplicate detected on lines ${i + 1} and ${
                j + 1
              } for field '${field}' (${thisField})`,
            );
          }
        }
      }
    };

    anyDuplicates("itemstatcost.txt", workspace.itemStatCost, "stat");
    anyDuplicates("itemtypes.txt", workspace.itemTypes, "code");
    anyDuplicates("levels.txt", workspace.levels, "id");
    anyDuplicates("lvlprest.txt", workspace.lvlPrest, "def");
    anyDuplicates("lvlsub.txt", workspace.lvlSub, "name");
    anyDuplicates("lvltypes.txt", workspace.lvlTypes, "name");
    anyDuplicates("lvlwarp.txt", workspace.lvlWarp, "name");
    anyDuplicates("missiles.txt", workspace.missiles, "missile");
    anyDuplicates("monai.txt", workspace.monAi, "ai");
    anyDuplicates("monmode.txt", workspace.monMode, "code");
    anyDuplicates("monmode.txt", workspace.monMode, "name");
    //anyDuplicates("monmode.txt", workspace.monMode, "token");
    anyDuplicates("monplace.txt", workspace.monPlace, "code");
    anyDuplicates("monsounds.txt", workspace.monSounds, "id");
    anyDuplicates("monstats.txt", workspace.monStats, "id");
    anyDuplicates("monstats2.txt", workspace.monStats2, "id");
    anyDuplicates("monumod.txt", workspace.monUMod, "uniquemod");
    anyDuplicates("monumod.txt", workspace.monUMod, "id");
    anyDuplicates("npc.txt", workspace.npc, "npc");
    anyDuplicates("objects.txt", workspace.objects, "class");
    //anyDuplicates("objgroup.txt", workspace.objGroup, "groupname");
    //anyDuplicates("objpreset.txt", workspace.objPreset, "index");
    anyDuplicates("overlay.txt", workspace.overlay, "overlay");
    anyDuplicates("pettype.txt", workspace.petType, "pet type");
    anyDuplicates("properties.txt", workspace.properties, "code");
    anyDuplicates("shrines.txt", workspace.shrines, "name");
    anyDuplicates("skills.txt", workspace.skills, "skill");
    anyDuplicates("states.txt", workspace.states, "state");
    anyDuplicates("superuniques.txt", workspace.superUniques, "superunique");
    anyDuplicates(
      "treasureclassex.txt",
      workspace.treasureClassEx,
      "treasure class",
    );
  }
}

/**
 * Ensure that Excel files have the correct columns.
 * @lintrule intentionally skipped here because we don't want to auto-evaluate this one
 */
export class ExcelColumns extends Rule {
  GetRuleName(): string {
    return "Basic/ExcelColumns";
  }

  Evaluate() {
  }

  Check<T extends D2RExcelRecord>(
    headerFields: { field: string; idx: number }[],
    generic: T,
  ) {
    const keys = Object.keys(generic);

    // Warn if there are non-standard columns in use
    headerFields.forEach((field) => {
      if (!keys.includes(field.field)) {
        this.Warn(
          `${generic.GetFileName()} - non-standard column '${field.field}' found`,
        );
      }
    });

    // Warn if any non-optional columns are missing
    const optional = generic.GetOptionalFields();
    keys.forEach((key) => {
      if (optional.includes(key)) {
        return; // skip optional
      }
      if (headerFields.find((field) => field.field === key) === undefined) {
        this.Warn(`${generic.GetFileName()} - missing column '${key}'`);
      }
    });
  }
}

/**
 * Link Excel fields together.
 */
@lintrule
export class LinkedExcel extends Rule {
  GetRuleName(): string {
    return "Basic/LinkedExcel";
  }

  Evaluate(workspace: Workspace) {
    // mustExist(misc, 'type', 'code', itemtypes, 'code', true) = "if 'code' is not null for some entry in misc and 'type' doesn't link to a 'code' in itemtypes.txt, warn."
    type ExistOptions = {
      caseSensitive?: boolean;
      allowNull?: boolean;
      nullChecker?: (s: string) => boolean;
    };

    const mustExist = <
      A extends D2RExcelRecord,
      B extends D2RExcelRecord,
      Ak extends keyof A = keyof A,
      Bk extends keyof B = keyof B,
    >(
      a: A[] | undefined,
      al: Ak,
      unl: Ak,
      b: B[] | undefined,
      bl: Bk,
      options?: ExistOptions,
    ) => {
      if (a === undefined) {
        return;
      }

      if (options === undefined) {
        options = {
          caseSensitive: true,
          allowNull: false,
          nullChecker: (s: string) => s === "",
        };
      } else if (options.nullChecker === undefined) {
        options.nullChecker = (s: string) => s === "";
      }

      const { caseSensitive, allowNull, nullChecker } = options;

      a.forEach((item, i) => {
        const key = item[unl] as unknown as string;
        if (
          key === "" || key === "Expansion" || key === "*end*  do not remove"
        ) {
          return; // skip, because this entry is null
        }

        const val = item[al] as unknown;
        if (
          allowNull === true && nullChecker !== undefined &&
          nullChecker(val as string)
        ) {
          return;
        }

        if (b !== undefined) {
          if (
            caseSensitive !== false && !b.some((item2) => item2[bl] === val)
          ) {
            this.Warn(
              `${item.GetFileName()}, line ${
                i + 1
              }: ${al} '${val}' not found for '${key}'`,
            );
          } else if (
            !b.some((item2) =>
              (item2[bl] as unknown as string).toLocaleLowerCase() ===
                (val as unknown as string).toLocaleLowerCase()
            )
          ) {
            this.Warn(
              `${item.GetFileName()}, line ${
                i + 1
              }: ${al} '${val}' not found for '${key}'`,
            );
          }
        }
      });
    };

    const {
      armor,
      bodyLocs,
      charStats,
      colors,
      events,
      gamble,
      gems,
      hireling,
      itemTypes,
      itemStatCost,
      levels,
      lowQualityItems,
      magicPrefix,
      magicSuffix,
      misc,
      missiles,
      monEquip,
      monProp,
      monSounds,
      monStats,
      monStats2,
      monType,
      monUMod,
      npc,
      objects,
      overlay,
      petType,
      properties,
      qualityItems,
      rarePrefix,
      rareSuffix,
      runes,
      setItems,
      sets,
      shrines,
      skills,
      skillDesc,
      sounds,
      states,
      superUniques,
      treasureClassEx,
      uniqueApellation,
      uniquePrefix,
      uniqueItems,
      uniqueSuffix,
      weapons,
    } = workspace;

    const allItems =
      armor !== undefined && misc !== undefined && weapons !== undefined
        ? armor.concat(misc).concat(weapons)
        : [];
    const multifield1 = <T>(base: string, rng: number, start = 1) =>
      seq(start, rng).map((v) => `${base}${v}`) as (keyof T)[];
    const multifield2 = <T>(
      prefix: string,
      suffix: string,
      rng: number,
      start = 1,
    ) => seq(start, rng).map((v) => `${prefix}${v}${suffix}`) as (keyof T)[];

    const isOptional = { allowNull: true };

    const itemCheckerXXX = (s: string) =>
      s === "" || s === "xxx" || s === undefined;
    [armor, misc, weapons].forEach((itemFile) => {
      // ensure armor/misc/weapons "type" and "type2" point to valid "code" in itemtypes.txt
      mustExist(itemFile, "type", "code", itemTypes, "code");
      mustExist(itemFile, "type2", "code", itemTypes, "code", isOptional);
      // ensure normcode/ubercode/ultracode in armor/misc/weapons points to valid entries
      mustExist(itemFile, "normcode", "code", allItems, "code", {
        allowNull: true,
        nullChecker: itemCheckerXXX,
      });
      mustExist(itemFile, "ubercode", "code", allItems, "code", {
        allowNull: true,
        nullChecker: itemCheckerXXX,
      });
      mustExist(itemFile, "ultracode", "code", allItems, "code", {
        allowNull: true,
        nullChecker: itemCheckerXXX,
      });
      // ensure tmogtype points to valid entries
      mustExist(itemFile, "tmogtype", "code", allItems, "code", {
        allowNull: true,
        nullChecker: itemCheckerXXX,
      });
    });

    // ensure item1-10 in charstats.txt point to valid "code" in armor/misc/weapons
    const csitemFields = multifield1<D2RCharStats>("item", 10);
    csitemFields.forEach((field) =>
      mustExist(
        charStats,
        field,
        "class",
        allItems,
        "code",
        { allowNull: true, nullChecker: (s) => s === "" || s === "0" },
      )
    );

    // ensure item1loc-item10loc in charstats.txt point to valid "code" in bodylocs
    const itemLocFields = multifield2<D2RCharStats>("item", "loc", 10);
    itemLocFields.forEach((field) =>
      mustExist(charStats, field, "class", bodyLocs, "code")
    );

    // ensure skill 1 - skill 10 in charstats.txt point to valid "skill" in skills.txt
    const csskillFields = multifield1<D2RCharStats>("skill ", 10);
    csskillFields.forEach((field) =>
      mustExist(charStats, field, "class", skills, "skill", isOptional)
    );

    // ensure startskill in charstats.txt point to valid "skill" in Skills.txt
    mustExist(charStats, "startskill", "class", skills, "skill", {
      allowNull: true,
      caseSensitive: false,
    });

    // ensure "code" in gamble.txt matches one in armor/misc/weapons
    mustExist(gamble, "code", "code", allItems, "code");

    // ensure "code" in gems.txt matches one in armor/misc/weapons
    mustExist(gems, "code", "code", allItems, "code");

    // ensure skill1-6 in hireling.txt points to valid "skill" in skills.txt
    const hlskillFields = multifield1<D2RHireling>("skill", 6);
    hlskillFields.forEach((field) =>
      mustExist(hireling, field, "hireling", skills, "skill", {
        allowNull: true,
      })
    );

    // ensure equiv1 and equiv2 point to valid "code" in itemtypes.txt
    const itequivFields = multifield1<D2RItemTypes>("equiv", 2);
    itequivFields.forEach((field) =>
      mustExist(itemTypes, field, "code", itemTypes, "code", {
        allowNull: true,
      })
    );

    // ensure mon1-25, umon1-25 and nmon1-25 in levels.txt point to valid entries in monstats.txt
    const monstersFields = multifield1<D2RLevels>("mon", 25);
    const umonFields = multifield1<D2RLevels>("umon", 25);
    const nmonFields = multifield1<D2RLevels>("nmon", 25);

    [monstersFields, umonFields, nmonFields].forEach((fieldSet) =>
      fieldSet.forEach((field) => {
        mustExist(levels, field, "name", monStats, "id", { allowNull: true });
      })
    );

    // ensure "monster" in monequip.txt point to valid entries in monstats.txt
    mustExist(monEquip, "monster", "monster", monStats, "id");

    // ensure item1-3 in monequip.txt point to valid entries in armor/misc/weapons
    const meItemFields = multifield1<D2RMonEquip>("item", 3);
    meItemFields.forEach((field) =>
      mustExist(monEquip, field, "monster", allItems, "code")
    );

    // ensure loc1-3 in monequip.txt point to valid entries in bodyloc
    const meLocFields = multifield1<D2RMonEquip>("loc", 3);
    meLocFields.forEach((field) =>
      mustExist(monEquip, field, "monster", bodyLocs, "code")
    );

    // ensure baseid in monstats.txt is a valid entry in monstats.txt
    mustExist(monStats, "baseid", "id", monStats, "id");

    // ensure monstatsex in monstats.txt is a valid entry in monstats2.txt
    mustExist(monStats, "monstatsex", "id", monStats2, "id");

    // ensure montype in monstats.txt is a valid entry in montype.txt
    mustExist(monStats, "montype", "id", monType, "type");

    // ensure monprop in monstats.txt is a valid entry in monprop.txt
    mustExist(monStats, "monprop", "id", monProp, "id", isOptional);

    // ensure monsound and umonsound in monstats.txt is a valid entry in monsounds.txt
    mustExist(monStats, "monsound", "id", monSounds, "id");
    mustExist(monStats, "umonsound", "id", monSounds, "id");

    // ensure skill1-skill8 in monstats.txt point to valid entries in skill.txt
    const msSkillFields = multifield1<D2RMonStats>("skill", 8);
    msSkillFields.forEach((skill) =>
      mustExist(monStats, skill, "id", skills, "skill", isOptional)
    );

    // ensure skilldamage in monstats.txt point to valid entries in skills.txt
    mustExist(monStats, "skilldamage", "id", skills, "skill", isOptional);

    // ensure treasureclasses in monstats.txt point to valid entries in treasureclassex.txt
    const ntcFields = multifield1<D2RMonStats>("treasureclass", 4);
    const ntcNFields = multifield2<D2RMonStats>("treasureclass", "(n)", 4);
    const ntcHFields = multifield2<D2RMonStats>("treasureclass", "(h)", 4);

    [ntcFields, ntcNFields, ntcHFields].forEach((fieldSet) =>
      fieldSet.forEach((field) =>
        mustExist(monStats, field, "id", treasureClassEx, "treasure class")
      )
    );

    // ensure ...these fields, are valid entries in missiles.txt
    ([
      "missa1",
      "missa2",
      "missc",
      "misss1",
      "misss2",
      "misss2",
      "misss3",
      "misss4",
      "misssq",
    ] as (keyof D2RMonStats)[]).forEach((field) =>
      mustExist(monStats, field, "code", missiles, "missile", isOptional)
    );

    // ensure equiv1-3 in montypes.txt is either null or valid entry in montypes.txt
    const mteqFields = multifield1<D2RMonType>("equiv", 3);
    mteqFields.forEach((field) =>
      mustExist(monType, field, "type", monType, "type")
    );

    // ensure exclude1-2 in monumod.txt is valid entry in montypes.txt or null
    const muexFields = multifield1<D2RMonUMod>("exclude", 2);
    muexFields.forEach((field) =>
      mustExist(monUMod, field, "uniquemod", monType, "type")
    );

    // ensure npc is valid id in monstats.txt
    mustExist(npc, "npc", "npc", monStats, "id");

    // ensure modXcode is null or valid entry in properties.txt
    const qiModFields = multifield2<D2RQualityItems>("mod", "code", 2);
    qiModFields.forEach((field) =>
      mustExist(qualityItems, field, "mod1code", properties, "code")
    );

    // ensure itype/etype in rareprefix/raresuffix point to valid entries in itemtypes
    const rareIType = multifield1<D2RRareBase>("itype", 7);
    const rareEType = multifield1<D2RRareBase>("etype", 4);
    [rareIType, rareEType].forEach((fieldSet) =>
      fieldSet.forEach((field) => {
        mustExist(rarePrefix, field, "name", itemTypes, "code");
        mustExist(rareSuffix, field, "name", itemTypes, "code");
      })
    );

    // ensure itype/etype in runes point to valid entries in itemtypes
    const runeIType = multifield1<D2RRunes>("itype", 6);
    const runeEType = multifield1<D2RRunes>("etype", 3);
    [runeIType, runeEType].forEach((fieldSet) =>
      fieldSet.forEach((field) => {
        mustExist(runes, field, "name", itemTypes, "code");
      })
    );

    // ensure RuneX in runes points to valid entries in armor/weapons/misc
    const runesX = multifield1<D2RRunes>("rune", 6);
    runesX.forEach((field) =>
      mustExist(runes, field, "name", allItems, "code")
    );

    // ensure TCode1-TCode7 in runes points to valid entries in properties
    const rCodeX = multifield1<D2RRunes>("t1code", 7);
    rCodeX.forEach((field) =>
      mustExist(runes, field, "name", properties, "code", isOptional)
    );

    // ensure set in setItems points to valid entries in sets
    mustExist(setItems, "set", "index", sets, "index");

    // ensure item in setItems points to valid item
    mustExist(setItems, "item", "index", allItems, "code");

    // ensure chrtransform/invtransform point to valid entries in colors.txt
    mustExist(setItems, "chrtransform", "index", colors, "code", isOptional);
    mustExist(setItems, "invtransform", "index", colors, "code", isOptional);

    // ensure dropsound/usesound point to valid entries in sounds.txt
    mustExist(setItems, "dropsound", "index", sounds, "sound", isOptional);
    mustExist(setItems, "usesound", "index", sounds, "sound", isOptional);

    // ensure prop1-9, aprop1a-aprop5a, and aprop1b-aprop5b exist in properties
    const setItemsProps = multifield1<D2RSetItems>("prop", 9);
    const setItemsPropA = multifield2<D2RSetItems>("aprop", "a", 5);
    const setItemsPropB = multifield2<D2RSetItems>("aprop", "b", 5);
    [setItemsProps, setItemsPropA, setItemsPropB].forEach((fieldSet) =>
      fieldSet.forEach((field) =>
        mustExist(setItems, field, "index", properties, "code", isOptional)
      )
    );

    // ensure fcode1-8, pcode2-5a and pcode2-5b in sets.txt exist in properties
    const setFCodes = multifield1<D2RSets>("fcode", 8);
    const setPCodeA = multifield2<D2RSets>("pcode", "a", 5, 2);
    const setPCodeB = multifield2<D2RSets>("pcode", "b", 5, 2);
    [setFCodes, setPCodeA, setPCodeB].forEach((fieldSet) =>
      fieldSet.forEach((field) =>
        mustExist(sets, field, "index", properties, "code", isOptional)
      )
    );

    // ensure skilldesc in skills.txt point to SkillDesc.txt
    mustExist(skills, "skilldesc", "skill", skillDesc, "skilldesc", isOptional);

    // ensure srvmissile, srvmissilea/b/c point to missiles.txt
    const skMissileCheck: (keyof D2RSkills)[] = [
      "srvmissile",
      "srvmissilea",
      "srvmissileb",
      "srvmissilec",
      "cltmissile",
      "cltmissilea",
      "cltmissileb",
      "cltmissilec",
      "cltmissiled",
    ];
    skMissileCheck.forEach((field) =>
      mustExist(skills, field, "skill", missiles, "missile", isOptional)
    );

    // ensure srvoverlay, cltoverlaya/b point to overlay.txt
    const skOverlayCheck: (keyof D2RSkills)[] = [
      "srvoverlay",
      "cltoverlaya",
      "cltoverlayb",
      "sumoverlay",
      "tgtoverlay",
      "prgoverlay",
      "castoverlay",
      "cltoverlaya",
      "cltoverlayb",
      "itemcastoverlay",
    ];
    skOverlayCheck.forEach((field) =>
      mustExist(skills, field, "skill", overlay, "overlay", isOptional)
    );

    // ensure aurastate, auratargetstate, passivestate point to states.txt
    const skStateCheck: (keyof D2RSkills)[] = [
      "aurastate",
      "auratargetstate",
      "passivestate",
    ];
    skStateCheck.forEach((field) =>
      mustExist(skills, field, "skill", states, "state", isOptional)
    );

    // ensure auraevent point to events.txt
    const skEventCheck: (keyof D2RSkills)[] = [
      "auraevent1",
      "auraevent2",
      "auraevent3",
    ];
    skEventCheck.forEach((field) =>
      mustExist(skills, field, "skill", events, "event", isOptional)
    );

    // ensure passiveitype points to entry in itypes.txt
    const skItemTypeCheck: (keyof D2RSkills)[] = [
      "passiveitype",
      "itypea1",
      "itypea2",
      "itypea3",
      "itypeb1",
      "itypeb2",
      "itypeb3",
      "etypea1",
      "etypea2",
      "etypeb1",
      "etypeb2",
    ];
    skItemTypeCheck.forEach((field) =>
      mustExist(skills, field, "skill", itemTypes, "code", isOptional)
    );

    // ensure passivestat, aurastat point to entries in itemstatcost.txt
    const skStatFields: (keyof D2RSkills)[] = [
      ...multifield1<D2RSkills>("aurastat", 6),
      ...multifield1<D2RSkills>("passivestat", 5),
    ];
    skStatFields.forEach((field) =>
      mustExist(skills, field, "skill", itemStatCost, "stat", isOptional)
    );

    // ensure summon is valid entry in monstats.txt
    mustExist(skills, "summon", "skill", monStats, "id", {
      allowNull: true,
      caseSensitive: false,
    });

    // ensure pettype is valid entry in pettype.txt
    mustExist(skills, "pettype", "skill", petType, "pet type", isOptional);

    // ensure sumskillX is valid entry in skills.txt
    const skSkillCheck: (keyof D2RSkills)[] = [
      ...multifield1<D2RSkills>("sumskill", 5),
      ...multifield1<D2RSkills>("reqskill", 3),
    ];
    skSkillCheck.forEach((field) =>
      mustExist(skills, field, "skill", skills, "skill", {
        allowNull: true,
        caseSensitive: false,
      })
    );

    // ensure summonmode is valid mode in monmode.txt
    // ensure monanim is valid mode in monmode.txt
    // TODO

    // ensure sumumod is valid entry in monumod.txt
    mustExist(skills, "sumumod", "skill", monUMod, "id", isOptional);

    // ensure sounds are valid
    const skSoundCheck: (keyof D2RSkills)[] = [
      "stsound",
      "stsoundclass",
      "dosound",
      "dosound a",
      "dosound b",
      "tgtsound",
      "prgsound",
    ];
    skSoundCheck.forEach((field) =>
      mustExist(skills, field, "skill", sounds, "sound")
    );

    // ensure anim is valid entry in playermod.txt
    // ensure seqtrans is valid entry in playermod.txt
    // TODO

    // ensure descMissileX in skilldesc.txt points to valid missiles.txt
    const skdMissileCheck: (keyof D2RSkillDesc)[] = [
      "descmissile1",
      "descmissile2",
      "descmissile3",
    ];
    skdMissileCheck.forEach((field) =>
      mustExist(skillDesc, field, "skilldesc", missiles, "missile", isOptional)
    );

    // ensure overlays in states.txt points to valid overlays
    const stOverlayCheck: (keyof D2RStates)[] = [
      ...multifield1<D2RStates>("overlay", 4),
      "pgsvoverlay",
      "castoverlay",
      "removerlay",
    ];
    stOverlayCheck.forEach((field) =>
      mustExist(states, field, "state", overlay, "overlay", isOptional)
    );

    // ensure missile in states.txt points to valid missile
    mustExist(states, "missile", "state", missiles, "missile", isOptional);

    // ensure skill in states.txt points to valid skill
    mustExist(states, "skill", "state", skills, "skill", {
      allowNull: true,
      caseSensitive: false,
    });

    // ensure itemtype in states.txt points to valid itemtype
    mustExist(states, "itemtype", "state", itemTypes, "code");

    // ensure itemtrans in states.txt points to valid color
    mustExist(states, "itemtrans", "state", colors, "code", isOptional);

    // ensure class in superuniques.txt points to valid monstats
    mustExist(superUniques, "class", "superunique", monStats, "id");

    // ensure monsound in superuniques.txt points to valid monsounds
    mustExist(superUniques, "monsound", "superunique", monSounds, "id");

    // ensure correct treasure classes
    mustExist(
      superUniques,
      "tc",
      "superunique",
      treasureClassEx,
      "treasure class",
      isOptional,
    );
    mustExist(
      superUniques,
      "tc(n)",
      "superunique",
      treasureClassEx,
      "treasure class",
      isOptional,
    );
    mustExist(
      superUniques,
      "tc(h)",
      "superunique",
      treasureClassEx,
      "treasure class",
      isOptional,
    );

    /**
     * NOTE: Treasure class linkage is excluded in this because it's quite complicated.
     */

    // ensure uniqueitems.txt point to valid codes
    mustExist(uniqueItems, "code", "index", allItems, "code");

    // ensure chrtransform and invtransform point to valid colors
    mustExist(uniqueItems, "chrtransform", "index", colors, "code", isOptional);
    mustExist(uniqueItems, "invtransform", "index", colors, "code", isOptional);

    // Check strings!
    const lookForString = <
      T extends D2RExcelRecord,
      U extends keyof T = keyof T,
    >(
      records: T[] | undefined,
      column: U,
      indexColumn: keyof T,
      optional: boolean,
    ) => {
      if (records === undefined) {
        return;
      }

      records.forEach((record, i) => {
        if (
          record[indexColumn] as unknown as string === "Expansion" ||
          record[indexColumn] as unknown as string === "Null" ||
          record[indexColumn] as unknown as string === "" ||
          record[indexColumn] as unknown as string === "Elite Uniques"
        ) {
          return;
        }
        if (
          record[column] === undefined ||
          record[column] as unknown as string === ""
        ) {
          if (optional) {
            return;
          }
          this.Warn(
            `${record.GetFileName()}, line ${i + 1}: ${column} for '${
              record[indexColumn]
            }' is blank but required`,
          );
          return;
        }

        // see if there's a matching string
        if (workspace.strings === undefined) {
          return;
        }

        if (
          FindMatchingStringIndex(
            workspace,
            record[column] as unknown as string,
          ) === undefined
        ) {
          this.Warn(
            `${record.GetFileName()}, line ${i + 1}: couldn't find string '${
              record[column]
            }' for ${column} for '${record[indexColumn]}'`,
          );
        }
      });
    };

    lookForString(armor, "namestr", "name", false);
    lookForString(misc, "namestr", "name", false);
    lookForString(weapons, "namestr", "name", false);

    const csStr: (keyof D2RCharStats)[] = [
      "strskilltab1",
      "strskilltab2",
      "strskilltab3",
      "strclassonly",
      "strallskills",
    ];
    csStr.forEach((field) => lookForString(charStats, field, "class", false));

    const lsStr: (keyof D2RLevels)[] = [
      "levelname",
      "levelwarp",
      "levelentry",
    ];
    lsStr.forEach((field) => lookForString(levels, field, "name", false));

    lookForString(lowQualityItems, "name", "name", false);
    lookForString(magicPrefix, "name", "name", false);
    lookForString(magicSuffix, "name", "name", false);
    lookForString(monStats, "namestr", "id", false);
    lookForString(monStats, "descstr", "id", true);
    lookForString(objects, "name", "class", false);
    lookForString(petType, "name", "pet type", true);
    lookForString(rarePrefix, "name", "name", false);
    lookForString(rareSuffix, "name", "name", false);
    lookForString(runes, "name", "name", false);
    lookForString(setItems, "index", "index", false);
    lookForString(sets, "name", "index", false);
    lookForString(shrines, "stringname", "name", false);
    lookForString(shrines, "stringphrase", "name", false);

    const sdStr: (keyof D2RSkillDesc)[] = [
      "str alt",
      "str long",
      "str name",
      "str short",
      ...multifield1<D2RSkillDesc>("desctexta", 6),
      ...multifield1<D2RSkillDesc>("desctextb", 6),
      ...multifield1<D2RSkillDesc>("dsc2texta", 5),
      ...multifield1<D2RSkillDesc>("dsc2textb", 5),
      ...multifield1<D2RSkillDesc>("dsc3texta", 7),
      ...multifield1<D2RSkillDesc>("dsc3textb", 7),
    ];
    sdStr.forEach((field) =>
      lookForString(skillDesc, field, "skilldesc", true)
    );

    lookForString(superUniques, "name", "superunique", false);
    lookForString(uniqueApellation, "name", "name", false);
    lookForString(uniquePrefix, "name", "name", false);
    lookForString(uniqueSuffix, "name", "name", false);
    lookForString(uniqueItems, "index", "index", false);
  }
}
