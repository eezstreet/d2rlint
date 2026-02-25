/**
 * Rules are the core of the program's operation.
 * Each rule checks the entire workspace for problems and reports it according to the rule settings.
 */

import { brightRed, brightYellow, cyan, gray } from "jsr:@std/fmt/colors";
import { GetConfig, type RuleAction } from "./config.ts";
import { FlushLogfileIfExists, GetLogfile, type LogEntry } from "./log.ts";
import type { Workspace } from "./workspace.ts";

let colorsEnabled = true;

export function setColorsEnabled(enabled: boolean): void {
  colorsEnabled = enabled;
}

function c(fn: (s: string) => string, s: string): string {
  return colorsEnabled ? fn(s) : s;
}

export type Constructor<T extends unknown = unknown> = {
  new (...args: unknown[]): T;
};

/**
 * Decorator - declares that the class is a D2RLint rule.
 * @param constructor - the constructor for the class that is being created
 */
const lintrules: { [name: string]: Constructor<Rule> } = {};
// deno-lint-ignore ban-types
export function lintrule(constructor: Function) {
  lintrules[constructor.name] = constructor.prototype.constructor;
  constructor.prototype.name = constructor.name;
}

/**
 * Gets the name of the lint rule.
 * @returns all of the lint rule names
 */
export function GetAllRuleNames(): string[] {
  return Object.keys(lintrules);
}

/**
 * Gets the Rule constructor that matches the given name.
 */
export function GetAllRules(): Rule[] {
  const ruleNames = GetAllRuleNames();
  return ruleNames.map((rn) => {
    const lr = lintrules[rn] as Constructor<Rule>;
    return new lr();
  });
}

/**
 * The Rule base class.
 * To produce new rules, we derive this and decorate it with @lintrule
 * Note: rules cannot take arguments in their constructor
 */
export abstract class Rule {
  /**
   * Checks if the workspace violates this rule.
   * @param workspace - the workspace to check
   */
  abstract Evaluate(workspace: Workspace): void;

  /**
   * Gets the default configuration value for this rule's action
   * @returns a RuleAction to occur when this rule is broken
   */
  GetDefaultAction(): RuleAction {
    return "warn";
  }

  /**
   * Gets the rule name. This can be for example "Monsters/Monstats2"
   */
  abstract GetRuleName(): string;

  /**
   * Makes a log message.
   */
  Log(entry: LogEntry): void {
    const config = GetConfig();
    const log = GetLogfile(config);
    log.WriteLine(entry);
  }

  /**
   * Makes a log/console message.
   * @param msg - the message to print to the log (and console)
   */
  Message(msg: string): void {
    const ruleName = this.GetRuleName();
    this.Log({ severity: "MESSAGE", ruleName, message: msg });
    console.log(`${c(cyan, "MESSAGE")}\t${c(gray, ruleName)}\t${msg}`);
  }

  /**
   * Makes a log/console warning.
   * @param msg - the message to print to the log (and console)
   */
  Warn(msg: string): void {
    const config = GetConfig();
    const ruleName = this.GetRuleName();

    const action = config.rules[ruleName]?.action ?? this.GetDefaultAction();
    if (action === "ignore") {
      return;
    }
    if (action === "warn") {
      this.Log({ severity: "WARN", ruleName, message: msg });
      console.log(
        `${c(brightYellow, "WARN")}\t${c(gray, ruleName)}\t${msg}`,
      );
    } else if (action === "error") {
      this.Log({ severity: "ERROR", ruleName, message: msg });
      FlushLogfileIfExists();
      console.log(
        `${c(brightRed, "ERROR")}\t${c(gray, ruleName)}\t${msg}`,
      );
      console.log("Press any key to exit...");
      Deno.stdin.readSync(new Uint8Array(32));
      Deno.exit(1);
    }
  }
}
