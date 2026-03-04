import { formatBasicLink, formatExtendedLink } from "./lib/link-formatter";

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

interface ObjectSetting {
  enabled: boolean;
  fieldLabel: string;
  showLabel: boolean;
}

interface ObjectSettings {
  [key: string]: ObjectSetting;
}

function findRecordNameElement(): HTMLElement | null {
  const startEl =
    document.querySelector("one-record-home-flexipage2") || document;
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

function getObjectLabel(): string | null {
  const startEl =
    document.querySelector("one-record-home-flexipage2") || document;
  const el =
    querySelectorInShadowDOM(startEl, "records-entity-label") ||
    querySelectorInShadowDOM(startEl, ".entityNameTitle");
  if (!el) return null;
  return el.innerText?.trim() || null;
}

function getFieldValue(fieldLabel: string): string | null {
  const startEl =
    document.querySelector("one-record-home-flexipage2") || document;
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

let cachedSettings: ObjectSettings = {};

function isRecordPage(): boolean {
  return /\/lightning\/r\/[^/]+\/[^/]+\/view/.test(window.location.pathname);
}

async function copyRecordLink(): Promise<{ success: boolean }> {
  if (!isRecordPage()) return { success: false };

  const nameEl = findRecordNameElement();
  if (!nameEl) return { success: false };

  const recordName = nameEl.innerText.trim();
  const url = window.location.href;

  let html: string;
  let plain: string;

  try {
    const objectLabel = getObjectLabel();
    const setting = objectLabel ? cachedSettings[objectLabel] : undefined;

    if (setting?.enabled && setting.fieldLabel) {
      const fieldValue = getFieldValue(setting.fieldLabel);
      if (fieldValue) {
        ({ html, plain } = formatExtendedLink(
          recordName,
          url,
          setting.fieldLabel,
          fieldValue,
          setting.showLabel,
        ));
      } else {
        ({ html, plain } = formatBasicLink(recordName, url));
      }
    } else {
      ({ html, plain } = formatBasicLink(recordName, url));
    }
  } catch {
    ({ html, plain } = formatBasicLink(recordName, url));
  }

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
  if (message.action === "copyRecordLink") {
    copyRecordLink().then(sendResponse);
    return true; // 非同期レスポンスのためtrueを返す
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
