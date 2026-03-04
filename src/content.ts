import { formatBasicLink, formatExtendedLink } from "./lib/link-formatter";

const ICON_ID = "sf-record-linker-icon";

const RECORD_NAME_SELECTORS = [
  'records-highlights2 slot[name="primaryField"] lightning-formatted-text',
  'records-highlights2 h1 lightning-formatted-text[slot="primaryField"]',
  "records-highlights2 h1 lightning-formatted-text",
];

interface ObjectSetting {
  enabled: boolean;
  fieldLabel: string;
  showLabel: boolean;
}

interface ObjectSettings {
  [key: string]: ObjectSetting;
}

function findRecordNameElement(): HTMLElement | null {
  for (const selector of RECORD_NAME_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el && el.textContent?.trim()) {
      return el;
    }
  }
  return null;
}

function createCopyIcon(): HTMLSpanElement {
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

function getObjectApiName(): string | null {
  const el = document.querySelector(
    "[data-target-selection-name^='sfdc:RecordField.']",
  );
  if (!el) return null;
  const attr = el.getAttribute("data-target-selection-name");
  if (!attr) return null;
  const match = attr.match(/^sfdc:RecordField\.([^.]+)\./);
  return match ? match[1].toLowerCase() : null;
}

function getFieldValue(fieldLabel: string): string | null {
  const item = document.querySelector(
    `records-record-layout-item[field-label="${fieldLabel}"]`,
  );
  if (!item) return null;

  const output = item.querySelector(
    "[data-output-element-id='output-field']",
  );
  if (!output) return null;

  const lookupLink = output.querySelector(
    "force-lookup a[data-navigation='enable']",
  );
  if (lookupLink) return lookupLink.textContent?.trim() || null;

  return output.textContent?.trim() || null;
}

function loadSettings(): Promise<ObjectSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ objectSettings: {} }, (result) => {
      resolve(result.objectSettings as ObjectSettings);
    });
  });
}

async function handleCopy(e: Event): Promise<void> {
  e.stopPropagation();
  e.preventDefault();

  const iconWrapper = e.currentTarget as HTMLElement;
  const nameEl = findRecordNameElement();
  if (!nameEl) return;

  const recordName = nameEl.textContent!.trim();
  const url = window.location.href;

  let html: string;
  let plain: string;

  try {
    const objectSettings = await loadSettings();
    const objectApiName = getObjectApiName();
    const setting = objectApiName
      ? objectSettings[objectApiName]
      : undefined;

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
    showFeedback(iconWrapper);
  } catch (err) {
    console.error("SF Record Linker: コピーに失敗しました", err);
  }
}

function showFeedback(iconWrapper: HTMLElement): void {
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

function insertIcon(): void {
  if (document.getElementById(ICON_ID)) return;

  const nameEl = findRecordNameElement();
  if (!nameEl) return;

  const icon = createCopyIcon();
  nameEl.before(icon);
}

function observePageChanges(): void {
  let lastUrl = location.href;

  const observer = new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      setTimeout(insertIcon, 500);
    }

    if (!document.getElementById(ICON_ID)) {
      insertIcon();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function init(): void {
  insertIcon();
  observePageChanges();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
