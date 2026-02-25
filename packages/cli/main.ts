/**
 * The main starting point for the application
 */

import { executeCommands } from "./commands/index.ts";
import { parseCliFlags } from "./flags.ts";
import {
  ApplyCliOverrides,
  FlushLogfileIfExists,
  GenerateDocs,
  GetAllRules,
  GetConfig,
  LoadWorkspace,
  SaveConfig,
  setColorsEnabled,
} from "@d2rlint/lib";

// Import all rules so that they get registered via @lintrule.
import "@d2rlint/lib/rules";

// ---------------------------------------------------------------------------
// Flag parsing
// ---------------------------------------------------------------------------

const { overrides, positionalArgs, save } = parseCliFlags(Deno.args);

// ---------------------------------------------------------------------------
// Config + workspace
// ---------------------------------------------------------------------------

// Load config then apply overrides before workspace loading, so workspace/
// fallback/version flags are visible to LoadWorkspace.
const config = GetConfig();
ApplyCliOverrides(config, overrides);

// Apply color setting before any colored output is produced.
// "auto" detects support via terminal env vars; true/false force the setting.
function supportsColor(): boolean {
  if (!Deno.stdout.isTerminal()) return false;
  if (Deno.env.get("COLORTERM")) return true;
  if (Deno.env.get("TERM_PROGRAM")) return true;
  if (Deno.env.get("WT_SESSION")) return true;
  return false;
}
const useColor = config.color === "auto" ? supportsColor() : config.color;
setColorsEnabled(useColor);

const { workspace, fallback, rules, version } = config;
const ws = LoadWorkspace(workspace, fallback, version);

// ---------------------------------------------------------------------------
// Command dispatch
// ---------------------------------------------------------------------------

if (positionalArgs.length > 0) {
  if (!executeCommands(positionalArgs, ws)) {
    console.error(
      `ERROR: A command by that name (${positionalArgs[0]}) does not exist.`,
    );
  }
  FlushLogfileIfExists();
  if (save) {
    SaveConfig(config, "config.json");
    console.log("Config saved to config.json");
  }
  Deno.exit(0);
}

// ---------------------------------------------------------------------------
// Donation banner (shown only for normal lint runs, not commands or --help)
// ---------------------------------------------------------------------------

if (!config.iveConsideredDonating) {
  console.log(`-----------------------------------------`);
  console.log(`| d2rlint is always available for free, |`);
  console.log(`| but it takes many man-hours to main-  |`);
  console.log(`| -tain it and produce new features for |`);
  console.log(`| all mod-makers to use.                |`);
  console.log(`|                                       |`);
  console.log(`| Please consider making a direct do-   |`);
  console.log(`| -nation, or sponsoring me on Patreon: |`);
  console.log(`| https://www.patreon.com/eezstreet     |`);
  console.log(`|                                       |`);
  console.log(`| Alternatively, change the following   |`);
  console.log(`| value in your config.json to be true: |`);
  console.log(`|   iveConsideredDonating: "false",     |`);
  console.log(`-----------------------------------------`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pressEnterToContinue(msg: string): void {
  console.log(msg);
  Deno.stdin.readSync(new Uint8Array(32));
}

// ---------------------------------------------------------------------------
// Rule evaluation
// ---------------------------------------------------------------------------

const allRules = GetAllRules();
for (const rule of allRules) {
  if (rules[rule.GetRuleName()]?.action !== "ignore") {
    rule.Evaluate(ws);
  }
}

pressEnterToContinue("Checking complete. Press enter to continue...");

// ---------------------------------------------------------------------------
// Doc generation
// ---------------------------------------------------------------------------

if (config.generateDocs === true) {
  GenerateDocs(ws);
  pressEnterToContinue("Docs generated. Press enter to continue...");
}

// ---------------------------------------------------------------------------
// --save
// ---------------------------------------------------------------------------

FlushLogfileIfExists();
if (save) {
  SaveConfig(config, "config.json");
  console.log("Config saved to config.json");
}

Deno.exit(0);
