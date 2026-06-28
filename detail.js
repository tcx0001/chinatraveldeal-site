const mainDealImage = document.getElementById("mainDealImage");
const detailThumbGrid = document.getElementById("detailThumbGrid");
const crumbTitle = document.getElementById("crumbTitle");
const detailTopline = document.getElementById("detailTopline");
const detailTitle = document.getElementById("detailTitle");
const detailMeta = document.getElementById("detailMeta");
const detailDescription = document.getElementById("detailDescription");
const detailDateLine = document.getElementById("detailDateLine");
const detailIncludes = document.getElementById("detailIncludes");
const detailPrice = document.getElementById("detailPrice");
const detailSaving = document.getElementById("detailSaving");
const detailDepositLink = document.getElementById("detailDepositLink");
const detailFullLink = document.getElementById("detailFullLink");
const detailBookingForm = document.getElementById("detailBookingForm");
const detailDestinationInput = document.getElementById("detailDestinationInput");
const detailFormMessage = document.getElementById("detailFormMessage");
const highlightGrid = document.getElementById("highlightGrid");
const itineraryList = document.getElementById("itineraryList");
const inclusionsAccordion = document.getElementById("inclusionsAccordion");
const itineraryExpandAll = document.getElementById("itineraryExpandAll");
const faqList = document.getElementById("faqList");
const bottomDepositLink = document.getElementById("bottomDepositLink");
const bottomFullLink = document.getElementById("bottomFullLink");
const continueBookingLink = document.getElementById("continueBookingLink");
const bottomContinueBookingLink = document.getElementById("bottomContinueBookingLink");

let backendConfig = {
  bookingEndpoint: ""
};

const isConfiguredEndpoint = (value) =>
  typeof value === "string" &&
  value.startsWith("https://") &&
  !value.includes("YOUR_PROJECT_REF");

const getDealFromUrl = (deals) => {
  const query = new URLSearchParams(window.location.search);
  const dealTitle = query.get("deal");
  if (!dealTitle) {
    return deals[0];
  }
  return deals.find((deal) => deal.title === dealTitle) || deals[0];
};

const renderThumbs = (deals, activeDeal) => {
  if (!detailThumbGrid) return;
  const fallback = deals.filter((deal) => deal.title !== activeDeal.title).slice(0, 4);
  const list = [activeDeal, ...fallback].slice(0, 4);
  detailThumbGrid.innerHTML = list
    .map(
      (deal) => `
      <figure>
        <img src="${deal.image}" alt="${deal.imageAlt || deal.title}" loading="lazy" decoding="async" />
      </figure>
    `
    )
    .join("");
};

const parseCityList = (metaText) =>
  (metaText || "")
    .split("|")[0]
    .split(",")
    .map((city) => city.trim())
    .filter(Boolean);

const renderHighlights = (deal) => {
  if (!highlightGrid) return;
  const cities = parseCityList(deal.meta);
  const tags = Array.isArray(deal.tags) ? deal.tags : [];
  const cards = [
    {
      title: "Destinations",
      body: cities.length > 0 ? cities.join(", ") : "Multi-city China route"
    },
    {
      title: "Trip style",
      body: tags.length > 0 ? tags.join(" / ") : "Guided package"
    },
    {
      title: "Travel month",
      body: deal.month || "Flexible departures"
    },
    {
      title: "Best for",
      body: deal.keywords ? deal.keywords.split(" ").slice(0, 6).join(", ") : "Culture and food travelers"
    }
  ];

  highlightGrid.innerHTML = cards
    .map(
      (card) => `
      <article class="highlight-item">
        <h3>${card.title}</h3>
        <p>${card.body}</p>
      </article>
    `
    )
    .join("");
};

const renderItinerary = (deal) => {
  if (!itineraryList) return;
  const cities = parseCityList(deal.meta);
  const dayStops = cities.length > 0 ? cities : ["Beijing", "Xi'an", "Shanghai", "Suzhou"];
  const items = dayStops.map((city, index) => ({
    title: `Day ${index + 1}`,
    subtitle: `${city} guided touring and local experiences`,
    content:
      index === 0
        ? `Arrive in ${city}, hotel check-in, and evening orientation with your tour host.`
        : `Explore ${city} highlights, curated culture stops, and regional dining experiences.`
  }));
  items.push({
    title: `Day ${items.length + 1}`,
    subtitle: "Departure day",
    content: "Hotel checkout, airport transfer, and onward travel support."
  });

  renderAccordion(itineraryList, items, "itinerary");

  if (itineraryExpandAll) {
    itineraryExpandAll.onclick = () => {
      const cards = itineraryList.querySelectorAll(".accordion-item");
      const shouldOpen = Array.from(cards).some((card) => !card.classList.contains("is-open"));
      cards.forEach((card) => {
        card.classList.toggle("is-open", shouldOpen);
      });
      itineraryExpandAll.textContent = shouldOpen ? "Collapse all" : "Expand all";
    };
  }
};

const renderInclusions = (deal) => {
  if (!inclusionsAccordion) return;
  const includeLine = deal.includes || "";
  const parsedIncludes = includeLine
    .replace(/^Includes:\s*/i, "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const includeItems = parsedIncludes.length > 0 ? parsedIncludes : ["Hotels", "Guides", "Transfers"];
  const categories = [
    {
      title: "Highlights",
      content: deal.description || "Major landmarks, curated culture, and local experiences."
    },
    {
      title: "Flights",
      content: "International and domestic flight arrangements can be included depending on your package."
    },
    {
      title: "Accommodation",
      content: includeItems.find((item) => item.toLowerCase().includes("hotel"))
        ? includeItems.find((item) => item.toLowerCase().includes("hotel"))
        : "Quality stays selected for location, comfort, and tour convenience."
    },
    {
      title: "Dining",
      content: "Daily breakfast plus selected regional dining experiences based on itinerary."
    },
    {
      title: "Essentials",
      content: "English-speaking local hosts, pre-departure support, and service hotlines."
    },
    {
      title: "Transport",
      content: includeItems.find((item) => item.toLowerCase().includes("rail")) || "High-speed rail and city transport as per itinerary."
    },
    {
      title: "Transfers",
      content: includeItems.find((item) => item.toLowerCase().includes("transfer")) || "Airport and inter-city transfer coordination."
    },
    {
      title: "Upgrades Available",
      content: "Private tours, premium hotels, and additional culinary/culture add-ons are available."
    }
  ];

  renderAccordion(
    inclusionsAccordion,
    categories.map((item) => ({
      title: item.title,
      content: item.content
    }))
  );
};

const renderAccordion = (container, items, mode = "default") => {
  container.innerHTML = items
    .map((item, index) => {
      const isOpen = index === 0 ? "is-open" : "";
      if (mode === "itinerary") {
        return `
          <article class="accordion-item ${isOpen}">
            <button class="accordion-trigger itinerary-trigger" type="button">
              <span class="itinerary-day-badge">${item.title}</span>
              <span class="itinerary-day-title">${item.subtitle || ""}</span>
              <span class="accordion-icon">▾</span>
            </button>
            <div class="accordion-panel">
              <p>${item.content}</p>
            </div>
          </article>
        `;
      }
      return `
        <article class="accordion-item ${isOpen}">
          <button class="accordion-trigger" type="button">
            <span>${item.title}</span>
            <span class="accordion-icon">▾</span>
          </button>
          <div class="accordion-panel">
            <p>${item.content}</p>
          </div>
        </article>
      `;
    })
    .join("");

  container.querySelectorAll(".accordion-trigger").forEach((button) => {
    button.addEventListener("click", () => {
      const parent = button.closest(".accordion-item");
      if (!parent) return;
      parent.classList.toggle("is-open");
    });
  });
};

const renderFaq = (deal) => {
  if (!faqList) return;
  const faqs = [
    {
      q: "Can I choose custom departure dates?",
      a: deal.dateLine || "Yes. Our team can propose suitable departures based on your schedule."
    },
    {
      q: "How does payment work?",
      a: "You can secure your seat with a deposit, then complete the balance before departure."
    },
    {
      q: "Do you provide visa and pre-trip support?",
      a: "Yes. We provide checklist guidance and pre-departure support for U.S. travelers."
    },
    {
      q: "Can I adjust hotels or room types?",
      a: "Yes. Add your preferences in the booking notes and we will quote tailored options."
    }
  ];

  faqList.innerHTML = faqs
    .map(
      (item, index) => `
      <article class="faq-item ${index === 0 ? "is-open" : ""}">
        <button class="faq-question" type="button">${item.q}</button>
        <p class="faq-answer">${item.a}</p>
      </article>
    `
    )
    .join("");

  faqList.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const parent = button.closest(".faq-item");
      if (!parent) return;
      parent.classList.toggle("is-open");
    });
  });
};

const renderDeal = (deal, paymentConfig, deals) => {
  if (!deal) return;
  if (mainDealImage) {
    mainDealImage.src = deal.image;
    mainDealImage.alt = deal.imageAlt || deal.title;
  }
  if (crumbTitle) crumbTitle.textContent = deal.title;
  if (detailTopline) detailTopline.textContent = deal.topline || "Deal";
  if (detailTitle) detailTitle.textContent = deal.title;
  if (detailMeta) detailMeta.textContent = deal.meta || "";
  if (detailDescription) detailDescription.textContent = deal.description || "";
  if (detailDateLine) detailDateLine.textContent = deal.dateLine || "Contact us for latest departures.";
  if (detailIncludes) detailIncludes.textContent = deal.includes || "Inclusions available on request.";
  if (detailPrice) detailPrice.textContent = deal.price || "TBD";
  if (detailSaving) detailSaving.textContent = deal.saveValue || "";
  if (detailDestinationInput) detailDestinationInput.value = deal.title;

  if (detailDepositLink) {
    detailDepositLink.href = paymentConfig.depositUrl || "mailto:275364182@qq.com";
    detailDepositLink.target = paymentConfig.depositUrl ? "_blank" : "_self";
  }
  if (detailFullLink) {
    detailFullLink.href = paymentConfig.fullUrl || "mailto:275364182@qq.com";
    detailFullLink.target = paymentConfig.fullUrl ? "_blank" : "_self";
  }

  if (bottomDepositLink) {
    bottomDepositLink.href = detailDepositLink?.href || "mailto:275364182@qq.com";
    bottomDepositLink.target = detailDepositLink?.target || "_self";
  }
  if (bottomFullLink) {
    bottomFullLink.href = detailFullLink?.href || "mailto:275364182@qq.com";
    bottomFullLink.target = detailFullLink?.target || "_self";
  }
  const bookingPageUrl = `./book.html?deal=${encodeURIComponent(deal.title || "")}`;
  if (continueBookingLink) {
    continueBookingLink.href = bookingPageUrl;
  }
  if (bottomContinueBookingLink) {
    bottomContinueBookingLink.href = bookingPageUrl;
  }

  renderThumbs(deals, deal);
  renderHighlights(deal);
  renderItinerary(deal);
  renderInclusions(deal);
  renderFaq(deal);
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

const init = async () => {
  try {
    const response = await fetch("./deals.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load deals.json");
    const config = await response.json();
    const deals = Array.isArray(config.deals) ? config.deals : [];
    if (deals.length === 0) throw new Error("No deals found");

    const paymentConfig = config.payment || {};
    backendConfig = config.backend || backendConfig;
    const activeDeal = getDealFromUrl(deals);
    renderDeal(activeDeal, paymentConfig, deals);
  } catch (error) {
    console.error(error);
    if (detailFormMessage) {
      detailFormMessage.textContent = "Could not load deal details.";
      detailFormMessage.style.color = "#b91c1c";
    }
  }
};

if (detailBookingForm && detailFormMessage) {
  detailBookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(detailBookingForm);
    const payload = Object.fromEntries(formData.entries());
    const requiredFields = ["name", "email", "date", "travelers", "destination", "interest"];
    const missing = requiredFields.find((field) => !payload[field]);

    if (missing) {
      detailFormMessage.textContent = "Please complete all required fields.";
      detailFormMessage.style.color = "#b91c1c";
      return;
    }

    if (!isConfiguredEndpoint(backendConfig.bookingEndpoint)) {
      detailFormMessage.textContent = "Booking backend is not connected yet.";
      detailFormMessage.style.color = "#b45309";
      return;
    }

    try {
      detailFormMessage.textContent = "Submitting your booking request...";
      detailFormMessage.style.color = "#1d4ed8";
      await postLeadData(backendConfig.bookingEndpoint, {
        type: "booking",
        source: "deal-page-booking-form",
        payload
      });
      detailFormMessage.textContent =
        "Request submitted successfully. Our team will contact you shortly.";
      detailFormMessage.style.color = "#166534";
      detailBookingForm.reset();
    } catch (error) {
      console.error(error);
      detailFormMessage.textContent = "Could not submit request right now. Please try again.";
      detailFormMessage.style.color = "#b91c1c";
    }
  });
}

init();
