import { lintrule, Rule } from "../lib/rule.ts";
import { D2RCubemain, Workspace } from "../lib/workspace.ts";

const isQuality = (s: string) =>
  s === "low" || s === "hiq" || s === "nor" || s === "mag" ||
  s === "rar" || s === "set" || s === "uni" || s === "crf" ||
  s === "tmp";
const isUber = (s: string) => s === "bas" || s === "exc" || s === "eli";
const isUnsocketer = (s: string) => s === "uns" || s === "rem";

/**
 * Check cube inputs.
 */
@lintrule
export class ValidInputs extends Rule {
  GetRuleName(): string {
    return "Cube/ValidInputs";
  }

  Evaluate(workspace: Workspace) {
    const { cubemain, armor, misc, weapons, setItems, uniqueItems, itemTypes } =
      workspace;
    if (cubemain === undefined) {
      return;
    }

    cubemain.forEach((entry, i) => {
      if (
        entry.enabled === "" ||
        entry.enabled === "0"
      ) { // skip unenabled
        return;
      }

      // numinputs should match the number of inputs
      const numInputs = entry.numinputs as unknown as string;
      if (numInputs === "" || numInputs === "0") {
        this.Warn(
          `${entry.GetFileName()}, line ${
            i + 2
          }: no inputs for recipe '${entry.description}'`,
        );
        return;
      }

      let numInputsAsNum = 0;
      try {
        numInputsAsNum = parseInt(numInputs);
      } catch {
        this.Warn(
          `${entry.GetFileName()}, line ${
            i + 2
          }: invalid value for 'numinputs' for recipe '${entry.description}'`,
        );
        return;
      }

      let numInputsReal = 0;
      const inputFields: (keyof D2RCubemain)[] = [
        "input 1",
        "input 2",
        "input 3",
        "input 4",
        "input 5",
        "input 6",
        "input 7",
      ];

      inputFields.forEach((inputField) => {
        const input = entry[inputField] as unknown as string;
        if (input === "" || input === undefined) {
          return;
        }

        const qty = [...input.matchAll(/(?:".*,qty=([0-9]+).*")|(.+)/gi)][0];
        if (qty[1] !== undefined) {
          numInputsReal += parseInt(qty[1].toString());
        } else {
          numInputsReal++;
        }

        const isRealItem = (value: string) => {
          if (
            armor === undefined || misc === undefined ||
            weapons === undefined || setItems === undefined ||
            uniqueItems === undefined || itemTypes === undefined
          ) {
            return true; // just assume it's real for right now
          }

          return value === "any" ||
            armor.some((item) => item.code === value) ||
            misc.some((item) => item.code === value) ||
            weapons.some((item) => item.code === value) ||
            setItems.some((item) => item.index === value) ||
            uniqueItems.some((item) => item.index === value) ||
            itemTypes.some((item) => item.code === value);
        };

        // let's make sure that the actual field of each input is legitimate
        if (input.match(/".*"/gi) !== null) {
          // is a formula
          const matched = [...input.matchAll(/"(.*)"/gi)][0][1];
          if (matched === undefined) {
            return; // shouldn't happen
          }
          const split = matched.split(",");

          // first item of a split should be the item
          if (!isRealItem(split[0])) {
            this.Warn(
              `${entry.GetFileName()}, line ${i + 2}: couldn't find '${
                split[0]
              }' for ${inputField} in recipe '${entry.description}'`,
            );
          }

          // there can only be exactly one of: "low", "hiq", "nor", "mag", "rar", "set", "uni", "crf", "tmp"
          // there can only be exactly one of: "eth", "noe"
          // there can only be exactly one of: "noe", "sock"
          // there can only be exactly one of: "bas", "exc", "eli"

          const isEthereal = (s: string) => s === "eth" || s === "noe";
          const isSock = (s: string) => s === "nos" || s.startsWith("sock");

          const onlyMatters = split.splice(1);
          const further = (
            callback: (s: string) => boolean,
            value: string,
            j: number,
          ) => {
            for (let k = j + 1; k < onlyMatters.length; k++) {
              if (callback(onlyMatters[k])) {
                this.Warn(
                  `${entry.GetFileName()}, line ${i + 2}: both '${
                    onlyMatters[k]
                  }' and '${value}' is ambiguous when defined together and will lead to undefined behavior (${inputField})`,
                );
              }
            }
          };

          onlyMatters.forEach((item, j) => {
            if (isQuality(item)) { // see if there is another quality modifier
              further(isQuality, item, j);
            } else if (isEthereal(item)) { // see if there is another eth modifier
              further(isEthereal, item, j);
            } else if (isSock(item)) { // see if there is another sock modifier
              further(isSock, item, j);
            } else if (isUber(item)) {
              further(isUber, item, j);
            } else if (
              !item.startsWith("qty=") && item !== "upg" && item !== "nru"
            ) {
              this.Warn(
                `${entry.GetFileName()}, line ${
                  i + 2
                }: unknown input qualifier '${item}' for ${inputField} in recipe '${entry.description}'`,
              );
            }
          });
        } else if (!isRealItem(input)) {
          this.Warn(
            `${entry.GetFileName()}, line ${
              i + 2
            }: couldn't find '${input}' for ${inputField} in recipe '${entry.description}'`,
          );
          if (input === '""') {
            this.Message(`(hint: empty quotes)`);
          } else if (input.match(/"/gi) !== null) {
            this.Message(`(hint: unclosed quote)`);
          } else if (input.match(/,/gi) !== null) {
            this.Message(`(hint: try wrapping with quotation marks)`);
          }
        }
      });

      if (numInputsReal !== numInputsAsNum) {
        this.Warn(
          `${entry.GetFileName()}, line ${
            i + 2
          }: wrong numinputs. expected ${numInputsReal}, found ${numInputsAsNum} in recipe '${entry.description}'`,
        );
      }
    });
  }
}

/**
 * Check cube outputs.
 */
@lintrule
export class ValidOutputs extends Rule {
  GetRuleName(): string {
    return "Cube/ValidOutputs";
  }

  Evaluate(workspace: Workspace) {
    const {
      cubemod,
      cubemain,
      armor,
      weapons,
      misc,
      setItems,
      uniqueItems,
      magicPrefix,
      magicSuffix,
      properties,
      itemTypes,
    } = workspace;
    if (cubemain === undefined || cubemod === undefined) {
      return;
    }

    cubemain.forEach((entry, i) => {
      if (entry.enabled === "" || entry.enabled === "0") {
        return; // skip unenabled
      }

      const outputFields: (keyof D2RCubemain)[] = [
        "output",
        "output b",
        "output c",
      ];

      const validItem = (s: string) => {
        if (
          armor === undefined || weapons === undefined || misc === undefined ||
          setItems === undefined || uniqueItems === undefined ||
          itemTypes === undefined
        ) {
          return true; // just assume it's correct for right now
        }

        if (s === "useitem" || s === "usetype") {
          return true; // special case for these
        }

        return armor.some((item) => item.code === s) ||
          weapons.some((item) => item.code === s) ||
          misc.some((item) => item.code === s) ||
          setItems.some((item) => item.index === s) ||
          uniqueItems.some((item) => item.index === s) ||
          itemTypes.some((item) => item.code === s);
      };

      outputFields.forEach((field, idx) => {
        const output = entry[field] as unknown as string;
        if (output === undefined) {
          return;
        }

        if (
          output === "Cow Portal" || output === "Pandemonium Portal" ||
          output === "Pandemonium Finale Portal" || output === "Red Portal"
        ) {
          return; // these are always valid no matter what
        }

        if (output.match(/".+"/gi) !== null) {
          // is a formula
          const quoted = [...output.matchAll(/"(.+)"/gi)][0][1];
          const split = quoted.split(",");
          if ((split[0] === "useitem" || split[0] === "usetype") && idx > 0) {
            this.Warn(
              `${entry.GetFileName()}, line ${i + 2}: ${
                quoted[1]
              } is not valid in '${field}', it is only valid for the first output`,
            );
            return;
          } else if (!validItem(split[0])) {
            this.Warn(
              `${entry.GetFileName()}, line ${i + 2}: could not find '${
                split[0]
              }' for ${field} in recipe '${entry.description}'`,
            );
          }

          // check the other fields in the formula to make sure they're accurate
          // we allow
          // - ONE quality (see `isQuality`)
          // - ONE uber qualifier (see `isUber`)
          // - EITHER 'uns' or 'rem'
          // - pre=.. (must be < magicprefix length)
          // - suf=.. (must be < magicsuffix length)
          // - qty=..
          // - upg
          // - rep
          // - rch
          // - sock=.. (must be < 6)
          // - reg
          // - mod
          const fetchQuantity = (r: RegExp, s: string) => {
            const matched = [...s.matchAll(r)][0];
            if (matched[1] === undefined) {
              return undefined;
            }
            return parseInt(matched[1]);
          };

          const qualifiers = split.splice(1);
          qualifiers.forEach((qualifier, idx) => {
            if (isQuality(qualifier)) {
              for (let j = idx + 1; j < qualifiers.length; j++) {
                if (isQuality(qualifiers[j])) {
                  this.Warn(
                    `${entry.GetFileName()}, line ${i + 2}: both '${
                      qualifiers[j]
                    }' and '${qualifier}' will cause undefined behavior for ${field} in recipe '${entry.description}'`,
                  );
                }
              }
            } else if (isUber(qualifier)) {
              for (let j = idx + 1; j < qualifiers.length; j++) {
                if (isUber(qualifiers[j])) {
                  this.Warn(
                    `${entry.GetFileName()}, line ${i + 2}: both '${
                      qualifiers[j]
                    }' and '${qualifier}' will cause undefined behavior for ${field} in recipe '${entry.description}'`,
                  );
                }
              }
            } else if (isUnsocketer(qualifier)) {
              for (let j = idx + 1; j < qualifiers.length; j++) {
                if (isUnsocketer(qualifiers[j])) {
                  this.Warn(
                    `${entry.GetFileName()}, line ${i + 2}: both '${
                      qualifiers[j]
                    }' and '${qualifier}' will cause undefined behavior for ${field} in recipe '${entry.description}'`,
                  );
                }
              }
            } else if (qualifier.startsWith("qty=")) {
              const q = fetchQuantity(/qty=([0-9]+)/gi, qualifier);
              if (q === undefined) {
                this.Warn(
                  `${entry.GetFileName()}, line ${
                    i + 2
                  }: missing quantity for '${qualifier}' for ${field} in recipe '${entry.description}'`,
                );
              }
            } else if (qualifier.startsWith("pre=")) {
              const q = fetchQuantity(/pre=([0-9]+)/gi, qualifier);
              if (q === undefined) {
                this.Warn(
                  `${entry.GetFileName()}, line ${
                    i + 2
                  }: missing quantity for '${qualifier}' for ${field} in recipe '${entry.description}'`,
                );
              } else if (
                magicPrefix !== undefined && q + 2 >= magicPrefix.length
              ) {
                this.Warn(
                  `${entry.GetFileName()}, line ${
                    i + 2
                  }: prefix for '${qualifier}' in ${field} is too large (${q} > ${
                    magicPrefix.length - 2
                  }) in recipe '${entry.description}'`,
                );
              }
            } else if (qualifier.startsWith("suf=")) {
              const q = fetchQuantity(/suf=([0-9]+)/gi, qualifier);
              if (q === undefined) {
                this.Warn(
                  `${entry.GetFileName()}, line ${
                    i + 2
                  }: missing quantity for '${qualifier}' for ${field} in recipe '${entry.description}'`,
                );
              } else if (
                magicSuffix !== undefined && q + 2 >= magicSuffix.length
              ) {
                this.Warn(
                  `${entry.GetFileName()}, line ${
                    i + 2
                  }: suffix for '${qualifier}' in ${field} is too large (${q} > ${
                    magicSuffix.length - 2
                  }) in recipe '${entry.description}'`,
                );
              }
            } else if (qualifier.startsWith("sock=")) {
              const q = fetchQuantity(/sock=([0-9]+)/gi, qualifier);
              if (q === undefined) {
                this.Warn(
                  `${entry.GetFileName()}, line ${
                    i + 2
                  }: missing quantity for '${qualifier}' for ${field} in recipe '${entry.description}'`,
                );
              } else if (q > 6 || q < 0) {
                this.Warn(
                  `${entry.GetFileName()}, line ${
                    i + 2
                  }: wrong number of sockets for ${field} in recipe '${entry.description}'`,
                );
              }
            } else if (
              qualifier !== "upg" && qualifier !== "rep" &&
              qualifier !== "rch" && qualifier !== "reg" && qualifier !== "mod"
            ) {
              this.Warn(
                `${entry.GetFileName()}, line ${
                  i + 2
                }: unknown qualifier ${qualifier} for ${field} in recipe '${entry.description}'`,
              );
            }
          });
        } else if (output === '""') {
          this.Warn(
            `${entry.GetFileName()}, line ${
              i + 2
            }: empty quotes in ${field} for recipe ${entry.description}`,
          );
        } else if (!validItem(output)) {
          this.Warn(
            `${entry.GetFileName()}, line ${
              i + 2
            }: could not find '${output}' for ${field} in recipe '${entry.description}'`,
          );

          if (output.match(/"/gi) !== null) {
            this.Message(`(hint: unclosed quote, check and fix it?)`);
          } else if (output.match(/,/gi) !== null) {
            this.Message(`(hint: wrap the formula in quotes first)`);
          }
        }
      });

      // ensure all mods point to valid entries in properties.txt
      if (properties !== undefined) {
        const modfields: (keyof D2RCubemain)[] = [
          "mod 1",
          "mod 2",
          "mod 3",
          "mod 4",
          "mod 5",
          "b mod 1",
          "b mod 2",
          "b mod 3",
          "b mod 4",
          "b mod 5",
          "c mod 1",
          "c mod 2",
          "c mod 3",
          "c mod 4",
          "c mod 5",
        ];

        modfields.forEach((field) => {
          const value = entry[field] as unknown as string;
          if (value === undefined || value === "") {
            return;
          }

          if (!properties.some((property) => property.code !== value)) {
            this.Warn(
              `${entry.GetFileName()}, line ${
                i + 2
              }: invalid property '${value}' for '${field}' in recipe '${entry.description}'`,
            );
          }
        });
      }
    });
  }
}
