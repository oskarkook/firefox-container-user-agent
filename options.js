const textarea = document.getElementById("ua");
const resetButton = document.getElementById("reset");
let defaultUserAgent = "";
const containerList = document.getElementById("containers");

async function renderContainers() {
  const { enabledStores } = await browser.storage.local.get({ enabledStores: [] });

  let containers = [];
  try {
    containers = await browser.contextualIdentities.query({});
  } catch {
    // Containers are disabled.
  }
  const stores = [{ cookieStoreId: "firefox-default", name: "No container" }, ...containers];
  if (await browser.extension.isAllowedIncognitoAccess()) {
    stores.push({ cookieStoreId: "firefox-private", name: "Private windows" });
  }

  containerList.replaceChildren(...stores.map(({ cookieStoreId, name }) => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = enabledStores.includes(cookieStoreId);
    checkbox.addEventListener("change", () => setEnabled(cookieStoreId, checkbox.checked));
    const label = document.createElement("label");
    label.append(checkbox, " ", name);
    return label;
  }));
}

async function setEnabled(cookieStoreId, enabled) {
  const { enabledStores } = await browser.storage.local.get({ enabledStores: [] });
  const stores = new Set(enabledStores);
  if (enabled) {
    stores.add(cookieStoreId);
  } else {
    stores.delete(cookieStoreId);
  }
  browser.storage.local.set({ enabledStores: [...stores] });
}

(async () => {
  const background = await browser.runtime.getBackgroundPage();
  defaultUserAgent = background.defaultUserAgent;
  const { userAgent } = await browser.storage.local.get({ userAgent: "" });
  textarea.value = userAgent || defaultUserAgent;
  renderContainers();
})();

textarea.addEventListener("input", () => {
  // Store the default as empty, so it keeps tracking CHROME_VERSION bumps.
  const userAgent = textarea.value.trim();
  browser.storage.local.set({ userAgent: userAgent === defaultUserAgent ? "" : userAgent });
});

resetButton.addEventListener("click", () => {
  textarea.value = defaultUserAgent;
  browser.storage.local.set({ userAgent: "" });
});

// Keep checkboxes in sync when toggled from the toolbar.
browser.storage.onChanged.addListener((changes) => {
  if (changes.enabledStores) renderContainers();
});
