// Module 2: AI Plant Disease Detection (CNN Inference Client)

document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("leafFileInput");
  const dropPrompt = document.getElementById("dropzonePrompt");
  const previewWrapper = document.getElementById("previewWrapper");
  const imgPreview = document.getElementById("imagePreview");
  const removeBtn = document.getElementById("btnRemovePreview");
  const analyzeBtn = document.getElementById("btnAnalyzeLeaf");

  const placeholderState = document.getElementById("diagnosisPlaceholder");
  const loadingState = document.getElementById("diagnosisLoading");
  const resultsCard = document.getElementById("diagnosisResults");

  let currentFile = null;
  let currentSample = null;

  // Handle Drag & Drop
  if (dropZone) {
    ["dragenter", "dragover"].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
      });
    });
    ["dragleave", "drop"].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
      });
    });
    dropZone.addEventListener("drop", (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelection(e.dataTransfer.files[0]);
      }
    });
  }

  // Handle File Input Change
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelection(e.target.files[0]);
      }
    });
  }

  function handleFileSelection(file) {
    currentFile = file;
    currentSample = null;
    document.querySelectorAll(".sample-leaf-btn").forEach(b => b.classList.remove("active"));

    const reader = new FileReader();
    reader.onload = (e) => {
      imgPreview.src = e.target.result;
      dropPrompt.style.display = "none";
      previewWrapper.style.display = "flex";
      analyzeBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  // Remove preview
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      currentFile = null;
      currentSample = null;
      fileInput.value = "";
      imgPreview.src = "";
      dropPrompt.style.display = "block";
      previewWrapper.style.display = "none";
      analyzeBtn.disabled = true;
      document.querySelectorAll(".sample-leaf-btn").forEach(b => b.classList.remove("active"));
    });
  }

  // Handle Sample Leaves Clicks
  const sampleBtns = document.querySelectorAll(".sample-leaf-btn");
  sampleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sampleBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      currentSample = btn.dataset.sample;
      currentFile = null;
      if (fileInput) fileInput.value = "";

      const sampleImg = btn.querySelector("img");
      if (sampleImg) {
        imgPreview.src = sampleImg.src;
        dropPrompt.style.display = "none";
        previewWrapper.style.display = "flex";
        analyzeBtn.disabled = false;
      }

      // Auto-trigger analysis for instant demo delight
      runCNNAnalysis();
    });
  });

  // Analyze Button Click
  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", () => {
      runCNNAnalysis();
    });
  }

  async function runCNNAnalysis() {
    if (!currentFile && !currentSample) return;

    placeholderState.style.display = "none";
    resultsCard.style.display = "none";
    loadingState.style.display = "flex";
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing leaf image with CNN...";

    try {
      let res;
      if (currentSample) {
        res = await fetch("/api/disease/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sample: currentSample })
        });
      } else {
        const formData = new FormData();
        formData.append("image", currentFile);
        res = await fetch("/api/disease/analyze", {
          method: "POST",
          body: formData
        });
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Analysis failed");
      }

      displayDiagnosis(data);
      showToast(`Diagnosis: ${data.disease} (${data.confidence}%)`, "success");
    } catch (err) {
      showToast(err.message, "error");
      placeholderState.style.display = "block";
    } finally {
      loadingState.style.display = "none";
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = "🔍 Analyze Leaf with CNN Model";
    }
  }

  function displayDiagnosis(data) {
    document.getElementById("diagCrop").textContent = data.crop;
    document.getElementById("diagDisease").textContent = data.disease;
    document.getElementById("diagPathogen").textContent = `Pathogen: ${data.pathogen}`;
    document.getElementById("diagConfidence").textContent = `${data.confidence}%`;

    const sevPill = document.getElementById("diagSeverity");
    sevPill.textContent = data.severity;
    sevPill.className = "severity-pill";
    if (data.is_healthy) {
      sevPill.classList.add("sev-healthy");
    } else if (data.severity.toLowerCase().includes("severe")) {
      sevPill.classList.add("sev-severe");
    } else {
      sevPill.classList.add("sev-moderate");
    }

    document.getElementById("diagSymptoms").textContent = data.symptoms;
    document.getElementById("diagOrganic").textContent = data.organic_treatment;
    document.getElementById("diagChemical").textContent = data.chemical_treatment;
    document.getElementById("diagPrevention").textContent = data.preventive_measures;

    // Render top predictions breakdown
    const listContainer = document.getElementById("predBarsList");
    listContainer.innerHTML = "";
    if (data.top_predictions && data.top_predictions.length > 0) {
      data.top_predictions.forEach(p => {
        const barItem = document.createElement("div");
        barItem.className = "pred-bar-item";
        barItem.innerHTML = `
          <div class="pred-bar-labels">
            <span>${escapeHtml(p.crop)} — ${escapeHtml(p.disease)}</span>
            <b>${p.confidence}%</b>
          </div>
          <div class="pred-bar-track">
            <div class="pred-bar-fill" style="width: ${Math.min(100, p.confidence)}%"></div>
          </div>
        `;
        listContainer.appendChild(barItem);
      });
      document.getElementById("topPredSection").style.display = "block";
    } else {
      document.getElementById("topPredSection").style.display = "none";
    }

    resultsCard.style.display = "block";
    resultsCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[c]));
  }
});
