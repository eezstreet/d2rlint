import { GetConfig } from "../lib/config.ts";
import { Workspace } from "../lib/workspace.ts";

function GeneratePage(inner: string): string {
  const config = GetConfig();
  const { docOptions } = config;
  const { title, localizedStrings } = docOptions;
  const { pageNames } = localizedStrings;
  const {
    main,
    runeword,
    uniques,
    sets,
    magic,
    cube,
    armor,
    weapons,
    gems,
    misc,
  } = pageNames;

  return `<html>
    <head>
      <title>${title}</title>
      <link rel="stylesheet" href="styles.css">
    </head>
    <body>
      <div class="header">
        <a href="index.html" class="header-item">${main}</a>
        <a href="uniques.html" class="header-item">${uniques}</a>
        <a href="runewords.html" class="header-item">${runeword}</a>
        <a href="sets.html" class="header-item">${sets}</a>
        <a href="magic.html" class="header-item">${magic}</a>
        <a href="cube.html" class="header-item">${cube}</a>
        <a href="armor.html" class="header-item">${armor}</a>
        <a href="weapons.html" class="header-item">${weapons}</a>
        <a href="gems.html" class="header-item">${gems}</a>
        <a href="misc.html" class="header-item">${misc}</a>
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
