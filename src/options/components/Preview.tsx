import { t } from '../../lib/i18n';
import { hasExplicitLink, tokenizeTemplate } from '../../lib/link-formatter';
import type { CardState } from '../../lib/types';

// プレビュー表示の最小単位。linked=true の部分が下線（リンク）で描画される。
interface PreviewSegment {
  text: string;
  linked: boolean;
}

function computePreviewSegments(
  card: CardState,
  linkNameOnly: boolean,
  showObjectName: boolean,
): PreviewSegment[] {
  const objectName = card.objectName.trim() || t('options_preview_objectName');
  const recordName = t('options_preview_recordName');

  // プレビューでは項目値をラベル名のプレースホルダ [項目名] で代用する。
  const resolveVar = (key: string): string => {
    if (key === 'name') return recordName;
    if (key === 'object') return objectName;
    return `[${key}]`;
  };

  if (card.mode === 'custom') {
    const format = card.format.trim();
    if (!format) return [{ text: recordName, linked: true }];

    // ${link:...} が1つでもあれば明示リンクモード。トークナイザと判定は
    // link-formatter から共有し、実出力（formatTemplateLink）とのドリフトを防ぐ。
    if (hasExplicitLink(format)) {
      return tokenizeTemplate(format).map((tok) =>
        tok.type === 'literal'
          ? { text: tok.text, linked: false }
          : { text: resolveVar(tok.key), linked: tok.isLink },
      );
    }

    // 従来挙動（${link:} なし）
    const expanded = format.replace(/\$\{([^}]+)\}/g, (match, key: string) => {
      if (key === 'name') return match; // ${name} はそのまま
      if (key === 'object') return objectName;
      return `[${key}]`;
    });

    if (linkNameOnly && expanded.includes('${name}')) {
      const idx = expanded.indexOf('${name}');
      return [
        { text: expanded.slice(0, idx), linked: false },
        { text: recordName, linked: true },
        { text: expanded.slice(idx + '${name}'.length), linked: false },
      ];
    }

    // linkNameOnly=false or ${name} なし → 全体
    const full = expanded.replace(/\$\{name\}/g, recordName);
    return [{ text: full, linked: true }];
  }

  // simple mode
  const label = card.fieldLabel.trim() || t('options_preview_label');
  const value = t('options_preview_value');
  const suffix = card.showLabel ? `(${label}:${value})` : `(${value})`;
  const prefix = showObjectName ? `${objectName}: ` : '';

  if (linkNameOnly) {
    return [
      { text: prefix, linked: false },
      { text: recordName, linked: true },
      { text: suffix, linked: false },
    ];
  }
  return [{ text: `${prefix}${recordName}${suffix}`, linked: true }];
}

interface GlobalPreviewProps {
  showObjectName: boolean;
  linkNameOnly: boolean;
  bulletList: boolean;
  bulletStyle: 'ul' | 'custom';
  bulletChar: string;
  includeToast: boolean;
}

export function GlobalPreview({
  showObjectName,
  linkNameOnly,
  bulletList,
  bulletStyle,
  bulletChar,
  includeToast,
}: GlobalPreviewProps) {
  const prefix = showObjectName ? `${t('options_preview_objectName')}: ` : '';
  const recordName = t('options_preview_recordName');
  const line = linkNameOnly ? (
    <>
      {prefix && <span>{prefix}</span>}
      <u>{recordName}</u>
    </>
  ) : (
    <u>
      {prefix}
      {recordName}
    </u>
  );

  const toast = includeToast && (
    <span class="preview-toast"> / {t('options_preview_errorSample')}</span>
  );

  if (!bulletList) {
    return (
      <div class="preview">
        <div class="preview-heading">{t('options_preview_heading')}</div>
        <div class="preview-text">
          {line}
          {toast}
        </div>
      </div>
    );
  }

  if (bulletStyle === 'ul') {
    return (
      <div class="preview">
        <div class="preview-heading">{t('options_preview_heading')}</div>
        <ul class="preview-list">
          <li class="preview-text">
            {line}
            {toast}
          </li>
          <li class="preview-text">{line}</li>
        </ul>
      </div>
    );
  }

  // custom bullet
  return (
    <div class="preview">
      <div class="preview-heading">{t('options_preview_heading')}</div>
      <div class="preview-text">
        <span>{bulletChar}</span>
        {line}
        {toast}
      </div>
      <div class="preview-text">
        <span>{bulletChar}</span>
        {line}
      </div>
    </div>
  );
}

interface PreviewProps {
  card: CardState;
  linkNameOnly: boolean;
  showObjectName: boolean;
}

export function Preview({ card, linkNameOnly, showObjectName }: PreviewProps) {
  const segments = computePreviewSegments(card, linkNameOnly, showObjectName);
  return (
    <div class="preview">
      <div class="preview-heading">{t('options_preview_heading')}</div>
      <div class="preview-text">
        {segments.map((seg, i) => {
          if (seg.text === '') return null;
          const key = `${i}:${seg.text}`;
          return seg.linked ? <u key={key}>{seg.text}</u> : <span key={key}>{seg.text}</span>;
        })}
      </div>
    </div>
  );
}
