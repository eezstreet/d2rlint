/**
 * CLI flag parsing and validation.
 * Owns parseArgs, conflict/enum validation, --rule parsing, and help output.
 */

import { parseArgs } from "jsr:@std/cli/parse-args";
import {
  CliOverrides,
  GameVersion,
  OutputFormat,
  RuleAction,
} from "@d2rlint/lib";
import { getCommandUsages } from "./commands/index.ts";

export interface ParsedFlags {
  overrides: CliOverrides;
  positionalArgs: string[];
  save: boolean;
}

const FLAG_HELP: { flag: string; description: string }[] = [
  { flag: "--workspace, -w <path>", description: "Override workspace directory" },
  { flag: "--fallback,  -f <path>", description: "Override fallback directory" },
  {
    flag: "--game-version <version>",
    description: "Override game version (legacy|2.6|3.0)",
  },
  { flag: "--log,       -l <path>", description: "Override log file path" },
  {
    flag: "--output-format <fmt>",
    description:
      "Override log output format: tsv, tsv-buffered, csv, csv-buffered, json, json-buffered",
  },
  { flag: "--log-append", description: "Append to log instead of overwriting" },
  { flag: "--no-log-append", description: "Overwrite log file" },
  { flag: "--color", description: "Force enable color output" },
  { flag: "--no-color", description: "Force disable color output" },
  { flag: "--generate-docs", description: "Enable documentation generation" },
  { flag: "--no-generate-docs", description: "Disable documentation generation" },
  {
    flag: "--rule <Name=action>",
    description: "Override a rule action (repeatable); action: warn|error|ignore",
  },
  { flag: "--save", description: "Save flag overrides to config.json" },
  { flag: "--help, -h", description: "Show this help" },
];

const VALID_OUTPUT_FORMATS: OutputFormat[] = [
  "tsv",
  "tsv-buffered",
  "csv",
  "csv-buffered",
  "json",
  "json-buffered",
];

/**
 * Parses and validates CLI flags. Calls Deno.exit(0) on --help, Deno.exit(1)
 * on any validation error.
 */
export function parseCliFlags(args: string[]): ParsedFlags {
  const parsed = parseArgs(args, {
    string: ["workspace", "fallback", "game-version", "log", "output-format"],
    boolean: [
      "generate-docs",
      "no-generate-docs",
      "log-append",
      "no-log-append",
      "color",
      "no-color",
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

  // --help
  if (parsed.help) {
    console.log("d2rlint - Diablo II data file linter");
    console.log("");
    console.log("Flags:");
    for (const { flag, description } of FLAG_HELP) {
      const padded = flag.padEnd(30);
      console.log(`  ${padded}  ${description}`);
    }
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
  if (parsed["color"] && parsed["no-color"]) {
    console.error("Cannot specify both --color and --no-color");
    Deno.exit(1);
  }

  // Validate --game-version
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

  // Validate --output-format
  const outputFormatRaw = parsed["output-format"] as string | undefined;
  if (
    outputFormatRaw !== undefined &&
    !VALID_OUTPUT_FORMATS.includes(outputFormatRaw as OutputFormat)
  ) {
    console.error(
      `Invalid --output-format "${outputFormatRaw}". Expected: ${
        VALID_OUTPUT_FORMATS.join(", ")
      }`,
    );
    Deno.exit(1);
  }

  // Parse --rule Name=action entries
  const ruleOverrides: Record<string, RuleAction> = {};
  for (const r of ((parsed["rule"] as string[]) ?? [])) {
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

  // Assemble overrides — only set fields explicitly passed
  const overrides: CliOverrides = {};
  if (parsed.workspace !== undefined) overrides.workspace = parsed.workspace;
  if (parsed.fallback !== undefined) overrides.fallback = parsed.fallback;
  if (gameVersionRaw !== undefined) overrides.version = gameVersionRaw as GameVersion;
  if (parsed.log !== undefined) overrides.log = parsed.log;
  if (outputFormatRaw !== undefined) overrides.outputFormat = outputFormatRaw as OutputFormat;
  if (parsed["log-append"]) overrides.logAppend = true;
  else if (parsed["no-log-append"]) overrides.logAppend = false;
  if (parsed["color"]) overrides.color = true;
  else if (parsed["no-color"]) overrides.color = false;
  if (parsed["generate-docs"]) overrides.generateDocs = true;
  else if (parsed["no-generate-docs"]) overrides.generateDocs = false;
  if (Object.keys(ruleOverrides).length > 0) overrides.rules = ruleOverrides;

  return {
    overrides,
    positionalArgs: parsed._.map(String),
    save: parsed.save as boolean,
  };
}
