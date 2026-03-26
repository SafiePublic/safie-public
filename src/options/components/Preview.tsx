import type { CardState } from "../../lib/types";
import { t } from "../../lib/i18n";

function computePreviewParts(
  card: CardState,
  linkNameOnly: boolean,
  showObjectName: boolean,
): { before: string; linked: string; after: string } {
  const objectName = card.objectName.trim() || t("options_preview_objectName");

  if (card.mode === "custom") {
    const format = card.format.trim();
    if (!format) return { before: "", linked: t("options_preview_recordName"), after: "" };

    const expanded = format.replace(/\$\{([^}]+)\}/g, (match, key: string) => {
      if (key === "name") return match; // ${name} はそのまま
      if (key === "object") return objectName;
      return `[${key}]`;
    });

    if (linkNameOnly && expanded.includes("${name}")) {
      const idx = expanded.indexOf("${name}");
      return {
        before: expanded.slice(0, idx),
        linked: t("options_preview_recordName"),
        after: expanded.slice(idx + "${name}".length),
      };
    }

    // linkNameOnly=false or ${name} なし → 全体
    const full = expanded.replace(/\$\{name\}/g, t("options_preview_recordName"));
    return { before: "", linked: full, after: "" };
  }

  // simple mode
  const label = card.fieldLabel.trim() || t("options_preview_label");
  const value = t("options_preview_value");
  const suffix = card.showLabel ? `(${label}:${value})` : `(${value})`;
  const prefix = showObjectName ? `${objectName}: ` : "";

  if (linkNameOnly) {
    return { before: prefix, linked: t("options_preview_recordName"), after: suffix };
  }
  return { before: "", linked: `${prefix}${t("options_preview_recordName")}${suffix}`, after: "" };
}

interface GlobalPreviewProps {
  showObjectName: boolean;
  linkNameOnly: boolean;
  bulletList: boolean;
  bulletStyle: "ul" | "custom";
  bulletChar: string;
  includeToast: boolean;
}

export function GlobalPreview({ showObjectName, linkNameOnly, bulletList, bulletStyle, bulletChar, includeToast }: GlobalPreviewProps) {
  const prefix = showObjectName ? `${t("options_preview_objectName")}: ` : "";
  const recordName = t("options_preview_recordName");
  const line = linkNameOnly ? (
    <>
      {prefix && <span>{prefix}</span>}
      <u>{recordName}</u>
    </>
  ) : (
    <u>{prefix}{recordName}</u>
  );

  const toast = includeToast && (
    <span class="preview-toast"> / {t("options_preview_errorSample")}</span>
  );

  if (!bulletList) {
    return (
      <div class="preview">
        <div class="preview-heading">{t("options_preview_heading")}</div>
        <div class="preview-text">{line}{toast}</div>
      </div>
    );
  }

  if (bulletStyle === "ul") {
    return (
      <div class="preview">
        <div class="preview-heading">{t("options_preview_heading")}</div>
        <ul class="preview-list">
          <li class="preview-text">{line}{toast}</li>
          <li class="preview-text">{line}</li>
        </ul>
      </div>
    );
  }

  // custom bullet
  return (
    <div class="preview">
      <div class="preview-heading">{t("options_preview_heading")}</div>
      <div class="preview-text">
        <span>{bulletChar}</span>{line}{toast}
      </div>
      <div class="preview-text">
        <span>{bulletChar}</span>{line}
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
  const { before, linked, after } = computePreviewParts(card, linkNameOnly, showObjectName);
  return (
    <div class="preview">
      <div class="preview-heading">{t("options_preview_heading")}</div>
      <div class="preview-text">
        {before && <span>{before}</span>}
        <u>{linked}</u>
        {after && <span>{after}</span>}
      </div>
    </div>
  );
}
