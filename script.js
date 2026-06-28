const bookingForm = document.getElementById("bookingForm");
const formMessage = document.getElementById("formMessage");
const newsletterForm = document.getElementById("newsletterForm");
const newsletterMessage = document.getElementById("newsletterMessage");
const slides = Array.from(document.querySelectorAll("[data-slide]"));
const dots = Array.from(document.querySelectorAll("[data-dot]"));
const regionTabs = Array.from(document.querySelectorAll("[data-region]"));
const regionPanels = Array.from(document.querySelectorAll("[data-region-panel]"));
const dealFiltersContainer = document.getElementById("dealFilters");
const dealResultMeta = document.getElementById("dealResultMeta");
const dealSearchForm = document.getElementById("dealSearchForm");
const destinationInput = document.getElementById("destinationInput");
const destinationOptions = document.getElementById("destinationOptions");
const monthSelect = document.getElementById("monthSelect");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const dealGrid = document.getElementById("dealGrid");
const recentGrid = document.getElementById("recentGrid");
const payDepositLink = document.getElementById("payDepositLink");
const payFullLink = document.getElementById("payFullLink");
const depositPaymentStatus = document.getElementById("depositPaymentStatus");
const fullPaymentStatus = document.getElementById("fullPaymentStatus");

let dealsData = [];
let filtersData = [];
let destinationsData = [];
let dealFilters = [];
let paymentConfig = {
  provider: "Stripe",
  depositUrl: "",
  fullUrl: "",
  manualEmail: "275364182@qq.com",
  manualPhone: "13980077660"
};
let backendConfig = {
  bookingEndpoint: "",
  newsletterEndpoint: ""
};

const loadDealsData = async () => {
  try {
    const response = await fetch("./deals.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch deals.json: ${response.status}`);
    }

    const json = await response.json();
    if (Array.isArray(json)) {
      dealsData = json;
      filtersData = [
        { id: "all", label: "Popular" },
        { id: "culture", label: "Culture" },
        { id: "food", label: "Food" },
        { id: "small-group", label: "Small Group" },
        { id: "luxury", label: "Luxury" }
      ];
      destinationsData = [];
      return true;
    }

    if (!json || !Array.isArray(json.deals)) {
      throw new Error("deals.json does not include a valid deals array");
    }

    dealsData = json.deals;
    filtersData = Array.isArray(json.filters) ? json.filters : [];
    destinationsData = Array.isArray(json.destinations) ? json.destinations : [];
    paymentConfig =
      json.payment && typeof json.payment === "object"
        ? {
            ...paymentConfig,
            provider: json.payment.provider || paymentConfig.provider,
            depositUrl: json.payment.depositUrl || "",
            fullUrl: json.payment.fullUrl || "",
            manualEmail: json.payment.manualEmail || paymentConfig.manualEmail,
            manualPhone: json.payment.manualPhone || paymentConfig.manualPhone
          }
        : paymentConfig;
    backendConfig =
      json.backend && typeof json.backend === "object"
        ? {
            ...backendConfig,
            bookingEndpoint: json.backend.bookingEndpoint || "",
            newsletterEndpoint: json.backend.newsletterEndpoint || ""
          }
        : backendConfig;
    return true;
  } catch (error) {
    console.error("Unable to load deals data:", error);
    dealsData = [];
    filtersData = [];
    destinationsData = [];
    return false;
  }
};

const initializePaymentLinks = () => {
  if (!payDepositLink || !payFullLink || !depositPaymentStatus || !fullPaymentStatus) {
    return;
  }

  if (paymentConfig.depositUrl && paymentConfig.fullUrl) {
    payDepositLink.href = paymentConfig.depositUrl;
    payFullLink.href = paymentConfig.fullUrl;
    payDepositLink.target = "_blank";
    payFullLink.target = "_blank";
    depositPaymentStatus.textContent = `Secure ${paymentConfig.provider} checkout ready.`;
    fullPaymentStatus.textContent = `Secure ${paymentConfig.provider} checkout ready.`;
    return;
  }

  const fallbackMail = `mailto:${encodeURIComponent(
    paymentConfig.manualEmail
  )}?subject=Payment%20Request%20-%20Chinatraveldeal`;
  payDepositLink.href = fallbackMail;
  payFullLink.href = fallbackMail;
  depositPaymentStatus.textContent =
    "Payment gateway not connected yet. Click to request payment link.";
  fullPaymentStatus.textContent =
    "Payment gateway not connected yet. Click to request payment link.";
};

const postLeadData = async (endpoint, payload) => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
};

const isConfiguredEndpoint = (value) =>
  typeof value === "string" &&
  value.startsWith("https://") &&
  !value.includes("YOUR_PROJECT_REF");

if (bookingForm && formMessage) {
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(bookingForm);
    const payload = Object.fromEntries(formData.entries());
    const requiredFields = ["name", "email", "date", "travelers", "destination", "interest"];
    const missing = requiredFields.find((field) => !payload[field]);

    if (missing) {
      formMessage.textContent = "Please fill out all required fields.";
      formMessage.style.color = "#b91c1c";
      return;
    }

    if (!isConfiguredEndpoint(backendConfig.bookingEndpoint)) {
      formMessage.textContent =
        "Form backend is not connected yet. Set backend.bookingEndpoint in deals.json.";
      formMessage.style.color = "#b45309";
      return;
    }

    try {
      formMessage.textContent = "Submitting your request...";
      formMessage.style.color = "#1d4ed8";
      await postLeadData(backendConfig.bookingEndpoint, {
        type: "booking",
        source: "website-booking-form",
        payload
      });
      formMessage.textContent =
        "Thanks! Your U.S.-to-China request is received. We will email your custom itinerary within 24 hours.";
      formMessage.style.color = "#166534";
      bookingForm.reset();
    } catch (error) {
      console.error("Booking request failed:", error);
      formMessage.textContent =
        "Could not submit right now. Please try again, or contact us at 275364182@qq.com.";
      formMessage.style.color = "#b91c1c";
    }
  });
}

if (newsletterForm && newsletterMessage) {
  newsletterForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(newsletterForm);
    const payload = Object.fromEntries(formData.entries());

    if (!payload.firstName || !payload.email) {
      newsletterMessage.textContent = "Please complete first name and email.";
      newsletterMessage.style.color = "#ffd2d2";
      return;
    }

    if (!isConfiguredEndpoint(backendConfig.newsletterEndpoint)) {
      newsletterMessage.textContent =
        "Newsletter backend not connected yet.";
      newsletterMessage.style.color = "#ffe08a";
      return;
    }

    try {
      newsletterMessage.textContent = "Submitting...";
      newsletterMessage.style.color = "#bcd8ff";
      await postLeadData(backendConfig.newsletterEndpoint, {
        type: "newsletter",
        source: "website-newsletter-form",
        payload
      });
      newsletterMessage.textContent =
        "Thanks for subscribing. You will receive new China deal alerts soon.";
      newsletterMessage.style.color = "#d8ffe7";
      newsletterForm.reset();
    } catch (error) {
      console.error("Newsletter signup failed:", error);
      newsletterMessage.textContent =
        "Could not subscribe right now. Please try again later.";
      newsletterMessage.style.color = "#ffd2d2";
    }
  });
}

if (slides.length > 0 && dots.length === slides.length) {
  let currentIndex = 0;

  const activateSlide = (index) => {
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === index);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === index);
    });
  };

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      currentIndex = index;
      activateSlide(currentIndex);
    });
  });

  setInterval(() => {
    currentIndex = (currentIndex + 1) % slides.length;
    activateSlide(currentIndex);
  }, 5000);
}

if (regionTabs.length > 0 && regionPanels.length > 0) {
  const activateRegion = (regionName) => {
    regionTabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.region === regionName);
    });
    regionPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.regionPanel === regionName);
    });
  };

  regionTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activateRegion(tab.dataset.region);
    });
  });
}

if (dealGrid && dealResultMeta && dealFiltersContainer) {
  let activeFilter = "all";

  const renderDealCard = (deal) => `
    <article class="deal-card">
      <img
        class="deal-image"
        loading="lazy"
        decoding="async"
        src="${deal.image}"
        alt="${deal.imageAlt || deal.title}"
      />
      <div class="deal-body">
        <p class="deal-badge">${deal.badge || "HOT DEAL"}</p>
        <p class="deal-topline">${deal.topline || ""}</p>
        <h3>${deal.title}</h3>
        <p class="deal-meta">${deal.meta || ""}</p>
        <p class="deal-desc">${deal.description || ""}</p>
        <p class="deal-meta-secondary">${deal.dateLine || ""}</p>
        <p class="deal-includes">${deal.includes || ""}</p>
        <div class="deal-saving-line">
          <span class="deal-original">${deal.originalPrice || ""}</span>
          <span class="deal-save-value">${deal.saveValue || ""}</span>
        </div>
        <div class="deal-tags">
          ${(deal.tags || []).map((tag) => `<span>${tag}</span>`).join("")}
        </div>
        <div class="deal-price">
          <span>from</span>
          <strong>${deal.price || "TBD"}</strong>
          <span>per person twin share</span>
        </div>
        <div class="deal-actions">
          <a class="btn btn-small" href="./deal.html?deal=${encodeURIComponent(deal.title || "")}">View Deal</a>
          <a class="btn btn-small btn-outline" href="./deal.html?deal=${encodeURIComponent(deal.title || "")}">Compare</a>
        </div>
      </div>
    </article>
  `;

  const renderRecentCard = (deal) => `
    <article class="recent-card">
      <h3>${deal.title}</h3>
      <p>${deal.description || ""}</p>
    </article>
  `;

  const renderFilterButtons = () => {
    const defaultFilters = [
      { id: "all", label: "Popular" },
      { id: "culture", label: "Culture" },
      { id: "food", label: "Food" },
      { id: "small-group", label: "Small Group" },
      { id: "luxury", label: "Luxury" }
    ];
    const config = filtersData.length > 0 ? filtersData : defaultFilters;

    dealFiltersContainer.innerHTML = config
      .map(
        (filter) =>
          `<button class="filter ${filter.id === "all" ? "active" : ""}" data-filter="${filter.id}" type="button">${filter.label}</button>`
      )
      .join("");

    dealFilters = Array.from(dealFiltersContainer.querySelectorAll(".filter"));
  };

  const renderDestinationOptions = () => {
    if (!destinationOptions) {
      return;
    }

    const fallback = Array.from(
      new Set(
        dealsData
          .map((deal) => deal.meta || "")
          .join(",")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );

    const list = destinationsData.length > 0 ? destinationsData : fallback;
    destinationOptions.innerHTML = list.map((item) => `<option value="${item}"></option>`).join("");
  };

  const renderMonthOptions = () => {
    if (!monthSelect) {
      return;
    }

    const months = Array.from(new Set(dealsData.map((deal) => deal.month).filter(Boolean))).sort();
    monthSelect.innerHTML = `<option value="">Any month</option>${months
      .map((month) => `<option value="${month}">${month}</option>`)
      .join("")}`;
  };

  const getFilteredDeals = () => {
    const searchText = (destinationInput?.value || "").trim().toLowerCase();
    const selectedMonth = monthSelect?.value || "";

    return dealsData.filter((deal) => {
      const categories = Array.isArray(deal.category) ? deal.category : [];
      const categoryMatched = activeFilter === "all" || categories.includes(activeFilter);
      const monthMatched = !selectedMonth || deal.month === selectedMonth;
      const textSource = `${deal.keywords || ""} ${deal.meta || ""} ${deal.title || ""}`.toLowerCase();
      const keywordMatched = !searchText || textSource.includes(searchText);
      return categoryMatched && monthMatched && keywordMatched;
    });
  };

  const refreshDeals = () => {
    const filteredDeals = getFilteredDeals();

    dealGrid.innerHTML =
      filteredDeals.length === 0
        ? '<p class="deal-empty">No deals matched your filters. Try another destination or month.</p>'
        : filteredDeals.map((deal) => renderDealCard(deal)).join("");

    dealResultMeta.textContent = `Showing ${filteredDeals.length} featured deal${filteredDeals.length === 1 ? "" : "s"}`;
  };

  const bindFilterEvents = () => {
    dealFilters.forEach((button) => {
      button.addEventListener("click", () => {
        dealFilters.forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        activeFilter = button.dataset.filter || "all";
        refreshDeals();
      });
    });
  };

  const initializeDealsSection = async () => {
    const loaded = await loadDealsData();
    if (!loaded) {
      initializePaymentLinks();
      dealResultMeta.textContent =
        "Could not load deals data. Please refresh after deployment.";
      dealGrid.innerHTML =
        '<p class="deal-empty">Unable to load deal data right now. Please try again later.</p>';
      if (recentGrid) {
        recentGrid.innerHTML = "";
      }
      return;
    }

    renderFilterButtons();
    renderDestinationOptions();
    renderMonthOptions();
    initializePaymentLinks();
    bindFilterEvents();

    if (recentGrid) {
      const recentDeals = dealsData.filter((deal) => deal.recentViewed).slice(0, 2);
      recentGrid.innerHTML = recentDeals.map((deal) => renderRecentCard(deal)).join("");
    }

    refreshDeals();
  };

  if (dealSearchForm) {
    dealSearchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      refreshDeals();
    });
  }

  if (monthSelect) {
    monthSelect.addEventListener("change", () => {
      refreshDeals();
    });
  }

  if (clearSearchBtn && destinationInput && monthSelect) {
    clearSearchBtn.addEventListener("click", () => {
      destinationInput.value = "";
      monthSelect.value = "";
      activeFilter = "all";
      dealFilters.forEach((item) => {
        item.classList.toggle("active", item.dataset.filter === "all");
      });
      refreshDeals();
    });
  }

  initializeDealsSection();
}
