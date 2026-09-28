// Bump this when Chrome releases a new major version.
const CHROME_VERSION = "154";

// Chrome's reduced User-Agent platform tokens.
const PLATFORMS = {
  win: "Windows NT 10.0; Win64; x64",
  mac: "Macintosh; Intel Mac OS X 10_15_7",
  linux: "X11; Linux x86_64",
};

// Read by the options page (via getBackgroundPage) to pre-fill the field.
var defaultUserAgent = null;
let customUserAgent = "";
// Cookie store IDs ("firefox-default", "firefox-container-1", ...) to rewrite the header in.
let enabledStores = new Set();

function rewriteUserAgent(details) {
  const userAgent = customUserAgent || defaultUserAgent;
  if (!enabledStores.has(details.cookieStoreId) || !userAgent) return {};
  for (const header of details.requestHeaders) {
    if (header.name.toLowerCase() === "user-agent") {
      header.value = userAgent;
    }
  }
  return { requestHeaders: details.requestHeaders };
}

// The icon is set per window and reflects the container of that window's active tab.
function render(tab) {
  const state = enabledStores.has(tab.cookieStoreId) ? "on" : "off";
  browser.browserAction.setIcon({ windowId: tab.windowId, path: `icons/${state}.svg` });
  browser.browserAction.setTitle({
    windowId: tab.windowId,
    title: `Container User-Agent: ${state.toUpperCase()} in this container`,
  });
}

async function renderAll() {
  for (const tab of await browser.tabs.query({ active: true })) render(tab);
}

browser.webRequest.onBeforeSendHeaders.addListener(
  rewriteUserAgent,
  { urls: ["<all_urls>"] },
  ["blocking", "requestHeaders"],
);

browser.browserAction.onClicked.addListener((tab) => {
  const stores = new Set(enabledStores);
  if (stores.has(tab.cookieStoreId)) {
    stores.delete(tab.cookieStoreId);
  } else {
    stores.add(tab.cookieStoreId);
  }
  browser.storage.local.set({ enabledStores: [...stores] });
});

browser.tabs.onActivated.addListener(async ({ tabId }) => {
  render(await browser.tabs.get(tabId));
});

// Storage is the source of truth, shared with the options page.
browser.storage.onChanged.addListener((changes) => {
  if (changes.userAgent) customUserAgent = changes.userAgent.newValue || "";
  if (changes.enabledStores) {
    enabledStores = new Set(changes.enabledStores.newValue || []);
    renderAll();
  }
});

(async () => {
  const { os } = await browser.runtime.getPlatformInfo();
  const platform = PLATFORMS[os] || PLATFORMS.linux;
  defaultUserAgent = `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME_VERSION}.0.0.0 Safari/537.36`;

  const stored = await browser.storage.local.get({ enabledStores: [], userAgent: "" });
  enabledStores = new Set(stored.enabledStores);
  customUserAgent = stored.userAgent;
  renderAll();
})();
