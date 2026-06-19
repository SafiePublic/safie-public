import { t } from './i18n';

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
  const suffix = showLabel ? `(${fieldLabel}:${fieldValue})` : `(${fieldValue})`;
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

// ${name} / ${商談番号} / ${link:商談番号} いずれにもマッチ。
// グループ1 = "link:"（任意）、グループ2 = 変数キー。
const TEMPLATE_VAR_RE = /\$\{(link:)?([^}]+)\}/g;

export function extractFieldLabels(format: string): string[] {
  const matches = format.matchAll(TEMPLATE_VAR_RE);
  const labels = new Set<string>();
  for (const m of matches) {
    // m[2] は link: 接頭辞を除いた変数キー（${link:商談番号} → 商談番号）。
    const label = m[2];
    if (label && !BUILTIN_VARS.has(label)) {
      labels.add(label);
    }
  }
  return [...labels];
}

// テンプレート内のトークン。リテラル文字列か、変数参照（リンク化指定の有無付き）。
// options のプレビュー（Preview.tsx）でも同じ解釈を使うため export する。
export type TemplateToken =
  | { type: 'literal'; text: string }
  | { type: 'var'; isLink: boolean; key: string };

// format 内に ${link:...} が1つでもあれば「明示リンク」モード。
// formatTemplateLink とプレビューで判定を共有する（重複・ドリフト防止）。
export function hasExplicitLink(format: string): boolean {
  return /\$\{link:[^}]+\}/.test(format);
}

export function tokenizeTemplate(format: string): TemplateToken[] {
  const tokens: TemplateToken[] = [];
  const re = new RegExp(TEMPLATE_VAR_RE.source, 'g');
  let lastIndex = 0;
  let m: RegExpExecArray | null = re.exec(format);
  while (m !== null) {
    if (m.index > lastIndex) {
      tokens.push({ type: 'literal', text: format.slice(lastIndex, m.index) });
    }
    tokens.push({ type: 'var', isLink: Boolean(m[1]), key: m[2] ?? '' });
    lastIndex = m.index + m[0].length;
    m = re.exec(format);
  }
  if (lastIndex < format.length) {
    tokens.push({ type: 'literal', text: format.slice(lastIndex) });
  }
  return tokens;
}

export function formatTemplateLink(
  recordName: string,
  url: string,
  format: string,
  fieldValues: Record<string, string>,
  objectLabel: string,
  linkNameOnly = true,
): LinkResult {
  const resolveVar = (key: string): string => {
    if (key === 'name') return recordName;
    if (key === 'object') return objectLabel;
    return fieldValues[key] ?? '';
  };

  const displayText = format.replace(TEMPLATE_VAR_RE, (_, _link: string, key: string) =>
    resolveVar(key),
  );

  // 指定された変数のみをリンク化し、linkNameOnly は無視する（後方互換: 旧 format は下の従来分岐へ）。
  if (hasExplicitLink(format)) {
    const html = tokenizeTemplate(format)
      .map((tok) => {
        if (tok.type === 'literal') return escapeHtml(tok.text);
        const value = escapeHtml(resolveVar(tok.key));
        // 値が空のときは空アンカー <a></a> を出さず、プレーン（空文字）にする。
        return tok.isLink && value !== '' ? `<a href="${escapeHtml(url)}">${value}</a>` : value;
      })
      .join('');
    return { html, plain: displayText };
  }

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
    const html = parts.map((p) => escapeHtml(p)).join(linkedName);

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
  const [first] = links;
  if (links.length === 1 && first) return first;
  if (!bullet.enabled) {
    return {
      html: links.map((l) => `<div>${l.html}</div>`).join(''),
      plain: links.map((l) => l.plain).join('\n'),
    };
  }
  if (bullet.style === 'ul') {
    return {
      html:
        '<meta charset="utf-8"><div><ul>' +
        links.map((l) => `<li>${l.html}</li>`).join('') +
        '</ul></div>',
      plain: links.map((l) => `- ${l.plain}`).join('\n'),
    };
  }
  // custom style
  const ch = bullet.char;
  return {
    html: links.map((l) => `<div>${escapeHtml(ch)}${l.html}</div>`).join(''),
    plain: links.map((l) => `${ch}${l.plain}`).join('\n'),
  };
}

export function appendToastMessages(link: LinkResult, toasts: string[]): LinkResult {
  if (toasts.length === 0) return link;

  const suffix = toasts.map((msg) => `${t('lib_linkFormatter_errorPrefix')}${msg}`).join(' / ');

  return {
    html: `${link.html} / <span style="color:#c23934">${escapeHtml(suffix)}</span>`,
    plain: `${link.plain} / ${suffix}`,
  };
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
