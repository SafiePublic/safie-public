import { joinLinks, appendToastMessages } from "./lib/link-formatter";
import type { GlobalSettings } from "./lib/types";
import { DEFAULT_GLOBAL_SETTINGS } from "./lib/types";

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.disable();
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {
              hostSuffix: ".lightning.force.com",
              pathContains: "/lightning/r/",
            },
          }),
        ],
        actions: [new chrome.declarativeContent.ShowAction()],
      },
    ]);
  });
});

function setBadge(tabId: number, success: boolean): void {
  const text = success ? "\u2713" : "\u2717";
  const color = success ? "#4CAF50" : "#F44336";
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color, tabId });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: "", tabId });
  }, 2000);
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.windowId) return;

  try {
    const highlighted = await chrome.tabs.query({
      windowId: tab.windowId,
      highlighted: true,
    });

    const targets = highlighted.filter((t) => t.id != null);
    if (targets.length === 0) return;

    const results = await Promise.all(
      targets.map(async (t) => {
        try {
          return await chrome.tabs.sendMessage(t.id!, {
            action: "getRecordLink",
          });
        } catch {
          return { success: false };
        }
      }),
    );

    const successResults = results.filter(
      (r): r is { success: true; html: string; plain: string; toasts?: string[] } =>
        r?.success === true && r.html && r.plain,
    );

    if (successResults.length === 0) {
      setBadge(tab.id, false);
      return;
    }

    const stored = await chrome.storage.sync.get({
      globalSettings: DEFAULT_GLOBAL_SETTINGS,
    }) as { globalSettings: GlobalSettings };
    const globalSettings = { ...DEFAULT_GLOBAL_SETTINGS, ...stored.globalSettings };

    const bullet = {
      enabled: globalSettings.bulletList,
      style: globalSettings.bulletStyle,
      char: globalSettings.bulletChar,
    };

    const links = successResults.map((r) => {
      const link = { html: r.html, plain: r.plain };
      return r.toasts?.length ? appendToastMessages(link, r.toasts) : link;
    });

    const { html, plain } = joinLinks(links, bullet);

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "copyToClipboard",
      html,
      plain,
    });

    setBadge(tab.id, response?.success === true);
  } catch {
    setBadge(tab.id!, false);
  }
});
