import {
  formatBasicLink,
  formatExtendedLink,
  formatTemplateLink,
  extractFieldLabels,
  prefixObjectName,
} from "./lib/link-formatter";
import type { ObjectSettings, GlobalSettings } from "./lib/types";
import { DEFAULT_GLOBAL_SETTINGS } from "./lib/types";
import { t } from "./lib/i18n";

function querySelectorInShadowDOM(
  root: Document | ShadowRoot | Element,
  selector: string,
  maxDepth = 10,
): HTMLElement | null {
  const el = root.querySelector<HTMLElement>(selector);
  if (el) return el;
  if (maxDepth <= 0) return null;

  const elements = root.querySelectorAll("*");
  for (const element of elements) {
    if (element.shadowRoot) {
      const found = querySelectorInShadowDOM(
        element.shadowRoot,
        selector,
        maxDepth - 1,
      );
      if (found) return found;
    }
  }
  return null;
}

function findRecordNameElement(
  startEl: Element | Document,
): HTMLElement | null {
  const rh2 = querySelectorInShadowDOM(startEl, "records-highlights2");
  if (!rh2) return null;

  for (const selector of [
    'lightning-formatted-text[slot="primaryField"]',
    "lightning-formatted-text",
  ]) {
    const el = rh2.querySelector<HTMLElement>(selector);
    if (el && el.innerText?.trim()) {
      return el;
    }
  }
  return null;
}

function getObjectLabel(startEl: Element | Document): string | null {
  const el =
    querySelectorInShadowDOM(startEl, "records-entity-label") ||
    querySelectorInShadowDOM(startEl, ".entityNameTitle");
  if (!el) return null;
  return el.innerText?.trim() || null;
}

function escapeCSSAttr(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function getFieldValue(
  startEl: Element | Document,
  fieldLabel: string,
): string | null {
  const item = querySelectorInShadowDOM(
    startEl,
    `records-record-layout-item[field-label="${escapeCSSAttr(fieldLabel)}"]`,
  );
  if (!item) return null;

  const output = item.querySelector<HTMLElement>(
    "[data-output-element-id='output-field']",
  );
  if (!output) return null;

  const lookupLink = output.querySelector<HTMLElement>(
    "force-lookup a[data-navigation='enable']",
  );
  if (lookupLink) return lookupLink.innerText?.trim() || null;

  return output.innerText?.trim() || null;
}

function buildLink(
  recordName: string,
  url: string,
  startEl: Element | Document,
): { html: string; plain: string } {
  try {
    const objectLabel = getObjectLabel(startEl);
    const setting = objectLabel ? cachedSettings[objectLabel] : undefined;
    const showObjectName = cachedGlobalSettings.showObjectName;
    const linkNameOnly = cachedGlobalSettings.linkNameOnly;

    if (!setting?.enabled) {
      return prefixObjectName(formatBasicLink(recordName, url), objectLabel ?? '', showObjectName, linkNameOnly);
    }

    const mode = setting.mode ?? 'simple';

    if (mode === 'custom' && setting.format) {
      const labels = extractFieldLabels(setting.format);
      const fieldValues: Record<string, string> = {};
      for (const label of labels) {
        const val = getFieldValue(startEl, label);
        if (!val) return prefixObjectName(formatBasicLink(recordName, url), objectLabel ?? '', showObjectName, linkNameOnly);
        fieldValues[label] = val;
      }
      // カスタムモードでは showObjectName を適用しない
      return formatTemplateLink(
        recordName,
        url,
        setting.format,
        fieldValues,
        objectLabel ?? '',
        linkNameOnly,
      );
    }

    if (setting.fieldLabel) {
      const fieldValue = getFieldValue(startEl, setting.fieldLabel);
      if (fieldValue) {
        return prefixObjectName(
          formatExtendedLink(
            recordName,
            url,
            setting.fieldLabel,
            fieldValue,
            setting.showLabel,
            linkNameOnly,
          ),
          objectLabel ?? '',
          showObjectName,
          linkNameOnly,
        );
      }
    }
  } catch {
    // フォールバック: 基本リンク
  }
  return formatBasicLink(recordName, url);
}

const ERROR_CLASS_PATTERNS = ['slds-theme--error', 'slds-theme_error'];

function detectToastMessages(): string[] {
  const container =
    document.querySelector('div.forceToastManager div.toastContainer') ||
    document.querySelector('div.forceToastManager');
  if (!container) return [];

  const byClass = container.querySelectorAll('div.forceToastMessage');
  const toastItems = byClass.length > 0
    ? byClass
    : container.querySelectorAll('[data-aura-class="forceToastMessage"]');

  const messages: string[] = [];
  for (const item of toastItems) {
    const isError = ERROR_CLASS_PATTERNS.some((cls) =>
      item.querySelector(`.${cls}`) !== null || item.classList.contains(cls),
    );
    if (!isError) continue;

    const textEl =
      item.querySelector<HTMLElement>('.toastMessage.forceActionsText') ||
      item.querySelector<HTMLElement>('.toastMessage') ||
      item.querySelector<HTMLElement>('div.toastContent span');
    const text = textEl?.innerText?.trim();
    if (text) messages.push(text);
  }
  return messages;
}

let cachedSettings: ObjectSettings = {};
let cachedGlobalSettings: GlobalSettings = { ...DEFAULT_GLOBAL_SETTINGS };

type PageType = 'record' | 'report' | 'unknown';

function detectPageType(): PageType {
  const path = window.location.pathname;
  if (/\/lightning\/r\/Report\/[^/]+\/view/.test(path)) return 'report';
  if (/\/lightning\/r\/[^/]+\/[^/]+\/view/.test(path)) return 'record';
  return 'unknown';
}

function findReportName(): string | null {
  // DOM から取得（優先）
  const titleEl = document.querySelector<HTMLElement>('.slds-page-header__title');
  if (titleEl) {
    const name = titleEl.innerText?.trim();
    if (name) return name;
  }

  // フォールバック: document.title
  const title = document.title;
  if (title?.includes(' | Salesforce')) {
    const name = title.replace(/ \| Salesforce$/, '').trim();
    if (name) return name;
  }
  return title?.trim() || null;
}

function getRecordLink(): { success: boolean; html?: string; plain?: string; toasts?: string[] } {
  const pageType = detectPageType();
  if (pageType === 'unknown') return { success: false };

  if (pageType === 'report') {
    const name = findReportName();
    if (!name) return { success: false };
    const link = formatBasicLink(name, window.location.href);
    const result = prefixObjectName(link, t("content_reportLabel"), cachedGlobalSettings.showObjectName, cachedGlobalSettings.linkNameOnly);
    const toasts = cachedGlobalSettings.includeToast ? detectToastMessages() : [];
    return { success: true, ...result, toasts };
  }

  const startEl =
    document.querySelector("one-record-home-flexipage2") || document;

  const nameEl = findRecordNameElement(startEl);
  if (!nameEl) return { success: false };

  const recordName = nameEl.innerText.trim();
  const url = window.location.href;
  const link = buildLink(recordName, url, startEl);
  const toasts = cachedGlobalSettings.includeToast ? detectToastMessages() : [];

  return { success: true, html: link.html, plain: link.plain, toasts };
}

async function copyToClipboard(
  html: string,
  plain: string,
): Promise<{ success: boolean }> {
  try {
    const clipboardItem = new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([plain], { type: "text/plain" }),
    });
    await navigator.clipboard.write([clipboardItem]);
    return { success: true };
  } catch (err) {
    console.error("SF Record Linker: Copy failed", err);
    return { success: false };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "getRecordLink") {
    sendResponse(getRecordLink());
    return false;
  }
  if (message.action === "copyToClipboard") {
    copyToClipboard(message.html, message.plain).then(sendResponse);
    return true;
  }
});

chrome.storage.sync.get(
  { objectSettings: {}, globalSettings: DEFAULT_GLOBAL_SETTINGS },
  (result) => {
    cachedSettings = result.objectSettings as ObjectSettings;
    cachedGlobalSettings = { ...DEFAULT_GLOBAL_SETTINGS, ...(result.globalSettings as GlobalSettings) };
  },
);
chrome.storage.onChanged.addListener((changes) => {
  if (changes.objectSettings) {
    cachedSettings = changes.objectSettings.newValue as ObjectSettings;
  }
  if (changes.globalSettings) {
    cachedGlobalSettings = { ...DEFAULT_GLOBAL_SETTINGS, ...(changes.globalSettings.newValue as GlobalSettings) };
  }
});
