const capsuleButton = document.getElementById("capsuleButton");
const viewButton = document.getElementById("viewButton");
const exportButton = document.getElementById("exportButton");

const importButton = document.getElementById("importButton");
const importFile = document.getElementById("importFile");

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


        // Capture the current page
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


        // Fallback
        if (!messages || messages.length === 0) {

            messages = [
                {
                    role: "unknown",
                    content: captured.pageText || ""
                }
            ];

        }


        // ========================================
        // BUILD CAPSULE
        // ========================================

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


        // Save capsule
        await chrome.storage.local.set({

            latestCapsule:
                capsule

        });


        // Display capsule
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

            // Read JSON file
            const text =
                await file.text();


            // Convert JSON into JavaScript object
            const capsule =
                JSON.parse(text);


            // ========================================
            // VALIDATE CAPSULE
            // ========================================

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


            // ========================================
            // SAVE IMPORTED CAPSULE
            // ========================================

            await chrome.storage.local.set({

                latestCapsule:
                    capsule

            });


            // ========================================
            // SHOW IMPORTED CAPSULE
            // ========================================

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
f