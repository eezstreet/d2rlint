# d2rlint

This program is designed to read Diablo II: Resurrected and Diablo II: Lord of Destruction data files, either from the stock Blizzard game or from user-created mods and do two things with them:

1. Check the files for errors using a series of rules. (AKA linting, hence the name of this application)

2. Output .html documentation of the files, indicating sets and set items, unique items, runewords, Horadric Cube recipes, gems, items, magic prefixes/suffixes, and more.

It is designed to be used by modmakers who want to check their files for errors and quickly generate documentation for their mods.

## Data Files

Diablo II (both Resurrected and Lord of Destruction) make use of data files in .txt format. These are tab-delimited spreadsheet files. Each row in misc.txt, weapons.txt, or armor.txt each denotes a new item, for example, while the columns control various properties of the item, such as damage for a weapon and so on.

The columns and valid values for them in the .txt files can vary between different versions of the game.

Resurrected adds .json files which mostly control visuals and translations to other languages. Resurrected also provides some documentation as to what the columns do. (Lord of Destruction does not have this documentation - the Phrozen Keep forums has file guides for most of the .txt files)

# Project Structure

The program is written in TypeScript and makes use of Deno. The project is organized as a Deno monorepo under `packages/`:

- `packages/lib/` — The `@d2rlint/lib` package: all library code (workspace, rules, doc generation, commands)
- `packages/cli/` — The `@d2rlint/cli` package: the CLI entry point (`main.ts`) and command dispatch

The root `deno.json` declares the workspace:
```json
{ "workspace": ["packages/lib", "packages/cli"] }
```

## Key Files

| File | Purpose |
|------|---------|
| `packages/cli/main.ts` | Entry point, orchestrates the full flow |
| `packages/lib/lib/config.ts` | Configuration loading/saving, rule config, `SavedConfiguration` interface |
| `packages/lib/lib/workspace.ts` | Excel parsing (`ParseExcel<T>()`), 80+ `D2RExcelRecord` subclass definitions, `Workspace` interface |
| `packages/lib/lib/rule.ts` | `Rule` base class, `@lintrule` decorator, rule registration system |
| `packages/lib/lib/log.ts` | Log file management (`LogFile` class) |
| `packages/lib/lib/misc.ts` | Utility functions (`seq`, `deepMerge`, `isObject`) |
| `packages/lib/rules/*.ts` | Domain-specific rule implementations (basic, items, cube, monsters, skills, levels, treasure, string) |
| `packages/lib/rules/mod.ts` | Side-effect barrel — importing this registers all rules via `@lintrule` |
| `packages/cli/commands/index.ts` | CLI command dispatch (dictionary-based) |
| `packages/lib/commands/*.ts` | CLI command handlers (bulk-code-lookup, bulk-itemgfx-lookup, bulk-set-and-unique) |
| `packages/lib/doc/doc.ts` | Documentation orchestrator (`GenerateDocs()`) |
| `packages/lib/doc/template.ts` | HTML page template wrapper (`GeneratePage()`) |
| `packages/lib/doc/items.ts` | Property/stat conversion utilities (`PropertyList`, `PropertyListToItemStatList`) |
| `packages/lib/doc/items/*.ts` | Page generators (unique, set, magic, gems, runeword, base items) |
| `packages/lib/doc/cube/cube.ts` | Cube recipe parser and HTML generator |
| `packages/lib/doc/lib.ts` | Doc-generation utilities (string lookup, formatting) |
| `packages/lib/mod.ts` | Public API barrel for `@d2rlint/lib` |
| `packages/lib/commands/mod.ts` | Public commands barrel for `@d2rlint/lib/commands` |

## Main Control Flow

1. **Configuration**: `GetConfig()` loads or creates `config.json`. On first run, creates defaults and prompts the user to edit. On subsequent runs, deep-merges saved config with defaults (forward-compatibility for new fields/rules).
2. **Workspace Loading**: `LoadWorkspace(workspace, fallback, legacy)` parses all D2 data files. For each file type, `ParseExcel<T>()` reads the tab-delimited .txt, maps headers to columns, and creates typed record instances. Files not found return `undefined`.
3. **Command Dispatch**: If CLI args are present (`Deno.args`), routes to matching command handler and exits. Commands are registered in a dictionary in `packages/cli/commands/index.ts`.
4. **Rule Evaluation**: `GetAllRules()` instantiates all `@lintrule`-decorated rules. Each rule is checked against config — if its action is not `"ignore"`, `rule.Evaluate(workspace)` is called. Rules call `this.Warn()` or `this.Message()` to output findings.
5. **Documentation Generation**: If `generateDocs` is enabled in config, `GenerateDocs(workspace)` iterates through page types, calls each generator function (e.g., `DocUniques(ws)`), wraps with `GeneratePage()` template, and writes HTML to `docs/`.
6. **Interactive Wait**: Uses `Deno.stdin.readSync()` at major steps to pause for user input before continuing.

## Design Patterns

### Decorator-Based Rule Registration
Rules are defined as classes extending `Rule` and decorated with `@lintrule` (in `packages/lib/lib/rule.ts`). The decorator registers the class in a global `lintrules` map. `GetAllRules()` instantiates all registered rules. Rules are identified by hierarchical names like `"Basic/NoDuplicateExcel"` or `"Cube/ValidInputs"`.

The decorator uses the legacy `experimentalDecorators` TypeScript syntax (one-argument form). **Do not attempt to migrate to TC39 standard decorator syntax** — Deno does not currently handle the two-argument TC39 class decorator signature without explicit `compilerOptions` in `deno.json`, and doing so breaks type-checking across all rule files.

### Rule Imports in main.ts Are Load-Time Registrations
The CLI imports `@d2rlint/lib/rules` (which resolves to `packages/lib/rules/mod.ts`). This is not unused — importing the module causes the `@lintrule` decorator to fire for every rule class, registering them all. Removing the import would silently disable all rules.

### Generic Excel Parsing
`ParseExcel<T extends D2RExcelRecord>()` in `workspace.ts` is a single generic function that handles all .txt file parsing. It takes a constructor type parameter, reads the file, decodes as ASCII, splits by tabs, maps the header row to column indices, and creates typed instances. Column headers are lowercased during parsing, so record property names must be lowercase.

### Excel Record Hierarchy
```
D2RExcelRecord (abstract base)
├── D2RItemExcelRecord (abstract, shared item fields)
│   ├── D2RArmor
│   ├── D2RWeapons
│   └── D2RMisc
├── D2RMonStats, D2RSetItems, D2RUniqueItems, ...
└── ~70+ other specific types
```
Each subclass defines `GetFileName()`, `GetOptionalFields()`, and `GetVersionChanges()`. Fields are typed as `unknown` to allow flexible column mapping from the parser. `GetOptionalFields()` lists fields that are always optional regardless of game version (e.g., armor doesn't have weapon columns). `GetVersionChanges()` returns per-patch additions/removals relative to the D2:LoD baseline, enabling version-aware column validation via `getFieldsNotExpectedForVersion()`.

### Workspace as Centralized Data Store
The `Workspace` interface (in `workspace.ts`) is a large collection of optional properties — one per data file type, plus computed categories and string tables. It acts as a DTO passed to all rules and doc generators. Optional fields handle missing files gracefully (rules/docs check for `undefined`).

### Rule Action Hierarchy
Rules have three action levels configured per-rule in `config.json`:
- `"warn"`: Yellow console output, log to file, continue
- `"error"`: Red console output, log to file, pause execution, exit with code 1
- `"ignore"`: Skip rule entirely

### Deep Merge for Config Evolution
`deepMerge()` in `misc.ts` recursively merges saved config with defaults on load. This ensures new rules and options appear automatically without requiring users to manually edit config, while preserving all existing user settings.

### Documentation Generation Pipeline
`GenerateDocs()` orchestrates page generation. Each page type has a generator function (e.g., `DocUniques(ws): string`) that builds an HTML string. `GenerateHtml()` calls the generator, wraps with `GeneratePage()` (nav + boilerplate), and writes to `docs/`. Pages can be excluded via `docOptions.filterPages[]`.

## Caveats

- **Column headers are lowercased**: The Excel parser lowercases all header fields. Record property names must be lowercase to match. Columns starting with `*` are ignored.
- **`@skipdocs` special column**: Any `.txt` file can include a `@skipdocs` column — rows with a non-empty value in this column are excluded from documentation output. This is handled specially in the parser.
- **Category markers use `@` prefix**: In doc generation, items whose index/name starts with `@` are treated as category headers (section dividers), not actual items. This is a convention in the data files.
- **Workspace categories are computed at doc time**: Properties like `uniqueCategories`, `armorCategories`, etc. on the `Workspace` interface are populated during documentation generation, not during workspace loading.
- **Legacy mode**: The `legacy` config flag switches between D2:Resurrected (`false`) and D2:LoD (`true`). Many files are conditionally loaded — D2R-only files like `actinfo.txt` or `levelgroups.txt` are skipped in legacy mode.
- **File discovery is recursive**: `ParseExcel()` searches recursively in the workspace directory (and fallback directory) for each file, case-insensitively.
- **Logging is unbuffered**: `LogFile.WriteLine()` appends to the log file synchronously on each call via `Deno.writeTextFileSync()`.
- **Terminal colors use `@std/fmt/colors`**: Imported from `jsr:@std/fmt/colors`. Uses `brightRed`, `brightYellow`, `cyan`, `gray`. (Previously used `chalk_deno` — do not reintroduce it.)
- **Doc localization is config-driven**: `docOptions` in config contains 30+ localizable strings for page names, cube recipe qualifiers, item property labels, and day-of-week arrays — all replaceable in `config.json`.
- **Never commit config files**: Config files (`config.json`, `config.*.json`) are user-specific and should never be staged or committed.

## Ground Truth Test Data

`ground-truth/` contains reference data files for each supported game version:
- `ground-truth/1.13/` — D2:LoD 1.13
- `ground-truth/2.6/` — D2:Resurrected 2.6
- `ground-truth/3.0/` — D2:Resurrected 3.0

Each version directory has a `CLAUDE.md` documenting version-specific changes relevant to d2rlint (new columns, new files, record class changes needed, etc.). Use these to test the linter against known-good data without needing a full game install.
