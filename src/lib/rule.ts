/**
 * Rules are the core of the program's operation.
 * Each rule checks the entire workspace for problems and reports it according to the rule settings.
 */

import { RuleAction } from "./config.ts";
import { Workspace } from "./workspace.ts";

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
}
