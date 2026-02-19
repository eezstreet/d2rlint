import { GetConfig } from "../lib/config.ts";
import { Workspace } from "../lib/workspace.ts";

function GeneratePage(inner: string): string {
  const config = GetConfig();
  const { docOptions } = config;
  const { title, localizedStrings, filterPages } = docOptions;
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

  const mainHeader = `<a href="index.html" class="header-item">${main}</a>`;
  const uniqueHeader = !filterPages.includes("uniques")
    ? `<a href="uniques.html" class="header-item">${uniques}</a>`
    : "";
  const rwHeader = !filterPages.includes("runeword")
    ? `<a href="runewords.html" class="header-item">${runeword}</a>`
    : "";
  const setHeader = !filterPages.includes("sets")
    ? `<a href="sets.html" class="header-item">${sets}</a>`
    : "";
  const magicHeader = !filterPages.includes("magic")
    ? `<a href="magic.html" class="header-item">${magic}</a>`
    : "";
  const cubeHeader = !filterPages.includes("cube")
    ? `<a href="cube.html" class="header-item">${cube}</a>`
    : "";
  const armorHeader = !filterPages.includes("armor")
    ? `<a href="armor.html" class="header-item">${armor}</a>`
    : "";
  const weaponHeader = !filterPages.includes("weapons")
    ? `<a href="weapons.html" class="header-item">${weapons}</a>`
    : "";
  const gemsHeader = !filterPages.includes("gems")
    ? `<a href="gems.html" class="header-item">${gems}</a>`
    : "";
  const miscHeader = !filterPages.includes("misc")
    ? `<a href="misc.html" class="header-item">${misc}</a>`
    : "";

  const allHeaders = [
    mainHeader,
    uniqueHeader,
    rwHeader,
    setHeader,
    magicHeader,
    cubeHeader,
    armorHeader,
    weaponHeader,
    gemsHeader,
    miscHeader,
  ].join("\r\n");

  return `<html>
    <head>
      <title>${title}</title>
      <link rel="stylesheet" href="styles.css">
    </head>
    <body>
      <div class="header">
        ${allHeaders}
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
