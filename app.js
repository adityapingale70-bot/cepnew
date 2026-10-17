const crops = ["Rice","Wheat","Cotton","Tomato","Potato","Soybean","Onion","Maize","Grapes","Banana"];

document.querySelectorAll('select[name="crop"]').forEach(select => {
  crops.forEach(crop => {
    const option = document.createElement("option");
    option.value = crop;
    option.textContent = crop;
    select.appendChild(option);
  });
});

function formData(form) {
  const result = {};
  new FormData(form).forEach((value, key) => {
    result[key] = value === "" ? "" : Number.isNaN(Number(value)) ? value : Number(value);
  });
  return result;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[char]));
}

async function submitTool(formId, resultId, endpoint, render) {
  const form = document.getElementById(formId);
  const result = document.getElementById(resultId);
  if (!form || !result) return;

  const button = form.querySelector('button[type="submit"]');
  if (button) {
    button.dataset.original = button.textContent;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (button) {
      button.disabled = true;
      button.textContent = "Processing...";
    }
    result.textContent = "Calculating demo result...";
    result.classList.remove("has-result");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(formData(form))
      });

      let data = {};
      try {
        data = await response.json();
      } catch (parseErr) {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      result.innerHTML = render(data);
      result.classList.add("has-result");
    } catch (error) {
      result.innerHTML = `<span style="color:#b91c1c;font-weight:600">⚠️ ${escapeHtml(error.message)}</span><br><small style="color:#64748b">Please check that the server is running properly.</small>`;
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = button.dataset.original || "Run again ↗";
      }
    }
  });
}

submitTool("yieldForm", "yieldResult", "/api/yield", d =>
  `<strong>Estimated demo yield: ${escapeHtml(d.estimated_yield_tonnes_per_hectare)} tonnes/hectare</strong><br>` +
  `Estimated total for ${escapeHtml(d.area_hectares)} hectare(s): <strong>${escapeHtml(d.estimated_total_tonnes)} tonnes</strong><br>` +
  `<small>${escapeHtml(d.note)}</small>`
);

submitTool("diseaseForm", "diseaseResult", "/api/disease-risk", d => {
  const isHigh = d.risk === "Higher risk";
  const badgeColor = isHigh ? "#dc2626" : "#16a34a";
  const confText = d.model_confidence ? ` (Confidence: ${escapeHtml(d.model_confidence)}%)` : "";
  return `<strong>Screening result: <span style="color:${badgeColor}">${escapeHtml(d.risk)}</span>${confText}</strong><br>` +
         `${escapeHtml(d.advice)}<br><small>${escapeHtml(d.note)}</small>`;
});

submitTool("fertilizerForm", "fertilizerResult", "/api/fertilizer", d =>
  `<strong>Soil reading observations:</strong><ul>` +
  (d.observations || []).map(item => `<li>${escapeHtml(item)}</li>`).join("") +
  `</ul><p style="margin:6px 0">${escapeHtml(d.recommendation)}</p><small>${escapeHtml(d.note)}</small>`
);

submitTool("weatherForm", "weatherResult", "/api/weather-trend", d =>
  `<strong>Illustrative rainfall trend (7-day):</strong><br>` +
  (d.days || []).map((day, i) => `<b>${escapeHtml(day)}:</b> ${escapeHtml(d.rainfall_trend_mm[i])} mm`).join(" · ") +
  `<br><small>${escapeHtml(d.note)}</small>`
);
