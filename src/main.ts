/**
 * The main starting point for the application
 */

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
const { workspace, fallback, rules, legacy } = config;
const ws = LoadWorkspace(workspace, fallback, legacy);
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
Deno.exit(0);
