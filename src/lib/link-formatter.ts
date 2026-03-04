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

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
