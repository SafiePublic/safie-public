import { describe, it, expect } from "vitest";
import {
  formatBasicLink,
  formatExtendedLink,
  formatTemplateLink,
  extractFieldLabels,
  escapeHtml,
  joinLinks,
  prefixObjectName,
  appendToastMessages,
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
  it("links name only by default (showLabel=false)", () => {
    const result = formatExtendedLink(
      "Record",
      "https://example.com",
      "Code",
      "ABC-001",
      false,
    );
    expect(result.html).toBe(
      '<a href="https://example.com">Record</a>(ABC-001)',
    );
    expect(result.plain).toBe("Record(ABC-001)");
  });

  it("links name only by default (showLabel=true)", () => {
    const result = formatExtendedLink(
      "Record",
      "https://example.com",
      "Code",
      "ABC-001",
      true,
    );
    expect(result.html).toBe(
      '<a href="https://example.com">Record</a>(Code:ABC-001)',
    );
    expect(result.plain).toBe("Record(Code:ABC-001)");
  });

  it("escapes HTML in name-only mode", () => {
    const result = formatExtendedLink(
      "R&D",
      "https://example.com",
      "Label",
      'Val<1>"',
      true,
    );
    expect(result.html).toBe(
      '<a href="https://example.com">R&amp;D</a>(Label:Val&lt;1&gt;&quot;)',
    );
    expect(result.plain).toBe('R&D(Label:Val<1>")');
  });

  it("links entire text when linkNameOnly=false", () => {
    const result = formatExtendedLink(
      "Record",
      "https://example.com",
      "Code",
      "ABC-001",
      false,
      false,
    );
    expect(result.html).toBe(
      '<a href="https://example.com">Record(ABC-001)</a>',
    );
    expect(result.plain).toBe("Record(ABC-001)");
  });

  it("links entire text with label when linkNameOnly=false", () => {
    const result = formatExtendedLink(
      "Record",
      "https://example.com",
      "Code",
      "ABC-001",
      true,
      false,
    );
    expect(result.html).toBe(
      '<a href="https://example.com">Record(Code:ABC-001)</a>',
    );
    expect(result.plain).toBe("Record(Code:ABC-001)");
  });
});

describe("extractFieldLabels", () => {
  it("extracts field labels from format string", () => {
    expect(extractFieldLabels("${name}(${商品コード})")).toEqual(["商品コード"]);
  });

  it("excludes builtin variables", () => {
    expect(
      extractFieldLabels("${object}: ${name}"),
    ).toEqual([]);
  });

  it("extracts multiple field labels", () => {
    expect(
      extractFieldLabels("${name}(${商品コード} / ${カテゴリ})"),
    ).toEqual(["商品コード", "カテゴリ"]);
  });

  it("deduplicates labels", () => {
    expect(
      extractFieldLabels("${商品コード} - ${商品コード}"),
    ).toEqual(["商品コード"]);
  });

  it("returns empty array when no variables", () => {
    expect(extractFieldLabels("fixed text")).toEqual([]);
  });
});

describe("formatTemplateLink", () => {
  const url = "https://example.com";

  it("links name only by default when ${name} present", () => {
    const result = formatTemplateLink(
      "Product A",
      url,
      "${name}",
      {},
      "商品",
    );
    expect(result.html).toBe('<a href="https://example.com">Product A</a>');
    expect(result.plain).toBe("Product A");
  });

  it("links name only with a single field", () => {
    const result = formatTemplateLink(
      "Product A",
      url,
      "${name}(${商品コード})",
      { 商品コード: "ABC-001" },
      "商品",
    );
    expect(result.html).toBe(
      '<a href="https://example.com">Product A</a>(ABC-001)',
    );
    expect(result.plain).toBe("Product A(ABC-001)");
  });

  it("expands multiple fields", () => {
    const result = formatTemplateLink(
      "Product A",
      url,
      "${name}(${商品コード} / ${カテゴリ})",
      { 商品コード: "ABC-001", カテゴリ: "Electronics" },
      "商品",
    );
    expect(result.plain).toBe("Product A(ABC-001 / Electronics)");
  });

  it("expands ${object}", () => {
    const result = formatTemplateLink(
      "Product A",
      url,
      "${name} - ${object}",
      {},
      "商品",
    );
    expect(result.plain).toBe("Product A - 商品");
  });

  it("escapes HTML in name-only mode", () => {
    const result = formatTemplateLink(
      "R&D",
      url,
      "${name}(${val})",
      { val: '<script>"xss"</script>' },
      "Obj",
    );
    expect(result.html).toBe(
      '<a href="https://example.com">R&amp;D</a>(&lt;script&gt;&quot;xss&quot;&lt;/script&gt;)',
    );
  });

  it("replaces unknown variables with empty string", () => {
    const result = formatTemplateLink(
      "Rec",
      url,
      "${name}(${unknown})",
      {},
      "Obj",
    );
    expect(result.plain).toBe("Rec()");
  });

  it("links entire text when linkNameOnly=false", () => {
    const result = formatTemplateLink(
      "Product A",
      url,
      "${name}(${商品コード})",
      { 商品コード: "ABC-001" },
      "商品",
      false,
    );
    expect(result.html).toBe(
      '<a href="https://example.com">Product A(ABC-001)</a>',
    );
    expect(result.plain).toBe("Product A(ABC-001)");
  });

  it("links entire text when no ${name} in format (even if linkNameOnly=true)", () => {
    const result = formatTemplateLink(
      "Product A",
      url,
      "${object}: ${商品コード}",
      { 商品コード: "ABC-001" },
      "商品",
      true,
    );
    expect(result.html).toBe(
      '<a href="https://example.com">商品: ABC-001</a>',
    );
    expect(result.plain).toBe("商品: ABC-001");
  });

  it("handles multiple ${name} occurrences", () => {
    const result = formatTemplateLink(
      "Rec",
      url,
      "${name} - ${name}",
      {},
      "Obj",
    );
    expect(result.html).toBe(
      '<a href="https://example.com">Rec</a> - <a href="https://example.com">Rec</a>',
    );
    expect(result.plain).toBe("Rec - Rec");
  });
});

describe("prefixObjectName", () => {
  const link = { html: '<a href="https://example.com">Record</a>', plain: "Record" };

  it("prepends object label when showObjectName is true", () => {
    const result = prefixObjectName(link, "取引先", true);
    expect(result.html).toBe('取引先: <a href="https://example.com">Record</a>');
    expect(result.plain).toBe("取引先: Record");
  });

  it("returns link unchanged when showObjectName is false", () => {
    const result = prefixObjectName(link, "取引先", false);
    expect(result).toEqual(link);
  });

  it("returns link unchanged when objectLabel is empty", () => {
    const result = prefixObjectName(link, "", true);
    expect(result).toEqual(link);
  });

  it("escapes HTML in object label", () => {
    const result = prefixObjectName(link, "R&D", true);
    expect(result.html).toBe('R&amp;D: <a href="https://example.com">Record</a>');
    expect(result.plain).toBe("R&D: Record");
  });

  it("puts prefix outside link when linkNameOnly is true", () => {
    const result = prefixObjectName(link, "取引先", true, true);
    expect(result.html).toBe('取引先: <a href="https://example.com">Record</a>');
  });

  it("puts prefix inside link when linkNameOnly is false", () => {
    const result = prefixObjectName(link, "取引先", true, false);
    expect(result.html).toBe('<a href="https://example.com">取引先: Record</a>');
    expect(result.plain).toBe("取引先: Record");
  });

  it("escapes HTML in object label inside link when linkNameOnly is false", () => {
    const result = prefixObjectName(link, "R&D", true, false);
    expect(result.html).toBe('<a href="https://example.com">R&amp;D: Record</a>');
  });
});

describe("joinLinks", () => {
  const bulletOff = { enabled: false, style: 'custom' as const, char: '- ' };
  const bulletUl = { enabled: true, style: 'ul' as const, char: '- ' };
  const bulletCustom = { enabled: true, style: 'custom' as const, char: '- ' };

  it("returns single link as-is regardless of config", () => {
    const link = { html: "<a>Link</a>", plain: "Link" };
    expect(joinLinks([link], bulletOff)).toEqual(link);
    expect(joinLinks([link], bulletUl)).toEqual(link);
    expect(joinLinks([link], bulletCustom)).toEqual(link);
  });

  it("joins multiple links with div when bullet disabled", () => {
    const links = [
      { html: "<a>A</a>", plain: "A" },
      { html: "<a>B</a>", plain: "B" },
    ];
    const result = joinLinks(links, bulletOff);
    expect(result.html).toBe("<div><a>A</a></div><div><a>B</a></div>");
    expect(result.plain).toBe("A\nB");
  });

  it("joins multiple links as <ul> when style=ul", () => {
    const links = [
      { html: "<a>A</a>", plain: "A" },
      { html: "<a>B</a>", plain: "B" },
    ];
    const result = joinLinks(links, bulletUl);
    expect(result.html).toBe(
      '<meta charset="utf-8"><div><ul><li><a>A</a></li><li><a>B</a></li></ul></div>',
    );
    expect(result.plain).toBe("- A\n- B");
  });

  it("joins multiple links with custom char when style=custom", () => {
    const links = [
      { html: "<a>A</a>", plain: "A" },
      { html: "<a>B</a>", plain: "B" },
    ];
    const result = joinLinks(links, bulletCustom);
    expect(result.html).toBe("<div>- <a>A</a></div><div>- <a>B</a></div>");
    expect(result.plain).toBe("- A\n- B");
  });

  it("escapes HTML in custom bullet char", () => {
    const links = [
      { html: "<a>A</a>", plain: "A" },
      { html: "<a>B</a>", plain: "B" },
    ];
    const result = joinLinks(links, { enabled: true, style: 'custom', char: '> ' });
    expect(result.html).toBe("<div>&gt; <a>A</a></div><div>&gt; <a>B</a></div>");
    expect(result.plain).toBe("> A\n> B");
  });

  it("supports custom bullet char like dot", () => {
    const links = [
      { html: "<a>A</a>", plain: "A" },
      { html: "<a>B</a>", plain: "B" },
    ];
    const result = joinLinks(links, { enabled: true, style: 'custom', char: '・' });
    expect(result.html).toBe("<div>・<a>A</a></div><div>・<a>B</a></div>");
    expect(result.plain).toBe("・A\n・B");
  });

});

describe("appendToastMessages", () => {
  const baseLink = { html: '<a href="https://example.com">商品A</a>', plain: "商品A" };

  it("returns link unchanged when toasts array is empty", () => {
    const result = appendToastMessages(baseLink, []);
    expect(result).toBe(baseLink);
  });

  it("appends single toast message with slash separator", () => {
    const result = appendToastMessages(baseLink, ["入力規則に違反しています"]);
    expect(result.plain).toBe("商品A / ⚠ エラー: 入力規則に違反しています");
    expect(result.html).toBe(
      '<a href="https://example.com">商品A</a> / <span style="color:#c23934">⚠ エラー: 入力規則に違反しています</span>',
    );
  });

  it("joins multiple toast messages with slash separator", () => {
    const result = appendToastMessages(baseLink, [
      "入力規則に違反しています",
      "必須項目が未入力です",
    ]);
    expect(result.plain).toBe(
      "商品A / ⚠ エラー: 入力規則に違反しています / ⚠ エラー: 必須項目が未入力です",
    );
  });

  it("escapes HTML special characters in toast messages", () => {
    const result = appendToastMessages(baseLink, ['値が <script> & "invalid"']);
    expect(result.html).toContain(
      "⚠ エラー: 値が &lt;script&gt; &amp; &quot;invalid&quot;",
    );
  });
});
