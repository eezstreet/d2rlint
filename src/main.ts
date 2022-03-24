/**
 * The main starting point for the application
 */

import { GetConfig } from "./lib/config.ts";
import { GetAllRules } from "./lib/rule.ts";
import { LoadWorkspace } from "./lib/workspace.ts";

// Import all rules here so that they get loaded.
import "./rules/basic.ts";
import "./rules/string.ts";
/////////////////////////////////////////////////

// Load workspace, iterate through rules, passing workspace into rule
const config = GetConfig();
const { workspace, rules } = config;
const ws = LoadWorkspace(workspace);
const allRules = GetAllRules();

allRules.forEach((rule) => {
  if (
    rules[rule.GetRuleName()] !== undefined &&
    rules[rule.GetRuleName()].action !== "ignore"
  ) {
    rule.Evaluate(ws);
  }
});

console.log(`Checking complete. Press any key to continue...`);
Deno.stdin.readSync(new Uint8Array(32));
Deno.exit(0);
