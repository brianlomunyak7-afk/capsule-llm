const capsuleButton = document.getElementById("capsuleButton");

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

       if (response && response.success) {
    await chrome.storage.local.set({
        latestCapsule: {
            text: response.text,
            createdAt: new Date().toISOString(),
            sourceUrl: tab.url,
            sourceTitle: tab.title
        }
    });

    capsuleButton.textContent = "Capsule Saved ✓";
    console.log("Capsule saved:", response.text);
}
        } else {
            throw new Error("No capture response");
        }

    } catch (error) {
        console.error("Capture error:", error);
        capsuleButton.textContent = "Capture failed";
    }
});