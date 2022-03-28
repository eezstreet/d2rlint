import { lintrule, Rule } from "../lib/rule.ts";
import {
  D2RExcelRecord,
  D2RTreasureClassEx,
  Workspace,
} from "../lib/workspace.ts";

/**
 * Check treasure class items.
 */
@lintrule
export class ValidTreasure extends Rule {
  GetRuleName(): string {
    return "TC/ValidTreasure";
  }

  Evaluate(workspace: Workspace) {
    const {
      treasureClassEx,
      itemTypes,
      armor,
      misc,
      weapons,
      setItems,
      uniqueItems,
    } = workspace;

    if (
      treasureClassEx === undefined || itemTypes === undefined ||
      armor === undefined || misc === undefined || weapons === undefined ||
      setItems === undefined || uniqueItems === undefined
    ) {
      return; // just skip it.
    }

    const fields: (keyof D2RTreasureClassEx)[] = [
      "item1",
      "item2",
      "item3",
      "item4",
      "item5",
      "item6",
      "item7",
      "item8",
      "item9",
      "item10",
    ];

    treasureClassEx.forEach((record, i) => {
      if (record["treasure class"] === "") {
        return; // ignore blank lines
      }

      const warn = (msg: string) => {
        this.Warn(
          `${record.GetFileName()}, line ${i + 2}: ${msg} in TC '${
            record["treasure class"]
          }'`,
        );
      };

      fields.forEach((field) => {
        const item = record[field] as unknown as string;

        // check if it's a valid armor, misc, weapon, set or unique item or item type
        const check = <T extends D2RExcelRecord, U extends keyof T = keyof T>(
          s: string,
          r: T[],
          k: U,
        ) => {
          return r.some((rx) => rx[k] === s as unknown);
        };

        const isItem = (s: string) =>
          check(s, armor, "code") || check(s, misc, "code") ||
          check(s, weapons, "code") || check(s, setItems, "index") ||
          check(s, uniqueItems, "index") || check(s, itemTypes, "code");

        if (isItem(item)) {
          return; // is valid.
        } else if (
          treasureClassEx.filter((_, j) => j < i).find((tc) =>
            tc["treasure class"] === item
          )
        ) {
          return; // is another TC
        } else if (item.match(/".+"/gi) !== null) {
          // is a formula
          const matched = [...item.matchAll(/"(.+)"/gi)][0][1];
          if (matched[1] === undefined) {
            return; // shouldn't occur
          }
          const split = matched.split(",");
          if (!isItem(split[0])) {
            warn(`couldn't find '${split[0]}' for '${field}'`);
          }
          if (split.length > 1) {
            const mul = [...item.matchAll(/mul=([0-9]+)/gi)][0][1];
            if (mul === undefined) {
              warn(`invalid 'mul' value for '${field}'`);
            }
          }
        } else if (item.match(/[0-9]+$/gi) !== null) {
          // might be auto TC.
          const matched = [...item.matchAll(/(.+[^0-9]+)[0-9]+$/gi)][0][1];
          if (matched === undefined) {
            warn(`couldn't parse '${item}' for '${field}'`);
          } else {
            const foundItemType = itemTypes.find((it) => it.code === matched);
            if (foundItemType === undefined) {
              warn(`couldn't find '${matched}' for '${field}'`);
            } else if (foundItemType.treasureclass !== "1") {
              warn(
                `'${field}' uses '${matched}' as an auto-tc but 'TreasureClass' is not set to 1`,
              );
            }
          }
        } else if (item === record["treasure class"]) {
          warn(`'${field}' can't be same as own TC`);
        } else {
          warn(`can't find '${item}' for '${field}'`);
        }
      });
    });
  }
}

/**
 * If 'Picks' is negative, the prop columns must all add to its absolute value.
 */
@lintrule
export class ValidNegativePicks extends Rule {
  GetRuleName() {
    return "TC/ValidNegativePicks";
  }

  Evaluate(workspace: Workspace) {
    const { treasureClassEx } = workspace;

    if (treasureClassEx === undefined) {
      return;
    }

    treasureClassEx.forEach((tc, line) => {
      let picks = 0;
      if (tc.picks === "") {
        return; // skip.
      }

      try {
        picks = parseInt(tc.picks as unknown as string);
      } catch {
        this.Warn(
          `${tc.GetFileName()}, line ${
            line + 2
          }: 'picks' is not a number for '${tc["treasure class"]}'`,
        );
        return;
      }

      if (picks >= 0) {
        return;
      }

      const picksAbs = Math.abs(picks);
      const probs: (keyof D2RTreasureClassEx)[] = [
        "prob1",
        "prob2",
        "prob3",
        "prob4",
        "prob5",
        "prob6",
        "prob7",
        "prob8",
        "prob9",
        "prob10",
      ];

      const picksReal = probs.reduce((sum, key) => {
        let val = 0;
        try {
          val = parseInt(tc[key] as unknown as string);
        } catch {
          this.Warn(
            `${tc.GetFileName()}, line ${
              line + 2
            }: '${key}' is not a number for '${tc["treasure class"]}'`,
          );
        }
        return sum + val;
      }, 0);

      if (picksReal !== picksAbs) {
        this.Warn(
          `${tc.GetFileName()}, line ${
            line + 2
          }: 'picks' (${picks}) doesn't match negative sum of probs (${picksReal}) for '${
            tc["treasure class"]
          }'`,
        );
      }
    });
  }
}

/**
 * If a value is defined in 'item1'-'item10', it must have a value in 'prob1'-'prob10'
 */
@lintrule
export class ValidProbs extends Rule {
  GetRuleName() {
    return "TC/ValidProbs";
  }

  Evaluate(workspace: Workspace) {
    const { treasureClassEx } = workspace;
    if (treasureClassEx === undefined) {
      return;
    }

    const matchingFields: [
      keyof D2RTreasureClassEx,
      keyof D2RTreasureClassEx,
    ][] = [
      ["item1", "prob1"],
      ["item2", "prob2"],
      ["item3", "prob3"],
      ["item4", "prob4"],
      ["item5", "prob5"],
      ["item6", "prob6"],
      ["item7", "prob7"],
      ["item8", "prob8"],
      ["item9", "prob9"],
      ["item10", "prob10"],
    ];

    treasureClassEx.forEach((tc, line) => {
      matchingFields.forEach((fieldSet) => {
        const ikey = fieldSet[0];
        const pkey = fieldSet[1];
        const item = tc[ikey];
        const prob = tc[pkey];

        if (item === "") {
          return; // skip
        }

        if (prob === "") {
          this.Warn(
            `${tc.GetFileName()}, line ${
              line + 2
            }: no '${pkey}' for '${ikey}' in '${tc["treasure class"]}'`,
          );
          return;
        }

        try {
          parseInt(prob as unknown as string);
        } catch {
          this.Warn(
            `${tc.GetFileName()}, line ${
              line + 2
            }: '${pkey}' is not a number in '${tc["treasure class"]}'`,
          );
        }
      });
    });
  }
}
