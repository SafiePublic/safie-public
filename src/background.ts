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
  if (!tab.id) return;
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "copyRecordLink",
    });
    setBadge(tab.id, response?.success === true);
  } catch {
    setBadge(tab.id, false);
  }
});
