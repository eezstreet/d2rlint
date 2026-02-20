/**
 * The main starting point for the application
 */

import { parseArgs } from "jsr:@std/cli/parse-args";
import { executeCommands, getCommandUsages } from "./commands/index.ts";
import {
  ApplyCliOverrides,
  CliOverrides,
  FlushLogfileIfExists,
  GameVersion,
  GenerateDocs,
  GetConfig,
  GetAllRules,
  LoadWorkspace,
  OutputFormat,
  RuleAction,
  SaveConfig,
} from "@d2rlint/lib";

// Import all rules so that they get registered via @lintrule.
import "@d2rlint/lib/rules";

// ---------------------------------------------------------------------------
// Flag parsing
// ---------------------------------------------------------------------------

const parsed = parseArgs(Deno.args, {
  string: ["workspace", "fallback", "game-version", "log", "output-format"],
  boolean: [
    "generate-docs",
    "no-generate-docs",
    "log-append",
    "no-log-append",
    "save",
    "help",
  ],
  collect: ["rule"],
  alias: {
    workspace: "w",
    fallback: "f",
    log: "l",
    help: "h",
  },
});

// Handle --help before loading anything
if (parsed.help) {
  console.log("d2rlint - Diablo II data file linter");
  console.log("");
  console.log("Flags:");
  console.log("  --workspace, -w <path>        Override workspace directory");
  console.log("  --fallback,  -f <path>        Override fallback directory");
  console.log(
    "  --game-version <version>      Override game version (legacy|2.6|3.0)",
  );
  console.log("  --log,       -l <path>        Override log file path");
  console.log(
    "  --output-format <fmt>         Override log output format",
  );
  console.log(
    "                                tsv, tsv-buffered, csv, csv-buffered,",
  );
  console.log("                                json, json-buffered");
  console.log(
    "  --log-append                  Append to log instead of overwriting",
  );
  console.log("  --no-log-append               Overwrite log file");
  console.log("  --generate-docs               Enable documentation generation");
  console.log(
    "  --no-generate-docs            Disable documentation generation",
  );
  console.log(
    "  --rule <Name=action>          Override a rule action (repeatable)",
  );
  console.log("                                action: warn|error|ignore");
  console.log("  --save                        Save flag overrides to config.json");
  console.log("  --help, -h                    Show this help");
  console.log("");
  console.log("Commands:");
  for (const usage of getCommandUsages()) {
    console.log(`  ${usage}`);
  }
  Deno.exit(0);
}

// Validate conflicting boolean pairs
if (parsed["generate-docs"] && parsed["no-generate-docs"]) {
  console.error("Cannot specify both --generate-docs and --no-generate-docs");
  Deno.exit(1);
}
if (parsed["log-append"] && parsed["no-log-append"]) {
  console.error("Cannot specify both --log-append and --no-log-append");
  Deno.exit(1);
}

// Validate --game-version value
const gameVersionRaw = parsed["game-version"] as string | undefined;
if (
  gameVersionRaw !== undefined &&
  gameVersionRaw !== "legacy" &&
  gameVersionRaw !== "2.6" &&
  gameVersionRaw !== "3.0"
) {
  console.error(
    `Invalid --game-version "${gameVersionRaw}". Expected: legacy, 2.6, or 3.0`,
  );
  Deno.exit(1);
}

// Validate --output-format value
const outputFormatRaw = parsed["output-format"] as string | undefined;
const validOutputFormats = [
  "tsv",
  "tsv-buffered",
  "csv",
  "csv-buffered",
  "json",
  "json-buffered",
];
if (outputFormatRaw !== undefined && !validOutputFormats.includes(outputFormatRaw)) {
  console.error(
    `Invalid --output-format "${outputFormatRaw}". Expected: ${
      validOutputFormats.join(", ")
    }`,
  );
  Deno.exit(1);
}

// Parse --rule Name=action flags
const ruleOverrides: Record<string, RuleAction> = {};
for (const r of (parsed["rule"] as string[])) {
  const eqIdx = r.lastIndexOf("=");
  if (eqIdx <= 0) {
    console.error(`Invalid --rule format: "${r}". Expected: RuleName=action`);
    Deno.exit(1);
  }
  const name = r.substring(0, eqIdx);
  const action = r.substring(eqIdx + 1);
  if (action !== "warn" && action !== "error" && action !== "ignore") {
    console.error(
      `Invalid action "${action}" for --rule ${name}. Expected: warn, error, or ignore`,
    );
    Deno.exit(1);
  }
  ruleOverrides[name] = action as RuleAction;
}

// Assemble the overrides object — only set fields that were explicitly passed
const overrides: CliOverrides = {};
if (parsed.workspace !== undefined) overrides.workspace = parsed.workspace as string;
if (parsed.fallback !== undefined) overrides.fallback = parsed.fallback as string;
if (gameVersionRaw !== undefined) overrides.version = gameVersionRaw as GameVersion;
if (parsed.log !== undefined) overrides.log = parsed.log as string;
if (outputFormatRaw !== undefined) overrides.outputFormat = outputFormatRaw as OutputFormat;
if (parsed["log-append"]) overrides.logAppend = true;
else if (parsed["no-log-append"]) overrides.logAppend = false;
if (parsed["generate-docs"]) overrides.generateDocs = true;
else if (parsed["no-generate-docs"]) overrides.generateDocs = false;
if (Object.keys(ruleOverrides).length > 0) overrides.rules = ruleOverrides;

// ---------------------------------------------------------------------------
// Config + workspace
// ---------------------------------------------------------------------------

// Load config then apply overrides before workspace loading, so workspace/
// fallback/version flags are visible to LoadWorkspace.
const config = GetConfig();
ApplyCliOverrides(config, overrides);

const { workspace, fallback, rules, version, iveConsideredDonating } = config;
const ws = LoadWorkspace(workspace, fallback, version);

if (!iveConsideredDonating) {
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
// Command dispatch
// ---------------------------------------------------------------------------

// Positional args (command name + its own args), with all flags stripped out.
const positionalArgs = parsed._.map(String);

if (positionalArgs.length > 0) {
  if (!executeCommands(positionalArgs, ws)) {
    console.log(
      `ERROR: A command by that name (${positionalArgs[0]}) does not exist.`,
    );
  }
  FlushLogfileIfExists();
  if (parsed.save) {
    SaveConfig(config, "config.json");
    console.log("Config saved to config.json");
  }
  Deno.exit(0);
}

// ---------------------------------------------------------------------------
// Rule evaluation
// ---------------------------------------------------------------------------

const allRules = GetAllRules();
allRules.forEach((rule) => {
  if (
    rules[rule.GetRuleName()] !== undefined &&
    rules[rule.GetRuleName()].action !== "ignore"
  ) {
    rule.Evaluate(ws);
  }
});

console.log(`Checking complete. Press enter to continue...`);
Deno.stdin.readSync(new Uint8Array(32));

// ---------------------------------------------------------------------------
// Doc generation
// ---------------------------------------------------------------------------

if (config.generateDocs === true) {
  GenerateDocs(ws);
  console.log(`Docs generated. Press enter to continue...`);
  Deno.stdin.readSync(new Uint8Array(32));
}

// ---------------------------------------------------------------------------
// --save
// ---------------------------------------------------------------------------

FlushLogfileIfExists();
if (parsed.save) {
  SaveConfig(config, "config.json");
  console.log("Config saved to config.json");
}

Deno.exit(0);
