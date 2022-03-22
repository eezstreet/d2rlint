# D2RLint (d2rlint)

Taking cues from projects such as [https://eslint.org/](eslint), D2RLint will
examine the tab-delimited spreadsheet ("Excel") files and JSON string tables for
Diablo II: Resurrected, and make note of any errors.

This is designed to be the direct successor of Paul Siramy's D2TxtAnalyzer.

## For developers

This project uses [deno](https://deno.land/). It is _strongly_ recommended that
Visual Studio Code be used with the
[deno extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno).

### Compiling

In order to compile the program, use the following (assuming `deno` is available
in your `PATH`):

```
deno compile --allow-read --allow-write src/main.ts
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
