chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action !== "capturePage") {
        return;
    }

    const messages = [];

    /*
     * Look for common ChatGPT conversation message containers.
     */
    const messageElements = document.querySelectorAll(
        '[data-message-author-role]'
    );

    messageElements.forEach((element) => {
        const role = element.getAttribute("data-message-author-role");

        const content = element.innerText.trim();

        if (!content) {
            return;
        }

        messages.push({
            role: role,
            content: content
        });
    });

    /*
     * If this is not a ChatGPT conversation,
     * fall back to capturing the page text.
     */
    if (messages.length === 0) {
        sendResponse({
            success: true,
            type: "raw",
            text: document.body.innerText
        });

        return;
    }

    sendResponse({
        success: true,
        type: "conversation",
        title: document.title,
        url: window.location.href,
        messages: messages
    });
});