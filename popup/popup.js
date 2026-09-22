(() => {
    // Only run on ChatGPT for now
    if (!window.location.hostname.includes("chatgpt.com")) {
        return;
    }

    // Prevent duplicate buttons
    if (document.getElementById("llm-capsule-floating-button")) {
        return;
    }

    const button = document.createElement("button");

    button.id = "llm-capsule-floating-button";
    button.type = "button";
    button.textContent = "💊";

    Object.assign(button.style, {
        position: "fixed",
        right: "24px",
        bottom: "90px",
        width: "44px",
        height: "44px",
        border: "none",
        borderRadius: "50%",
        background: "#6c4cff",
        color: "#ffffff",
        fontSize: "20px",
        cursor: "pointer",
        zIndex: "999999",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 18px rgba(0, 0, 0, 0.35)",
        transition: "transform 0.15s ease, background 0.15s ease"
    });

    button.addEventListener("mouseenter", () => {
        button.style.transform = "scale(1.08)";
        button.style.background = "#7b61ff";
    });

    button.addEventListener("mouseleave", () => {
        button.style.transform = "scale(1)";
        button.style.background = "#6c4cff";
    });

    button.addEventListener("click", () => {
        console.log("LLM Capsule button clicked");
    });

    document.body.appendChild(button);
})();