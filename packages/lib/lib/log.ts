import { SavedConfiguration } from "./config.ts";

/**
 * Logfile is our basic class for handling log files. Go figure.
 * We construct it with a config and then write messages to it.
 * When we're done, we tell it to write. Easy.
 */
export class LogFile {
  #logfile: string;

  constructor(config: SavedConfiguration) {
    const { log, logAppend } = config;
    this.#logfile = log;
    if (!logAppend) {
      Deno.writeTextFileSync(this.#logfile, `Log started at ${new Date()}\r\n`);
    }
  }

  public WriteLine(text: string) {
    Deno.writeTextFileSync(this.#logfile, `${text}\r\n`, { append: true });
  }
}

let curLog: LogFile | undefined = undefined;

/**
 * Gets the current logfile. If it hasn't been created yet, create it now.
 * @param config - the configuration.
 * @returns {LogFile} - the created logfile
 */
export function GetLogfile(config: SavedConfiguration): LogFile {
  if (curLog !== undefined) {
    return curLog;
  }
  curLog = new LogFile(config);
  return curLog;
}
