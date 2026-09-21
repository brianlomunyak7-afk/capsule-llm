const capsuleButton =
    document.getElementById("capsuleButton");

const viewButton =
    document.getElementById("viewButton");

const exportButton =
    document.getElementById("exportButton");

const importButton =
    document.getElementById("importButton");

const importFile =
    document.getElementById("importFile");

const continueButton =
    document.getElementById("continueButton");

const libraryButton =
    document.getElementById("libraryButton");

const capsuleOutput =
    document.getElementById("capsuleOutput");

const status =
    document.getElementById("status");

const library =
    document.getElementById("library");


let currentLibrary = [];


// ========================================
// UTILITY FUNCTIONS
// ========================================

function generateCapsuleId() {

    return crypto.randomUUID();

}


function ensureCapsuleId(capsule) {

    if (!capsule.capsuleId) {

        capsule.capsuleId =
            generateCapsuleId();

    }

    return capsule;

}


function formatDate(date) {

    if (!date) {

        return "Unknown date";

    }

    try {

        return new Date(date).toLocaleString();

    } catch {

        return "Unknown date";

    }

}


function showOutput(data) {

    capsuleOutput.textContent =
        typeof data === "string"
            ? data
            : JSON.stringify(
                data,
                null,
                2
            );

    capsuleOutput.classList.add(
        "visible"
    );

}


// ========================================
// LIBRARY
// ========================================

async function getLibrary() {

    const result =
        await chrome.storage.local.get(
            "capsuleLibrary"
        );


    const capsules =
        Array.isArray(
            result.capsuleLibrary
        )
            ? result.capsuleLibrary
            : [];


    return capsules.map(
        ensureCapsuleId
    );

}


async function saveLibrary(
    capsules
) {

    await chrome.storage.local.set({

        capsuleLibrary:
            capsules

    });

}


async function saveToLibrary(
    capsule
) {

    capsule =
        ensureCapsuleId(
            capsule
        );


    const capsules =
        await getLibrary();


    const existingIndex =
        capsules.findIndex(
            item =>
                item.capsuleId ===
                capsule.capsuleId
        );


    if (
        existingIndex !== -1
    ) {

        capsules[
            existingIndex
        ] = capsule;

    } else {

        capsules.unshift(
            capsule
        );

    }


    await saveLibrary(
        capsules
    );


    return capsule;

}


async function saveCurrentCapsule(
    capsule
) {

    capsule =
        ensureCapsuleId(
            capsule
        );


    await chrome.storage.local.set({

        latestCapsule:
            capsule

    });


    await saveToLibrary(
        capsule
    );


    return capsule;

}


// ========================================
// CREATE CAPSULE
// ========================================

capsuleButton.addEventListener(
    "click",
    async () => {

        capsuleButton.textContent =
            "Capturing...";

        status.textContent =
            "";

        try {

            const [tab] =
                await chrome.tabs.query({

                    active: true,

                    currentWindow: true

                });


            if (
                !tab ||
                !tab.id
            ) {

                throw new Error(
                    "No active tab found."
                );

            }


            const results =
                await chrome.scripting.executeScript({

                    target: {

                        tabId:
                            tab.id

                    },


                    func: () => {

                        const elements =
                            document.querySelectorAll(
                                "[data-message-author-role]"
                            );


                        const messages = [];


                        elements.forEach(
                            element => {

                                const role =
                                    element.getAttribute(
                                        "data-message-author-role"
                                    );


                                const content =
                                    element.innerText
                                        .trim();


                                if (
                                    !content
                                ) {

                                    return;

                                }


                                messages.push({

                                    role:
                                        role,

                                    content:
                                        content

                                });

                            }
                        );


                        return {

                            title:
                                document.title,

                            url:
                                window.location.href,

                            messages:
                                messages,

                            pageText:
                                document.body.innerText

                        };

                    }

                });


            const captured =
                results[0].result;


            if (!captured) {

                throw new Error(
                    "Nothing was captured."
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

                        role:
                            "unknown",

                        content:
                            captured.pageText ||
                            ""

                    }

                ];

            }


            const capsule = {

                capsuleId:
                    generateCapsuleId(),

                capsuleVersion:
                    "1.1",

                app:
                    "ChatGPT",

                title:
                    captured.title ||
                    "Untitled Conversation",

                createdAt:
                    new Date()
                        .toISOString(),

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


            showOutput(
                capsule
            );


            status.textContent =
                `Captured ${messages.length} messages and saved to library.`;


            capsuleButton.textContent =
                "Capsule Saved ✓";


            await renderLibrary();


            setTimeout(() => {

                capsuleButton.textContent =
                    "✨ Create Capsule";

            }, 2000);


        } catch (error) {

            console.error(
                "Capture error:",
                error
            );


            capsuleButton.textContent =
                "Capture failed";


            status.textContent =
                "Capture failed";


            showOutput(
                error.message
            );

        }

    }
);


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


        if (
            !result.latestCapsule
        ) {

            status.textContent =
                "No saved capsule found.";

            return;

        }


        const capsule =
            ensureCapsuleId(
                result.latestCapsule
            );


        await chrome.storage.local.set({

            latestCapsule:
                capsule

        });


        showOutput(
            capsule
        );


        status.textContent =
            `Capsule contains ${capsule.messageCount || capsule.messages.length} messages.`;

    }
);


// ========================================
// EXPORT
// ========================================

exportButton.addEventListener(
    "click",
    async () => {

        const result =
            await chrome.storage.local.get(
                "latestCapsule"
            );


        if (
            !result.latestCapsule
        ) {

            status.textContent =
                "No saved capsule to export.";

            return;

        }


        const capsule =
            ensureCapsuleId(
                result.latestCapsule
            );


        const capsuleData =
            JSON.stringify(
                capsule,
                null,
                2
            );


        const blob =
            new Blob(
                [
                    capsuleData
                ],
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
            `${capsule.capsuleId}.llmcapsule`;


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
                "Export";

        }, 2000);

    }
);


// ========================================
// IMPORT
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
                typeof capsule !==
                    "object"
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


            ensureCapsuleId(
                capsule
            );


            capsule.messageCount =
                capsule.messages.length;


            if (
                !capsule.capsuleVersion
            ) {

                capsule.capsuleVersion =
                    "1.1";

            }


            await saveCurrentCapsule(
                capsule
            );


            showOutput(
                capsule
            );


            status.textContent =
                `Imported ${capsule.messages.length} messages and added to library ✓`;


            importButton.textContent =
                "Imported ✓";


            await renderLibrary();


            setTimeout(() => {

                importButton.textContent =
                    "Import";

            }, 2000);


        } catch (error) {

            console.error(
                "Import error:",
                error
            );


            status.textContent =
                "Import failed";


            showOutput(
                error.message
            );

        }


        importFile.value =
            "";

    }
);


// ========================================
// CONTINUE CONVERSATION
// ========================================

async function continueCapsule(
    capsule
) {

    if (
        !capsule ||
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

        `I am continuing a conversation that was previously held with ${capsule.app || "another AI assistant"}.

The original conversation is provided below.

Treat it as existing conversation context rather than starting from scratch.

Conversation title:
${capsule.title || "Untitled Conversation"}

Conversation:
`;


    capsule.messages.forEach(
        (message, index) => {

            let role =
                String(
                    message.role ||
                    "unknown"
                ).toUpperCase();


            if (
                role === "USER"
            ) {

                role = "USER";

            } else if (
                role === "ASSISTANT"
            ) {

                role = "ASSISTANT";

            }


            prompt +=
                `\n--- ${role} MESSAGE ${index + 1} ---\n`;


            prompt +=
                `${message.content || ""}\n`;

        }
    );


    prompt += `

--- END OF CONVERSATION ---

Continue naturally from the conversation above.

Preserve important context, decisions, requirements, code, project state, and unresolved tasks.

Do not restart the project.

Do not unnecessarily repeat information already established.

Continue from where the previous conversation ended.`;


    await navigator.clipboard.writeText(
        prompt
    );


    showOutput(
        prompt
    );


    status.textContent =
        "Continuation prompt copied ✓";


    continueButton.textContent =
        "Copied ✓";


    setTimeout(() => {

        continueButton.textContent =
            "Continue";

    }, 2000);

}


continueButton.addEventListener(
    "click",
    async () => {

        try {

            const result =
                await chrome.storage.local.get(
                    "latestCapsule"
                );


            if (
                !result.latestCapsule
            ) {

                status.textContent =
                    "No capsule available.";

                return;

            }


            const capsule =
                ensureCapsuleId(
                    result.latestCapsule
                );


            await continueCapsule(
                capsule
            );


        } catch (error) {

            console.error(
                "Continuation error:",
                error
            );


            status.textContent =
                "Could not create continuation prompt.";


            showOutput(
                error.message
            );

        }

    }
);


// ========================================
// LIBRARY BUTTON
// ========================================

libraryButton.addEventListener(
    "click",
    async () => {

        await renderLibrary();

    }
);


// ========================================
// LIBRARY RENDERING
// ========================================

async function renderLibrary() {

    const capsules =
        await getLibrary();


    currentLibrary =
        capsules;


    library.innerHTML =
        "";


    const header =
        document.createElement(
            "div"
        );


    header.className =
        "library-header";


    const title =
        document.createElement(
            "h2"
        );


    title.className =
        "library-title";


    title.textContent =
        "My Capsules";


    const count =
        document.createElement(
            "span"
        );


    count.className =
        "library-count";


    count.textContent =
        `${capsules.length} capsule${capsules.length === 1 ? "" : "s"}`;


    header.appendChild(
        title
    );


    header.appendChild(
        count
    );


    library.appendChild(
        header
    );


    if (
        capsules.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "empty-library";


        empty.textContent =
            "No capsules saved yet.";


        library.appendChild(
            empty
        );


        return;

    }


    const search =
        document.createElement(
            "input"
        );


    search.className =
        "search-box";


    search.placeholder =
        "Search capsules...";


    library.appendChild(
        search
    );


    const list =
        document.createElement(
            "div"
        );


    list.id =
        "capsuleList";


    library.appendChild(
        list
    );


    function renderList(
        filtered
    ) {

        list.innerHTML =
            "";


        if (
            filtered.length === 0
        ) {

            const empty =
                document.createElement(
                    "div"
                );


            empty.className =
                "empty-library";


            empty.textContent =
                "No matching capsules.";


            list.appendChild(
                empty
            );


            return;

        }


        filtered.forEach(
            capsule => {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "capsule-card";


                const cardTitle =
                    document.createElement(
                        "h3"
                    );


                cardTitle.textContent =
                    capsule.title ||
                    "Untitled Capsule";


                const meta =
                    document.createElement(
                        "div"
                    );


                meta.className =
                    "capsule-meta";


                const app =
                    document.createElement(
                        "span"
                    );


                app.className =
                    "meta-item";


                app.textContent =
                    capsule.app ||
                    "Unknown";


                const messages =
                    document.createElement(
                        "span"
                    );


                messages.className =
                    "meta-item";


                messages.textContent =
                    `${capsule.messages.length} messages`;


                const date =
                    document.createElement(
                        "span"
                    );


                date.className =
                    "meta-item";


                date.textContent =
                    formatDate(
                        capsule.createdAt
                    );


                meta.appendChild(
                    app
                );


                meta.appendChild(
                    messages
                );


                meta.appendChild(
                    date
                );


                const actions =
                    document.createElement(
                        "div"
                    );


                actions.className =
                    "capsule-actions";


                const view =
                    document.createElement(
                        "button"
                    );


                view.className =
                    "view-capsule";


                view.textContent =
                    "View";


                view.addEventListener(
                    "click",
                    async () => {

                        await chrome.storage.local.set({

                            latestCapsule:
                                capsule

                        });


                        showOutput(
                            capsule
                        );


                        status.textContent =
                            "Capsule loaded ✓";

                    }
                );


                const continueBtn =
                    document.createElement(
                        "button"
                    );


                continueBtn.className =
                    "continue-capsule";


                continueBtn.textContent =
                    "Continue";


                continueBtn.addEventListener(
                    "click",
                    async () => {

                        await chrome.storage.local.set({

                            latestCapsule:
                                capsule

                        });


                        await continueCapsule(
                            capsule
                        );

                    }
                );


                const deleteBtn =
                    document.createElement(
                        "button"
                    );


                deleteBtn.className =
                    "delete-capsule";


                deleteBtn.textContent =
                    "Delete";


                deleteBtn.addEventListener(
                    "click",
                    async () => {

                        const confirmed =
                            confirm(
                                "Delete this capsule?"
                            );


                        if (
                            !confirmed
                        ) {

                            return;

                        }


                        const updated =
                            (
                                await getLibrary()
                            ).filter(
                                item =>
                                    item.capsuleId !==
                                    capsule.capsuleId
                            );


                        await saveLibrary(
                            updated
                        );


                        await renderLibrary();


                        status.textContent =
                            "Capsule deleted.";

                    }
                );


                actions.appendChild(
                    view
                );


                actions.appendChild(
                    continueBtn
                );


                actions.appendChild(
                    deleteBtn
                );


                card.appendChild(
                    cardTitle
                );


                card.appendChild(
                    meta
                );


                card.appendChild(
                    actions
                );


                list.appendChild(
                    card
                );

            }
        );

    }


    renderList(
        capsules
    );


    search.addEventListener(
        "input",
        () => {

            const query =
                search.value
                    .toLowerCase()
                    .trim();


            const filtered =
                capsules.filter(
                    capsule => {

                        const title =
                            (
                                capsule.title ||
                                ""
                            ).toLowerCase();


                        const app =
                            (
                                capsule.app ||
                                ""
                            ).toLowerCase();


                        return (
                            title.includes(
                                query
                            ) ||
                            app.includes(
                                query
                            )
                        );

                    }
                );


            renderList(
                filtered
            );

        }
    );


    status.textContent =
        `${capsules.length} capsule${capsules.length === 1 ? "" : "s"} in library.`;

}