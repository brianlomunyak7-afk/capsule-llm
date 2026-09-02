chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "capturePage") {
        const pageText = document.body.innerText;

        console.log("LLM Capsule captured:", pageText);

        sendResponse({
            success: true,
            text: pageText
        });
    }
});