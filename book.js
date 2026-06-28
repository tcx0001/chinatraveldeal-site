const bookDealBackLink = document.getElementById("bookDealBackLink");
const bookDealImage = document.getElementById("bookDealImage");
const bookTopline = document.getElementById("bookTopline");
const bookTitle = document.getElementById("bookTitle");
const bookMeta = document.getElementById("bookMeta");
const bookDescription = document.getElementById("bookDescription");
const bookPrice = document.getElementById("bookPrice");
const bookDepositLink = document.getElementById("bookDepositLink");
const bookFullLink = document.getElementById("bookFullLink");
const bookForm = document.getElementById("bookForm");
const bookDestinationInput = document.getElementById("bookDestinationInput");
const bookFormMessage = document.getElementById("bookFormMessage");

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
  if (!dealTitle) return deals[0];
  return deals.find((deal) => deal.title === dealTitle) || deals[0];
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

const renderBookingPage = (deal, payment) => {
  if (!deal) return;

  if (bookDealImage) {
    bookDealImage.src = deal.image;
    bookDealImage.alt = deal.imageAlt || deal.title;
  }
  if (bookTopline) bookTopline.textContent = deal.topline || "Deal";
  if (bookTitle) bookTitle.textContent = deal.title || "China Deal";
  if (bookMeta) bookMeta.textContent = deal.meta || "";
  if (bookDescription) bookDescription.textContent = deal.description || "";
  if (bookPrice) bookPrice.textContent = deal.price || "TBD";
  if (bookDestinationInput) bookDestinationInput.value = deal.title || "";

  const queryTitle = encodeURIComponent(deal.title || "");
  if (bookDealBackLink) {
    bookDealBackLink.href = `./deal.html?deal=${queryTitle}`;
  }

  if (bookDepositLink) {
    bookDepositLink.href = payment.depositUrl || "mailto:275364182@qq.com";
    bookDepositLink.target = payment.depositUrl ? "_blank" : "_self";
  }
  if (bookFullLink) {
    bookFullLink.href = payment.fullUrl || "mailto:275364182@qq.com";
    bookFullLink.target = payment.fullUrl ? "_blank" : "_self";
  }
};

const init = async () => {
  try {
    const response = await fetch("./deals.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load deals.json");
    const config = await response.json();
    const deals = Array.isArray(config.deals) ? config.deals : [];
    if (deals.length === 0) throw new Error("No deals found");
    backendConfig = config.backend || backendConfig;
    const paymentConfig = config.payment || {};
    const activeDeal = getDealFromUrl(deals);
    renderBookingPage(activeDeal, paymentConfig);
  } catch (error) {
    console.error(error);
    if (bookFormMessage) {
      bookFormMessage.textContent = "Could not load booking details.";
      bookFormMessage.style.color = "#b91c1c";
    }
  }
};

if (bookForm && bookFormMessage) {
  bookForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(bookForm);
    const payload = Object.fromEntries(formData.entries());
    const requiredFields = ["name", "email", "date", "travelers", "destination", "interest", "phone"];
    const missing = requiredFields.find((field) => !payload[field]);

    if (missing) {
      bookFormMessage.textContent = "Please complete all required fields.";
      bookFormMessage.style.color = "#b91c1c";
      return;
    }

    if (!isConfiguredEndpoint(backendConfig.bookingEndpoint)) {
      bookFormMessage.textContent = "Booking backend is not connected yet.";
      bookFormMessage.style.color = "#b45309";
      return;
    }

    try {
      bookFormMessage.textContent = "Submitting your booking...";
      bookFormMessage.style.color = "#1d4ed8";
      await postLeadData(backendConfig.bookingEndpoint, {
        type: "booking",
        source: "booking-step-page",
        payload
      });
      bookFormMessage.textContent = "Booking request submitted. Our team will contact you shortly.";
      bookFormMessage.style.color = "#166534";
      bookForm.reset();
    } catch (error) {
      console.error(error);
      bookFormMessage.textContent = "Could not submit booking right now. Please try again.";
      bookFormMessage.style.color = "#b91c1c";
    }
  });
}

init();
