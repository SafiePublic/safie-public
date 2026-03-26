import type { CardState } from "../../lib/types";

function computePreviewParts(
  card: CardState,
  linkNameOnly: boolean,
  showObjectName: boolean,
): { before: string; linked: string; after: string } {
  const objectName = card.objectName.trim() || "オブジェクト名";

  if (card.mode === "custom") {
    const format = card.format.trim();
    if (!format) return { before: "", linked: "レコード名", after: "" };

    const expanded = format.replace(/\$\{([^}]+)\}/g, (match, key: string) => {
      if (key === "name") return match; // ${name} はそのまま
      if (key === "object") return objectName;
      return `[${key}]`;
    });

    if (linkNameOnly && expanded.includes("${name}")) {
      const idx = expanded.indexOf("${name}");
      return {
        before: expanded.slice(0, idx),
        linked: "レコード名",
        after: expanded.slice(idx + "${name}".length),
      };
    }

    // linkNameOnly=false or ${name} なし → 全体
    const full = expanded.replace(/\$\{name\}/g, "レコード名");
    return { before: "", linked: full, after: "" };
  }

  // simple mode
  const label = card.fieldLabel.trim() || "ラベル";
  const suffix = card.showLabel ? `(${label}:値)` : "(値)";
  const prefix = showObjectName ? `${objectName}: ` : "";

  if (linkNameOnly) {
    return { before: prefix, linked: "レコード名", after: suffix };
  }
  return { before: "", linked: `${prefix}レコード名${suffix}`, after: "" };
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
  const prefix = showObjectName ? "オブジェクト名: " : "";
  const line = linkNameOnly ? (
    <>
      {prefix && <span>{prefix}</span>}
      <u>レコード名</u>
    </>
  ) : (
    <u>{prefix}レコード名</u>
  );

  const toast = includeToast && (
    <span class="preview-toast"> / ⚠ エラー: エラーメッセージ</span>
  );

  if (!bulletList) {
    return (
      <div class="preview">
        <div class="preview-heading">プレビュー</div>
        <div class="preview-text">{line}{toast}</div>
      </div>
    );
  }

  if (bulletStyle === "ul") {
    return (
      <div class="preview">
        <div class="preview-heading">プレビュー</div>
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
      <div class="preview-heading">プレビュー</div>
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
      <div class="preview-heading">プレビュー</div>
      <div class="preview-text">
        {before && <span>{before}</span>}
        <u>{linked}</u>
        {after && <span>{after}</span>}
      </div>
    </div>
  );
}
