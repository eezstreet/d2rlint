import { lintrule, Rule } from "../lib/rule.ts";
import {
  D2RItemExcelRecord,
  D2RItemTypes,
  Workspace,
} from "../lib/workspace.ts";

/**
 * Gem Sockets must be <= Min(invwidth x invheight, 6)
 * MaxSockets1<=MaxSockets2<=MaxSockets3===GemSockets
 * MaxSocketLevelThreshold1<MaxSocketLevelThreshold2<MaxSocketLevelThreshold3
 */
@lintrule
export class ValidSockets extends Rule {
  GetRuleName() {
    return "Items/ValidSockets";
  }

  Evaluate(workspace: Workspace): void {
    const { armor, misc, weapons, itemTypes } = workspace;

    // Ensure that we have all of the files.
    if (
      armor === undefined || misc === undefined || weapons === undefined ||
      itemTypes === undefined
    ) {
      return;
    }

    const warn = (file: string, line: number, msg: string) => {
      this.Warn(`${file}, line ${line + 2}: ${msg}`);
    };

    // Ensure that MaxSocketLevelThreshold1/2 are all valid, first.
    itemTypes.forEach((itemType, _line) => {
      const { code, GetFileName } = itemType;
      const file = GetFileName();
      const line = _line;
      let thres1 = 0, thres2 = 0;
      let sockets1 = 0, sockets2 = 0, sockets3 = 0;

      const makeNumber = (k: keyof D2RItemTypes) => {
        try {
          return parseInt(itemType[k] as unknown as string);
        } catch {
          warn(
            file,
            line,
            `'${k}' is not a number for item type '${code}'`,
          );
          return 0;
        }
      };

      thres1 = makeNumber("maxsocketslevelthreshold1");
      thres2 = makeNumber("maxsocketslevelthreshold2");
      sockets1 = makeNumber("maxsockets1");
      sockets2 = makeNumber("maxsockets2");
      sockets3 = makeNumber("maxsockets3");

      if (thres1 > thres2) {
        warn(
          file,
          line,
          `MaxSocketsLevelThreshold1 > MaxSocketsLevelThreshold2 for item type '${code}'`,
        );
      }

      if (sockets1 > sockets2) {
        warn(
          file,
          line,
          `MaxSockets1 > MaxSockets2 for item type '${code}'`,
        );
      }
      if (sockets2 > sockets3) {
        warn(
          file,
          line,
          `MaxSockets2 > MaxSockets3 for item type '${code}'`,
        );
      }
      if (sockets1 > sockets3) {
        warn(
          file,
          line,
          `MaxSockets1 > MaxSockets3 for item type '${code}'`,
        );
      }
      if (sockets1 > 6 || sockets1 < 0) {
        warn(
          file,
          line,
          `invalid MaxSockets1 (${sockets1}) for item type '${code}'`,
        );
      }
      if (sockets2 > 6 || sockets2 < 0) {
        warn(
          file,
          line,
          `invalid MaxSockets2 (${sockets2}) for item type '${code}'`,
        );
      }
      if (sockets3 > 6 || sockets3 < 0) {
        warn(
          file,
          line,
          `invalid MaxSockets3 (${sockets3}) for item type '${code}'`,
        );
      }
    });

    [misc, armor, weapons].forEach((itemFile) =>
      itemFile.forEach((item, _line) => {
        const line = _line + 2;
        const file = item.GetFileName();
        const {
          name,
          type,
          type2,
        } = item;

        const makeNumber = (k: keyof D2RItemExcelRecord) => {
          try {
            return parseInt(item[k] as unknown as string);
          } catch {
            warn(file, line, `'${k}' for '${name}' is not a number`);
            return 0;
          }
        };

        const itemType1 = itemTypes.find((it) => it.code === type);
        const itemType2 = itemTypes.find((it) => it.code === type2);
        let itemTypeDefinedSockets = 0;

        const findMaxSocketsForItemType = (it: D2RItemTypes | undefined) => {
          if (it === undefined) {
            return 0;
          }
          const { maxsockets1, maxsockets2, maxsockets3 } = it;
          try {
            const ms1 = parseInt(maxsockets1 as unknown as string);
            const ms2 = parseInt(maxsockets2 as unknown as string);
            const ms3 = parseInt(maxsockets3 as unknown as string);
            return Math.max(ms1, ms2, ms3);
          } catch {
            return 0;
          }
        };

        itemTypeDefinedSockets = Math.max(
          findMaxSocketsForItemType(itemType1),
          findMaxSocketsForItemType(itemType2),
        );

        const gemsockets = makeNumber("gemsockets");
        const gemapplytype = makeNumber("gemapplytype");
        const hasinv = makeNumber("hasinv");
        const invwidth = makeNumber("invwidth");
        const invheight = makeNumber("invheight");

        if (hasinv !== 1) {
          return; // just bail here, this item is not supposed to have sockets
        }

        if (gemsockets > itemTypeDefinedSockets) {
          warn(
            file,
            line,
            `gemsockets (${gemsockets}) won't spawn on '${name}' because its type(s) won't allow more than ${itemTypeDefinedSockets} sockets.`,
          );
        }
        if (gemapplytype < 0 || gemapplytype > 3) {
          warn(
            file,
            line,
            `invalid gemapplytype '${gemapplytype}' for '${name}'`,
          );
        }
        if (gemsockets > invwidth * invheight) {
          warn(
            file,
            line,
            `'${name}' has more gemsockets (${gemsockets}) than inventory spaces used (${invwidth} x ${invheight} = ${
              invheight * invwidth
            })`,
          );
        }
      })
    );
  }
}

/**
 * Charms aren't allowed to be gambled.
 */
@lintrule
export class NoIllegalGambling extends Rule {
  GetRuleName() {
    return "Items/NoIllegalGambling";
  }

  Evaluate(workspace: Workspace) {
    const { gamble, misc, weapons, armor, itemTypes } = workspace;

    if (
      gamble === undefined || misc === undefined || weapons === undefined ||
      armor === undefined || itemTypes === undefined
    ) {
      return;
    }

    gamble.forEach((entry, _line) => {
      const line = _line + 2;
      const file = entry.GetFileName();
      const miscCode = misc.find((item) => item.code === entry.code);
      const armorCode = armor.find((item) => item.code === entry.code);
      const weaponCode = weapons.find((item) => item.code === entry.code);
      const realEntry = miscCode !== undefined
        ? miscCode
        : armorCode !== undefined
        ? armorCode
        : weaponCode !== undefined
        ? weaponCode
        : undefined;
      let warned = false;
      if (realEntry === undefined) {
        // not found. this will trigger other warnings, so just skip for now.
        return;
      }

      const walkItemType = (it: string) => {
        if (it === "" || warned) {
          return;
        }
        if (it === "char") {
          warned = true;
          this.Warn(
            `${file}, line ${line}: Charms, such as '${entry.code}', cannot be gambled.`,
          );
        }

        const itemTypeEntry = itemTypes.find((it2) => it2.code === it);
        if (itemTypeEntry === undefined) {
          // whole different can of worms. skip for now.
          return;
        }

        walkItemType(itemTypeEntry.equiv1 as unknown as string);
        walkItemType(itemTypeEntry.equiv2 as unknown as string);
      };

      walkItemType(realEntry.type as unknown as string);
      walkItemType(realEntry.type2 as unknown as string);
    });
  }
}
