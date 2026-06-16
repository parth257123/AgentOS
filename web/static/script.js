document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chat-form");
    const promptInput = document.getElementById("prompt-input");
    const sendBtn = document.getElementById("send-btn");
    const chatHistory = document.getElementById("chat-history");
    
    // Telemetry Elements
    const totalCostEl = document.getElementById("total-cost");
    const healthPercentEl = document.getElementById("health-percent");
    const healthStatusEl = document.getElementById("health-status");
    const healthBarEl = document.getElementById("health-bar");
    const tokenCountEl = document.getElementById("token-count");
    
    function appendMessage(role, content, isHtml=false) {
        const msgDiv = document.createElement("div");
        msgDiv.className = `message ${role}-message`;
        
        const contentDiv = document.createElement("div");
        contentDiv.className = "message-content";
        
        if (isHtml) {
            contentDiv.innerHTML = content;
        } else {
            contentDiv.textContent = content;
        }
        
        msgDiv.appendChild(contentDiv);
        chatHistory.appendChild(msgDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        return contentDiv;
    }
    
    function updateTelemetry(telemetry) {
        if (!telemetry) return;
        
        // Update Cost
        totalCostEl.textContent = parseFloat(telemetry.total_cost).toFixed(6);
        
        // Update Health
        const hp = telemetry.health_percent;
        healthPercentEl.textContent = `${hp}%`;
        healthBarEl.style.width = `${hp}%`;
        tokenCountEl.textContent = `${telemetry.manager_tokens} Tokens`;
        
        const status = telemetry.health_status.toUpperCase();
        healthStatusEl.textContent = status;
        
        // Update Classes
        healthStatusEl.className = "status-badge";
        if (status === "HEALTHY") healthStatusEl.classList.add("healthy");
        else if (status === "MODERATE") healthStatusEl.classList.add("moderate");
        else if (status === "WARNING") healthStatusEl.classList.add("warning");
        else if (status === "CRITICAL") healthStatusEl.classList.add("critical");
    }

    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const prompt = promptInput.value.trim();
        if (!prompt) return;
        
        // Add User Message
        appendMessage("user", prompt);
        promptInput.value = "";
        
        // Disable input
        sendBtn.disabled = true;
        promptInput.disabled = true;
        
        // Loading Message
        const loadingDiv = appendMessage("agent", "Mesh Executing", false);
        loadingDiv.classList.add("loading-dots");
        
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });
            
            const data = await response.json();
            
            // Remove loading
            loadingDiv.parentElement.remove();
            
            if (data.error) {
                appendMessage("system", `Error: ${data.error}`);
            } else {
                appendMessage("agent", data.result);
                updateTelemetry(data.telemetry);
            }
            
        } catch (err) {
            loadingDiv.parentElement.remove();
            appendMessage("system", "Network Error. Could not reach Mesh.");
        } finally {
            sendBtn.disabled = false;
            promptInput.disabled = false;
            promptInput.focus();
        }
    });
});
