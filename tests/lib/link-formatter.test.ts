import { describe, it, expect } from "vitest";
import {
  formatBasicLink,
  formatExtendedLink,
  escapeHtml,
} from "../../src/lib/link-formatter";

describe("escapeHtml", () => {
  it("escapes &, <, >, \"", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
    expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
  });

  it("handles multiple special characters in one string", () => {
    expect(escapeHtml('<a href="x">&')).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;",
    );
  });

  it("returns empty string as-is", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("leaves normal text unchanged", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
  });
});

describe("formatBasicLink", () => {
  it("returns html anchor and plain record name", () => {
    const result = formatBasicLink("My Record", "https://example.com");
    expect(result.html).toBe(
      '<a href="https://example.com">My Record</a>',
    );
    expect(result.plain).toBe("My Record");
  });

  it("escapes HTML in record name for html output", () => {
    const result = formatBasicLink(
      '<script>alert("xss")</script>',
      "https://example.com",
    );
    expect(result.html).toBe(
      '<a href="https://example.com">&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</a>',
    );
  });

  it("preserves raw record name in plain output", () => {
    const result = formatBasicLink("R&D <Team>", "https://example.com");
    expect(result.plain).toBe("R&D <Team>");
  });
});

describe("formatExtendedLink", () => {
  it("appends field value without label when showLabel is false", () => {
    const result = formatExtendedLink(
      "Record",
      "https://example.com",
      "Code",
      "ABC-001",
      false,
    );
    expect(result.html).toBe(
      '<a href="https://example.com">Record(ABC-001)</a>',
    );
    expect(result.plain).toBe("Record(ABC-001)");
  });

  it("appends label:value when showLabel is true", () => {
    const result = formatExtendedLink(
      "Record",
      "https://example.com",
      "Code",
      "ABC-001",
      true,
    );
    expect(result.html).toBe(
      '<a href="https://example.com">Record(Code:ABC-001)</a>',
    );
    expect(result.plain).toBe("Record(Code:ABC-001)");
  });

  it("escapes HTML in combined display text", () => {
    const result = formatExtendedLink(
      "R&D",
      "https://example.com",
      "Label",
      'Val<1>"',
      true,
    );
    expect(result.html).toBe(
      '<a href="https://example.com">R&amp;D(Label:Val&lt;1&gt;&quot;)</a>',
    );
    expect(result.plain).toBe('R&D(Label:Val<1>")');
  });
});
