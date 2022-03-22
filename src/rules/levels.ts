import { lintrule, Rule } from "../lib/rule.ts";
import { D2RLevels, Workspace } from "../lib/workspace.ts";
import { seq } from "../lib/misc.ts";

@lintrule
export class CheckMonsters extends Rule {
  GetRuleName(): string {
    return "Levels/ValidMonsters";
  }

  Evaluate(workspace: Workspace) {
    const { levels, monStats } = workspace;

    if (levels === undefined) {
      console.log(`Levels/ValidMonsters: levels.txt not found, skipping...`);
      return;
    }

    if (monStats === undefined) {
      console.log(`Levels/ValidMonsters: monstats.txt not found, skipping...`);
      return;
    }

    const makeMapper = (base: string, rng: number) =>
      seq(1, rng).map((v) => `${base}${v}`);
    const monstersFields = makeMapper("mon", 25) as (keyof D2RLevels)[];
    const umonFields = makeMapper("umon", 25) as (keyof D2RLevels)[];
    const nmonFields = makeMapper("nmon", 25) as (keyof D2RLevels)[];

    const monsterDoesNotExist = (s: string) =>
      s.trim().length > 0 && monStats.find((mon) => mon.id === s) === undefined;

    levels.forEach((level) => {
      const fieldCallback = (field: keyof D2RLevels) => {
        if (monsterDoesNotExist(level[field] as string)) {
          console.log(
            `Levels/ValidMonsters: unknown ${field} monster '${
              level[field]
            }' for '${level.name}'`,
          );
        }
      };

      monstersFields.forEach(fieldCallback);
      umonFields.forEach(fieldCallback);
      nmonFields.forEach(fieldCallback);
    });
  }
}
