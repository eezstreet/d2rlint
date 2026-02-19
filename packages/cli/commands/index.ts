import { Workspace } from "@d2rlint/lib";
import { ExecuteBulkCodeLookup, ExecuteBulkItemGfxLookup, ExecuteBulkSetAndUnique } from "@d2rlint/lib/commands";

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
