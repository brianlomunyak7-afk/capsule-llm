const capsuleButton = document.getElementById("capsuleButton");
const viewButton = document.getElementById("viewButton");
const exportButton = document.getElementById("exportButton");

const importButton = document.getElementById("importButton");
const importFile = document.getElementById("importFile");

const continueButton = document.getElementById("continueButton");

const capsuleOutput = document.getElementById("capsuleOutput");
const status = document.getElementById("status");


// ========================================
// CREATE CAPSULE
// ========================================

capsuleButton.addEventListener("click", async () => {

    capsuleButton.textContent = "Capturing...";
    status.textContent = "";

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

                const messageElements =
                    document.querySelectorAll(
                        '[data-message-author-role]'
                    );

                const messages = [];

                messageElements.forEach((element) => {

                    const role =
                        element.getAttribute(
                            "data-message-author-role"
                        );

                    const content =
                        element.innerText.trim();

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

            title:
                captured.title ||
                "Untitled Conversation",

            createdAt:
                new Date().toISOString(),

            sourceUrl:
                captured.url,

            messageCount:
                messages.length,

            messages:
                messages
        };

        await chrome.storage.local.set({
            latestCapsule: capsule
        });

        capsuleOutput.textContent =
            JSON.stringify(
                capsule,
                null,
                2
            );

        status.textContent =
            `Captured ${messages.length} messages.`;

        capsuleButton.textContent =
            "Capsule Saved ✓";

    } catch (error) {

        console.error(
            "Capture error:",
            error
        );

        capsuleButton.textContent =
            "Capture failed";

        status.textContent =
            "Capture failed";

        capsuleOutput.textContent =
            error.message;
    }

});


// ========================================
// VIEW SAVED CAPSULE
// ========================================

viewButton.addEventListener(
    "click",
    async () => {

        const result =
            await chrome.storage.local.get(
                "latestCapsule"
            );

        if (!result.latestCapsule) {

            status.textContent =
                "No saved capsule found.";

            capsuleOutput.textContent = "";

            return;
        }

        capsuleOutput.textContent =
            JSON.stringify(
                result.latestCapsule,
                null,
                2
            );

        status.textContent =
            `Capsule contains ${result.latestCapsule.messageCount} messages.`;

    }
);


// ========================================
// EXPORT CAPSULE
// ========================================

exportButton.addEventListener(
    "click",
    async () => {

        const result =
            await chrome.storage.local.get(
                "latestCapsule"
            );

        if (!result.latestCapsule) {

            status.textContent =
                "No saved capsule to export.";

            return;
        }

        const capsuleData =
            JSON.stringify(
                result.latestCapsule,
                null,
                2
            );

        const blob =
            new Blob(
                [capsuleData],
                {
                    type: "application/json"
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement("a");

        link.href =
            url;

        link.download =
            "llm-capsule.json";

        link.click();

        URL.revokeObjectURL(
            url
        );

        status.textContent =
            "Capsule exported ✓";

        exportButton.textContent =
            "Exported ✓";

        setTimeout(() => {

            exportButton.textContent =
                "Export Capsule";

        }, 2000);

    }
);


// ========================================
// OPEN IMPORT FILE SELECTOR
// ========================================

importButton.addEventListener(
    "click",
    () => {

        importFile.click();

    }
);


// ========================================
// IMPORT CAPSULE
// ========================================

importFile.addEventListener(
    "change",
    async () => {

        const file =
            importFile.files[0];

        if (!file) {
            return;
        }

        try {

            const text =
                await file.text();

            const capsule =
                JSON.parse(text);


            if (
                !capsule ||
                typeof capsule !== "object"
            ) {

                throw new Error(
                    "Invalid capsule file."
                );

            }

            if (
                !Array.isArray(
                    capsule.messages
                )
            ) {

                throw new Error(
                    "This file does not contain a valid messages array."
                );

            }

            await chrome.storage.local.set({

                latestCapsule:
                    capsule

            });

            capsuleOutput.textContent =
                JSON.stringify(
                    capsule,
                    null,
                    2
                );

            status.textContent =
                `Imported ${capsule.messages.length} messages ✓`;

            importButton.textContent =
                "Imported ✓";

            setTimeout(() => {

                importButton.textContent =
                    "Import Capsule";

            }, 2000);

        } catch (error) {

            console.error(
                "Import error:",
                error
            );

            status.textContent =
                "Import failed";

            capsuleOutput.textContent =
                error.message;

        }

        importFile.value = "";

    }
);


// ========================================
// CONTINUE CONVERSATION
// ========================================

continueButton.addEventListener(
    "click",
    async () => {

        try {

            const result =
                await chrome.storage.local.get(
                    "latestCapsule"
                );


            if (!result.latestCapsule) {

                status.textContent =
                    "No capsule available.";

                return;

            }


            const capsule =
                result.latestCapsule;


            if (
                !Array.isArray(
                    capsule.messages
                ) ||
                capsule.messages.length === 0
            ) {

                status.textContent =
                    "Capsule contains no messages.";

                return;

            }


            // ========================================
            // BUILD CONTINUATION PROMPT
            // ========================================

            let prompt =
                `I am continuing a conversation that was previously held with ${capsule.app}.

The original conversation is provided below.

Please treat it as existing conversation context rather than starting from scratch.

Conversation title:
${capsule.title}

Conversation:

`;


            capsule.messages.forEach(
                (message, index) => {

                    const role =
                        message.role === "user"
                            ? "USER"
                            : message.role === "assistant"
                                ? "ASSISTANT"
                                : message.role.toUpperCase();

                    prompt +=
                        `\n--- ${role} MESSAGE ${index + 1} ---\n`;

                    prompt +=
                        `${message.content}\n`;

                }
            );


            prompt += `

--- END OF CONVERSATION ---

Continue from the conversation above.

Preserve the important context, decisions, requirements, code, and unresolved tasks.

Do not restart the project or repeat information unnecessarily.

Continue naturally from where the previous conversation ended.`;


            // ========================================
            // COPY TO CLIPBOARD
            // ========================================

            await navigator.clipboard.writeText(
                prompt
            );


            // ========================================
            // DISPLAY RESULT
            // ========================================

            capsuleOutput.textContent =
                prompt;

            status.textContent =
                "Continuation prompt copied ✓";

            continueButton.textContent =
                "Copied ✓";


            setTimeout(() => {

                continueButton.textContent =
                    "Continue Conversation";

            }, 2000);


        } catch (error) {

            console.error(
                "Continuation error:",
                error
            );

            status.textContent =
                "Could not create continuation prompt.";

            capsuleOutput.textContent =
                error.message;

        }

    }
);