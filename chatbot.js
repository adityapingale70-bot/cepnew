// Module 3: Farmer Chatbot Client Interface

document.addEventListener("DOMContentLoaded", () => {
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatMessages = document.getElementById("chatMessages");
  const sendBtn = document.getElementById("btnSendMsg");
  const chipsRow = document.getElementById("quickChipsRow");

  const chatHistory = [];

  // Submit User Message
  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      sendMessage(text);
      chatInput.value = "";
    });
  }

  // Click on any Suggestion Chip
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip-btn, .chip-sm");
    if (chip && chip.dataset.question) {
      sendMessage(chip.dataset.question);
    }
  });

  async function sendMessage(text) {
    appendUserMessage(text);
    chatHistory.push({ role: "user", content: text });

    const typingIndicator = appendTypingIndicator();
    chatMessages.scrollTop = chatMessages.scrollHeight;

    sendBtn.disabled = true;

    try {
      const res = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: chatHistory.slice(-6)
        })
      });

      const data = await res.json();
      typingIndicator.remove();

      if (data.success && data.reply) {
        appendBotMessage(data.reply);
        chatHistory.push({ role: "assistant", content: data.reply.answer });
        updateChips(data.reply.suggested_queries);
      } else {
        appendErrorMessage("Could not process your question. Please try again.");
      }
    } catch (err) {
      typingIndicator.remove();
      appendErrorMessage("Network error connecting to Kisan AI.");
    } finally {
      sendBtn.disabled = false;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  function appendUserMessage(text) {
    const msgDiv = document.createElement("div");
    msgDiv.className = "message user-message";
    msgDiv.innerHTML = `
      <div class="msg-content">
        <div class="msg-bubble">${escapeHtml(text)}</div>
        <span class="msg-time">${getTime()}</span>
      </div>
      <div class="msg-avatar user-avatar">👨‍🌾</div>
    `;
    chatMessages.appendChild(msgDiv);
  }

  function appendBotMessage(reply) {
    const msgDiv = document.createElement("div");
    msgDiv.className = "message bot-message";

    let tipsHtml = "";
    if (reply.quick_tips && reply.quick_tips.length > 0) {
      tipsHtml = `
        <div class="msg-tips">
          <b>Key Agronomic Points:</b>
          <ul>${reply.quick_tips.map(t => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
        </div>
      `;
    }

    const formattedAnswer = escapeHtml(reply.answer).replace(/\n/g, "<br>");

    msgDiv.innerHTML = `
      <div class="msg-avatar">🌱</div>
      <div class="msg-content">
        <div class="category-tag">${escapeHtml(reply.category || "Agricultural Advice")}</div>
        <div class="msg-bubble">
          <p>${formattedAnswer}</p>
          ${tipsHtml}
        </div>
        <span class="msg-time">${getTime()}</span>
      </div>
    `;
    chatMessages.appendChild(msgDiv);
  }

  function appendTypingIndicator() {
    const ind = document.createElement("div");
    ind.className = "message bot-message typing-indicator-msg";
    ind.innerHTML = `
      <div class="msg-avatar">🌱</div>
      <div class="msg-content">
        <div class="typing-bubble">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    chatMessages.appendChild(ind);
    return ind;
  }

  function appendErrorMessage(errorText) {
    const msgDiv = document.createElement("div");
    msgDiv.className = "message bot-message";
    msgDiv.innerHTML = `
      <div class="msg-avatar">⚠️</div>
      <div class="msg-content">
        <div class="msg-bubble error-bubble">
          <p>${escapeHtml(errorText)}</p>
        </div>
      </div>
    `;
    chatMessages.appendChild(msgDiv);
  }

  function updateChips(queries) {
    if (!chipsRow || !queries || queries.length === 0) return;
    chipsRow.innerHTML = '<span class="chips-label">Related Questions:</span>';
    queries.forEach(q => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip-sm";
      btn.dataset.question = q;
      btn.textContent = q;
      chipsRow.appendChild(btn);
    });
  }

  function getTime() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[c]));
  }
});
