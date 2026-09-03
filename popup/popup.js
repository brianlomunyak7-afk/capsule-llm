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

        const results = await chrome.scripting.executeScript({
            target: {
                tabId: tab.id
            },

            func: () => {
                const messageElements = document.querySelectorAll(
                    '[data-message-author-role]'
                );

                const messages = [];

                messageElements.forEach((element) => {
                    const role = element.getAttribute(
                        "data-message-author-role"
                    );

                    const content = element.innerText.trim();

                    if (!content) {
                        return;
                    }

                    messages.push({
                        role: role,
                        content: content
                    });
                });

                return {
                    title: document.title,
                    url: window.location.href,
                    messages: messages,
                    pageText: document.body.innerText
                };
            }
        });

        const captured = results[0].result;

        if (!captured) {
            throw new Error("Nothing was captured");
        }

        let messages = captured.messages;

        /*
         * Fallback if no structured messages were detected.
         */
        if (!messages || messages.length === 0) {
            messages = [
                {
                    role: "unknown",
                    content: captured.pageText || ""
                }
            ];
        }

        const capsule = {
    capsuleVersion: "1.0",

    app: "ChatGPT",

    title: captured.title || "Untitled Conversation",

    createdAt: new Date().toISOString(),

    sourceUrl: captured.url,

    messageCount: messages.length,

    messages: messages
};
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
        {
            type: "application/json"
        }
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