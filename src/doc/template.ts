import { GetConfig } from "../lib/config.ts";
import { Workspace } from "../lib/workspace.ts";

function GeneratePage(inner: string): string {
  const config = GetConfig();

  return `<html>
    <head>
      <title>${config.docOptions.title}</title>
      <link rel="stylesheet" href="styles.css">
    </head>
    <body>
      <div class="header">
        <a href="index.html" class="header-item">Main</a>
        <a href="uniques.html" class="header-item">Unique Items</a>
        <a href="sets.html" class="header-item">Set Items</a>
        <a href="magic.html" class="header-item">Magic Prefixes/Suffixes</a>
        <a href="cube.html" class="header-item">Cube Recipes</a>
        <a href="armor.html" class="header-item">Armor</a>
        <a href="weapons.html" class="header-item">Weapons</a>
        <a href="misc.html" class="header-item">Misc Items</a>
        <a href="gems.html" class="header-item">Gems</a>
        <a href="runewords.html" class="header-item">Runewords</a>
      </div>
      ${inner}
    </body>
  </html>`;
}

export function GenerateHtml(
  html: string,
  ws: Workspace,
  generator: (ws: Workspace) => string,
) {
  Deno.writeTextFileSync(`docs/${html}`, GeneratePage(generator(ws)));
}
