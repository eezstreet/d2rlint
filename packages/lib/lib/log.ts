import type { OutputFormat, SavedConfiguration } from "./config.ts";

export type LogEntry = {
  severity: "MESSAGE" | "WARN" | "ERROR";
  ruleName: string;
  message: string;
};

/**
 * Logfile is our basic class for handling log files. Go figure.
 * We construct it with a config and then write messages to it.
 * When we're done, we tell it to write. Easy.
 */
export class LogFile {
  #logfile: string;
  #format: OutputFormat;
  #logAppend: boolean;
  #buffered: boolean;
  #entries: LogEntry[];
  #startedAt: Date;

  constructor(config: SavedConfiguration) {
    const { log, logAppend, outputFormat } = config;
    this.#logfile = log;
    this.#format = outputFormat;
    this.#logAppend = logAppend;
    this.#buffered = outputFormat.endsWith("-buffered");
    this.#entries = [];
    this.#startedAt = new Date();

    // For unbuffered formats, initialize the file now (truncate + optional
    // header). For buffered formats we write nothing until Flush().
    if (!this.#buffered && !logAppend) {
      Deno.writeTextFileSync(this.#logfile, this.#fileHeader());
    }
  }

  public WriteLine(entry: LogEntry): void {
    if (this.#buffered) {
      this.#entries.push(entry);
    } else {
      Deno.writeTextFileSync(this.#logfile, this.#serializeEntry(entry), {
        append: true,
      });
    }
  }

  /**
   * Writes buffered entries to the log file. No-op for unbuffered formats.
   * For json-buffered, logAppend is ignored (appending JSON arrays produces
   * invalid JSON, so we always overwrite).
   */
  public Flush(): void {
    if (!this.#buffered) return;
    const append = this.#logAppend && this.#format !== "json-buffered";
    Deno.writeTextFileSync(this.#logfile, this.#serializeAll(), { append });
  }

  // Returns the string written to the file at construction time (unbuffered,
  // !logAppend only). Empty string = just truncate.
  #fileHeader(): string {
    switch (this.#format) {
      case "tsv":
        return `Log started at ${this.#startedAt}\r\n`;
      case "csv":
        return "severity,ruleName,message\r\n";
      default:
        return ""; // json (JSONL): start empty
    }
  }

  #serializeAll(): string {
    switch (this.#format) {
      case "tsv-buffered":
        return (
          `Log started at ${this.#startedAt}\r\n` +
          this.#entries.map((e) => this.#serializeTsv(e)).join("")
        );
      case "csv-buffered":
        return (
          "severity,ruleName,message\r\n" +
          this.#entries.map((e) => this.#serializeCsv(e)).join("")
        );
      case "json-buffered":
        return JSON.stringify(this.#entries, null, 2);
      default:
        return "";
    }
  }

  #serializeEntry(entry: LogEntry): string {
    switch (this.#format) {
      case "tsv":
        return this.#serializeTsv(entry);
      case "csv":
        return this.#serializeCsv(entry);
      case "json":
        return JSON.stringify(entry) + "\n";
      default:
        return this.#serializeTsv(entry);
    }
  }

  #serializeTsv(entry: LogEntry): string {
    return `${entry.severity}\t${entry.ruleName}\t${entry.message}\r\n`;
  }

  #serializeCsv(entry: LogEntry): string {
    const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
    return `${escape(entry.severity)},${escape(entry.ruleName)},${
      escape(entry.message)
    }\r\n`;
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

/**
 * Flushes the logfile if one has been created. No-op otherwise.
 * Call this before any early Deno.exit() to ensure buffered output is written.
 */
export function FlushLogfileIfExists(): void {
  curLog?.Flush();
}
