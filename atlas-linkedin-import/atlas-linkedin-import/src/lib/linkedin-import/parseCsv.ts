import type { LinkedInCandidate } from "./types";

/**
 * Minimal RFC-4180-ish line splitter: handles quoted fields, embedded
 * commas, and doubled quotes ("" -> "). Deliberately does not handle quoted
 * fields spanning multiple physical lines — LinkedIn's export never
 * produces those, so a full streaming tokenizer would be over-engineering
 * for this one input format. No new dependency (e.g. papaparse) needed.
 */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

type ColumnKey =
  | "firstName"
  | "lastName"
  | "url"
  | "email"
  | "company"
  | "position"
  | "connectedOn";

const HEADER_ALIASES: Record<ColumnKey, string[]> = {
  firstName: ["first name"],
  lastName: ["last name"],
  url: ["url", "profile url"],
  email: ["email address", "email"],
  company: ["company"],
  position: ["position", "title"],
  connectedOn: ["connected on"],
};

function findColumnIndex(header: string[], aliases: string[]): number {
  const lower = header.map((h) => h.trim().toLowerCase());
  return lower.findIndex((h) => aliases.includes(h));
}

export type ParsedLinkedInCsv = {
  candidates: LinkedInCandidate[];
  totalRows: number;
  skippedRows: number;
  headerFound: boolean;
};

/**
 * LinkedIn's "Connections.csv" export starts with several lines of a
 * "Notes:" preamble before the real header row. The exact number of lines
 * has changed across LinkedIn's own export revisions, so rather than
 * skipping a fixed count we scan for the row that actually contains both
 * "First Name" and "Last Name" and treat that as the header.
 */
export function parseLinkedInCsv(csvText: string): ParsedLinkedInCsv {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  let headerIndex = lines.findIndex((line) => {
    const cols = splitCsvLine(line).map((c) => c.toLowerCase());
    return cols.includes("first name") && cols.includes("last name");
  });

  const headerFound = headerIndex !== -1;
  if (!headerFound) headerIndex = 0; // fallback: assume the first line is the header

  const header = splitCsvLine(lines[headerIndex]);

  const idx = {
    firstName: findColumnIndex(header, HEADER_ALIASES.firstName),
    lastName: findColumnIndex(header, HEADER_ALIASES.lastName),
    url: findColumnIndex(header, HEADER_ALIASES.url),
    email: findColumnIndex(header, HEADER_ALIASES.email),
    company: findColumnIndex(header, HEADER_ALIASES.company),
    position: findColumnIndex(header, HEADER_ALIASES.position),
    connectedOn: findColumnIndex(header, HEADER_ALIASES.connectedOn),
  };

  const dataLines = lines.slice(headerIndex + 1);
  const candidates: LinkedInCandidate[] = [];
  let skippedRows = 0;

  for (const line of dataLines) {
    const cols = splitCsvLine(line);

    const firstName = idx.firstName >= 0 ? cols[idx.firstName] ?? "" : "";
    const lastName = idx.lastName >= 0 ? cols[idx.lastName] ?? "" : "";
    const name = `${firstName} ${lastName}`.trim();

    if (!name) {
      skippedRows++;
      continue;
    }

    candidates.push({
      name,
      company: idx.company >= 0 ? cols[idx.company] ?? "" : "",
      role: idx.position >= 0 ? cols[idx.position] ?? "" : "",
      linkedinUrl: idx.url >= 0 ? cols[idx.url] ?? "" : "",
      email: idx.email >= 0 ? cols[idx.email] ?? "" : "",
      connectedOn: idx.connectedOn >= 0 ? cols[idx.connectedOn] ?? "" : "",
    });
  }

  return {
    candidates,
    totalRows: dataLines.length,
    skippedRows,
    headerFound,
  };
}
