# D2RLint (d2rlint)

Taking cues from projects such as [eslint](https://eslint.org/), D2RLint will
examine the tab-delimited spreadsheet ("Excel") files and JSON string tables for
Diablo II: Resurrected, and make note of any errors.

It is partially backwards compatible with Legacy. See below.

This is designed to be the direct successor of Paul Siramy's D2TxtAnalyzer.

## For users

On first use, the executable will first print a message telling you that it
wrote a config file:

```
d2rlint didn't start, because the configuration file was missing. One has been generated for you.
Please edit the configuration file (config.json) to set your workspace location.
By default, this will look in the current working directory.
Press any key to continue.
```

You will find that it has produced a `config.json` file:

```json
{
  "workspace": "",
  "fallback": "",
  "log": "output.txt",
  "legacy": false,
  "rules": {
    "Basic/NoDuplicateExcel": {
      "action": "warn"
    },
    "Basic/LinkedExcel": {
      "action": "warn"
    },
    "Basic/NumericBounds": {
      "action": "warn"
    },
    "Cube/ValidInputs": {
      "action": "warn"
    },
    "Cube/ValidOutputs": {
      "action": "warn"
    },
    "Cube/ValidOp": {
      "action": "warn"
    },
    "Level/ValidWarp": {
      "action": "warn"
    },
    "Level/ValidWPs": {
      "action": "warn"
    },
    "String/NoUntranslated": {
      "action": "ignore"
    },
    "TC/ValidTreasure": {
      "action": "warn"
    }
  }
}
```

Please type the location where any .txt files can be found in the "workspace"
folder. This is recursive; for example, you can type
`C:/Program Files (x86)/Diablo II/MyMod` and it will search for everything. Or
you can type `C:/` for all it cares.

If you want, you can also add a fallback directory. If files aren't found in the
"workspace" folder, it'll also try to look in the "fallback" folder.

You can adjust the level of concern for each individual rule within the
`"rules"` section. There are three "action levels":

- `"warn"`: the default for most rules, this will warn about the rule but
  continue execution
- `"ignore"`: if this is set, the rule will be ignored (the rule is not even
  evaluated)
- `"error"`: throw an error if this rule fails and don't continue

Please note that only `"ignore"` has any impact at the moment as this tool is
still under development.

### List of Rules

- `Basic/NoDuplicateExcel`: Fields that should not be duplicated will present a
  warning. For example, using the same `code` field in any two rows within
  either misc.txt, armor.txt, or weapons.txt will throw a warning.
- `Basic/ExcelColumns`: Columns that aren't optional and are missing will throw
  a warning. Likewise, columns that aren't supposed to be there will throw a
  warning. (Columns that start with an asterisk (*) are not parsed, and are
  ignored.)
- `Basic/LinkedExcel`: Ensures that all inter-file linkage is accurate, with a
  few exceptions. Examples include things like checking for missing strings,
  checking for invalid item codes and so on. This won't check Treasure Class or
  Cube linkage, this is handled by other rules.
- `Basic/NumericBounds`: Ensures that no fields go out of bounds. For example, a
  number greater than 6 for 'Picks' in TreasureClassEx.txt would be considered
  invalid for a TC.
- `Cube/ValidInputs`: Ensures that both the number of inputs and the inputs
  themselves to cube recipes are valid.
- `Cube/ValidOutputs`: Ensures that the outputs to cube recipes are valid.
- `Cube/ValidOp`: Ensures that valid parameters and values are passed to
  opcodes.
- `Items/NoIllegalGambling`: Ensures that charms cannot be gambled.
- `Items/ValidSockets`: Ensures that all items have valid numbers of sockets.
- `Level/ValidWarp`: Ensures that levels are linked together with valid vis/warp
  values.
- `Level/ValidWPs`: Ensures that no two levels share the same waypoint index.
- `Monsters/ValidChains`: Ensures that baseId/NextInClass chain is correct.
- `Skills/EqualSkills`: Ensures that all classes have the same number of skills.
- `String/NoUntranslated`: Ensures that all languages for all strings are
  translated, and no fields are excluded unnecessarily. **This is ignored by
  default.** This triggers a lot of errors and can slow down the program
  considerably and is only really meant for advanced usage.
- `TC/ValidProbs`: Ensures that Treasure Classes with negative `Picks` values
  have their probs values equal the negative absolute value of the `Picks`
  column.
- `TC/ValidTreasure`: Ensures that Treasure Classes are linked together
  properly.

Note that the files that ship with the original game will trigger some of these
rules. **This is normal.** There are genuine errors in their own files, and this
is to be expected.

### Legacy Mode

By changing `legacy: false` to `legacy: true` in the config.json, your workspace
will be treated as a Diablo II: Legacy workspace instead of a Diablo II:
Resurrected one. The support for Legacy is not quite there yet. Mainly, it has a
few issues:

- TBL files aren't parsed yet, so it can't check if strings are unfound or
  untranslated. (`String/NoUntranslated` does not work _at all_ in legacy mode
  currently.)
- A few of the column changes from Legacy to Resurrected aren't fully reflected
  yet.

## For developers

This project uses [deno](https://deno.land/). It is _strongly_ recommended that
Visual Studio Code be used with the
[deno extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno).

### Compiling

In order to compile the program, use the following (assuming `deno` is available
in your `PATH`):

```
deno compile --allow-read --allow-write --allow-env src/main.ts
```

This will produce a `src.exe` or `src` executable (depending on your platform).

### Creating new rules

The program is designed to be extensible and customizable for your needs. In the
`src/rules` directory you can create new rules. They are pretty straightforward:

```ts
import { lintrule, Rule } from "../lib/rule.ts";

@lintrule
export default class MyCustomRule extends Rule {
  GetRuleName(): string {
    return "MyRules/MyCustomRule";
  }

  Evaluate(workspace: Workspace): void {
    // check if something in the workspace isn't satisfactory, print if not
    return;
  }
}
```

This example rule will always pass, but check out some examples of rules that
have already been created within that directory.

Remember that rules need to be imported within the `main.ts` otherwise they will
not be called.

## Licensing

This project is licensed under the GNU GPLv3 license.

## Future plans

- Backwards compatibility with Diablo II (un-resurrected). It works fine, but it
  will warn about missing column headers.
- Auto-fix problems (similar to ESLint)
- More rules!
