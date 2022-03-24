import { RuleAction } from "../lib/config.ts";
import { lintrule, Rule } from "../lib/rule.ts";
import { D2RStringTable, Workspace } from "../lib/workspace.ts";

/**
 * No untranslated strings allowed.
 */
@lintrule
export class NoUntranslated extends Rule {
  GetRuleName(): string {
    return "String/NoUntranslated";
  }

  GetDefaultAction(): RuleAction {
    return "ignore";
  }

  Evaluate(workspace: Workspace) {
    const { strings } = workspace;
    if (strings === undefined) {
      return;
    }

    const stringFiles = Object.keys(strings);
    stringFiles.forEach((stringFile) => {
      const sf = strings[stringFile];
      if (sf === undefined || sf.length === 0) {
        return;
      }

      if (sf.forEach === undefined) {
        //console.log(`sf.forEach === undefined! found on ${stringFile}.json`);
        return;
      }
      sf.forEach((entry) => {
        // warn if something is blank?
        const langKeys: (keyof D2RStringTable)[] = [
          "deDE",
          "enUS",
          "esES",
          "esMX",
          "frFR",
          "itIT",
          "jaJP",
          "koKR",
          "plPL",
          "ptBR",
          "ruRU",
          "zhCN",
          "zhTW",
        ];

        // warn if a key is undefined or blank for a language
        const whichUnd = langKeys.filter((key) => entry[key] === undefined);
        const whichBl = langKeys.filter((key) => entry[key] === "");

        if (whichUnd.length > 0) {
          this.Warn(
            `${stringFile}.json: ${entry.Key} (${entry.id}) has fields undefined: ${whichUnd}`,
          );
        }
        if (whichBl.length > 0) {
          this.Warn(
            `${stringFile}.json: ${entry.Key} (${entry.id}) has fields blank: ${whichBl}`,
          );
        }

        // warn if
      });
    });
  }
}
