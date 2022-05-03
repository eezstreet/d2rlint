/**
 * The main starting point for the application
 */

import GenerateDocs from "./doc/doc.ts";
import { GetConfig } from "./lib/config.ts";
import { GetAllRules } from "./lib/rule.ts";
import { LoadWorkspace } from "./lib/workspace.ts";

// Import all rules here so that they get loaded.
import "./rules/basic.ts";
import "./rules/cube.ts";
import "./rules/items.ts";
import "./rules/levels.ts";
import "./rules/monsters.ts";
import "./rules/skills.ts";
import "./rules/string.ts";
import "./rules/treasure.ts";
/////////////////////////////////////////////////

// Load workspace, iterate through rules, passing workspace into rule
const config = GetConfig();
const { workspace, fallback, rules, legacy, iveConsideredDonating } = config;
const ws = LoadWorkspace(workspace, fallback, legacy);

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
