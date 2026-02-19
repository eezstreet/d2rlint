import { Workspace } from "../lib/workspace.ts";

type MappedType = { normal: string; uber: string; ultra: string };
type MapOfMappedType = { [key: string]: MappedType };

export const ExecuteBulkSetAndUnique = (ws: Workspace, args: string[]) => {
  if (args.length < 2) {
    console.log(`usage: bulk-set-and-unique <file name> <output file name>`);
    return;
  }

  const objects = Deno.readTextFileSync(args[0])
    .split("\n")
    .map((s) => s.replaceAll(/[ \-]/gi, "_").toLocaleLowerCase())
    .map((s) => s.replaceAll("'", ""))
    .map((s) => s.trim())
    .map((s) => {
      const items = s.split("\t");
      const newObject: MapOfMappedType = {};
      newObject[items[0]] = {
        normal: items[1],
        uber: items[1],
        ultra: items[1],
      };
      return newObject;
    });

  Deno.writeTextFileSync(args[1], JSON.stringify(objects, undefined, 2));
};
