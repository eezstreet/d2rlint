# D2RLint (d2rlint)

Taking cues from projects such as [eslint](https://eslint.org/), D2RLint will
examine the tab-delimited spreadsheet ("Excel") files and JSON string tables for
Diablo II: Resurrected, and make note of any errors.

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
  "rules": {
    "Levels/ValidMonsters": {
      "action": "warn"
    }
  }
}
```

Please type the location where any .txt files can be found in the "workspace"
folder. This is recursive; for example, you can type
`C:/Program Files (x86)/Diablo II/MyMod` and it will search for everything. Or
you can type `C:/` for all it cares.

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

- `Basic/NoDuplicates`: Fields that should not be duplicated will present a
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
- `String/NoUntranslated`: Ensures that all languages for all strings are
  translated, and no fields are excluded unnecessarily. **This is ignored by
  default.** This triggers a lot of errors and can slow down the program
  considerably and is only really meant for advanced usage.

Note that the files that ship with the original game will trigger some of these
rules. **This is normal.** There are genuine errors in their own files, and this
is to be expected.

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
- Make column checking into a Rule.
- Auto-fix config file when it is missing data about new rules.
- Auto-fix problems (similar to ESLint)
- Improve the look of the display (using chalk)
- More rules!
