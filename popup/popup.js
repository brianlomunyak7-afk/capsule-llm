const capsuleButton = document.getElementById("capsuleButton");
const viewButton = document.getElementById("viewButton");
const exportButton = document.getElementById("exportButton");
const importButton = document.getElementById("importButton");
const importFile = document.getElementById("importFile");
const continueButton = document.getElementById("continueButton");
const libraryButton = document.getElementById("libraryButton");

const capsuleOutput = document.getElementById("capsuleOutput");
const status = document.getElementById("status");
const library = document.getElementById("library");


// ========================================
// LIBRARY HELPERS
// ========================================

async function getLibrary() {
    const result = await chrome.storage.local.get(
        "capsuleLibrary"
    );

    return result.capsuleLibrary || [];
}


async function saveToLibrary(capsule) {

    const capsules = await getLibrary();

    const existingIndex = capsules.findIndex(
        item =>
            item.sourceUrl === capsule.sourceUrl &&
            item.createdAt === capsule.createdAt
    );

    if (existingIndex === -1) {
        capsules.unshift(capsule);
    }

    await chrome.storage.local.set({
        capsuleLibrary: capsules
    });
}


async function saveCurrentCapsule(capsule) {

    await chrome.storage.local.set({
        latestCapsule: capsule
    });

    await saveToLibrary(capsule);
}


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

        const results =
            await chrome.scripting.executeScript({

                target: {
                    tabId: tab.id
                },

                func: () => {

                    const messageElements =
                        document.querySelectorAll(
                            '[data-message-author-role]'
                        );

                    const messages = [];

                    messageElements.forEach(
                        (element) => {

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

                        }
                    );

                    return {
                        title: document.title,
                        url: window.location.href,
                        messages: messages,
                        pageText: document.body.innerText
                    };
                }
            });


        const captured =
            results[0].result;


        if (!captured) {
            throw new Error(
                "Nothing was captured"
            );
        }


        let messages =
            captured.messages;


        if (
            !messages ||
            messages.length === 0
        ) {

            messages = [
                {
                    role: "unknown",
                    content:
                        captured.pageText || ""
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


        await saveCurrentCapsule(
            capsule
        );


        capsuleOutput.textContent =
            JSON.stringify(
                capsule,
                null,
                2
            );


        status.textContent =
            `Captured ${messages.length} messages and saved to library.`;


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

            capsuleOutput.textContent =
                "";

            return;
        }


        const capsule =
            result.latestCapsule;


        capsuleOutput.textContent =
            JSON.stringify(
                capsule,
                null,
                2
            );


        status.textContent =
            `Capsule contains ${capsule.messageCount} messages.`;

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
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


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
// IMPORT CAPSULE
// ========================================

importButton.addEventListener(
    "click",
    () => {

        importFile.click();

    }
);


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
                JSON.parse(
                    text
                );


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


            await saveCurrentCapsule(
                capsule
            );


            capsuleOutput.textContent =
                JSON.stringify(
                    capsule,
                    null,
                    2
                );


            status.textContent =
                `Imported ${capsule.messages.length} messages and added to library ✓`;


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


        importFile.value =
            "";

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


            await navigator.clipboard.writeText(
                prompt
            );


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


// ========================================
// CAPSULE LIBRARY
// ========================================

libraryButton.addEventListener(
    "click",
    async () => {

        await renderLibrary();

    }
);


async function renderLibrary() {

    const capsules =
        await getLibrary();


    if (capsules.length === 0) {

        library.innerHTML =
            "<p>No capsules saved yet.</p>";

        status.textContent =
            "Capsule library is empty.";

        return;

    }


    library.innerHTML =
        "";


    capsules.forEach(
        (capsule, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "capsule-card";


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                capsule.title ||
                "Untitled Capsule";


            const info =
                document.createElement(
                    "p"
                );


            info.textContent =
                `${capsule.app || "Unknown"} • ${capsule.messageCount || capsule.messages.length} messages`;


            const view =
                document.createElement(
                    "button"
                );


            view.textContent =
                "View";


            view.addEventListener(
                "click",
                async () => {

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
                        "Capsule loaded ✓";

                }
            );


            const continueBtn =
                document.createElement(
                    "button"
                );


            continueBtn.textContent =
                "Continue";


            continueBtn.addEventListener(
                "click",
                async () => {

                    await chrome.storage.local.set({
                        latestCapsule:
                            capsule
                    });


                    continueButton.click();

                }
            );


            const deleteBtn =
                document.createElement(
                    "button"
                );


            deleteBtn.textContent =
                "Delete";


            deleteBtn.addEventListener(
                "click",
                async () => {

                    const updated =
                        await getLibrary();


                    updated.splice(
                        index,
                        1
                    );


                    await chrome.storage.local.set({
                        capsuleLibrary:
                            updated
                    });


                    await renderLibrary();


                    status.textContent =
                        "Capsule deleted.";

                }
            );


            card.appendChild(
                title
            );


            card.appendChild(
                info
            );


            card.appendChild(
                view
            );


            card.appendChild(
                continueBtn
            );


            card.appendChild(
                deleteBtn
            );


            library.appendChild(
                card
            );

        }
    );


    status.textContent =
        `${capsules.length} capsule${capsules.length === 1 ? "" : "s"} in library.`;

}