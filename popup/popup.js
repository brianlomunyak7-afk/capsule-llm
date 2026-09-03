const capsuleButton = document.getElementById("capsuleButton");
const viewButton = document.getElementById("viewButton");
const exportButton = document.getElementById("exportButton");
const capsuleOutput = document.getElementById("capsuleOutput");


// CREATE CAPSULE
capsuleButton.addEventListener("click", async () => {
    capsuleButton.textContent = "Capturing...";

    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        if (!tab || !tab.id) {
            throw new Error("No active tab found");
        }

        const response = await chrome.tabs.sendMessage(tab.id, {
            action: "capturePage"
        });

        if (!response || !response.success) {
            throw new Error("No capture response");
        }

        const capsule = {
            app: "ChatGPT",
            title: response.title || tab.title || "Untitled Conversation",
            createdAt: new Date().toISOString(),
            sourceUrl: tab.url,
            messages: response.messages || [
                {
                    role: "unknown",
                    content: response.text || ""
                }
            ]
        };

        await chrome.storage.local.set({
            latestCapsule: capsule
        });

        capsuleOutput.textContent = JSON.stringify(
            capsule,
            null,
            2
        );

        capsuleButton.textContent = "Capsule Saved ✓";

    } catch (error) {
        console.error("Capture error:", error);

        capsuleButton.textContent = "Capture failed";

        capsuleOutput.textContent =
            "Capture failed:\n\n" + error.message;
    }
});


// VIEW CAPSULE
viewButton.addEventListener("click", async () => {
    const result = await chrome.storage.local.get("latestCapsule");

    if (!result.latestCapsule) {
        capsuleOutput.textContent = "No saved capsule found.";
        return;
    }

    capsuleOutput.textContent = JSON.stringify(
        result.latestCapsule,
        null,
        2
    );
});


// EXPORT CAPSULE
exportButton.addEventListener("click", async () => {
    const result = await chrome.storage.local.get("latestCapsule");

    if (!result.latestCapsule) {
        capsuleOutput.textContent = "No saved capsule to export.";
        return;
    }

    const capsuleData = JSON.stringify(
        result.latestCapsule,
        null,
        2
    );

    const blob = new Blob(
        [capsuleData],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "llm-capsule.json";

    link.click();

    URL.revokeObjectURL(url);

    exportButton.textContent = "Exported ✓";

    setTimeout(() => {
        exportButton.textContent = "Export Capsule";
    }, 2000);
})