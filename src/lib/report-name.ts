// レポート実行ページのレポート名抽出ロジック。
// DOM 探索（Shadow DOM / iframe 横断 querySelector）は呼び出し側から注入し、テスト可能にする。

import type { ShadowQuery } from "./dom-query";
export type { ShadowQuery };

// 新しいレポートランタイム（dashboard-container 系）はヘッダーを Shadow DOM 内に描画する
// ことがあり、document.querySelector では取得できない。Shadow DOM を横断して探索する。
// h1 直下にはレポートタイプ名の span も存在するため、.slds-page-header__title を明示的に狙う。
const REPORT_TITLE_SELECTORS = [
  ".report-header .slds-page-header__title",
  ".slds-page-header__title",
];

export function findReportName(
  root: Document | Element,
  documentTitle: string,
  query: ShadowQuery,
): string | null {
  for (const selector of REPORT_TITLE_SELECTORS) {
    const el = query(root, selector);
    if (!el) continue;
    // title 属性は slds-truncate で本文が切れても完全なレポート名を保持するため優先
    const name = el.getAttribute("title")?.trim() || el.innerText?.trim();
    if (name) return name;
  }

  // フォールバック: document.title。
  // 環境名付与系の拡張機能がタイトルを書き換えるとノイズが混入するため最終手段に留める。
  if (documentTitle?.includes(" | Salesforce")) {
    const name = documentTitle.replace(/ \| Salesforce$/, "").trim();
    if (name) return name;
  }
  return documentTitle?.trim() || null;
}
