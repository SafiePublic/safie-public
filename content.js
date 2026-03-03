/**
 * SF Record Linker — Content Script
 * Salesforce Lightning レコードページにコピーアイコンを挿入し、
 * レコードへのリンクをクリップボードにコピーする。
 */

(function () {
  const ICON_ID = "sf-record-linker-icon";

  // レコード名を保持する要素のセレクタ（HTMLサンプル解析済み）
  const RECORD_NAME_SELECTORS = [
    'records-highlights2 slot[name="primaryField"] lightning-formatted-text',
    'records-highlights2 h1 lightning-formatted-text[slot="primaryField"]',
    'records-highlights2 h1 lightning-formatted-text',
  ];

  /**
   * レコード名の要素を検索して返す
   */
  function findRecordNameElement() {
    for (const selector of RECORD_NAME_SELECTORS) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim()) {
        return el;
      }
    }
    return null;
  }

  /**
   * コピーアイコンの SVG を生成
   */
  function createCopyIcon() {
    const wrapper = document.createElement("span");
    wrapper.id = ICON_ID;
    wrapper.title = "リンクをコピー";
    wrapper.style.cssText = `
      display: inline-flex;
      align-items: center;
      margin-left: 6px;
      cursor: pointer;
      vertical-align: middle;
      opacity: 0.6;
      transition: opacity 0.2s;
    `;

    wrapper.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    `;

    wrapper.addEventListener("mouseenter", () => {
      wrapper.style.opacity = "1";
    });
    wrapper.addEventListener("mouseleave", () => {
      wrapper.style.opacity = "0.6";
    });

    wrapper.addEventListener("click", handleCopy);

    return wrapper;
  }

  /**
   * クリップボードにリンクをコピー
   */
  async function handleCopy(e) {
    e.stopPropagation();
    e.preventDefault();

    const nameEl = findRecordNameElement();
    if (!nameEl) return;

    const recordName = nameEl.textContent.trim();
    const url = window.location.href;
    const { html, plain } = formatBasicLink(recordName, url);

    try {
      const clipboardItem = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      });
      await navigator.clipboard.write([clipboardItem]);
      showFeedback(e.currentTarget);
    } catch (err) {
      console.error("SF Record Linker: コピーに失敗しました", err);
    }
  }

  /**
   * コピー成功フィードバック（チェックマークに変更して戻す）
   */
  function showFeedback(iconWrapper) {
    const originalHTML = iconWrapper.innerHTML;
    iconWrapper.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
           fill="none" stroke="#4CAF50" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    `;
    iconWrapper.style.opacity = "1";

    setTimeout(() => {
      iconWrapper.innerHTML = originalHTML;
      iconWrapper.style.opacity = "0.6";
    }, 1500);
  }

  /**
   * コピーアイコンを挿入
   */
  function insertIcon() {
    // 既に挿入済みならスキップ
    if (document.getElementById(ICON_ID)) return;

    const nameEl = findRecordNameElement();
    if (!nameEl) return;

    // primaryField の slot 要素の直後（h1 内末尾付近）に挿入
    const primaryFieldSlot = document.querySelector(
      'records-highlights2 slot[name="primaryField"]'
    );
    const insertTarget = primaryFieldSlot || nameEl;

    const icon = createCopyIcon();
    insertTarget.after(icon);
  }

  /**
   * MutationObserver で SPA ページ遷移を検知
   */
  function observePageChanges() {
    let lastUrl = location.href;

    const observer = new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        // URL 変更後、DOM 更新を待ってからアイコン挿入を試行
        setTimeout(insertIcon, 500);
      }

      // URL が同じでもアイコンが消えていたら再挿入
      if (!document.getElementById(ICON_ID)) {
        insertIcon();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // 初期化
  function init() {
    insertIcon();
    observePageChanges();
  }

  // DOM ready 時に実行
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
