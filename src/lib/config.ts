/**
 * The program's configuration is saved as JSON in either the current directory (if writeable)
 * or in the home directory.
 */

import { GetAllRules } from "./rule.ts";
import * as fs from "https://deno.land/std@0.130.0/fs/mod.ts";
import { deepMerge } from "./misc.ts";
import { D2RStringTable } from "./workspace.ts";

/**
 * Types
 */
export type RuleAction = "warn" | "error" | "ignore";
export type DocPageType =
  | "uniques"
  | "sets"
  | "magic"
  | "cube"
  | "armor"
  | "weapons"
  | "misc"
  | "gems"
  | "runeword";

export interface RuleConfig {
  action: RuleAction;
}

type AllRuleConfig = { [ruleName: string]: RuleConfig };

export interface SavedConfiguration {
  legacy: boolean;
  workspace: string;
  fallback: string;
  log: string;
  logAppend: boolean;
  iveConsideredDonating: boolean;
  rules: { [ruleName: string]: RuleConfig };
  generateDocs: boolean;
  docOptions: {
    title: string;
    language: Omit<keyof D2RStringTable, "id" | "Key">;
    filterPages: DocPageType[];
    localizedStrings: {
      pageNames: {
        main: string;
        uniques: string;
        sets: string;
        magic: string;
        cube: string;
        armor: string;
        weapons: string;
        misc: string;
        gems: string;
        runeword: string;
      };
      subPageNames: {
        magicPrefixes: string;
        magicSuffixes: string;
        fullSetBonus: string;
        partialSetBonus: string;
        setItems: string;
      };
      cubeInputQualifiers: {
        qty: string;
        low: string;
        nor: string;
        hiq: string;
        mag: string;
        set: string;
        rar: string;
        uni: string;
        crf: string;
        tmp: string;
        nos: string;
        sock: string;
        sockN: string;
        noe: string;
        eth: string;
        bas: string;
        exc: string;
        eli: string;
        nru: string;
        any: string;
      };
      cubeOutputQualifiers: {
        usetype: string;
        useitem: string;
        low: string;
        nor: string;
        hiq: string;
        mag: string;
        set: string;
        rar: string;
        uni: string;
        crf: string;
        tmp: string;
        eth: string;
        sockN: string;
        mod: string;
        uns: string;
        rem: string;
        reg: string;
        exc: string;
        eli: string;
        rep: string;
        rch: string;
        percentChance: string;
        lvl: string;
        plvl: string;
        ilvl: string;
        modNoList: string;
        pre: string;
        suf: string;
      };
      cubeHardcodedOutputs: {
        "Cow Portal": string;
        "Pandemonium Portal": string;
        "Pandemonium Finale Portal": string;
        "Red Portal": string;
      };
      cubeDaysOfWeek: string[];
      cubeOps: string[];
      other: {
        setNItems: string;
        setSpecificItem: string;
        setFull: string;
      };
    };
  };
}

/**
 * Globals
 */
let config: SavedConfiguration;

/**
 * Functions
 */

/**
 * Creates the default configuration.
 */
function CreateDefaultConfig(): SavedConfiguration {
  const allRules = GetAllRules();
  const rules: AllRuleConfig = {};

  allRules.forEach((rule) =>
    rules[rule.GetRuleName()] = { action: rule.GetDefaultAction() }
  );

  return {
    workspace: "",
    legacy: false,
    fallback: "",
    logAppend: false,
    log: "output.txt",
    iveConsideredDonating: false,
    rules,
    generateDocs: false,
    docOptions: {
      title: "My Mod Documentation",
      language: "enUS",
      filterPages: [],
      localizedStrings: {
        pageNames: {
          main: "Main",
          runeword: "Runewords",
          uniques: "Unique Items",
          sets: "Set Items",
          magic: "Magic Prefixes/Suffixes",
          cube: "Cube Recipes",
          armor: "Armor",
          weapons: "Weapons",
          gems: "Gems",
          misc: "Misc Items",
        },
        subPageNames: {
          magicPrefixes: "Magic Prefixes",
          magicSuffixes: "Magic Suffixes",
          fullSetBonus: "Full Set Bonuses",
          partialSetBonus: "Partial Set Bonuses",
          setItems: "Set Items",
        },
        cubeInputQualifiers: {
          qty: "%s x %d",
          low: "Low Quality %s",
          nor: "Normal %s",
          hiq: "Superior %s",
          mag: "Magic %s",
          set: "Set %s",
          rar: "Rare %s",
          uni: "Unique %s",
          crf: "Crafted %s",
          tmp: "Tempered %s",
          nos: "Non-Socketed %s",
          sock: "Socketed %s",
          sockN: "%s with %d sockets",
          noe: "Non-Ethereal %s",
          eth: "Ethereal %s",
          bas: "Basic (Non-Exceptional, Non-Elite) %s",
          exc: "Exceptional %s",
          eli: "Elite %s",
          nru: "%s, non-runeworded",
          any: "Any Item",
        },
        cubeHardcodedOutputs: {
          "Cow Portal": "Portal to %s",
          "Pandemonium Portal": "Portal to Pandemonium Sub-Level",
          "Pandemonium Finale Portal": "Portal to Uber Tristram",
          "Red Portal": "Portal to %s",
        },
        cubeOutputQualifiers: {
          useitem: "The same item",
          usetype: "The same item, rerolled",
          low: "%s, Low Quality",
          nor: "%s, Normal Quality",
          hiq: "%s, Superior Quality",
          mag: "%s, Magic Quality",
          set: "%s, Set Quality",
          rar: "%s, Rare Quality",
          uni: "%s, Unique Quality",
          crf: "%s, Crafted",
          tmp: "%s, Tempered",
          eth: "%s, Ethereal",
          sockN: "%s, with %d sockets",
          mod: "These extra properties are added:",
          modNoList: "The item's properties are preserved",
          uns: "Socketed items are destroyed",
          rem: "Socketed items are removed (and not destroyed)",
          reg: "Properties are regenerated",
          exc: "%s, Exceptional",
          eli: "%s, Elite",
          rep: "The item is repaired",
          rch: "The item is recharged",
          percentChance: "%d%% chance: %s",
          lvl: "Item Level: %d",
          plvl: "Item Level: +%d%% of Player Level",
          ilvl: "Item Level: +%d%% of Item Level",
          pre: "%pre %item",
          suf: "%item %suf",
        },
        cubeOps: [
          "Invalid",
          "%value < Current Day of Month < %param",
          "Current Day of Week is not %datevalue",
          "Player Stat '%paramstat' > %value",
          "Player Stat '%paramstat' < %value",
          "Player Stat '%paramstat' is not %value",
          "Player Stat '%paramstat' is %value",
          "Base Player Stat '%paramstat' > %value",
          "Base Player Stat '%paramstat' < %value",
          "Base Player Stat '%paramstat' is not %value",
          "Base Player Stat '%paramstat' is %value",
          "Added Player Stat '%paramstat' > %value",
          "Added Player Stat '%paramstat' < %value",
          "Added Player Stat '%paramstat' is not %value",
          "Added Player Stat '%paramstat' is %value",
          "First Input's '%paramstat' > %value",
          "First Input's '%paramstat' < %value",
          "First Input's '%paramstat' is not %value",
          "First Input's '%paramstat' is %value",
          "First Input's Base '%paramstat' > %value",
          "First Input's Base '%paramstat' < %value",
          "First Input's Base '%paramstat' is not %value",
          "First Input's Base '%paramstat' is %value",
          "First Input's Added '%paramstat' > %value",
          "First Input's Added '%paramstat' < %value",
          "First Input's Added '%paramstat' is not %value",
          "First Input's Added '%paramstat' is %value",
          "First Input's Mod Class is not %value",
          "Special",
        ],
        cubeDaysOfWeek: [
          "None",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        other: {
          setNItems: "(%d items)",
          setSpecificItem: "(only if %s is equipped)",
          setFull: "(Full set)",
        },
      },
    },
  };
}

/**
 * @param config - the configuration to save
 * @param location - the location where to save it
 */
function SaveConfig(config: SavedConfiguration, location: string) {
  const text = JSON.stringify(config, undefined, 2);
  Deno.writeTextFileSync(location, text);
}

/**
 * Loads the configuration for the first time.
 */
function LoadConfigFirstTime(): SavedConfiguration {
  if (!fs.existsSync("config.json")) {
    const config = CreateDefaultConfig();
    SaveConfig(config, "config.json");

    console.log(
      "d2rlint didn't start, because the configuration file was missing. One has been generated for you.",
    );
    console.log(
      "Please edit the configuration file (config.json) to set your workspace location.",
    );
    console.log("By default, this will look in the current working directory.");
    console.log("Press enter to continue.");

    Deno.stdin.readSync(new Uint8Array(32));
    Deno.exit(0);
  }

  // Read the config file. If any fields are missing from it that exists in the default, go ahead and re-write.
  const config = Deno.readTextFileSync("config.json");
  try {
    const parsed = JSON.parse(config) as SavedConfiguration;
    const defaultConfig = CreateDefaultConfig();
    const newConfig = deepMerge(defaultConfig, parsed);
    SaveConfig(newConfig, "config.json");
    return newConfig;
  } catch {
    const defaultConfig = CreateDefaultConfig();
    SaveConfig(defaultConfig, "config.json");
    return defaultConfig;
  }
}

/**
 * Gets the Configuration object.
 * @returns {Configuration} - the configuration that was loaded (or created from default)
 */
export function GetConfig(): SavedConfiguration {
  if (config === undefined) {
    return LoadConfigFirstTime();
  }
  return config;
}
