// Module 1: Farmer Dashboard Interactive Logic

document.addEventListener("DOMContentLoaded", () => {
  const profileForm = document.getElementById("profileForm");
  const saveBtn = document.getElementById("saveProfileBtn");
  const statusMsg = document.getElementById("profileStatusMsg");

  // Profile Form Save
  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
      statusMsg.textContent = "";

      const formData = new FormData(profileForm);
      const payload = Object.fromEntries(formData.entries());

      try {
        const res = await fetch("/api/farmer/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showToast("Farmer profile updated successfully!", "success");
          document.getElementById("displayFarmerName").textContent = data.farmer.name;
          document.getElementById("displayFarmerLoc").textContent = `${data.farmer.village}, ${data.farmer.district}`;
          document.getElementById("statFarmSize").textContent = `${data.farmer.farm_size_acres} Acres`;
        } else {
          showToast(data.error || "Failed to update profile", "error");
        }
      } catch (err) {
        showToast("Network error updating profile", "error");
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "💾 Save Profile Changes";
      }
    });
  }

  // Crop Pill Selection Toggle
  const cropBtns = document.querySelectorAll(".crop-pill-btn");
  cropBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.classList.toggle("selected");
      const selected = Array.from(document.querySelectorAll(".crop-pill-btn.selected"))
                           .map(b => b.dataset.crop);

      document.getElementById("statCropsCount").textContent = `${selected.length} Crops`;

      try {
        await fetch("/api/farmer/crops", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected_crops: selected })
        });
        showToast(`Crops updated: ${selected.join(", ")}`, "success");
      } catch (e) {
        console.error("Failed to sync crops", e);
      }
    });
  });
});
