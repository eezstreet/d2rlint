import { Workspace } from "../lib/workspace.ts";
import {
  DocArmor,
  DocGems,
  DocMagic,
  DocMisc,
  DocRunewords,
  DocSets,
  DocUniques,
  DocWeapons,
} from "./items.ts";
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
