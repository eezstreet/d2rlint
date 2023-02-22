import { Workspace } from "../lib/workspace.ts";

export const ExecuteBulkCodeLookup = (ws: Workspace, args: string[]) => {
  if (args.length < 2) {
    console.log(`usage: bulk-code-lookup <file name> <output file name>`);
    return;
  }

  if (
    ws.armor === undefined || ws.weapons === undefined || ws.misc === undefined
  ) {
    console.log(`Invalid workspace.`);
    return;
  }

  const allItems = [...ws.armor, ...ws.weapons, ...ws.misc];
  const codes = Deno.readTextFileSync(args[0])
    .split("\n")
    .map((s) => s.replace("[\s\r\n]", "").trim())
    .map((s) => {
      console.log(`attempting to find for "${s}"`);
      const found = allItems.find((itm) => {
        const name = itm.name as string;
        return name.trim() === s;
      });
      if (found === undefined) {
        return `{{${s}}}\t${s}`;
      } else {
        return `${found.code}\t${s}`;
      }
    })
    .join("\n");

  Deno.writeTextFileSync(args[1], codes);
};
