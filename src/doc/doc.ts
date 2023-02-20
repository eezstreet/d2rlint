import { DocPageType, GetConfig } from "../lib/config.ts";
import { Workspace } from "../lib/workspace.ts";
import DocCubeRecipes from "./cube/cube.ts";
import { DocArmor, DocMisc, DocWeapons } from "./items/base.ts";
import { DocGems } from "./items/gems.ts";
import { DocMagic } from "./items/magic.ts";
import { DocRunewords } from "./items/runeword.ts";
import { DocSets } from "./items/set.ts";
import { DocUniques } from "./items/unique.ts";
import DocMain from "./main.ts";
import { GenerateHtml } from "./template.ts";

/**
 * Generates all of the HTML files for a workspace
 */
export default function GenerateDocs(workspace: Workspace): void {
  console.log(`Generating documentation. This may take some time...`);

  // create folder "docs" if it doesn't already exist
  try {
    Deno.mkdirSync("docs");
  } catch {
    // do nothing, allow directories that already exist to not blow up the whole thing
  }

  const startTime = new Date();
  const config = GetConfig();
  const shouldGenerate = (p: DocPageType) =>
    !config.docOptions.filterPages.includes(p);

  // generate main page
  GenerateHtml("index.html", workspace, DocMain);
  console.log(`...generated index.`);

  // generate unique items page
  if (shouldGenerate("uniques")) {
    GenerateHtml("uniques.html", workspace, DocUniques);
    console.log(`...generated uniques.`);
  }

  // generate sets/set items page
  if (shouldGenerate("sets")) {
    GenerateHtml("sets.html", workspace, DocSets);
    console.log(`...generated sets.`);
  }

  // generate magic prefixes/suffixes page
  if (shouldGenerate("magic")) {
    GenerateHtml("magic.html", workspace, DocMagic);
    console.log(`...generated magic items.`);
  }

  // generate cube recipes page
  if (shouldGenerate("cube")) {
    GenerateHtml("cube.html", workspace, DocCubeRecipes);
    console.log(`...generated cube recipes.`);
  }

  // generate armor page
  if (shouldGenerate("armor")) {
    GenerateHtml("armor.html", workspace, DocArmor);
    console.log(`...generated armor.`);
  }

  // generate weapons page
  if (shouldGenerate("weapons")) {
    GenerateHtml("weapons.html", workspace, DocWeapons);
    console.log(`...generated weapons.`);
  }

  // generate misc items page
  if (shouldGenerate("misc")) {
    GenerateHtml("misc.html", workspace, DocMisc);
    console.log(`...generated misc items.`);
  }

  // generate gems page
  if (shouldGenerate("gems")) {
    GenerateHtml("gems.html", workspace, DocGems);
    console.log(`...generated gems.`);
  }

  // generate runewords page
  if (shouldGenerate("runeword")) {
    GenerateHtml("runewords.html", workspace, DocRunewords);
    console.log(`...generated runewords.`);
  }

  const endTime = new Date();
  const diff = (endTime.getTime() - startTime.getTime()) / 1000;
  console.log(`All done. It took ${Math.round(diff)} seconds.`);
}
