import { t } from "./i18n";

export interface LinkResult {
  html: string;
  plain: string;
}

export function formatBasicLink(recordName: string, url: string): LinkResult {
  const escaped = escapeHtml(recordName);
  return {
    html: `<a href="${escapeHtml(url)}">${escaped}</a>`,
    plain: recordName,
  };
}

export function formatExtendedLink(
  recordName: string,
  url: string,
  fieldLabel: string,
  fieldValue: string,
  showLabel: boolean,
  linkNameOnly = true,
): LinkResult {
  const suffix = showLabel
    ? `(${fieldLabel}:${fieldValue})`
    : `(${fieldValue})`;
  const displayText = `${recordName}${suffix}`;

  if (linkNameOnly) {
    const escapedName = escapeHtml(recordName);
    const escapedSuffix = escapeHtml(suffix);
    return {
      html: `<a href="${escapeHtml(url)}">${escapedName}</a>${escapedSuffix}`,
      plain: displayText,
    };
  }

  const escaped = escapeHtml(displayText);
  return {
    html: `<a href="${escapeHtml(url)}">${escaped}</a>`,
    plain: displayText,
  };
}

const BUILTIN_VARS = new Set(['name', 'object']);

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
  linkNameOnly = true,
): LinkResult {
  const displayText = format.replace(/\$\{([^}]+)\}/g, (_, key: string) => {
    if (key === 'name') return recordName;
    if (key === 'object') return objectLabel;
    return fieldValues[key] ?? '';
  });

  if (linkNameOnly && format.includes('${name}')) {
    // ${name} 以外の変数を先に展開
    const expandedFormat = format.replace(/\$\{([^}]+)\}/g, (match, key: string) => {
      if (key === 'name') return match; // ${name} はそのまま残す
      if (key === 'object') return objectLabel;
      return fieldValues[key] ?? '';
    });

    // ${name} で分割して、各パートをエスケープしてリンク付き name で結合
    const parts = expandedFormat.split('${name}');
    const escapedName = escapeHtml(recordName);
    const linkedName = `<a href="${escapeHtml(url)}">${escapedName}</a>`;
    const html = parts.map(p => escapeHtml(p)).join(linkedName);

    return { html, plain: displayText };
  }

  const escaped = escapeHtml(displayText);
  return {
    html: `<a href="${escapeHtml(url)}">${escaped}</a>`,
    plain: displayText,
  };
}

export function prefixObjectName(
  link: LinkResult,
  objectLabel: string,
  showObjectName: boolean,
  linkNameOnly = true,
): LinkResult {
  if (!showObjectName || !objectLabel) return link;
  const prefix = `${objectLabel}: `;
  if (linkNameOnly) {
    return {
      html: `${escapeHtml(prefix)}${link.html}`,
      plain: `${prefix}${link.plain}`,
    };
  }
  // linkNameOnly=false: プレフィックスもリンク内に含める
  return {
    html: link.html.replace(/^<a ([^>]+)>/, `<a $1>${escapeHtml(prefix)}`),
    plain: `${prefix}${link.plain}`,
  };
}

export interface BulletConfig {
  enabled: boolean;
  style: 'ul' | 'custom';
  char: string;
}

export function joinLinks(links: LinkResult[], bullet: BulletConfig): LinkResult {
  if (links.length === 1) return links[0];
  if (!bullet.enabled) {
    return {
      html: links.map((l) => `<div>${l.html}</div>`).join(""),
      plain: links.map((l) => l.plain).join("\n"),
    };
  }
  if (bullet.style === 'ul') {
    return {
      html: '<meta charset="utf-8"><div><ul>' + links.map((l) => `<li>${l.html}</li>`).join("") + "</ul></div>",
      plain: links.map((l) => `- ${l.plain}`).join("\n"),
    };
  }
  // custom style
  const ch = bullet.char;
  return {
    html: links.map((l) => `<div>${escapeHtml(ch)}${l.html}</div>`).join(""),
    plain: links.map((l) => `${ch}${l.plain}`).join("\n"),
  };
}

export function appendToastMessages(
  link: LinkResult,
  toasts: string[],
): LinkResult {
  if (toasts.length === 0) return link;

  const suffix = toasts.map((msg) => `${t("lib_linkFormatter_errorPrefix")}${msg}`).join(" / ");

  return {
    html: `${link.html} / <span style="color:#c23934">${escapeHtml(suffix)}</span>`,
    plain: `${link.plain} / ${suffix}`,
  };
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
