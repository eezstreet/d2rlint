# D2RLint (d2rlint)

Taking cues from projects such as [eslint](https://eslint.org/), D2RLint will
examine the tab-delimited spreadsheet ("Excel") files and JSON string tables for
Diablo II: Resurrected, and make note of any errors. Designed to be the direct
successor of Paul Siramy's fantastic D2TxtAnalyzer, this tool checks for many
more problems and is designed to work with Diablo II: Resurrected. It is still
partially backwards-compatible with the legacy version of the game.

This tool also provides two more features:

- **Automatic mod documentation**. Once enabled in the configuration file,
  d2rlint will genenerate HTML documentation for your mod. This includes
  information about Horadric Cube recipes, runewords, sets, and more.
- **Other helpful utilities**. There are a number of different commands that you
  can execute in the commandline to make your life a little bit easier.

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
  "logAppend": false,
  "legacy": false,
  "iveConsideredDonating": false,
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
    // ...
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

The program by default writes to `stdout`, but it can also write to a log file.
If `logAppend` is turned on, it will write to the same log file over and over
again.

The program will output a banner at the top of `stdout` unless
`iveConsideredDonating` has been turned on. **Please consider donating!**

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
- `Items/ValidStatParameters`: Ensures that all item minimums and maximums are
  within the bounds specified by the `Save Bits` and `Save Add` fields in
  `itemstatcost.txt`. Additionally, it verifies that all skill-based parameters
  for items (such as chance-to-cast and charged skills) point to valid skills.
- `Level/ValidWarp`: Ensures that levels are linked together with valid vis/warp
  values.
- `Level/ValidWPs`: Ensures that no two levels share the same waypoint index.
- `Monsters/ValidChains`: Ensures that baseId/NextInClass chains are correct.
- `Skills/EqualSkills`: Ensures that all classes have the same number of skills.
- `String/NoUntranslated`: Ensures that all languages for all strings are
  translated, and no fields are excluded unnecessarily. _This is ignored by
  default._ This triggers a lot of errors in the base game and can be slow.
- `TC/ValidNegativePicks`: Ensures that Treasure Classes with negative `Picks`
  values have their `prob`s values equal the negative absolute value of the
  `Picks` column.
- `TC/ValidProbs`: Ensures that Treasure Classes have pairing values for
  `item1`-`item10` and `prob1`-`prob10`. For example, if an item has a value in
  `item1` but not a matching value in `prob1`, this will trigger a warning.
- `TC/ValidTreasure`: Ensures that Treasure Classes are linked together
  properly. Specifically, this triggers warnings if a value in `item1`-`item10`
  points to something that is _not_ a previously-occurring Treasure Class, a Set
  or Unique item name (as indicated by the `index` field of `setitems.txt` or
  `uniqueitems.txt`), an item type from `itemtypes.txt` with `AutoTC` set, _or_
  a valid item code from `armor.txt`, `misc.txt` or `weapons.txt`. It handles
  `mul=` on item codes.

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

## Advanced Feature: Automatic Mod Documentation

This program also features the ability to automatically generate mod
documentation for your mod in HTML format. It can generate data for the
following:

- Cube Recipes
- Sets
- Magic Affixes
- Base Items
- Runewords
- Unique Items

To use it, you'll need to enable it in the configuration and re-run the tool.

There is the following:

```json
"generateDocs": false,
```

Change this to read:

```json
"generateDocs": true,
```

It'll automatically generate a "docs" folder, with HTML files that you can
customize and edit at your whim.

### CSS Styling

By default, the mod documentation is totally unstyled and you'll want a CSS file
to make everything look pretty. A 'styles.css' file is included in this repo.
Move it into the 'docs' folder that is generated for a nice clean look to start
out with. Feel free to customize as you want.

### Hidden item properties

By default, entries in itemstatcost.txt will throw warnings if there is no
descfunc specified. To fix this problem, you can add a field to the
`localizedStrings` section of the `docOptions` within the config. For a
real-world scenario, consider Eastern Sun; every item in the mod has a hidden
number of "tinker points" that are available for use. But since this property is
hidden, it will throw a warning on every `item_tinkerflag2` that it comes
across.

To fix it in this case, we would add the following:

```json
"hiddenItemProperties": {
  "item_tinkerflag2": "%d Tinker Points"
},
```

### Hiding data from the docs

We might want certain things to be hidden or discovered by the player, or we
might want to just hide lots of superfluous recipes in the cube - there's sure
to be a lot of them.

In the following files, you can add a `@skipdocs` column. Anything with a '1' in
this column will be hidden in the documentation:

- armor.txt
- misc.txt
- weapons.txt
- gems.txt
- uniqueitems.txt
- sets.txt
- runes.txt
- cubemain.txt

### Section Headers

Let's say you're a huge mod with thousands of unique items. Creating a list of a
thousand items to scroll through is very tedious; you can break it up by using
sections.

Making your docs have sections is really easy. All you need to do is add a row
in your excel file, with the first cell starting with a '@'. For example,
creating a cell called '@Helmets' will show a section titled "Helmets" and add
that to the list of section headers. It's really that simple.

You can do this in the following files:

- armor.txt
- weapons.txt
- gems.txt
- uniqueitems.txt
- sets.txt
- runes.txt

## Other helpful utilities

There are three helpful utilities that can be accessed through the commandline.

### Bulk Item Code Lookup

To use this utility, execute d2rlint from the commandline like so:

```
./d2rlint bulk-code-lookup <input file> <output file>
```

What this does is take a list of item names (from the first column of armor.txt,
misc.txt, or weapons.txt) and looks up their corresponding item code, and
returns the result as a tab-delimited .txt file. This is super useful in some
niche situations, such as creating Set or Unique items quickly when you don't
have the item codes memorized.

For example, let's take the following list:

```
Hunter's Bow
Quilted Armor
Light Belt
Heavy Gloves
Helm
Composite Bow
Ring Mail
Long Battle Bow
Light Plated Boots
```

If we ran this on this list, we would get the following:

```
hbw	Hunter's Bow
qui	Quilted Armor
vbl	Light Belt
vgl	Heavy Gloves
hlm	Helm
cbw	Composite Bow
rng	Ring Mail
lbb	Long Battle Bow
tbt	Light Plated Boots
```

...which can be copy-pasted into a tab-delimited TXT file for use in
uniqueitems.txt or setitems.txt.

### Bulk ItemGFX Lookup

To use this utility, execute d2rlint from the commandline like so:

```
./d2rlint bulk-itemgfx-lookup <input file> <output file>
```

The input file is a list of item codes. The output is a list of entries from
items.json that matches the given item indices.

For example, let's take the following list:

```
hbw
qui
vbl
vgl
hlm
cbw
rng
lbb
tbt
```

If we ran this on this list, we would get the following:

```
bow/hunters_bow	hbw
armor/quilted_armor	qui
belt/light_belt	vbl
glove/heavy_gloves	vgl
helmet/helm	hlm
bow/composite_bow	cbw
armor/ring_mail	rng
bow/long_battle_bow	lbb
boot/light_plate_boots	tbt
```

This is particularly useful if we want to find which assets are used by what, or
if we are constructing a new sets.json or uniqueitems.json. Speaking of that...

### Bulk Set/Unique.json

To use this utility, execute d2rlint from the commandline like so:

```
./d2rlint bulk-set-and-unique <input file> <output file>
```

The input file is a tab delimited list of set (or unique) items and the
corresponding graphic you want to use. The output is a .json file, fit for using
in setitems.json or uniqueitems.json.

For example, if we ran this through the program:

```
Arctic Horn	bow/hunters_bow
Arctic Furs	armor/quilted_armor
Arctic Binding	belt/light_belt
Arctic Mitts	glove/heavy_gloves
Archer Helmet	helmet/helm
Standard Bow	bow/composite_bow
Military Garb	armor/ring_mail
Vidala's Barb	bow/long_battle_bow
Vidala's Fetlock	boot/light_plate_boots
```

The result would look like this:

```json
[
  {
    "arctic_horn": {
      "normal": "bow/hunters_bow",
      "uber": "bow/hunters_bow",
      "ultra": "bow/hunters_bow"
    }
  },
  {
    "arctic_furs": {
      "normal": "armor/quilted_armor",
      "uber": "armor/quilted_armor",
      "ultra": "armor/quilted_armor"
    }
  },
  {
    "arctic_binding": {
      "normal": "belt/light_belt",
      "uber": "belt/light_belt",
      "ultra": "belt/light_belt"
    }
  },
  {
    "arctic_mitts": {
      "normal": "glove/heavy_gloves",
      "uber": "glove/heavy_gloves",
      "ultra": "glove/heavy_gloves"
    }
  },
  {
    "archer_helmet": {
      "normal": "helmet/helm",
      "uber": "helmet/helm",
      "ultra": "helmet/helm"
    }
  },
  {
    "standard_bow": {
      "normal": "bow/composite_bow",
      "uber": "bow/composite_bow",
      "ultra": "bow/composite_bow"
    }
  },
  {
    "military_garb": {
      "normal": "armor/ring_mail",
      "uber": "armor/ring_mail",
      "ultra": "armor/ring_mail"
    }
  },
  {
    "vidalas_barb": {
      "normal": "bow/long_battle_bow",
      "uber": "bow/long_battle_bow",
      "ultra": "bow/long_battle_bow"
    }
  },
  {
    "vidalas_fetlock": {
      "normal": "boot/light_plate_boots",
      "uber": "boot/light_plate_boots",
      "ultra": "boot/light_plate_boots"
    }
  },
  {
    "vidalas_ambush": {
      "normal": "armor/plate_mail",
      "uber": "armor/plate_mail",
      "ultra": "armor/plate_mail"
    }
  },
  {
    "vidalas_snare": {
      "normal": "amulet/amulet",
      "uber": "amulet/amulet",
      "ultra": "amulet/amulet"
    }
  }
]
```

...which is a valid sets.json file.

## Licensing

This project is licensed under the GNU GPLv3 license.

## Future plans

- Auto-fix problems (similar to ESLint)
- More rules!
- Maybe an IDE?
