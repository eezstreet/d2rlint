/**
 * The program's configuration is saved as JSON in either the current directory (if writeable)
 * or in the home directory.
 */

import { GetAllRules } from "./rule.ts";
import * as fs from "https://deno.land/std@0.130.0/fs/mod.ts";

/**
 * Types
 */
export type RuleAction = "warn" | "error" | "ignore";

export interface RuleConfig {
  action: RuleAction;
}

type AllRuleConfig = { [ruleName: string]: RuleConfig };

export interface SavedConfiguration {
  workspace: string;
  rules: { [ruleName: string]: RuleConfig };
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
    rules,
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
    console.log("Press any key to continue.");

    Deno.stdin.readSync(new Uint8Array(32));
    Deno.exit(0);
  }

  const config = Deno.readTextFileSync("config.json");
  return JSON.parse(config) as SavedConfiguration;
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
