import { lintrule, Rule } from "../lib/rule.ts";
import { Workspace } from "../lib/workspace.ts";

/**
 * Ensure that all baseid chains in monstats.txt are contiguous and don't have gaps.
 */
@lintrule
export class ValidChains extends Rule {
  GetRuleName() {
    return "Monsters/ValidChains";
  }

  Evaluate(workspace: Workspace) {
    const { monStats } = workspace;

    if (monStats === undefined) {
      return;
    }

    // create the set of chains
    const chains = monStats.reduce(
      (chainSet, record, line) => {
        const baseId = record.baseid as unknown as string;
        const nextInChain = record.nextinclass as unknown as string;
        const id = record.id as unknown as string;

        // find this baseId in chain set
        const found = chainSet.find((it) => it.baseId === baseId);
        if (found === undefined) {
          return chainSet.concat({ baseId, nextInChain, id, line });
        }
        if (found.nextInChain !== id) {
          this.Warn(
            `${record.GetFileName()}, line ${
              found.line + 2
            }: broken baseId chain '${baseId}', nextInClass for '${found.id}' should point to '${id}' but it points to '${found.nextInChain}' instead`,
          );
        }
        return chainSet.filter((cs) => cs.id !== found.id).concat({
          baseId,
          nextInChain,
          id,
          line,
        });
      },
      [] as { baseId: string; nextInChain: string; id: string; line: number }[],
    );

    // go through each chain. the nextInChain should be blank for each entry. otherwise we have a problem!
    chains.forEach((cs) => {
      const { id, line, nextInChain } = cs;
      if (nextInChain !== "") {
        this.Warn(
          `${monStats[0].GetFileName()}, line ${
            line + 2
          }: nextInClass for '${id}' (${nextInChain}) doesn't exist.`,
        );
      }
    });
  }
}
