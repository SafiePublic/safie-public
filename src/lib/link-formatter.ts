export interface LinkResult {
  html: string;
  plain: string;
}

export function formatBasicLink(recordName: string, url: string): LinkResult {
  const escaped = escapeHtml(recordName);
  return {
    html: `<a href="${url}">${escaped}</a>`,
    plain: recordName,
  };
}

export function formatExtendedLink(
  recordName: string,
  url: string,
  fieldLabel: string,
  fieldValue: string,
  showLabel: boolean,
): LinkResult {
  const suffix = showLabel
    ? `(${fieldLabel}:${fieldValue})`
    : `(${fieldValue})`;
  const displayText = `${recordName}${suffix}`;
  const escaped = escapeHtml(displayText);
  return {
    html: `<a href="${url}">${escaped}</a>`,
    plain: displayText,
  };
}

const BUILTIN_VARS = new Set(['name', 'object', 'alias']);

export function extractFieldLabels(format: string): string[] {
  const matches = format.matchAll(/\$\{([^}]+)\}/g);
  const labels = new Set<string>();
  for (const m of matches) {
    if (!BUILTIN_VARS.has(m[1])) {
      labels.add(m[1]);
    }
  }
  return [...labels];
}

export function formatTemplateLink(
  recordName: string,
  url: string,
  format: string,
  fieldValues: Record<string, string>,
  objectLabel: string,
  alias: string,
): LinkResult {
  const displayText = format.replace(/\$\{([^}]+)\}/g, (_, key: string) => {
    if (key === 'name') return recordName;
    if (key === 'object') return objectLabel;
    if (key === 'alias') return alias;
    return fieldValues[key] ?? '';
  });
  const escaped = escapeHtml(displayText);
  return {
    html: `<a href="${url}">${escaped}</a>`,
    plain: displayText,
  };
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
