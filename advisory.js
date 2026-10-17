// Module 5: Crop Advisory and Weather Client Logic

document.addEventListener("DOMContentLoaded", () => {
  // Crop Advisory Switcher
  const cropSelect = document.getElementById("advisoryCropSelect");
  if (cropSelect) {
    cropSelect.addEventListener("change", async () => {
      const crop = cropSelect.value;
      try {
        const res = await fetch(`/api/advisory/crop/${encodeURIComponent(crop)}`);
        const data = await res.json();
        if (data.success && data.advisory) {
          renderCropAdvisory(data.advisory);
        }
      } catch (err) {
        console.error("Failed to load crop advisory", err);
      }
    });
  }

  function renderCropAdvisory(adv) {
    document.getElementById("advCropTitle").textContent = adv.crop;
    document.getElementById("advCropTemp").textContent = `Ideal: ${adv.ideal_temp}`;
    document.getElementById("advSowing").innerHTML = `<b>Sowing Window:</b> ${escapeHtml(adv.sowing_window)}`;
    document.getElementById("advNutrient").textContent = adv.nutrient_schedule;
    document.getElementById("advAlerts").textContent = adv.common_alerts;

    const timeline = document.getElementById("advStagesList");
    if (timeline && adv.critical_growth_stages) {
      timeline.innerHTML = adv.critical_growth_stages.map(st => `
        <div class="stage-step">
          <div class="stage-dot"></div>
          <div class="stage-info">
            <strong>${escapeHtml(st.stage)} <small>(${escapeHtml(st.days)})</small></strong>
            <p>${escapeHtml(st.key_action)}</p>
          </div>
        </div>
      `).join("");
    }
  }

  // Irrigation Calculator Form
  const irrigForm = document.getElementById("irrigationForm");
  const resultCard = document.getElementById("irrigationResult");

  if (irrigForm) {
    irrigForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = Object.fromEntries(new FormData(irrigForm).entries());

      try {
        const res = await fetch("/api/advisory/irrigation-calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success && data.plan) {
          renderIrrigationResult(data.plan);
          showToast("Irrigation schedule updated", "success");
        }
      } catch (err) {
        showToast("Error calculating irrigation schedule", "error");
      }
    });
  }

  function renderIrrigationResult(plan) {
    const badge = document.getElementById("irrigStatusBadge");
    badge.textContent = plan.status;
    badge.className = "irrig-status-badge";
    if (plan.urgency === "critical") {
      badge.classList.add("irrig-critical");
    } else if (plan.urgency === "high") {
      badge.classList.add("irrig-high");
    } else {
      badge.classList.add("irrig-normal");
    }

    document.getElementById("irrigActionHeading").textContent = `${plan.crop} on ${plan.soil_type}`;
    document.getElementById("irrigActionDesc").textContent = plan.recommended_action;
    document.getElementById("irrigCountdown").textContent = `${plan.days_remaining} Days Left`;
    document.getElementById("irrigRunTime").textContent = plan.recommended_run_time;
    document.getElementById("irrigEfficiency").textContent = plan.system_efficiency;
    document.getElementById("irrigSaved").textContent = plan.water_saving_achieved;
    document.getElementById("irrigTip").textContent = `💡 ${plan.conservation_tip}`;

    resultCard.style.display = "block";
    resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[c]));
  }
});
