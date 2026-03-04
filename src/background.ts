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

    const links = results.filter(
      (r): r is { success: true; html: string; plain: string } =>
        r?.success === true && r.html && r.plain,
    );

    if (links.length === 0) {
      setBadge(tab.id, false);
      return;
    }

    const html = links.map((l) => l.html).join("<br>");
    const plain = links.map((l) => l.plain).join("\n");

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
