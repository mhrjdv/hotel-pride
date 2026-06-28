/**
 * CSV export helpers.
 *
 * Produces CSV that opens directly in Google Sheets / Microsoft Excel — no
 * OAuth, no server round-trip. Values are quoted and escaped per RFC 4180, and
 * the output is prefixed with a UTF-8 BOM so Excel renders non-ASCII (₹, etc.)
 * correctly.
 */

type CsvValue = string | number | null | undefined;

/** Escape a single CSV field: wrap in quotes and double any inner quotes. */
function escapeCell(value: CsvValue): string {
  const str = value == null ? '' : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

/** Serialise a 2D array of cells into a CSV string. */
export function rowsToCsv(rows: CsvValue[][]): string {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

/**
 * Serialise an array of records into CSV. Column order is taken from the keys
 * of the first row; the header row is the keys themselves.
 */
export function recordsToCsv(records: Record<string, CsvValue>[]): string {
  if (records.length === 0) return '';
  const headers = Object.keys(records[0]);
  const rows: CsvValue[][] = [
    headers,
    ...records.map((rec) => headers.map((h) => rec[h])),
  ];
  return rowsToCsv(rows);
}

/** Trigger a browser download of the given text content as a file. */
function triggerDownload(filename: string, content: string, mime: string): void {
  // BOM so Excel detects UTF-8.
  const blob = new Blob(['﻿', content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Build a CSV from an array of records and download it. Reusable helper for any
 * tabular export — opens directly in Google Sheets / Excel.
 *
 * @example
 * exportToCsv('report.csv', [{ Metric: 'Revenue', Value: 12000 }]);
 */
export function exportToCsv(
  filename: string,
  rows: Record<string, CsvValue>[]
): void {
  triggerDownload(filename, recordsToCsv(rows), 'text/csv');
}

/**
 * Download CSV from a pre-built 2D array of cells. Useful when the export mixes
 * section headers, blank spacer rows, and differing column layouts (e.g. a
 * combined summary + breakdown report).
 */
export function exportRowsToCsv(filename: string, rows: CsvValue[][]): void {
  triggerDownload(filename, rowsToCsv(rows), 'text/csv');
}
