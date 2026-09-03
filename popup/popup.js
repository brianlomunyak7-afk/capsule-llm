const capsuleButton = document.getElementById("capsuleButton");
const viewButton = document.getElementById("viewButton");
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

        // Save capsule
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


// VIEW SAVED CAPSULE
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