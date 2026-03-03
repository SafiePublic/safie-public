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
   * 修正 #1: リンクSVG とチェックSVG を両方保持し、display 切り替えで
   * フィードバック表示。innerHTML 差し替えによるリスナー消失を防止。
   */
  function createCopyIcon() {
    const wrapper = document.createElement("span");
    wrapper.id = ICON_ID;
    wrapper.title = "リンクをコピー";
    wrapper.style.cssText = `
      display: inline-flex;
      align-items: center;
      margin-right: 6px;
      cursor: pointer;
      vertical-align: middle;
      opacity: 0.6;
      transition: opacity 0.2s;
    `;

    wrapper.innerHTML = `
      <svg class="icon-link" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
      <svg class="icon-check" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
           fill="none" stroke="#4CAF50" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" style="display:none">
        <polyline points="20 6 9 17 4 12"/>
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
   * ページヘッダーからオブジェクトラベル名を取得
   * 例: <records-entity-label>部品表</records-entity-label> → "部品表"
   */
  function getObjectLabel() {
    const el = document.querySelector("records-entity-label")
            || document.querySelector(".entityNameTitle");
    if (!el) return null;
    return el.textContent.trim() || null;
  }

  /**
   * field-label 属性でフィールドを特定し、値を取得
   */
  function getFieldValue(fieldLabel) {
    const item = document.querySelector(
      `records-record-layout-item[field-label="${fieldLabel}"]`
    );
    if (!item) return null;

    const output = item.querySelector("[data-output-element-id='output-field']");
    if (!output) return null;

    // force-lookup: リンクテキストを取得（アシスティブテキスト除外）
    const lookupLink = output.querySelector("force-lookup a[data-navigation='enable']");
    if (lookupLink) return lookupLink.textContent.trim();

    // その他: textContent で取得
    return output.textContent.trim() || null;
  }

  // 修正 #3: 設定をキャッシュし、chrome.storage.onChanged でリアルタイム同期
  let cachedSettings = {};

  /**
   * クリップボードにリンクをコピー
   */
  async function handleCopy(e) {
    e.stopPropagation();
    e.preventDefault();

    const iconWrapper = e.currentTarget;
    const nameEl = findRecordNameElement();
    if (!nameEl) return;

    const recordName = nameEl.textContent.trim();
    const url = window.location.href;

    let html, plain;

    try {
      const objectSettings = cachedSettings;
      const objectLabel = getObjectLabel();
      const setting = objectLabel && objectSettings[objectLabel];

      if (setting && setting.enabled && setting.fieldLabel) {
        const fieldValue = getFieldValue(setting.fieldLabel);
        if (fieldValue) {
          ({ html, plain } = formatExtendedLink(
            recordName, url, setting.fieldLabel, fieldValue, setting.showLabel
          ));
        } else {
          ({ html, plain } = formatBasicLink(recordName, url));
        }
      } else {
        ({ html, plain } = formatBasicLink(recordName, url));
      }
    } catch (err) {
      // 設定読込失敗時はフォールバック
      ({ html, plain } = formatBasicLink(recordName, url));
    }

    try {
      const clipboardItem = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      });
      await navigator.clipboard.write([clipboardItem]);
      showFeedback(iconWrapper);
    } catch (err) {
      console.error("SF Record Linker: コピーに失敗しました", err);
    }
  }

  /**
   * 修正 #1: display 切り替えによるフィードバック（リスナー消失なし）
   */
  function showFeedback(iconWrapper) {
    const linkSvg = iconWrapper.querySelector(".icon-link");
    const checkSvg = iconWrapper.querySelector(".icon-check");
    linkSvg.style.display = "none";
    checkSvg.style.display = "";
    iconWrapper.style.opacity = "1";

    setTimeout(() => {
      linkSvg.style.display = "";
      checkSvg.style.display = "none";
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

    // レコード名 (lightning-formatted-text) の直前に挿入して左隣に配置
    const icon = createCopyIcon();
    nameEl.before(icon);
  }

  /**
   * 修正 #2: abort() 付き waitForElement で Observer 多重稼働を防止
   */
  function waitForElement(selectors, timeout = 5000) {
    let observer;
    let timeoutId;

    const promise = new Promise((resolve, reject) => {
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent.trim()) return resolve(el);
      }

      observer = new MutationObserver(() => {
        for (const selector of selectors) {
          const el = document.querySelector(selector);
          if (el && el.textContent.trim()) {
            observer.disconnect();
            clearTimeout(timeoutId);
            resolve(el);
            return;
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      timeoutId = setTimeout(() => {
        observer.disconnect();
        reject(new Error("Timeout: record name element not found"));
      }, timeout);
    });

    promise.abort = () => {
      if (observer) observer.disconnect();
      clearTimeout(timeoutId);
    };

    return promise;
  }

  /**
   * MutationObserver で SPA ページ遷移を検知
   * 修正 #2: 前の waitForElement をキャンセルして多重稼働を防止
   * Phase 2 修正: アイコン消失検知を維持（Lightning の DOM 再構築対応）
   */
  function observePageChanges() {
    let lastUrl = location.href;
    let pending = null;

    const observer = new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        // 前の待機をキャンセル
        if (pending) pending.abort();
        pending = waitForElement(RECORD_NAME_SELECTORS);
        pending.then(() => insertIcon()).catch(() => {});
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

    // 修正 #3: 設定の初期読み込みとリアルタイム同期
    chrome.storage.sync.get({ objectSettings: {} }, (result) => {
      cachedSettings = result.objectSettings;
    });
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.objectSettings) {
        cachedSettings = changes.objectSettings.newValue;
      }
    });
  }

  // DOM ready 時に実行
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
