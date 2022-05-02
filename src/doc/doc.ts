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
  // create folder "docs" if it doesn't already exist
  try {
    Deno.mkdirSync("docs");
  } catch {
    // do nothing, allow directories that already exist to not blow up the whole thing
  }

  // generate main page
  GenerateHtml("index.html", workspace, DocMain);

  // generate unique items page
  GenerateHtml("uniques.html", workspace, DocUniques);

  // generate sets/set items page
  GenerateHtml("sets.html", workspace, DocSets);

  // generate magic prefixes/suffixes page
  GenerateHtml("magic.html", workspace, DocMagic);

  // generate cube recipes page
  GenerateHtml("cube.html", workspace, DocCubeRecipes);

  // generate armor page
  GenerateHtml("armor.html", workspace, DocArmor);

  // generate weapons page
  GenerateHtml("weapons.html", workspace, DocWeapons);

  // generate misc items page
  GenerateHtml("misc.html", workspace, DocMisc);

  // generate gems page
  GenerateHtml("gems.html", workspace, DocGems);

  // generate runewords page
  GenerateHtml("runewords.html", workspace, DocRunewords);
}
