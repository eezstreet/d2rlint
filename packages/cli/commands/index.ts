import { Workspace } from "@d2rlint/lib";
import { ExecuteBulkCodeLookup, ExecuteBulkItemGfxLookup, ExecuteBulkSetAndUnique } from "@d2rlint/lib/commands";

type CommandEntry = {
  fn: (ws: Workspace, args: string[]) => void;
  usage: string;
};

const commands: { [key: string]: CommandEntry } = {
  "bulk-code-lookup": {
    fn: ExecuteBulkCodeLookup,
    usage: "bulk-code-lookup <input-file> <output-file>",
  },
  "bulk-itemgfx-lookup": {
    fn: ExecuteBulkItemGfxLookup,
    usage: "bulk-itemgfx-lookup <input-file> <output-file>",
  },
  "bulk-set-and-unique": {
    fn: ExecuteBulkSetAndUnique,
    usage: "bulk-set-and-unique <input-file> <output-file>",
  },
};

export const executeCommands = (args: string[], ws: Workspace) => {
  if (args[0] === "--help" || args[0] === "help") {
    console.log("Available commands:");
    for (const { usage } of Object.values(commands)) {
      console.log(`  ${usage}`);
    }
    return true;
  }

  const keys = Object.keys(commands);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (args.length > 0 && args[0] === key) {
      commands[key].fn(ws, args.filter((_, idx) => idx > 0));
      return true;
    }
  }
  return false;
};
