import { describe, expect, it } from "vitest";

import {
  bulkTemplateCsv,
  formatBulkFileSize,
  formatCoverage,
  validateBulkFile,
} from "./bulk-workspace";

describe("validateBulkFile", () => {
  it("accepts CSV filenames regardless of extension casing", () => {
    expect(validateBulkFile({ name: "accounts.CSV" })).toBeNull();
  });

  it("rejects files that are not CSV documents", () => {
    expect(validateBulkFile({ name: "accounts.xlsx" })).toBe(
      "Choose a CSV file to continue.",
    );
  });
});

describe("bulkTemplateCsv", () => {
  it("creates the supported domain and company headers without sample data", () => {
    expect(bulkTemplateCsv()).toBe("domain,company\n");
  });
});

describe("formatBulkFileSize", () => {
  it.each([
    [0, "0 B"],
    [1_536, "1.5 KB"],
    [1_048_576, "1 MB"],
  ])("formats %i bytes as %s", (bytes, expected) => {
    expect(formatBulkFileSize(bytes)).toBe(expected);
  });
});

describe("formatCoverage", () => {
  it("converts fractional coverage to a whole percentage", () => {
    expect(formatCoverage(0.836)).toBe("84%");
  });
});
