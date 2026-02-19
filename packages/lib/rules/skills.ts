import { lintrule, Rule } from "../lib/rule.ts";
import { Workspace } from "../lib/workspace.ts";

@lintrule
export class EqualSkills extends Rule {
  GetRuleName() {
    return "Skills/EqualSkills";
  }

  Evaluate(workspace: Workspace) {
    const { skills, playerClass } = workspace;

    if (
      skills === undefined || playerClass === undefined ||
      playerClass.length <= 0
    ) {
      return;
    }

    const counts = playerClass.filter((theClass) => theClass.code !== "").map(
      (theClass) => {
        const { code } = theClass;
        const count = skills.reduce((curCount, skill) => {
          if (skill.charclass === code) {
            return curCount + 1;
          }
          return curCount;
        }, 0);

        return { code, count };
      },
    );

    const anyBad = counts.reduce(
      (_, pair) => _ || pair.count !== counts[0].count,
      false,
    );
    if (anyBad) {
      const countString = counts.map((pair) => `${pair.code} = ${pair.count}`)
        .join(", ");
      this.Warn(
        `Not all classes have the same number of skills defined in skills.txt. [${countString}]`,
      );
    }
  }
}
