const capsuleButton = document.getElementById("capsuleButton");

capsuleButton.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    chrome.tabs.sendMessage(
        tab.id,
        { action: "capturePage" },
        (response) => {
            if (chrome.runtime.lastError) {
                capsuleButton.textContent = "Capture failed";
                return;
            }

            capsuleButton.textContent = "Capsule Created ✓";
            console.log("Captured:", response);
        }
    );
})