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

        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["capsule/capture.js"]
        });

        const response = await chrome.tabs.sendMessage(tab.id, {
            action: "capturePage"
        });

        if (!response || !response.success) {
            throw new Error("No capture response");
        }

        await chrome.storage.local.set({
            latestCapsule: {
                text: response.text,
                createdAt: new Date().toISOString(),
                sourceUrl: tab.url,
                sourceTitle: tab.title
            }
        });

        capsuleButton.textContent = "Capsule Saved ✓";

    } catch (error) {
        console.error("Capture error:", error);
        capsuleButton.textContent = "Capture failed";
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
});