/**
 * The main starting point for the application
 */

import { executeCommands } from "./commands/index.ts";
import { GenerateDocs, GetConfig, GetAllRules, LoadWorkspace } from "@d2rlint/lib";

// Import all rules so that they get registered via @lintrule.
import "@d2rlint/lib/rules";

// Load workspace, iterate through rules, passing workspace into rule
const config = GetConfig();
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

// See if we're entering a command
if (Deno.args.length > 0) {
  if (!executeCommands(Deno.args, ws)) {
    console.log(
      `ERROR: A command by that name (${Deno.args[0]}) does not exist.`,
    );
  }
  Deno.exit(0);
}

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

if (config.generateDocs === true) {
  GenerateDocs(ws);
  console.log(`Docs generated. Press enter to continue...`);
  Deno.stdin.readSync(new Uint8Array(32));
}

Deno.exit(0);
