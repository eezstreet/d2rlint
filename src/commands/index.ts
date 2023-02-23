import { Workspace } from "../lib/workspace.ts";
import { ExecuteBulkCodeLookup } from "./bulk-code-lookup.ts";
import { ExecuteBulkItemGfxLookup } from "./bulk-itemgfx-lookup.ts";
import { ExecuteBulkSetAndUnique } from "./bulk-set-and-unique.ts";

const commands: { [key: string]: (ws: Workspace, args: string[]) => void } = {
  "bulk-code-lookup": ExecuteBulkCodeLookup,
  "bulk-itemgfx-lookup": ExecuteBulkItemGfxLookup,
  "bulk-set-and-unique": ExecuteBulkSetAndUnique,
};

export const executeCommands = (args: string[], ws: Workspace) => {
  const keys = Object.keys(commands);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (args.length > 0 && args[0] === key) {
      commands[key](ws, args.filter((_, idx) => idx > 0));
      return true;
    }
  }
  return false;
};
