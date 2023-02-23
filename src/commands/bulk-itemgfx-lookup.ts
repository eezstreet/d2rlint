import { Workspace } from "../lib/workspace.ts";

export const ExecuteBulkItemGfxLookup = (ws: Workspace, args: string[]) => {
  if (args.length < 2) {
    console.log(`usage: bulk-itemgfx-lookup <file name> <output file name>`);
    return;
  }

  if (ws.json === undefined || ws.json.items === undefined) {
    return;
  }

  const codes = Deno.readTextFileSync(args[0])
    .split("\n")
    .map((s) => s.replace("[\s\r\n]", "").trim())
    .map((s) => {
      if (
        s.length <= 0 || ws.json === undefined || ws.json.items === undefined
      ) {
        return "";
      }
      const found = ws.json.items.find((itm) => {
        const keys = Object.keys(itm);
        if (keys.length > 0 && keys[0] === s) {
          return true;
        }
        return false;
      });
      if (found === undefined) {
        return `{not found}}\t${s}`;
      }
      return `${found[s].asset}\t${s}`;
    })
    .join("\n");

  Deno.writeTextFileSync(args[1], codes);
};
