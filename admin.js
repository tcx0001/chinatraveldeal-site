const form = document.getElementById("dealForm");
const existingList = document.getElementById("existingList");
const addedList = document.getElementById("addedList");
const dealSearchInput = document.getElementById("dealSearchInput");
const jsonOutput = document.getElementById("jsonOutput");
const statusText = document.getElementById("status");
const formErrors = document.getElementById("formErrors");
const formMode = document.getElementById("formMode");
const submitDealBtn = document.getElementById("submitDealBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const suggestKeywordsBtn = document.getElementById("suggestKeywordsBtn");
const suggestCategoriesBtn = document.getElementById("suggestCategoriesBtn");
const copyJsonBtn = document.getElementById("copyJson");
const downloadJsonBtn = document.getElementById("downloadJson");
const clearDraftBtn = document.getElementById("clearDraft");
const clearAddedBtn = document.getElementById("clearAdded");
const paymentProviderInput = document.getElementById("paymentProviderInput");
const paymentDepositUrlInput = document.getElementById("paymentDepositUrlInput");
const paymentFullUrlInput = document.getElementById("paymentFullUrlInput");
const paymentManualEmailInput = document.getElementById("paymentManualEmailInput");
const paymentManualPhoneInput = document.getElementById("paymentManualPhoneInput");

let baseData = { filters: [], destinations: [], deals: [] };
let addedDeals = [];
let editState = null;
let searchQuery = "";
let paymentConfig = {
  provider: "Stripe",
  depositUrl: "",
  fullUrl: "",
  manualEmail: "275364182@qq.com",
  manualPhone: "13980077660"
};
const DRAFT_KEY = "chinatraveldeal-admin-draft-v1";

const setStatus = (text, color = "#2b4f79") => {
  statusText.textContent = text;
  statusText.style.color = color;
};

const normalizeCsv = (value = "") =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const slug = (value = "") => value.trim().toLowerCase();

const getCombinedDeals = () => [...baseData.deals, ...addedDeals];

const getFormDraft = () => ({
  title: form.elements.title.value,
  image: form.elements.image.value,
  imageAlt: form.elements.imageAlt.value,
  month: form.elements.month.value,
  price: form.elements.price.value,
  originalPrice: form.elements.originalPrice.value,
  saveValue: form.elements.saveValue.value,
  badge: form.elements.badge.value,
  topline: form.elements.topline.value,
  meta: form.elements.meta.value,
  description: form.elements.description.value,
  dateLine: form.elements.dateLine.value,
  includes: form.elements.includes.value,
  keywords: form.elements.keywords.value,
  category: form.elements.category.value,
  tags: form.elements.tags.value,
  recentViewed: form.elements.recentViewed.checked
});

const applyFormDraft = (draft) => {
  if (!draft || typeof draft !== "object") {
    return;
  }

  form.elements.title.value = draft.title || "";
  form.elements.image.value = draft.image || "";
  form.elements.imageAlt.value = draft.imageAlt || "";
  form.elements.month.value = draft.month || "";
  form.elements.price.value = draft.price || "";
  form.elements.originalPrice.value = draft.originalPrice || "";
  form.elements.saveValue.value = draft.saveValue || "";
  form.elements.badge.value = draft.badge || "";
  form.elements.topline.value = draft.topline || "";
  form.elements.meta.value = draft.meta || "";
  form.elements.description.value = draft.description || "";
  form.elements.dateLine.value = draft.dateLine || "";
  form.elements.includes.value = draft.includes || "";
  form.elements.keywords.value = draft.keywords || "";
  form.elements.category.value = draft.category || "";
  form.elements.tags.value = draft.tags || "";
  form.elements.recentViewed.checked = Boolean(draft.recentViewed);
};

const getPaymentConfigFromInputs = () => ({
  provider: (paymentProviderInput?.value || "").trim() || "Stripe",
  depositUrl: (paymentDepositUrlInput?.value || "").trim(),
  fullUrl: (paymentFullUrlInput?.value || "").trim(),
  manualEmail: (paymentManualEmailInput?.value || "").trim() || "275364182@qq.com",
  manualPhone: (paymentManualPhoneInput?.value || "").trim() || "13980077660"
});

const applyPaymentConfigToInputs = (config) => {
  if (!config) {
    return;
  }
  if (paymentProviderInput) paymentProviderInput.value = config.provider || "";
  if (paymentDepositUrlInput) paymentDepositUrlInput.value = config.depositUrl || "";
  if (paymentFullUrlInput) paymentFullUrlInput.value = config.fullUrl || "";
  if (paymentManualEmailInput) paymentManualEmailInput.value = config.manualEmail || "";
  if (paymentManualPhoneInput) paymentManualPhoneInput.value = config.manualPhone || "";
};

const saveDraftState = () => {
  try {
    paymentConfig = getPaymentConfigFromInputs();
    const draft = {
      formDraft: getFormDraft(),
      addedDeals,
      editState,
      searchQuery,
      paymentConfig
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error("Failed to save local draft:", error);
  }
};

const restoreDraftState = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      return false;
    }

    const draft = JSON.parse(raw);
    if (Array.isArray(draft.addedDeals)) {
      addedDeals = draft.addedDeals;
    }

    if (draft.paymentConfig && typeof draft.paymentConfig === "object") {
      paymentConfig = {
        ...paymentConfig,
        provider: draft.paymentConfig.provider || paymentConfig.provider,
        depositUrl: draft.paymentConfig.depositUrl || "",
        fullUrl: draft.paymentConfig.fullUrl || "",
        manualEmail: draft.paymentConfig.manualEmail || paymentConfig.manualEmail,
        manualPhone: draft.paymentConfig.manualPhone || paymentConfig.manualPhone
      };
      applyPaymentConfigToInputs(paymentConfig);
    }

    if (typeof draft.searchQuery === "string") {
      searchQuery = draft.searchQuery;
      dealSearchInput.value = draft.searchQuery;
    }

    applyFormDraft(draft.formDraft);

    if (
      draft.editState &&
      typeof draft.editState === "object" &&
      (draft.editState.source === "base" || draft.editState.source === "added") &&
      Number.isInteger(draft.editState.index)
    ) {
      editState = draft.editState;
      setFormMode(
        `Mode: Editing ${editState.source === "base" ? "existing" : "new"} deal #${editState.index + 1}`,
        "Save Changes"
      );
    }

    refreshOutput();
    setStatus("Restored local draft from previous session.", "#1c6b3a");
    return true;
  } catch (error) {
    console.error("Failed to restore local draft:", error);
    return false;
  }
};

const isDuplicateTitle = (title) => {
  const target = slug(title);
  if (!target) {
    return false;
  }

  return getCombinedDeals().some((deal, index) => {
    const sameTitle = slug(deal.title) === target;
    if (!sameTitle) {
      return false;
    }

    if (!editState) {
      return true;
    }

    if (editState.source === "base" && index === editState.index) {
      return false;
    }

    if (editState.source === "added" && index === baseData.deals.length + editState.index) {
      return false;
    }

    return true;
  });
};

const renderErrors = (errors) => {
  formErrors.innerHTML = errors.map((error) => `<li>${error}</li>`).join("");
};

const setFormMode = (modeText, submitText) => {
  formMode.textContent = modeText;
  submitDealBtn.textContent = submitText;
};

const resetEditMode = () => {
  editState = null;
  form.reset();
  renderErrors([]);
  setFormMode("Mode: Add new deal", "Add Deal");
  saveDraftState();
};

const buildDealFromForm = (formData) => ({
  title: (formData.get("title") || "").trim(),
  image: (formData.get("image") || "").trim(),
  imageAlt: (formData.get("imageAlt") || "").trim(),
  category: normalizeCsv(String(formData.get("category") || "")),
  month: (formData.get("month") || "").trim(),
  keywords: (formData.get("keywords") || "").trim(),
  badge: (formData.get("badge") || "").trim(),
  topline: (formData.get("topline") || "").trim(),
  meta: (formData.get("meta") || "").trim(),
  description: (formData.get("description") || "").trim(),
  dateLine: (formData.get("dateLine") || "").trim(),
  includes: (formData.get("includes") || "").trim(),
  originalPrice: (formData.get("originalPrice") || "").trim(),
  saveValue: (formData.get("saveValue") || "").trim(),
  tags: normalizeCsv(String(formData.get("tags") || "")),
  price: (formData.get("price") || "").trim(),
  recentViewed: Boolean(formData.get("recentViewed"))
});

const validateDeal = (deal) => {
  const errors = [];
  const requiredFields = [
    "title",
    "image",
    "imageAlt",
    "month",
    "price",
    "originalPrice",
    "saveValue",
    "badge",
    "topline",
    "meta",
    "description",
    "dateLine",
    "includes",
    "keywords"
  ];

  requiredFields.forEach((field) => {
    if (!deal[field]) {
      errors.push(`${field} is required.`);
    }
  });

  if (!deal.image.startsWith("http://") && !deal.image.startsWith("https://")) {
    errors.push("image must be a valid URL starting with http:// or https://");
  }

  if (!deal.price.startsWith("$")) {
    errors.push("price should start with '$' (example: $2,450).");
  }

  if (!deal.originalPrice.startsWith("$")) {
    errors.push("originalPrice should start with '$' (example: $3,320).");
  }

  if (deal.category.length === 0) {
    errors.push("At least one category is required.");
  }

  if (deal.tags.length === 0) {
    errors.push("At least one tag is required.");
  }

  if (isDuplicateTitle(deal.title)) {
    errors.push("title already exists. Please use a unique title.");
  }

  return errors;
};

const generateKeywordSuggestion = () => {
  const title = form.elements.title.value || "";
  const meta = form.elements.meta.value || "";
  const description = form.elements.description.value || "";
  const text = `${title} ${meta} ${description}`.toLowerCase();

  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "from",
    "days",
    "day",
    "tour",
    "plus",
    "this",
    "that",
    "your",
    "you",
    "into",
    "more",
    "china"
  ]);

  const words = text
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !stopWords.has(word));

  return Array.from(new Set(words)).slice(0, 12).join(" ");
};

const suggestCategories = () => {
  const text = `${form.elements.title.value} ${form.elements.meta.value} ${form.elements.description.value}`.toLowerCase();
  const categories = new Set();

  if (/food|cuisine|chef|hotpot|dumpling|taste|dining/.test(text)) {
    categories.add("food");
  }
  if (/luxury|premium|private|5-star|concierge/.test(text)) {
    categories.add("luxury");
  }
  if (/small group|history|heritage|culture|festival|museum|opera/.test(text)) {
    categories.add("culture");
  }
  if (/small group|group/.test(text)) {
    categories.add("small-group");
  }

  if (categories.size === 0) {
    categories.add("culture");
  }

  return Array.from(categories).join(", ");
};

const filterDealsByQuery = (deals) => {
  if (!searchQuery) {
    return deals;
  }
  return deals.filter((deal) =>
    String(deal.title || "")
      .toLowerCase()
      .includes(searchQuery)
  );
};

const renderDealList = (target, deals, source) => {
  const visibleDeals = filterDealsByQuery(deals);
  if (visibleDeals.length === 0) {
    target.innerHTML = "<li>No deals in this list.</li>";
    return;
  }

  target.innerHTML = visibleDeals
    .map(
      (deal, index) => `
      <li>
        <div class="deal-item">
          <span class="deal-item-title">${deal.title}</span>
          <div class="deal-item-actions">
            <button class="secondary" type="button" data-action="edit" data-source="${source}" data-title="${encodeURIComponent(deal.title || "")}">Edit</button>
            <button class="danger" type="button" data-action="delete" data-source="${source}" data-title="${encodeURIComponent(deal.title || "")}">Delete</button>
          </div>
        </div>
      </li>
    `
    )
    .join("");
};

const refreshOutput = () => {
  paymentConfig = getPaymentConfigFromInputs();
  const merged = {
    filters: baseData.filters,
    destinations: baseData.destinations,
    payment: paymentConfig,
    deals: [...baseData.deals, ...addedDeals]
  };
  jsonOutput.value = JSON.stringify(merged, null, 2);
  renderDealList(existingList, baseData.deals, "base");
  renderDealList(addedList, addedDeals, "added");
  saveDraftState();
};

const fillFormForEdit = (deal, source, index) => {
  form.elements.title.value = deal.title || "";
  form.elements.image.value = deal.image || "";
  form.elements.imageAlt.value = deal.imageAlt || "";
  form.elements.month.value = deal.month || "";
  form.elements.price.value = deal.price || "";
  form.elements.originalPrice.value = deal.originalPrice || "";
  form.elements.saveValue.value = deal.saveValue || "";
  form.elements.badge.value = deal.badge || "";
  form.elements.topline.value = deal.topline || "";
  form.elements.meta.value = deal.meta || "";
  form.elements.description.value = deal.description || "";
  form.elements.dateLine.value = deal.dateLine || "";
  form.elements.includes.value = deal.includes || "";
  form.elements.keywords.value = deal.keywords || "";
  form.elements.category.value = (deal.category || []).join(", ");
  form.elements.tags.value = (deal.tags || []).join(", ");
  form.elements.recentViewed.checked = Boolean(deal.recentViewed);

  editState = { source, index };
  renderErrors([]);
  setFormMode(
    `Mode: Editing ${source === "base" ? "existing" : "new"} deal #${index + 1}`,
    "Save Changes"
  );
  form.elements.title.focus();
  saveDraftState();
};

const handleDealListAction = (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const source = button.dataset.source;
  const dealTitle = decodeURIComponent(button.dataset.title || "");
  const action = button.dataset.action;
  const list = source === "base" ? baseData.deals : addedDeals;
  const index = list.findIndex((item) => (item.title || "") === dealTitle);
  const deal = list[index];

  if (!deal) {
    return;
  }

  if (action === "edit") {
    fillFormForEdit(deal, source, index);
    return;
  }

  if (action === "delete") {
    list.splice(index, 1);
    if (editState && editState.source === source && editState.index === index) {
      resetEditMode();
    }
    refreshOutput();
    setStatus(`Deleted "${deal.title}".`, "#a23d3d");
  }
};

const loadBaseData = async () => {
  try {
    const response = await fetch("./deals.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load deals.json: ${response.status}`);
    }

    const json = await response.json();
    if (Array.isArray(json)) {
      baseData = { filters: [], destinations: [], deals: json };
      paymentConfig = {
        provider: "Stripe",
        depositUrl: "",
        fullUrl: "",
        manualEmail: "275364182@qq.com",
        manualPhone: "13980077660"
      };
    } else {
      baseData = {
        filters: Array.isArray(json.filters) ? json.filters : [],
        destinations: Array.isArray(json.destinations) ? json.destinations : [],
        deals: Array.isArray(json.deals) ? json.deals : []
      };
      paymentConfig = {
        ...paymentConfig,
        ...(json.payment && typeof json.payment === "object" ? json.payment : {})
      };
    }

    applyPaymentConfigToInputs(paymentConfig);
    refreshOutput();
    setStatus("Loaded deals.json successfully.");
  } catch (error) {
    console.error(error);
    baseData = { filters: [], destinations: [], deals: [] };
    paymentConfig = {
      provider: "Stripe",
      depositUrl: "",
      fullUrl: "",
      manualEmail: "275364182@qq.com",
      manualPhone: "13980077660"
    };
    applyPaymentConfigToInputs(paymentConfig);
    refreshOutput();
    setStatus("Failed to load deals.json. You can still build records manually.", "#b23b3b");
  }
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const deal = buildDealFromForm(formData);
  const errors = validateDeal(deal);
  renderErrors(errors);

  if (errors.length > 0) {
    setStatus("Please fix validation errors before saving.", "#b23b3b");
    return;
  }

  if (editState) {
    const targetList = editState.source === "base" ? baseData.deals : addedDeals;
    targetList[editState.index] = deal;
    setStatus(`Updated "${deal.title}".`, "#1c6b3a");
  } else {
    addedDeals.push(deal);
    setStatus(`Added "${deal.title}" to export list.`, "#1c6b3a");
  }

  refreshOutput();
  resetEditMode();
});

cancelEditBtn.addEventListener("click", () => {
  resetEditMode();
  setStatus("Edit cancelled.");
});

existingList.addEventListener("click", handleDealListAction);
addedList.addEventListener("click", handleDealListAction);

copyJsonBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(jsonOutput.value);
    setStatus("JSON copied to clipboard.", "#1c6b3a");
  } catch (error) {
    console.error(error);
    setStatus("Copy failed. Please select and copy manually.", "#b23b3b");
  }
});

downloadJsonBtn.addEventListener("click", () => {
  const blob = new Blob([jsonOutput.value], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "deals.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  setStatus("Downloaded deals.json.", "#1c6b3a");
});

dealSearchInput.addEventListener("input", () => {
  searchQuery = dealSearchInput.value.trim().toLowerCase();
  refreshOutput();
});

form.addEventListener("input", saveDraftState);
form.addEventListener("change", saveDraftState);
[
  paymentProviderInput,
  paymentDepositUrlInput,
  paymentFullUrlInput,
  paymentManualEmailInput,
  paymentManualPhoneInput
].forEach((input) => {
  input?.addEventListener("input", refreshOutput);
  input?.addEventListener("change", refreshOutput);
});

clearAddedBtn.addEventListener("click", () => {
  addedDeals = [];
  refreshOutput();
  resetEditMode();
  setStatus("Cleared newly added records.");
});

suggestKeywordsBtn.addEventListener("click", () => {
  const suggestion = generateKeywordSuggestion();
  form.elements.keywords.value = suggestion;
  saveDraftState();
  setStatus("Generated keywords suggestion.", "#1c6b3a");
});

suggestCategoriesBtn.addEventListener("click", () => {
  form.elements.category.value = suggestCategories();
  saveDraftState();
  setStatus("Suggested categories from current content.", "#1c6b3a");
});

clearDraftBtn.addEventListener("click", () => {
  localStorage.removeItem(DRAFT_KEY);
  addedDeals = [];
  searchQuery = "";
  dealSearchInput.value = "";
  paymentConfig = {
    provider: "Stripe",
    depositUrl: "",
    fullUrl: "",
    manualEmail: "275364182@qq.com",
    manualPhone: "13980077660"
  };
  applyPaymentConfigToInputs(paymentConfig);
  resetEditMode();
  refreshOutput();
  setStatus("Cleared local draft data.", "#a23d3d");
});

const initializeAdmin = async () => {
  await loadBaseData();
  restoreDraftState();
  refreshOutput();
};

initializeAdmin();
