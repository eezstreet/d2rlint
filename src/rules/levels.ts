import { lintrule, Rule } from "../lib/rule.ts";
import { D2RLevels, Workspace } from "../lib/workspace.ts";

/**
 * Check to make sure that the level has valid vis/warp entries
 */
@lintrule
export class ValidWarp extends Rule {
  GetRuleName(): string {
    return "Level/ValidWarp";
  }

  Evaluate(workspace: Workspace) {
    const { levels, lvlWarp } = workspace;

    if (levels === undefined || lvlWarp === undefined) {
      // skip this, we don't have enough data
      return;
    }

    levels.forEach((level, line) => {
      if (level.name === "Expansion") {
        return; // skip, it'll explode
      }

      const visFields: (keyof D2RLevels)[] = [
        "vis0",
        "vis1",
        "vis2",
        "vis3",
        "vis4",
        "vis5",
        "vis6",
        "vis7",
      ];

      const warpFields: (keyof D2RLevels)[] = [
        "warp0",
        "warp1",
        "warp2",
        "warp3",
        "warp4",
        "warp5",
        "warp6",
        "warp7",
      ];

      const warn = (msg: string) => {
        this.Warn(
          `${level.GetFileName()}, line ${
            line + 2
          }: ${msg} for level '${level.name}'`,
        );
      };

      visFields.forEach((visField, idx) => {
        // skip if vis is -1 or 0
        let vis = 0, warp = 0, id = 0;
        try {
          vis = parseInt(level[visField] as unknown as string);
        } catch {
          warn(`${visField} is not a number`);
        }
        try {
          warp = parseInt(level[warpFields[idx]] as unknown as string);
        } catch {
          warn(`${warpFields[idx]} is not a number`);
        }
        try {
          id = parseInt(level.id as unknown as string);
        } catch {
          warn(`id is not a number`);
        }

        if (vis <= 0) {
          return; // don't actually care
        }

        // These levels/warp combinations are intentionally wrong. They use weird hardcoded linkage that makes d2rlint fail no matter what. It's not actually an error.
        // Attempting to fix them will break the game however, so we probably shouldn't hint that it's a warning.
        if (
          (id === 26 && warpFields[idx] === "warp1") || // Act 1 - Monastery, warp1
          (id === 27 && warpFields[idx] === "warp0") || // Act 1 - Courtyard 1, warp0
          (id === 27 && warpFields[idx] === "warp1") || // Act 1 - Courtyard 1, warp1
          (id === 28 && warpFields[idx] === "warp0") || // Act 1 - Barracks, warp0
          (id === 32 && warpFields[idx] === "warp1") || // Act 1 - Courtyard 2, warp1
          (id === 33 && warpFields[idx] === "warp0") || // Act 1 - Cathedral, warp0
          (id === 107 && warpFields[idx] === "warp1") || // Act 4 - Lava 1, warp1
          (id === 108 && warpFields[idx] === "warp0") // Act 4 - Diablo 1, warp0
        ) {
          return;
        }

        if (vis >= levels.length) {
          warn(`invalid ${visField}`);
        }

        if (warp < 0 || warp >= lvlWarp.length) {
          warn(`invalid ${warpFields[idx]}`);
        }

        // Another case of the hardcodes. This time around, there's specific linkages in Act 5 that are hardcoded for some unknown reason.
        if (level.act === "4") {
          return;
        }

        const visLevel = levels[vis];
        // ensure that the level has one vis pointing back at us
        if (
          visFields.find((vfx) => visLevel[vfx] === `${line}`) === undefined
        ) {
          warn(
            `level '${visLevel.name}' doesn't have a vis field pointing at us`,
          );
        }
      });
    });
  }
}

/**
 * Ensure no identical waypoints.
 */
@lintrule
export class ValidWPs extends Rule {
  GetRuleName(): string {
    return "Level/ValidWPs";
  }

  Evaluate(workspace: Workspace) {
    const { levels } = workspace;

    if (levels === undefined) {
      return; // skip
    }

    levels.forEach((level, line) => {
      if (level.waypoint === "255") {
        return; // skip this level
      }
      for (let i = line + 1; i < levels.length; i++) {
        if (levels[i].waypoint === level.waypoint) {
          this.Warn(
            `${level.GetFileName()}, line ${
              line + 2
            }: duplicate waypoint '${level.waypoint}' detected for '${level.name}', on line ${
              i + 2
            } for '${levels[i].name}'`,
          );
        }
      }
    });
  }
}

/**
 * Ensure no overlapping.
 * TODO
 */
/*@lintrule
export class NoOverlap extends Rule {
  GetRuleName(): string {
    return "Level/NoOverlap";
  }

  Evaluate(workspace: Workspace) {
    const { levels } = workspace;
    if (levels === undefined) {
      return;
    }
  }
}*/
