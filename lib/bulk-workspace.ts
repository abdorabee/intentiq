interface BulkFileLike {
  name: string;
}

export function validateBulkFile(file: BulkFileLike): string | null {
  return file.name.toLowerCase().endsWith(".csv")
    ? null
    : "Choose a CSV file to continue.";
}

export function bulkTemplateCsv(): string {
  return "domain,company\n";
}

export function formatBulkFileSize(bytes: number): string {
  if (bytes < 1_024) return `${bytes} B`;

  const kilobytes = bytes / 1_024;
  if (kilobytes < 1_024) {
    return `${Number(kilobytes.toFixed(1))} KB`;
  }

  return `${Number((kilobytes / 1_024).toFixed(1))} MB`;
}

export function formatCoverage(coverage: number): string {
  return `${Math.round(coverage * 100)}%`;
}
