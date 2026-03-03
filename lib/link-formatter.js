/**
 * リンク生成ロジック
 * Phase 1: formatBasicLink — レコード名 + URL のシンプルなリンク
 * Phase 2: formatExtendedLink — オブジェクト項目値付きリンク
 * Phase 3: formatCustomLink — テンプレートベースのカスタムリンク（予定）
 */

function formatBasicLink(recordName, url) {
  const escapedName = escapeHtml(recordName);
  const escapedUrl = escapeHtml(url);
  return {
    html: `<a href="${escapedUrl}">${escapedName}</a>`,
    plain: recordName,
  };
}

function formatExtendedLink(recordName, url, fieldLabel, fieldValue, showLabel) {
  const suffix = showLabel ? `(${fieldLabel}:${fieldValue})` : `(${fieldValue})`;
  const displayText = `${recordName}${suffix}`;
  const escapedText = escapeHtml(displayText);
  const escapedUrl = escapeHtml(url);
  return {
    html: `<a href="${escapedUrl}">${escapedText}</a>`,
    plain: displayText,
  };
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
