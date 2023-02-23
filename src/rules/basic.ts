import { GetConfig } from "../lib/config.ts";
import { seq } from "../lib/misc.ts";
import { lintrule, Rule } from "../lib/rule.ts";
import {
  D2RActInfo,
  D2RAutomagic,
  D2RCharStats,
  D2RExcelRecord,
  D2RGems,
  D2RHireling,
  D2RItemStatCost,
  D2RItemTypes,
  D2RLevels,
  D2RMagicBase,
  D2RMissiles,
  D2RMonEquip,
  D2RMonProp,
  D2RMonSounds,
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
  D2RUniqueItems,
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
            thisField as unknown as string !== "" &&
            thisField as unknown as string !== "Expansion" // HACK
          ) {
            this.Warn(
              `${records[i].GetFileName()} - duplicate detected on lines ${
                i + 2
              } and ${j + 2} for field '${String(field)}' (${thisField})`,
            );
          }
        }
      }
    };

    const config = GetConfig();
    const { armor, misc, weapons } = workspace;
    if (armor !== undefined && misc !== undefined && weapons !== undefined) {
      //anyDuplicates([...armor, ...misc, ...weapons], "name");
      anyDuplicates([...armor, ...misc, ...weapons], "code");
    }
    anyDuplicates(workspace.itemStatCost, "stat");
    anyDuplicates(workspace.itemTypes, "code");
    anyDuplicates(workspace.levels, "id");
    anyDuplicates(workspace.lvlPrest, "def");
    anyDuplicates(workspace.lvlSub, "name");
    anyDuplicates(workspace.lvlTypes, "name");
    anyDuplicates(workspace.lvlWarp, "name");
    anyDuplicates(workspace.missiles, "missile");
    anyDuplicates(workspace.monAi, "ai");
    anyDuplicates(workspace.monMode, "code");
    anyDuplicates(workspace.monMode, "name");
    //anyDuplicates(workspace.monMode, "token");
    anyDuplicates(workspace.monPlace, "code");
    anyDuplicates(workspace.monSounds, "id");
    anyDuplicates(workspace.monStats, "id");
    anyDuplicates(workspace.monStats2, "id");
    anyDuplicates(workspace.monUMod, "uniquemod");
    anyDuplicates(workspace.monUMod, "id");
    anyDuplicates(workspace.npc, "npc");
    if (!config.legacy) {
      anyDuplicates(workspace.objects, "class");
    }
    //anyDuplicates(workspace.objGroup, "groupname");
    //anyDuplicates(workspace.objPreset, "index");
    anyDuplicates(workspace.overlay, "overlay");
    anyDuplicates(workspace.petType, "pet type");
    anyDuplicates(workspace.properties, "code");
    if (!config.legacy) {
      anyDuplicates(workspace.shrines, "name");
    }
    anyDuplicates(workspace.skills, "skill");
    anyDuplicates(workspace.states, "state");
    anyDuplicates(workspace.superUniques, "superunique");
    anyDuplicates(workspace.treasureClassEx, "treasure class");
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
      if (!keys.includes(field.field) && !field.field.startsWith("@")) {
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
    // mustExist(misc, 'type', 'code', itemtypes, 'code', options) = "if 'code' is not null for some entry in misc and 'type' doesn't link to a 'code' in itemtypes.txt, warn."
    // we can put in an "isOptional" in the options to mark that the field is wholly optional
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
          nullChecker: (s: string) => s === "" || s === undefined,
        };
      } else if (options.nullChecker === undefined) {
        options.nullChecker = (s: string) => s === "" || s === undefined;
      }

      const { caseSensitive, allowNull, nullChecker } = options;

      a.forEach((item, i) => {
        const key = item[unl] as unknown as string;
        if (
          key === "" || key === "Expansion" || key === "*end*  do not remove" ||
          key.startsWith("@")
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
              `${item.GetFileName()}, line ${i + 2}: ${
                String(al)
              } '${val}' not found for '${key}'`,
            );
          } else if (
            !b.some((item2) =>
              (item2[bl] as unknown as string).toLocaleLowerCase() ===
                (val as unknown as string).toLocaleLowerCase()
            )
          ) {
            this.Warn(
              `${item.GetFileName()}, line ${i + 2}: ${
                String(al)
              } '${val}' not found for '${key}'`,
            );
          }
        }
      });
    };

    const {
      actInfo,
      armor,
      autoMagic,
      bodyLocs,
      books,
      charStats,
      colors,
      cubemain,
      elemTypes,
      events,
      gamble,
      gems,
      hireling,
      hitclass,
      itemTypes,
      itemStatCost,
      levels,
      lowQualityItems,
      magicPrefix,
      magicSuffix,
      misc,
      missiles,
      monAi,
      monEquip,
      monMode,
      monProp,
      monSeq,
      monSounds,
      monStats,
      monStats2,
      monType,
      monUMod,
      npc,
      objects,
      objGroup,
      objPreset,
      overlay,
      petType,
      playerClass,
      plrMode,
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
      soundEnviron,
      states,
      storePage,
      superUniques,
      treasureClassEx,
      uniqueApellation,
      uniquePrefix,
      uniqueItems,
      uniqueSuffix,
      wanderingMon,
      weapons,
    } = workspace;

    const config = GetConfig();

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
      // ensure autoprefix points to valid entries in automagic.txt
      mustExist(
        itemFile,
        "auto prefix",
        "code",
        autoMagic,
        "group",
        isOptional,
      );
      // ensure stat1-3 points to valid entries in itemstatcost.txt
      mustExist(itemFile, "stat1", "code", itemStatCost, "stat", isOptional);
      mustExist(itemFile, "stat2", "code", itemStatCost, "stat", isOptional);
      mustExist(itemFile, "stat3", "code", itemStatCost, "stat", isOptional);
      // ensure hitclass points to valid entries in hitclass.txt
      mustExist(itemFile, "hit class", "code", hitclass, "code", isOptional);
    });

    // ensure all entries in actinfo.txt are correct
    const actInfoFields: (keyof D2RActInfo)[] = [
      "town",
      "start",
      "classlevelrangestart",
      "classlevelrangeend",
      ...multifield1<D2RActInfo>("waypoint", 9),
    ];
    actInfoFields.forEach((field) =>
      mustExist(actInfo, field, "act", levels, "name", isOptional)
    );

    // ensure classspecific/class in automagic.txt is valid
    mustExist(
      autoMagic,
      "classspecific",
      "name",
      playerClass,
      "code",
      isOptional,
    );
    mustExist(autoMagic, "class", "name", playerClass, "code", isOptional);

    // ensure transformcolor in automagic is accurate
    mustExist(autoMagic, "transformcolor", "name", colors, "code", isOptional);

    // ensure mod1code-mod3code in automagic point to valid properties
    mustExist(autoMagic, "mod1code", "name", properties, "code", isOptional);
    mustExist(autoMagic, "mod2code", "name", properties, "code", isOptional);
    mustExist(autoMagic, "mod3code", "name", properties, "code", isOptional);

    // ensure these fields point to valid item types
    const amITypes: (keyof D2RAutomagic)[] = [
      ...multifield1<D2RAutomagic>("itype", 7),
      ...multifield1<D2RAutomagic>("etype", 5),
    ];
    amITypes.forEach((field) =>
      mustExist(autoMagic, field, "name", itemTypes, "code", isOptional)
    );

    // ensure "scrollskill" and "bookskill" in books.txt point to valid skills
    mustExist(books, "bookskill", "name", skills, "skill", isOptional);
    mustExist(books, "scrollskill", "name", skills, "skill", isOptional);

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

    // ensure "class" in cubemain.txt points to a valid character class
    mustExist(
      cubemain,
      "class",
      "description",
      playerClass,
      "code",
      isOptional,
    );

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

    // ensure Mode1-6 in hireling.txt points to valid modmode.txt entry
    /*const hlModeFields = multifield1<D2RHireling>("mode", 6);
    hlModeFields.forEach((field) =>
      mustExist(hireling, field, "hireling", monMode, "code", isOptional)
    );*/

    // ensure maxstat in itemstatcost.txt points to valid entry
    mustExist(
      itemStatCost,
      "maxstat",
      "stat",
      itemStatCost,
      "stat",
      isOptional,
    );

    // ensure itemeventx in itemstatcost.txt is a valid event
    mustExist(itemStatCost, "itemevent1", "stat", events, "event", isOptional);
    mustExist(itemStatCost, "itemevent2", "stat", events, "event", isOptional);

    // ensure shoots, quiver, equiv1 and equiv2 point to valid "code" in itemtypes.txt
    const itInternalFields: (keyof D2RItemTypes)[] = [
      "equiv1",
      "equiv2",
      "shoots",
      "quiver",
    ];
    itInternalFields.forEach((field) =>
      mustExist(itemTypes, field, "code", itemTypes, "code", isOptional)
    );

    // ensure bodyloc1/bodyloc2 in itemtypes.txt point to valid bodylocs
    mustExist(itemTypes, "bodyloc1", "code", bodyLocs, "code", isOptional);
    mustExist(itemTypes, "bodyloc2", "code", bodyLocs, "code", isOptional);

    // ensure staffmods and class in itemtypes.txt is a valid playerclass
    mustExist(itemTypes, "staffmods", "code", playerClass, "code", isOptional);
    mustExist(itemTypes, "class", "code", playerClass, "code", isOptional);
    // FIXME: add new dualwieldclass1-7

    // ensure storepage in itemtypes.txt is a valid storepage
    mustExist(itemTypes, "storepage", "code", storePage, "code", isOptional);

    // ensure mon1-25, umon1-25 and nmon1-25 in levels.txt point to valid entries in monstats.txt
    const monstersFields = multifield1<D2RLevels>("mon", 25);
    const umonFields = multifield1<D2RLevels>("umon", 25);
    const nmonFields = multifield1<D2RLevels>("nmon", 25);
    const cmonFields = multifield1<D2RLevels>("cmon", 4);

    [monstersFields, umonFields, nmonFields, cmonFields].forEach((fieldSet) =>
      fieldSet.forEach((field) => {
        mustExist(levels, field, "name", monStats, "id", { allowNull: true });
      })
    );

    // ensure soundenv in levels.txt points to valid soundenviron.txt fields
    mustExist(levels, "soundenv", "name", soundEnviron, "index", isOptional);

    // ensure mod1code-mod3code in magicprefix/magicsuffix are valid
    // ensure itype1-7 and etype1-5 in magicprefix/magicsuffix are valid
    // ensure transformcolor in magicprefix/magicsuffix are valid
    // ensure classspecific and class in magicprefix/magicsuffix are valid
    [magicPrefix, magicSuffix].forEach((file) => {
      const modcodes = multifield2<D2RMagicBase>("mod", "code", 3);
      const icodes = [
        ...multifield1<D2RMagicBase>("itype", 7),
        ...multifield1<D2RMagicBase>("etype", 5),
      ];

      modcodes.forEach((field) =>
        mustExist(file, field, "name", properties, "code", isOptional)
      );
      icodes.forEach((field) =>
        mustExist(file, field, "name", itemTypes, "code", isOptional)
      );
      mustExist(file, "transformcolor", "name", colors, "code", isOptional);
      mustExist(file, "classspecific", "name", playerClass, "code", isOptional);
      mustExist(file, "class", "name", playerClass, "code", isOptional);
    });

    // ensure

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

    [
      ...multifield1<D2RMonProp>("prop", 6),
      ...multifield2<D2RMonProp>("prop", " (n)", 6),
      ...multifield2<D2RMonProp>("prop", " (h)", 6),
    ].forEach((field) =>
      mustExist(monProp, field, "id", properties, "code", isOptional)
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
    // the exact name of these fields varies strongly depending on which game version
    const fieldSetChecker = (f: (keyof D2RMonStats)[]) => {
      f.forEach((field) =>
        mustExist(
          monStats,
          field,
          "id",
          treasureClassEx,
          "treasure class",
          isOptional,
        )
      );
    };

    if (config.legacy) {
      const ntcFields = multifield1<D2RMonStats>("treasureclass", 4);
      const ntcNFields = multifield2<D2RMonStats>("treasureclass", "(n)", 4);
      const ntcHFields = multifield2<D2RMonStats>("treasureclass", "(h)", 4);

      [ntcFields, ntcNFields, ntcHFields].forEach(fieldSetChecker);
    } else {
      const monstatKeys: (keyof D2RMonStats)[] = [
        "treasureclass",
        "treasureclass(n)",
        "treasureclass(h)",
        "treasureclasschamp",
        "treasureclasschamp(n)",
        "treasureclasschamp(h)",
        "treasureclassunique",
        "treasureclassunique(n)",
        "treasureclassunique(h)",
        "treasureclassquest",
        "treasureclassquest(n)",
        "treasureclassquest(h)",
        "treasureclassdesecrated",
        "treasureclassdesecrated(n)",
        "treasureclassdesecrated(h)",
      ];

      monstatKeys.forEach((field) =>
        mustExist(
          monStats,
          field,
          "id",
          treasureClassEx,
          "treasure class",
          isOptional,
        )
      );
    }

    // ensure that AI in monstats.txt is valid
    mustExist(monStats, "ai", "id", monAi, "ai");

    // ensure that minion1/minion2 in monstats.txt is valid
    mustExist(monStats, "minion1", "id", monStats, "id", isOptional);
    mustExist(monStats, "minion2", "id", monStats, "id", isOptional);

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
      mustExist(monStats, field, "id", missiles, "missile", isOptional)
    );

    // ensure "Skill" in missiles.txt points to a valid skill.txt entry
    mustExist(missiles, "skill", "missile", skills, "skill", isOptional);

    // ensure "etype" in missiles.txt points to a valid elemtype.txt entry
    mustExist(missiles, "etype", "missile", elemTypes, "code", isOptional);

    // ensure "travelsound", "hitsound" and "progsound" in missiles.txt points to a valid sounds.txt entry
    mustExist(missiles, "travelsound", "missile", sounds, "sound", isOptional);
    mustExist(missiles, "hitsound", "missile", sounds, "sound", isOptional);
    mustExist(missiles, "progsound", "missile", sounds, "sound", isOptional);

    // ensure "progoverlay" in missiles.txt points to a valid overlay entry
    mustExist(
      missiles,
      "progoverlay",
      "missile",
      overlay,
      "overlay",
      isOptional,
    );

    // ensure these missile fields in missiles.txt point to valid entries
    const missSubEntries: (keyof D2RMissiles)[] = [
      "explosionmissile",
      "submissile1",
      "submissile2",
      "submissile3",
      "hitsubmissile1",
      "hitsubmissile2",
      "hitsubmissile3",
      "hitsubmissile4",
      "clthitsubmissile1",
      "clthitsubmissile2",
      "clthitsubmissile3",
      "clthitsubmissile4",
      "cltsubmissile1",
      "cltsubmissile2",
      "cltsubmissile3",
    ];
    missSubEntries.forEach((field) =>
      mustExist(missiles, field, "missile", missiles, "missile", isOptional)
    );

    // ensure the following are valid entries in monmode.txt:
    const mstModeFields: (keyof D2RMonStats)[] = [
      "spawnmode",
      "el1mode",
      "el2mode",
      "el3mode",
    ];
    mstModeFields.forEach((field) =>
      mustExist(monStats, field, "id", monMode, "code", {
        allowNull: true,
        nullChecker: (s) => s === "xx" || s === "XX" || s === "",
      })
    );

    // ensure the following are valid entries in elemtypes.txt:
    const mstElemFields: (keyof D2RMonStats)[] = [
      "el1type",
      "el2type",
      "el3type",
    ];
    mstElemFields.forEach((field) =>
      mustExist(monStats, field, "id", elemTypes, "code", isOptional)
    );

    // ensure skxmode is valid monmode.txt or monseq.txt entry
    const msSeqEntries: [keyof D2RMonStats, keyof D2RMonStats][] = [
      ["skill1", "sk1mode"],
      ["skill2", "sk2mode"],
      ["skill3", "sk3mode"],
      ["skill4", "sk4mode"],
      ["skill5", "sk5mode"],
      ["skill6", "sk6mode"],
      ["skill7", "sk7mode"],
      ["skill8", "sk8mode"],
    ];
    if (
      monStats !== undefined && monMode !== undefined && monSeq !== undefined
    ) {
      msSeqEntries.forEach((seqEntry) => {
        monStats.forEach((mon, line) => {
          const skill = seqEntry[0];
          const mode = seqEntry[1];

          if (mon[skill] === "") {
            return; // blank skill, just ignore
          }

          const modeEntry = mon[mode];
          // see if it's a valid mode in monMode.txt
          if (monMode.some((record) => record.code === modeEntry)) {
            return;
          }
          // see if it's a valid seq in monSeq.txt
          if (monSeq.some((record) => record.sequence === modeEntry)) {
            return;
          }

          this.Warn(
            `${mon.GetFileName()}, line ${
              line + 2
            }: could not find mode '${modeEntry}' for '${mode}'`,
          );
        });
      });
    }

    // ensure these fields in monsounds point to valid sounds.txt entries:
    const msSoundFields: (keyof D2RMonSounds)[] = [
      "attack1",
      "attack2",
      "weapon1",
      "weapon2",
      "hitsound",
      "deathsound",
      "skill1",
      "skill2",
      "skill3",
      "skill4",
      "footstep",
      "footsteplayer",
      "neutral",
      "init",
      "taunt",
      "flee",
    ];
    msSoundFields.forEach((field) =>
      mustExist(monSounds, field, "id", sounds, "sound", isOptional)
    );

    // ensure cvtmox and cvttgtx are valid entries in monmode.txt
    const msModeFields: (keyof D2RMonSounds)[] = [
      "cvtmo1",
      "cvtmo2",
      "cvtmo3",
      "cvttgt1",
      "cvttgt2",
      "cvttgt3",
    ];
    msModeFields.forEach((field) =>
      mustExist(monSounds, field, "id", monMode, "code", isOptional)
    );

    // ensure these fields exist in skills.txt:
    multifield1<D2RMonSounds>("cvtsk", 3).forEach((field) =>
      mustExist(monSounds, field, "id", skills, "skill", isOptional)
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

    // ensure objectclass in objpreset matches a class in object.txt
    mustExist(objPreset, "objectclass", "index", objects, "class", {
      caseSensitive: false,
    });

    // ensure mclassx in pettype.txt matches a monster in monstats.txt
    /*multifield1<D2RPetType>("mclass", 4).forEach((field) => {
      mustExist(petType, field, "pet type", monStats, "id", isOptional);
    });*/

    // ensure modXcode is null or valid entry in qualityitems.txt
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

    // ensure class in skills.txt points to valid player class
    mustExist(skills, "charclass", "skill", playerClass, "code", isOptional);

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

    // ensure summonmode is valid (if summon != null)
    if (
      skills !== undefined && monMode !== undefined && plrMode !== undefined
    ) {
      skills.forEach((skill, line) => {
        if (skill.summon !== undefined && skill.summon !== "") {
          if (
            monMode.find((mode) => mode.code === skill.summode) === undefined
          ) {
            this.Warn(
              `${skill.GetFileName()}, line ${
                line + 2
              }: invalid summode '${skill.summode}' for '${skill.skill}'`,
            );
          }
        }

        // ensure monanim is valid (or is xx)
        if (
          skill.skill !== "" && skill.skill !== "Expansion" &&
          skill.monanim !== "XX" && skill.monanim !== ""
        ) {
          if (
            monMode.find((mode) => mode.code === skill.monanim) === undefined
          ) {
            this.Warn(
              `${skill.GetFileName()}, line ${
                line + 2
              }: invalid monanim '${skill.monanim}' for '${skill.skill}'`,
            );
          }
        }

        // ensure anim and seqtrans are valid
        if (
          skill.skill !== "" && skill.skill !== "Expansion" &&
          skill.anim !== "XX" && skill.anim !== ""
        ) {
          if (plrMode.find((mode) => mode.code === skill.anim) === undefined) {
            this.Warn(
              `${skill.GetFileName()}, line ${
                line + 2
              }: invalid anim '${skill.anim}' for '${skill.skill}'`,
            );
          }
        }

        if (
          skill.skill !== "" && skill.skill !== "Expansion" &&
          skill.seqtrans !== "XX" && skill.seqtrans !== ""
        ) {
          if (
            plrMode.find((mode) => mode.code === skill.seqtrans) === undefined
          ) {
            this.Warn(
              `${skill.GetFileName()}, line ${
                line + 2
              }: invalid seqtrans '${skill.seqtrans}' for '${skill.seqtrans}'`,
            );
          }
        }
      });
    }

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
    const numPassiveFields = config.legacy ? 5 : 10; // 2.4 upped to 6, 2.5 upped again to 10
    const skStatFields: (keyof D2RSkills)[] = [
      ...multifield1<D2RSkills>("aurastat", 6),
      ...multifield1<D2RSkills>(
        "passivestat",
        numPassiveFields,
      ),
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
    if (!config.legacy) {
      // these were added in 2.5
      mustExist(
        superUniques,
        "tc desecrated",
        "superunique",
        treasureClassEx,
        "treasure class",
        isOptional,
      );
      mustExist(
        superUniques,
        "tc(n) desecrated",
        "superunique",
        treasureClassEx,
        "treasure class",
        isOptional,
      );
      mustExist(
        superUniques,
        "tc(h) desecrated",
        "superunique",
        treasureClassEx,
        "treasure class",
        isOptional,
      );
    }

    /**
     * NOTE: Treasure class linkage is excluded in this because it's quite complicated.
     */

    // ensure uniqueitems.txt point to valid codes
    mustExist(uniqueItems, "code", "index", allItems, "code");

    // ensure chrtransform and invtransform point to valid colors
    mustExist(uniqueItems, "chrtransform", "index", colors, "code", isOptional);
    mustExist(uniqueItems, "invtransform", "index", colors, "code", isOptional);

    // ensure props are valid properties.txt entries
    multifield1<D2RUniqueItems>("prop", 12).forEach((field) =>
      mustExist(uniqueItems, field, "index", properties, "code", isOptional)
    );

    // ensure class in wanderingmon is a valid id in monstats.txt
    mustExist(wanderingMon, "class", "class", monStats, "id");

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
          record[indexColumn] as unknown as string === "Elite Uniques" ||
          (record[indexColumn] as unknown as string).startsWith("@")
        ) {
          return;
        }
        if (
          record[column] === undefined ||
          record[column] as unknown as string === "" ||
          (record[column] as unknown as string).length === 0
        ) {
          if (optional) {
            return;
          }
          this.Warn(
            `${record.GetFileName()}, line ${i + 2}: ${String(column)} for '${
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
            `${record.GetFileName()}, line ${i + 2}: couldn't find string '${
              record[column]
            }' for ${String(column)} for '${record[indexColumn]}'`,
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

    const iscStr: (keyof D2RItemStatCost)[] = [
      "descstrpos",
      "descstrneg",
      "dgrpstrneg",
      "dgrpstrpos",
    ];
    iscStr.forEach((field) => lookForString(itemStatCost, field, "stat", true));

    const lsStr: (keyof D2RLevels)[] = [
      "levelname",
      "levelwarp",
      //"levelentry",
    ];
    lsStr.forEach((field) => lookForString(levels, field, "name", false));

    lookForString(lowQualityItems, "name", "name", false);
    lookForString(magicPrefix, "name", "name", false);
    lookForString(magicSuffix, "name", "name", false);
    lookForString(monStats, "namestr", "id", false);
    lookForString(monStats, "descstr", "id", true);
    lookForString(monType, "strplur", "type", true);
    lookForString(objects, "name", "class", false);
    lookForString(petType, "name", "pet type", true);
    lookForString(rarePrefix, "name", "name", false);
    lookForString(rareSuffix, "name", "name", false);
    lookForString(runes, "name", "name", false);
    lookForString(setItems, "index", "index", false);
    lookForString(sets, "name", "index", false);
    if (!config.legacy) {
      lookForString(shrines, "stringname", "name", false);
      lookForString(shrines, "stringphrase", "name", false);
    }

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

    // Check for JSON entries
    if (!config.legacy) {
      const jsonKeyConvert = (s: string) =>
        s.replace(/([a-z])([A-Z0-9])/g, "$1_$2").replace(
          /[A-Z]/g,
          (c) => c.toLocaleLowerCase(),
        ).replace(/[ -]/g, "_").replace(/[^A-Za-z0-9_]/g, "");

      const { json } = workspace;
      if (json !== undefined) {
        // check missiles.txt against missiles.json
        if (json.missiles !== undefined && missiles !== undefined) {
          const keys = Object.keys(json.missiles);
          missiles.forEach((missile, line) => {
            if (missile.missile !== undefined) {
              const missileStr = jsonKeyConvert(missile.missile as string);
              if (!keys.includes(missileStr)) {
                // warn!
                this.Warn(
                  `${missile.GetFileName()}, line ${
                    line + 2
                  }: '${missileStr}' not found in missiles.json`,
                );
              }
            }
          });
        }

        // check armor.txt, misc.txt and weapons.txt against items.json
        if (
          json.items !== undefined && armor !== undefined &&
          misc !== undefined &&
          weapons !== undefined
        ) {
          [armor, misc, weapons].forEach((recordSet) =>
            recordSet.forEach((record, line) => {
              if (
                record.code !== undefined && json.items !== undefined &&
                record.name !== "Expansion" && record.name !== ""
              ) {
                if (
                  json.items.find((i) =>
                    Object.keys(i).includes(record.code as string)
                  ) === undefined
                ) {
                  this.Warn(
                    `${record.GetFileName()}, line ${
                      line + 2
                    }: ${record.code} (for '${record.name}') not found in items.json`,
                  );
                }
              }
            })
          );
        }

        // check monstats.txt against monsters.json
        if (json.monsters !== undefined && monStats !== undefined) {
          const keys = Object.keys(json.monsters);

          monStats.forEach((monster, line) => {
            if (
              monster.id !== undefined && monster.id !== "" &&
              monster.id !== "Expansion"
            ) {
              if (!keys.includes(monster.id as string)) {
                this.Warn(
                  `${monster.GetFileName()}, line ${
                    line + 2
                  }: '${monster.id}' not found in monsters.json`,
                );
              }
            }
          });
        }

        // check setitems.txt against sets.json
        if (json.sets !== undefined && setItems !== undefined) {
          setItems.forEach((setItem, line) => {
            if (setItem.index !== undefined && json.sets !== undefined) {
              const conv = jsonKeyConvert(setItem.index as string);
              if (
                setItem.item !== "" &&
                json.sets.find((s) => Object.keys(s).includes(conv)) ===
                  undefined
              ) {
                this.Warn(
                  `${setItem.GetFileName()}, line ${
                    line + 2
                  }: '${conv}' not found for '${setItem.index}' in sets.json`,
                );
              }
            }
          });
        }

        // check uniqueItems.txt against uniques.json
        if (json.uniques !== undefined && uniqueItems !== undefined) {
          uniqueItems.forEach((uniqueItem, line) => {
            if (
              uniqueItem.code !== "" && uniqueItem.index !== undefined &&
              json.uniques !== undefined
            ) {
              const conv = jsonKeyConvert(uniqueItem.index as string);
              if (
                json.uniques.find((u) => Object.keys(u).includes(conv)) ===
                  undefined
              ) {
                this.Warn(
                  `${uniqueItem.GetFileName()}, line ${
                    line + 2
                  }: '${conv}' not found for '${uniqueItem.index}' in uniques.json`,
                );
              }
            }
          });
        }
      }
    }
  }
}

/**
 *  Check that no two strings share the same ID or Key
 */
@lintrule
export class StringCheck extends Rule {
  GetRuleName(): string {
    return "Basic/StringCheck";
  }

  Evaluate(workspace: Workspace): void {
    const { strings } = workspace;
    if (!strings) {
      return;
    }

    const foundIds: { id: number; key: string }[] = [];

    const tableNames = Object.keys(strings);
    for (let j = 0; j < tableNames.length; j++) {
      const theTable = strings[tableNames[j]];
      if (!theTable) {
        continue;
      }

      for (let i = 0; i < theTable.length; i++) {
        const found = foundIds.find((v) => v.id === theTable[i].id);
        if (found && found.key !== theTable[i].Key) {
          this.Warn(
            `String "${theTable[i].Key}" shares an ID ('${
              theTable[i].id
            }') with string "${found.key}"`,
          );
        } else {
          foundIds.push({ id: theTable[i].id, key: theTable[i].Key });
        }
      }
    }
  }
}

/**
 * Check that certain numeric bounds are met
 */
@lintrule
export class NumericBounds extends Rule {
  GetRuleName(): string {
    return "Basic/NumericBounds";
  }

  Evaluate(workspace: Workspace) {
    const validVersion = <
      T extends D2RExcelRecord,
      U extends keyof T = keyof T,
    >(
      excel: T[] | undefined,
      index: U,
      k: U,
      shouldConsider?: (r: T) => boolean,
    ) => {
      if (excel === undefined) {
        return;
      }

      // deno-lint-ignore no-explicit-any
      excel.forEach((record: any, line) => {
        const idString = record[index] as unknown as string;
        const kString = record[k] as unknown as string;
        if (
          idString !== "" && idString !== "Expansion" &&
          idString !== "Armor" && idString !== "Elite Uniques" &&
          idString !== "Rings" && idString !== "Class Specific" &&
          kString !== "0" && kString !== "1" && kString !== "100" &&
          !idString.startsWith("@") &&
          (!shouldConsider || shouldConsider(record))
        ) {
          this.Warn(
            `${record.GetFileName()}, line ${
              line + 2
            }: invalid 'version' (${kString}) for '${idString}'`,
          );
        }
      });
    };

    const {
      armor,
      weapons,
      misc,
      autoMagic,
      books,
      charStats,
      cubemain,
      gems,
      hireling,
      inventory,
      itemRatio,
      itemStatCost,
      itemTypes,
      levels,
      lvlMaze,
      lvlPrest,
      lvlTypes,
      magicPrefix,
      magicSuffix,
      missiles,
      monPreset,
      monSounds,
      monStats,
      monUMod,
      npc,
      objects,
      objGroup,
      objPreset,
      overlay,
      petType,
      rarePrefix,
      rareSuffix,
      sets,
      setItems,
      shrines,
      skills,
      skillDesc,
      states,
      superUniques,
      treasureClassEx,
      uniqueItems,
    } = workspace;

    const config = GetConfig();

    validVersion(armor, "name", "version");
    validVersion(misc, "name", "version");
    validVersion(weapons, "name", "version");
    validVersion(magicPrefix, "name", "version");
    validVersion(magicSuffix, "name", "version");
    validVersion(monUMod, "uniquemod", "version");
    validVersion(overlay, "overlay", "version");
    validVersion(rarePrefix, "name", "version");
    validVersion(rareSuffix, "name", "version");
    validVersion(sets, "index", "version");
    validVersion(uniqueItems, "index", "version");
    validVersion(itemRatio, "function", "version");
    validVersion(cubemain, "description", "version", (r) => r.enabled === "1");

    /**
     * check numeric amounts
     */
    type comparer = (expected: number, actual: number) => boolean;
    type messager = (
      expected: number,
      actual: number,
      index: string,
      field: string,
    ) => string;
    const makeComparer =
      (c: comparer, m: messager) =>
      <T extends D2RExcelRecord, U extends keyof T = keyof T>(
        records: T[] | undefined,
        field: U,
        index: U,
        num: number,
        mustExist = false,
      ) => {
        if (records === undefined) {
          return;
        }

        records.forEach((record, line) => {
          let numericAmt = 0;
          const asStr = record[field] as unknown as string;
          const indexStr = record[index] as unknown as string;
          const fieldName = field as string;
          if (indexStr === "Expansion") {
            // skip
            return;
          }

          if (asStr === "") {
            if (mustExist) {
              this.Warn(
                `${record.GetFileName()}, line ${line + 2}: '${
                  String(field)
                }' is not filled in for '${indexStr}'`,
              );
            }
            return;
          }

          try {
            numericAmt = parseInt(asStr);
          } catch {
            this.Warn(
              `${record.GetFileName()}, line ${line + 2}: '${
                String(field)
              }' is not a number for '${indexStr}'`,
            );
            return;
          }

          if (!c(num, numericAmt)) {
            this.Warn(
              `${record.GetFileName()}, line ${line + 2}: ${
                m(num, numericAmt, indexStr, fieldName)
              }`,
            );
          }
        });
      };

    const lt = makeComparer(
      (e, a) => a < e,
      (e, a, i, f) => `'${f}' is too large (${a}, max is ${e - 1}) for '${i}'`,
    );
    const gt = makeComparer(
      (e, a) => a > e,
      (e, a, i, f) => `'${f}' is too small (${a}, min is ${e + 1}) for '${i}'`,
    );

    [armor, misc, weapons].forEach((recordSet) => {
      gt(recordSet, "cost", "code", -1);
      gt(recordSet, "gamble cost", "code", -1);
      gt(recordSet, "invwidth", "code", 0);
      gt(recordSet, "invheight", "code", 0);
    });

    if (!config.legacy) {
      gt(charStats, "lightradius", "class", -1);
    }

    gt(inventory, "gridx", "class", -2, true);
    gt(inventory, "gridy", "class", -2, true);
    gt(itemRatio, "uniquedivisor", "function", 0, true);
    gt(itemRatio, "uniquemin", "function", 0, true);
    gt(itemRatio, "setdivisor", "function", 0, true);
    gt(itemRatio, "setmin", "function", 0, true);
    gt(itemRatio, "raredivisor", "function", 0, true);
    gt(itemRatio, "raremin", "function", 0, true);
    gt(itemRatio, "magicdivisor", "function", 0, true);
    gt(itemRatio, "magicmin", "function", 0, true);
    gt(itemRatio, "hiqualitydivisor", "function", 0, true);
    gt(itemRatio, "normaldivisor", "function", 0, true);
    if (!config.legacy) {
      gt(hireling, "resurrectcostdivisor", "hireling", 0);
      gt(hireling, "resurrectcostmultiplier", "hireling", 0);
      gt(hireling, "resurrectcostmax", "hireling", 0);
      gt(hireling, "hiringmaxleveldifference", "hireling", -1);
    }

    gt(objects, "sizex", "name", -1);
    gt(objects, "sizey", "name", -1);
    gt(overlay, "numdirections", "overlay", 0);
    gt(petType, "basemax", "pet type", -1);
    lt(treasureClassEx, "picks", "treasure class", 7);

    /**
     * ensure records are in range
     */

    const inRng = <T extends D2RExcelRecord, U extends keyof T = keyof T>(
      records: T[] | undefined,
      field: U,
      index: U,
      min: number,
      max: number,
      mustExist = false,
    ) => {
      if (records === undefined) {
        return;
      }

      records.forEach((record, line) => {
        let numericAmt = 0;
        const asStr = record[field] as unknown as string;
        const indexStr = record[index] as unknown as string;
        if (indexStr === "Expansion") {
          return;
        }
        if (asStr === "") {
          if (mustExist) {
            this.Warn(
              `${record.GetFileName()}, line ${line + 2}: '${
                String(field)
              }' is not filled in for "${indexStr}'`,
            );
          }
          return;
        }

        try {
          numericAmt = parseInt(asStr);
        } catch {
          this.Warn(
            `${record.GetFileName()}, line ${line + 2}: '${
              String(field)
            }' is not a number for '${indexStr}'`,
          );
          return;
        }

        if (numericAmt < min || numericAmt > max) {
          this.Warn(
            `${record.GetFileName()}, line ${line + 2}: '${
              String(field)
            }' is out of range for '${indexStr}', expected number between ${min} and ${max} (inclusive), found ${numericAmt}`,
          );
        }
      });
    };

    [armor, misc, weapons].forEach((itemFile) => {
      inRng(itemFile, "compactsave", "name", 0, 1);
      inRng(itemFile, "spawnable", "name", 0, 1);
      inRng(itemFile, "nodurability", "name", 0, 1);
      inRng(itemFile, "showlevel", "name", 0, 1);
      inRng(itemFile, "useable", "name", 0, 1);
      inRng(itemFile, "stackable", "name", 0, 1);
      inRng(itemFile, "transmogrify", "name", 0, 1);
      inRng(itemFile, "unique", "name", 0, 1);
      inRng(itemFile, "transparent", "name", 0, 1);
      inRng(itemFile, "hasinv", "name", 0, 1);
      inRng(itemFile, "stackable", "name", 0, 1);
      inRng(itemFile, "component", "name", 0, 16);
      inRng(itemFile, "transtbl", "name", 0, 8);
      inRng(itemFile, "quest", "name", 0, 37);
      inRng(itemFile, "questdiffcheck", "name", 0, 1);

      if (gems !== undefined) {
        inRng(itemFile, "gemoffset", "name", 0, gems.length - 1);
      }

      if (missiles !== undefined) {
        inRng(itemFile, "missiletype", "name", 0, missiles.length - 1);
      }

      inRng(itemFile, "invtrans", "name", 0, 8);
      inRng(itemFile, "skipname", "name", 0, 1);
      inRng(itemFile, "nameable", "name", 0, 1);
      inRng(itemFile, "permstoreitem", "name", 0, 1);
      inRng(itemFile, "worldevent", "name", 0, 1);
      inRng(itemFile, "block", "name", 0, 75);
      inRng(itemFile, "rarm", "name", 0, 2);
      inRng(itemFile, "larm", "name", 0, 2);
      inRng(itemFile, "torso", "name", 0, 2);
      inRng(itemFile, "legs", "name", 0, 2);
      inRng(itemFile, "rspad", "name", 0, 2);
      inRng(itemFile, "lspad", "name", 0, 2);
      inRng(itemFile, "pspell", "name", -1, 14); // 2 pspells are undocumented
      inRng(itemFile, "spelldesc", "name", 0, 4);
      inRng(itemFile, "spelldesccolor", "name", 0, 12);
    });

    inRng(autoMagic, "spawnable", "name", 0, 1);
    inRng(autoMagic, "rare", "name", 0, 1);
    inRng(books, "pspell", "name", -1, 14); // 2 pspells are undocumented

    inRng(charStats, "walkvelocity", "class", 1, 10);
    inRng(charStats, "runvelocity", "class", 1, 10);
    inRng(charStats, "item1count", "class", 0, 10, true);
    inRng(charStats, "item2count", "class", 0, 10, true);
    inRng(charStats, "item3count", "class", 0, 10, true);
    inRng(charStats, "item4count", "class", 0, 10, true);
    inRng(charStats, "item5count", "class", 0, 10, true);
    inRng(charStats, "item6count", "class", 0, 10, true);
    inRng(charStats, "item7count", "class", 0, 10, true);
    inRng(charStats, "item8count", "class", 0, 10, true);
    inRng(charStats, "item9count", "class", 0, 10, true);
    inRng(charStats, "item10count", "class", 0, 10, true);
    inRng(charStats, "item1quality", "class", 0, 9);
    inRng(charStats, "item2quality", "class", 0, 9);
    inRng(charStats, "item3quality", "class", 0, 9);
    inRng(charStats, "item4quality", "class", 0, 9);
    inRng(charStats, "item5quality", "class", 0, 9);
    inRng(charStats, "item6quality", "class", 0, 9);
    inRng(charStats, "item7quality", "class", 0, 9);
    inRng(charStats, "item8quality", "class", 0, 9);
    inRng(charStats, "item9quality", "class", 0, 9);
    inRng(charStats, "item10quality", "class", 0, 9);
    inRng(gems, "transform", "name", 0, 20);
    inRng(itemRatio, "uber", "function", 0, 1);
    inRng(itemRatio, "class specific", "function", 0, 1);
    inRng(itemStatCost, "advdisplay", "stat", 0, 2);
    inRng(itemStatCost, "itemeventfunc1", "stat", 0, 33);
    inRng(itemStatCost, "itemeventfunc2", "stat", 0, 33);
    inRng(itemStatCost, "send other", "stat", 0, 1);
    inRng(itemStatCost, "signed", "stat", 0, 1);
    inRng(itemStatCost, "send bits", "stat", 0, 32);
    inRng(itemStatCost, "send param bits", "stat", 0, 32);
    inRng(itemStatCost, "updateanimrate", "stat", 0, 1);
    inRng(itemStatCost, "saved", "stat", 0, 1);
    inRng(itemStatCost, "csvsigned", "stat", 0, 1);
    inRng(itemStatCost, "csvbits", "stat", 0, 32);
    inRng(itemStatCost, "csvparam", "stat", 0, 32);
    inRng(itemStatCost, "fcallback", "stat", 0, 1);
    inRng(itemStatCost, "fmin", "stat", 0, 1);
    inRng(itemStatCost, "encode", "stat", 0, 4);
    inRng(itemStatCost, "keepzero", "stat", 0, 1);
    inRng(itemStatCost, "op", "stat", 0, 13);
    inRng(itemStatCost, "direct", "stat", 0, 1);
    inRng(itemStatCost, "damagerelated", "stat", 0, 1);
    inRng(itemStatCost, "descfunc", "stat", 0, 29); // descfunc 29 added in 2.5
    inRng(itemStatCost, "descval", "stat", 0, 2);
    inRng(itemStatCost, "stuff", "stat", 1, 8);
    inRng(itemTypes, "throwable", "code", 0, 1);
    inRng(itemTypes, "reload", "code", 0, 1);
    inRng(itemTypes, "reequip", "code", 0, 1);
    inRng(itemTypes, "autostack", "code", 0, 1);
    inRng(itemTypes, "magic", "code", 0, 1);
    inRng(itemTypes, "rare", "code", 0, 1);
    inRng(itemTypes, "normal", "code", 0, 1);
    inRng(itemTypes, "beltable", "code", 0, 1);
    inRng(itemTypes, "treasureclass", "code", 0, 1);
    if (!config.legacy) {
      inRng(levels, "act", "name", 0, 4, true);
    }
    inRng(levels, "questflag", "name", 0, 41);
    inRng(levels, "questflagex", "name", 0, 41);
    inRng(levels, "teleport", "name", 0, 2);
    inRng(levels, "rain", "name", 0, 1);
    inRng(levels, "mud", "name", 0, 1);
    inRng(levels, "noper", "name", 0, 1);
    inRng(levels, "losdraw", "name", 0, 1);
    inRng(levels, "floorfilter", "name", 0, 1);
    inRng(levels, "blankscreen", "name", 0, 1);
    inRng(levels, "drawedges", "name", 0, 1);
    inRng(levels, "drlgtype", "name", 0, 3);
    inRng(levels, "subtype", "name", -1, 13);
    inRng(levels, "subtheme", "name", -1, 4);
    inRng(levels, "intensity", "name", 0, 128);
    inRng(levels, "red", "name", 0, 255);
    inRng(levels, "green", "name", 0, 255);
    inRng(levels, "blue", "name", 0, 255);
    inRng(levels, "portal", "name", 0, 1);
    inRng(levels, "position", "name", 0, 1);
    inRng(levels, "savemonsters", "name", 0, 1);
    inRng(levels, "quest", "name", 0, 41);
    inRng(levels, "monwndr", "name", 0, 1);
    inRng(levels, "nummon", "name", 0, 13);
    inRng(levels, "rangedspawn", "name", 0, 1);
    inRng(levels, "cpct1", "name", 0, 100);
    inRng(levels, "cpct2", "name", 0, 100);
    inRng(levels, "cpct3", "name", 0, 100);
    inRng(levels, "cpct4", "name", 0, 100);
    inRng(levels, "objprb0", "name", 0, 100);
    inRng(levels, "objprb1", "name", 0, 100);
    inRng(levels, "objprb2", "name", 0, 100);
    inRng(levels, "objprb3", "name", 0, 100);
    inRng(levels, "objprb4", "name", 0, 100);
    inRng(levels, "objprb5", "name", 0, 100);
    inRng(levels, "objprb6", "name", 0, 100);
    inRng(levels, "objprb7", "name", 0, 100);
    inRng(lvlMaze, "merge", "name", 0, 1000);
    inRng(lvlPrest, "populate", "name", 0, 1);
    inRng(lvlPrest, "logicals", "name", 0, 1);
    inRng(lvlPrest, "outdoors", "name", 0, 1);
    inRng(lvlPrest, "animate", "name", 0, 1);
    inRng(lvlPrest, "killedge", "name", 0, 1);
    inRng(lvlPrest, "fillblanks", "name", 0, 1);
    inRng(lvlPrest, "automap", "name", 0, 1);
    inRng(lvlPrest, "scan", "name", 0, 1);
    inRng(lvlTypes, "act", "name", 0, 5, true);
    // NOTENOTE, there are two undocumented pcltdofunc functions:
    // 69th function = in use by Corpse Explosion
    // 70th function = in use by vine beast death
    inRng(missiles, "pcltdofunc", "missile", 0, 70);
    inRng(missiles, "pclthitfunc", "missile", 0, 64);
    inRng(missiles, "psrvdofunc", "missile", 0, 37);
    inRng(missiles, "psrvhitfunc", "missile", 0, 59);
    inRng(missiles, "psrvdmgfunc", "missile", 0, 15);
    inRng(missiles, "red", "missile", 0, 255);
    inRng(missiles, "green", "missile", 0, 255);
    inRng(missiles, "blue", "missile", 0, 255);
    inRng(missiles, "loopanim", "missile", 0, 2); // pretty sure 2 = loop only once but this is undocumented
    inRng(missiles, "subloop", "missile", 0, 1);
    inRng(missiles, "collidetype", "missile", 0, 8);
    inRng(missiles, "collidekill", "missile", 0, 1);
    inRng(missiles, "collidefriend", "missile", 0, 1);
    inRng(missiles, "lastcollide", "missile", 0, 1);
    inRng(missiles, "collision", "missile", 0, 1);
    inRng(missiles, "clientcol", "missile", 0, 1);
    inRng(missiles, "clientsend", "missile", 0, 1);
    inRng(missiles, "nexthit", "missile", 0, 1);
    inRng(missiles, "srctown", "missile", 0, 1);
    inRng(missiles, "candestroy", "missile", 0, 1);
    inRng(missiles, "tohit", "missile", 0, 1);
    inRng(missiles, "alwaysexplode", "missile", 0, 1);
    inRng(missiles, "explosion", "missile", 0, 2); // 2 is used for Fire Enchanted death missile. not documented.
    inRng(missiles, "town", "missile", 0, 1);
    inRng(missiles, "nouniquemod", "missile", 0, 1);
    inRng(missiles, "nomultishot", "missile", 0, 2); // 2 is used for Fire Enchanted death missile. not documented.
    inRng(missiles, "holy", "missile", 0, 4);
    inRng(missiles, "canslow", "missile", 0, 1);
    inRng(missiles, "returnfire", "missile", 0, 1);
    inRng(missiles, "gethit", "missile", 0, 1);
    inRng(missiles, "softhit", "missile", 0, 1);
    inRng(missiles, "knockback", "missile", 0, 100);
    inRng(missiles, "trans", "missile", 0, 2);
    inRng(missiles, "pierce", "missile", 0, 1);
    inRng(missiles, "missileskill", "missile", 0, 1);
    inRng(missiles, "hitshift", "missile", 0, 8);
    inRng(missiles, "applymastery", "missile", 0, 1);
    inRng(missiles, "half2hsrc", "missile", 0, 1);
    inRng(missiles, "localblood", "missile", 0, 1);
    inRng(monPreset, "act", "place", 1, 5, true);
    inRng(monSounds, "att1prb", "id", 0, 100);
    inRng(monSounds, "att2prb", "id", 0, 100);
    inRng(monSounds, "fsprb", "id", 0, 100);
    inRng(monStats, "translvl", "id", 0, 7);
    inRng(monStats, "sparsepopulate", "id", 0, 100);
    inRng(monStats, "velocity", "id", 0, 20);
    inRng(monStats, "run", "id", 0, 20);
    //inRng(monStats, "level", "id", 0, 99);     FIXME
    //inRng(monStats, "level(n)", "id", 0, 99);  FIXME
    //inRng(monStats, "level(h)", "id", 0, 99);  PLEEZ
    inRng(monUMod, "fpick", "id", 0, 3);
    inRng(npc, "buy mult", "npc", 0, 2048);
    inRng(npc, "sell mult", "npc", 0, 2048);
    inRng(npc, "questflag a", "npc", 0, 41);
    inRng(npc, "questflag b", "npc", 0, 41);
    inRng(npc, "questflag c", "npc", 0, 41);
    inRng(npc, "questbuymult a", "npc", 0, 2048);
    inRng(npc, "questbuymult b", "npc", 0, 2048);
    inRng(npc, "questbuymult c", "npc", 0, 2048);
    inRng(npc, "questsellmult a", "npc", 0, 2048);
    inRng(npc, "questsellmult b", "npc", 0, 2048);
    inRng(npc, "questsellmult c", "npc", 0, 2048);
    inRng(npc, "questrepmult a", "npc", 0, 2048);
    inRng(npc, "questrepmult b", "npc", 0, 2048);
    inRng(npc, "questrepmult c", "npc", 0, 2048);
    inRng(objects, "selectable0", "name", 0, 1);
    inRng(objects, "selectable1", "name", 0, 1);
    inRng(objects, "selectable2", "name", 0, 1);
    inRng(objects, "selectable3", "name", 0, 1);
    inRng(objects, "selectable4", "name", 0, 1);
    inRng(objects, "selectable5", "name", 0, 1);
    inRng(objects, "selectable6", "name", 0, 1);
    inRng(objects, "selectable7", "name", 0, 1);
    inRng(objects, "isattackable0", "name", 0, 1);
    inRng(objects, "enveffect", "name", 0, 1);
    inRng(objects, "isdoor", "name", 0, 1);
    inRng(objects, "blocksvis", "name", 0, 1);
    inRng(objects, "orientation", "name", 0, 3);
    inRng(objects, "orderflag0", "name", 0, 2);
    inRng(objects, "orderflag1", "name", 0, 2);
    inRng(objects, "orderflag2", "name", 0, 2);
    inRng(objects, "orderflag3", "name", 0, 2);
    inRng(objects, "orderflag4", "name", 0, 2);
    inRng(objects, "orderflag5", "name", 0, 2);
    inRng(objects, "orderflag6", "name", 0, 2);
    inRng(objects, "orderflag7", "name", 0, 2);
    inRng(objects, "monsterok", "name", 0, 1);
    inRng(objects, "restore", "name", 0, 1);
    inRng(objGroup, "density0", "groupname", 0, 128);
    inRng(objGroup, "density1", "groupname", 0, 128);
    inRng(objGroup, "density2", "groupname", 0, 128);
    inRng(objGroup, "density3", "groupname", 0, 128);
    inRng(objGroup, "density4", "groupname", 0, 128);
    inRng(objGroup, "density5", "groupname", 0, 128);
    inRng(objGroup, "density6", "groupname", 0, 128);
    inRng(objGroup, "density7", "groupname", 0, 128);
    inRng(objGroup, "prob0", "groupname", 0, 100);
    inRng(objGroup, "prob1", "groupname", 0, 100);
    inRng(objGroup, "prob2", "groupname", 0, 100);
    inRng(objGroup, "prob3", "groupname", 0, 100);
    inRng(objGroup, "prob4", "groupname", 0, 100);
    inRng(objGroup, "prob5", "groupname", 0, 100);
    inRng(objGroup, "prob6", "groupname", 0, 100);
    inRng(objGroup, "prob7", "groupname", 0, 100);
    inRng(objPreset, "act", "index", 1, 5);
    inRng(overlay, "trans", "overlay", 0, 8);
    inRng(overlay, "initradius", "overlay", 0, 18);
    inRng(overlay, "radius", "overlay", 0, 18);
    inRng(overlay, "red", "overlay", 0, 255);
    inRng(overlay, "green", "overlay", 0, 255);
    inRng(overlay, "blue", "overlay", 0, 255);
    inRng(overlay, "localblood", "overlay", 0, 2);
    inRng(petType, "warp", "pet type", 0, 1);
    inRng(petType, "range", "pet type", 0, 1);
    inRng(petType, "partysend", "pet type", 0, 1);
    inRng(petType, "automap", "pet type", 0, 1);
    inRng(petType, "drawhp", "pet type", 0, 1);
    inRng(petType, "icontype", "pet type", 0, 3);
    inRng(setItems, "lvl", "index", 0, 125);
    inRng(setItems, "lvl req", "index", 0, 99);
    inRng(setItems, "add func", "index", 0, 2);
    inRng(shrines, "code", "name", 0, 22);
    inRng(skills, "passivereqweaponcount", "skill", 0, 2);
    inRng(skills, "stsuccessonly", "skill", 0, 1);
    inRng(skills, "stsounddelay", "skill", 0, 1);
    inRng(skills, "weaponsnd", "skill", 0, 1);
    inRng(skills, "warp", "skill", 0, 1);
    inRng(skills, "immediate", "skill", 0, 1);
    inRng(skills, "enhanceable", "skill", 0, 1);
    inRng(skills, "attackrank", "skill", 0, 12);
    inRng(skills, "noammo", "skill", 0, 1);
    inRng(skills, "weapsel", "skill", 0, 4);
    inRng(skills, "lineofsight", "skill", 0, 5);
    // reqlevel/maxlevel ?
    inRng(skills, "restrict", "skill", 0, 3);
    inRng(skills, "aura", "skill", 0, 1);
    inRng(skills, "periodic", "skill", 0, 1);
    inRng(skills, "passive", "skill", 0, 1);
    inRng(skills, "aitype", "skill", 0, 13);
    inRng(skills, "cost mult", "skill", 0, 1024);
    inRng(skillDesc, "skillpage", "skilldesc", 0, 3);
    inRng(skillDesc, "skillrow", "skilldesc", 0, 6);
    inRng(skillDesc, "skillcolumn", "skilldesc", 0, 3);
    inRng(skillDesc, "listrow", "skilldesc", -1, 4);
    inRng(skillDesc, "descdam", "skilldesc", 0, 26); // D2R 2.5 added 25 and 26
    inRng(skillDesc, "descatt", "skilldesc", 0, 5);
    inRng(states, "setfunc", "state", 0, 19);
    inRng(states, "remfunc", "state", 0, 12);
    //inRng(states, "gfxclass", "state", 0, 6);  FIXME
    inRng(superUniques, "utrans", "name", 0, 40);
    inRng(superUniques, "utrans(n)", "name", 0, 40);
    inRng(superUniques, "utrans(h)", "name", 0, 40);
    inRng(treasureClassEx, "level", "treasure class", 0, 125);
    //inRng(treasureClassEx, "nodrop", "treasure class", 0, 100);
    inRng(treasureClassEx, "unique", "treasure class", 0, 1024);
    inRng(treasureClassEx, "set", "treasure class", 0, 1024);
    inRng(treasureClassEx, "rare", "treasure class", 0, 1024);
    inRng(treasureClassEx, "magic", "treasure class", 0, 1024);
    inRng(uniqueItems, "lvl", "index", 0, 126);
    inRng(uniqueItems, "lvl req", "index", 0, 99);

    // in gems.txt, we have to make sure that modxmin and modxmax are the same
    // otherwise, we get flickering in-game
    /*if (gems !== undefined) {
      gems.forEach((gem, line) => {
        const recordPairs: [keyof D2RGems, keyof D2RGems][] = [
          ["helmmod1min", "helmmod1max"],
          ["helmmod2min", "helmmod2max"],
          ["helmmod3min", "helmmod3max"],
          ["shieldmod1min", "shieldmod1max"],
          ["shieldmod2min", "shieldmod2max"],
          ["shieldmod3min", "shieldmod3max"],
          ["weaponmod1min", "weaponmod1max"],
          ["weaponmod2min", "weaponmod2max"],
          ["weaponmod3min", "weaponmod3max"],
        ];

        recordPairs.forEach((recordPair) => {
          if (gem[recordPair[0]] !== gem[recordPair[1]]) {
            this.Warn(
              `${gem.GetFileName()}, line ${line + 2}: ${recordPair[0]} and ${
                recordPair[1]
              } don't match for '${gem.code}', this will cause flickering ingame`,
            );
          }
        });
      });
    }*/
  }
}
