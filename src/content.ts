import {
  formatBasicLink,
  formatExtendedLink,
  formatTemplateLink,
  extractFieldLabels,
} from "./lib/link-formatter";
import type { ObjectSettings } from "./lib/types";

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

function getFieldValue(
  startEl: Element | Document,
  fieldLabel: string,
): string | null {
  const item = querySelectorInShadowDOM(
    startEl,
    `records-record-layout-item[field-label="${fieldLabel}"]`,
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

    if (!setting?.enabled) return formatBasicLink(recordName, url);

    const mode = setting.mode ?? 'simple';

    if (mode === 'custom' && setting.format) {
      const labels = extractFieldLabels(setting.format);
      const fieldValues: Record<string, string> = {};
      for (const label of labels) {
        const val = getFieldValue(startEl, label);
        if (!val) return formatBasicLink(recordName, url);
        fieldValues[label] = val;
      }
      return formatTemplateLink(
        recordName,
        url,
        setting.format,
        fieldValues,
        objectLabel ?? '',
        setting.alias ?? '',
      );
    }

    if (setting.fieldLabel) {
      const fieldValue = getFieldValue(startEl, setting.fieldLabel);
      if (fieldValue) {
        return formatExtendedLink(
          recordName,
          url,
          setting.fieldLabel,
          fieldValue,
          setting.showLabel,
        );
      }
    }
  } catch {
    // フォールバック: 基本リンク
  }
  return formatBasicLink(recordName, url);
}

let cachedSettings: ObjectSettings = {};

function isRecordPage(): boolean {
  return /\/lightning\/r\/[^/]+\/[^/]+\/view/.test(window.location.pathname);
}

function getRecordLink(): { success: boolean; html?: string; plain?: string } {
  if (!isRecordPage()) return { success: false };

  const startEl =
    document.querySelector("one-record-home-flexipage2") || document;

  const nameEl = findRecordNameElement(startEl);
  if (!nameEl) return { success: false };

  const recordName = nameEl.innerText.trim();
  const url = window.location.href;
  const { html, plain } = buildLink(recordName, url, startEl);
  return { success: true, html, plain };
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
    console.error("SF Record Linker: コピーに失敗しました", err);
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

chrome.storage.sync.get({ objectSettings: {} }, (result) => {
  cachedSettings = result.objectSettings as ObjectSettings;
});
chrome.storage.onChanged.addListener((changes) => {
  if (changes.objectSettings) {
    cachedSettings = changes.objectSettings.newValue as ObjectSettings;
  }
});
