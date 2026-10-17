// Module 4: Farmer Market Connect Client Logic

document.addEventListener("DOMContentLoaded", () => {
  // Tab Switching
  const tabBtns = document.querySelectorAll(".market-tabs .tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => (p.style.display = "none"));

      btn.classList.add("active");
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.style.display = "block";
    });
  });

  // Modals
  const addModal = document.getElementById("addListingModal");
  const openAddBtn = document.getElementById("btnOpenAddListing");
  const closeAddBtn = document.getElementById("btnCloseAddModal");
  const cancelAddBtn = document.getElementById("btnCancelAdd");
  const addListingForm = document.getElementById("addListingForm");

  if (openAddBtn) openAddBtn.addEventListener("click", () => (addModal.style.display = "flex"));
  if (closeAddBtn) closeAddBtn.addEventListener("click", () => (addModal.style.display = "none"));
  if (cancelAddBtn) cancelAddBtn.addEventListener("click", () => (addModal.style.display = "none"));

  // Add Listing Form Submission
  if (addListingForm) {
    addListingForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(addListingForm);
      const payload = Object.fromEntries(formData.entries());
      payload.organic = formData.get("organic") === "true";

      try {
        const res = await fetch("/api/market/add-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message, "success");
          addModal.style.display = "none";
          addListingForm.reset();
          reloadListings();
        } else {
          showToast(data.error || "Failed to add listing", "error");
        }
      } catch (err) {
        showToast("Error creating listing", "error");
      }
    });
  }

  // Filter Handling
  const cropFilter = document.getElementById("cropFilter");
  const maxPriceFilter = document.getElementById("maxPriceFilter");
  const applyFilterBtn = document.getElementById("btnApplyFilter");
  const resetFilterBtn = document.getElementById("btnResetFilter");

  if (applyFilterBtn) {
    applyFilterBtn.addEventListener("click", () => {
      reloadListings();
    });
  }

  if (resetFilterBtn) {
    resetFilterBtn.addEventListener("click", () => {
      if (cropFilter) cropFilter.value = "All";
      if (maxPriceFilter) maxPriceFilter.value = "";
      reloadListings();
    });
  }

  async function reloadListings() {
    const crop = cropFilter ? cropFilter.value : "All";
    const maxPrice = maxPriceFilter ? maxPriceFilter.value : "";
    const params = new URLSearchParams();
    if (crop !== "All") params.append("crop", crop);
    if (maxPrice) params.append("max_price", maxPrice);

    try {
      const res = await fetch(`/api/market/listings?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        renderListings(data.listings);
        const countSpan = document.getElementById("listingsCount");
        if (countSpan) countSpan.textContent = data.listings.length;
      }
    } catch (err) {
      console.error("Failed to load listings", err);
    }
  }

  function renderListings(items) {
    const container = document.getElementById("listingsContainer");
    if (!container) return;
    if (items.length === 0) {
      container.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><h4>No listings match your filter criteria.</h4></div>';
      return;
    }
    container.innerHTML = items.map(item => `
      <div class="listing-card">
        <div class="listing-card-top">
          <span class="crop-tag">${escapeHtml(item.crop)}</span>
          ${item.organic ? '<span class="badge organic">🌿 Organic</span>' : ''}
          <span class="listing-date">${escapeHtml(item.created_at)}</span>
        </div>
        <h3 class="listing-variety">${escapeHtml(item.variety)}</h3>
        <div class="listing-meta">
          <div><strong>${item.quantity_quintals}</strong> Quintals Available</div>
          <div>📍 ${escapeHtml(item.location)}</div>
        </div>
        <div class="listing-price-box">
          <span class="price-val">₹${item.price_per_quintal}</span>
          <span class="price-unit">/ quintal</span>
        </div>
        <div class="farmer-info-row">
          <span>👨‍🌾 ${escapeHtml(item.farmer_name)}</span>
          <small>${escapeHtml(item.phone)}</small>
        </div>
        <button type="button" class="btn btn-primary full-width btn-order-trigger"
                data-id="${item.id}"
                data-crop="${escapeHtml(item.crop)}"
                data-farmer="${escapeHtml(item.farmer_name)}"
                data-price="${item.price_per_quintal}"
                data-maxqty="${item.quantity_quintals}">
          🤝 Buy / Inquire Order
        </button>
      </div>
    `).join("");
  }

  // Order Placement Modal
  const orderModal = document.getElementById("orderModal");
  const closeOrderBtn = document.getElementById("btnCloseOrderModal");
  const cancelOrderBtn = document.getElementById("btnCancelOrder");
  const orderForm = document.getElementById("orderForm");
  const qtyInput = document.getElementById("orderQuantityInput");
  const totalDisplay = document.getElementById("orderTotalDisplay");

  let currentPrice = 0;

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-order-trigger");
    if (btn) {
      document.getElementById("orderListingId").value = btn.dataset.id;
      document.getElementById("orderCropName").textContent = btn.dataset.crop;
      document.getElementById("orderPricePerQtl").textContent = `₹${btn.dataset.price}`;
      document.getElementById("orderFarmerName").textContent = btn.dataset.farmer;
      currentPrice = parseFloat(btn.dataset.price) || 0;

      qtyInput.max = btn.dataset.maxqty;
      qtyInput.value = Math.min(25, btn.dataset.maxqty);
      updateTotal();

      orderModal.style.display = "flex";
    }
  });

  if (closeOrderBtn) closeOrderBtn.addEventListener("click", () => (orderModal.style.display = "none"));
  if (cancelOrderBtn) cancelOrderBtn.addEventListener("click", () => (orderModal.style.display = "none"));

  if (qtyInput) {
    qtyInput.addEventListener("input", updateTotal);
  }

  function updateTotal() {
    const q = parseFloat(qtyInput.value) || 0;
    const total = q * currentPrice;
    totalDisplay.value = `₹${total.toLocaleString("en-IN")}`;
  }

  if (orderForm) {
    orderForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = Object.fromEntries(new FormData(orderForm).entries());

      try {
        const res = await fetch("/api/market/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Order Confirmed! Ref: ${data.order.order_id}`, "success");
          orderModal.style.display = "none";
          orderForm.reset();
          reloadListings();
        } else {
          showToast(data.error || "Order placement failed", "error");
        }
      } catch (err) {
        showToast("Error placing order", "error");
      }
    });
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[c]));
  }
});
