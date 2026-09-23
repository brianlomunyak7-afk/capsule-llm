// ========================================
// LLM CAPSULE
// Simple Prompt Workflow
// ========================================


// ========================================
// ELEMENTS
// ========================================

const capsuleButton =
    document.getElementById("capsuleButton");

const dropButton =
    document.getElementById("dropButton");

const importFile =
    document.getElementById("importFile");

const status =
    document.getElementById("status");

const library =
    document.getElementById("library");

const libraryCount =
    document.getElementById("libraryCount");

const promptPreview =
    document.getElementById("promptPreview");

const previewTitle =
    document.getElementById("previewTitle");

const promptText =
    document.getElementById("promptText");

const closePreview =
    document.getElementById("closePreview");

const copyPromptButton =
    document.getElementById("copyPromptButton");

const dropIntoAIButton =
    document.getElementById("dropIntoAIButton");


// ========================================
// STORAGE
// ========================================

async function getPrompts() {

    const result =
        await chrome.storage.local.get(
            "promptLibrary"
        );

    return Array.isArray(
        result.promptLibrary
    )
        ? result.promptLibrary
        : [];
}


async function savePrompts(
    prompts
) {

    await chrome.storage.local.set({

        promptLibrary:
            prompts

    });

}


// ========================================
// ID
// ========================================

function generateId() {

    if (
        crypto &&
        crypto.randomUUID
    ) {

        return crypto.randomUUID();

    }

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2)
    );

}


// ========================================
// STATUS
// ========================================

function setStatus(
    message
) {

    status.textContent =
        message;

}


// ========================================
// NAME PROMPT
// ========================================

function askForName() {

    const name =
        window.prompt(
            "Name this prompt:",
            ""
        );

    if (
        name === null
    ) {

        return null;

    }

    const cleanName =
        name.trim();

    if (
        !cleanName
    ) {

        window.alert(
            "Please enter a name."
        );

        return null;

    }

    return cleanName;

}


// ========================================
// CREATE CONTINUATION PROMPT
// ========================================

function createContinuationPrompt(
    captured,
    messages
) {

    let prompt =

        `Continue this conversation naturally.

You are receiving context from a previous AI conversation.

Do not restart the work from the beginning.

Use the conversation below as existing context.

Conversation title:
${captured.title || "Untitled Conversation"}

Previous conversation:
`;


    messages.forEach(
        (message, index) => {

            let role =
                String(
                    message.role ||
                    "unknown"
                ).toUpperCase();


            if (
                role === "USER"
            ) {

                role =
                    "USER";

            } else if (
                role === "ASSISTANT"
            ) {

                role =
                    "ASSISTANT";

            }


            prompt +=
                `

--- ${role} MESSAGE ${index + 1} ---

${message.content || ""}
`;

        }
    );


    prompt += `

--- END OF PREVIOUS CONVERSATION ---

Continue from where the conversation ended.

Preserve the important context, requirements, decisions, code, project state, and unresolved tasks.

Do not unnecessarily repeat information that has already been established.

Respond as if you are continuing the existing conversation.`;


    return prompt;

}


// ========================================
// SAVE PROMPT
// ========================================

async function savePrompt(
    prompt
) {

    const prompts =
        await getPrompts();


    prompts.unshift(
        prompt
    );


    await savePrompts(
        prompts
    );

}


// ========================================
// OPEN PREVIEW
// ========================================

function openPreview(
    prompt
) {

    previewTitle.textContent =
        prompt.name;

    promptText.value =
        prompt.content;

    promptPreview.classList.add(
        "visible"
    );

}


// ========================================
// CLOSE PREVIEW
// ========================================

closePreview.addEventListener(
    "click",
    () => {

        promptPreview.classList.remove(
            "visible"
        );

    }
);


// ========================================
// COPY PROMPT
// ========================================

copyPromptButton.addEventListener(
    "click",
    async () => {

        const text =
            promptText.value;

        if (
            !text
        ) {

            return;

        }

        try {

            await navigator.clipboard.writeText(
                text
            );

            copyPromptButton.textContent =
                "Copied ✓";

            setStatus(
                "Prompt copied ✓"
            );


            setTimeout(
                () => {

                    copyPromptButton.textContent =
                        "Copy";

                },
                1500
            );

        } catch (error) {

            console.error(
                error
            );

            setStatus(
                "Could not copy prompt."
            );

        }

    }
);


// ========================================
// DROP INTO AI
// ========================================

dropIntoAIButton.addEventListener(
    "click",
    async () => {

        const text =
            promptText.value;

        if (
            !text
        ) {

            return;

        }


        try {

            await navigator.clipboard.writeText(
                text
            );


            const [tab] =
                await chrome.tabs.query({

                    active:
                        true,

                    currentWindow:
                        true

                });


            if (
                tab &&
                tab.id
            ) {

                try {

                    await chrome.scripting.executeScript({

                        target: {

                            tabId:
                                tab.id

                        },

                        func: (
                            prompt
                        ) => {

                            const selectors = [

                                "textarea",

                                "textarea[placeholder]",

                                "[contenteditable='true']",

                                "[role='textbox']"

                            ];


                            let input =
                                null;


                            for (
                                const selector
                                of selectors
                            ) {

                                input =
                                    document.querySelector(
                                        selector
                                    );

                                if (
                                    input
                                ) {

                                    break;

                                }

                            }


                            if (
                                !input
                            ) {

                                return {

                                    success:
                                        false,

                                    reason:
                                        "No text input found."

                                };

                            }


                            input.focus();


                            if (
                                input.tagName ===
                                "TEXTAREA"
                            ) {

                                const setter =
                                    Object.getOwnPropertyDescriptor(
                                        HTMLTextAreaElement.prototype,
                                        "value"
                                    )?.set;


                                if (
                                    setter
                                ) {

                                    setter.call(
                                        input,
                                        prompt
                                    );

                                } else {

                                    input.value =
                                        prompt;

                                }


                                input.dispatchEvent(
                                    new Event(
                                        "input",
                                        {
                                            bubbles:
                                                true
                                        }
                                    )
                                );

                                input.dispatchEvent(
                                    new Event(
                                        "change",
                                        {
                                            bubbles:
                                                true
                                        }
                                    )
                                );

                            } else {

                                input.textContent =
                                    prompt;


                                input.dispatchEvent(
                                    new InputEvent(
                                        "input",
                                        {
                                            bubbles:
                                                true,

                                            inputType:
                                                "insertText",

                                            data:
                                                prompt
                                        }
                                    )
                                );

                            }


                            return {

                                success:
                                    true

                            };

                        },

                        args: [
                            text
                        ]

                    });


                    setStatus(
                        "Prompt dropped into the AI input ✓"
                    );

                } catch (
                    injectionError
                ) {

                    console.error(
                        injectionError
                    );

                    setStatus(
                        "Prompt copied. Paste it into the AI input."
                    );

                }

            } else {

                setStatus(
                    "Prompt copied. Paste it into the AI input."
                );

            }

        } catch (error) {

            console.error(
                error
            );

            setStatus(
                "Prompt copied. Paste it into the AI input."
            );

        }

    }
);


// ========================================
// GENERATE PROMPT
// ========================================

capsuleButton.addEventListener(
    "click",
    async () => {

        capsuleButton.textContent =
            "Capturing...";

        setStatus(
            ""
        );


        try {

            const [tab] =
                await chrome.tabs.query({

                    active:
                        true,

                    currentWindow:
                        true

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


                        const messages =
                            [];


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
                results[0]?.result;


            if (
                !captured
            ) {

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


            const promptContent =
                createContinuationPrompt(
                    captured,
                    messages
                );


            const name =
                askForName();


            if (
                !name
            ) {

                capsuleButton.textContent =
                    "✨ Generate Prompt";

                setStatus(
                    "Generation cancelled."
                );

                return;

            }


            const prompt = {

                id:
                    generateId(),

                name:
                    name,

                content:
                    promptContent,

                source:
                    "ChatGPT",

                sourceUrl:
                    captured.url,

                messageCount:
                    messages.length,

                createdAt:
                    new Date()
                        .toISOString()

            };


            await savePrompt(
                prompt
            );


            await renderLibrary();


            capsuleButton.textContent =
                "Saved ✓";


            setStatus(
                `${name} saved successfully.`
            );


            setTimeout(
                () => {

                    capsuleButton.textContent =
                        "✨ Generate Prompt";

                },
                1800
            );


        } catch (error) {

            console.error(
                "Generation error:",
                error
            );


            capsuleButton.textContent =
                "Generation failed";


            setStatus(
                error.message ||
                "Could not generate prompt."
            );


            setTimeout(
                () => {

                    capsuleButton.textContent =
                        "✨ Generate Prompt";

                },
                1800
            );

        }

    }
);


// ========================================
// DROP PROMPT BUTTON
// ========================================

dropButton.addEventListener(
    "click",
    () => {

        importFile.click();

    }
);


// ========================================
// IMPORT / DROP FILE
// ========================================

importFile.addEventListener(
    "change",
    async () => {

        const file =
            importFile.files[0];


        if (
            !file
        ) {

            return;

        }


        try {

            const text =
                await file.text();


            let importedPrompt;


            /*
             * Support our generated
             * prompt format.
             */

            try {

                const parsed =
                    JSON.parse(
                        text
                    );


                if (
                    parsed &&
                    typeof parsed ===
                        "object" &&
                    parsed.content
                ) {

                    importedPrompt = {

                        id:
                            generateId(),

                        name:
                            parsed.name ||
                            file.name
                                .replace(
                                    /\.[^/.]+$/,
                                    ""
                                ),

                        content:
                            parsed.content,

                        source:
                            parsed.source ||
                            "Imported",

                        sourceUrl:
                            parsed.sourceUrl ||
                            "",

                        messageCount:
                            parsed.messageCount ||
                            0,

                        createdAt:
                            new Date()
                                .toISOString()

                    };

                }

            } catch (
                jsonError
            ) {

                /*
                 * Not JSON.
                 * Treat it as plain text.
                 */

            }


            /*
             * Plain text file.
             */

            if (
                !importedPrompt
            ) {

                const fileName =
                    file.name
                        .replace(
                            /\.[^/.]+$/,
                            ""
                        );


                importedPrompt = {

                    id:
                        generateId(),

                    name:
                        fileName ||
                        "Imported Prompt",

                    content:
                        text,

                    source:
                        "Imported",

                    sourceUrl:
                        "",

                    messageCount:
                        0,

                    createdAt:
                        new Date()
                            .toISOString()

                };

            }


            const name =
                window.prompt(
                    "Name this prompt:",
                    importedPrompt.name
                );


            if (
                name === null
            ) {

                importFile.value =
                    "";

                return;

            }


            const cleanName =
                name.trim();


            if (
                cleanName
            ) {

                importedPrompt.name =
                    cleanName;

            }


            await savePrompt(
                importedPrompt
            );


            await renderLibrary();


            setStatus(
                `${importedPrompt.name} added ✓`
            );


        } catch (error) {

            console.error(
                "Drop error:",
                error
            );


            setStatus(
                "Could not add prompt."
            );

        }


        importFile.value =
            "";

    }
);


// ========================================
// LIBRARY
// ========================================

async function renderLibrary() {

    const prompts =
        await getPrompts();


    library.innerHTML =
        "";


    libraryCount.textContent =
        prompts.length;


    if (
        prompts.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "empty-library";


        empty.innerHTML =
            `
                <strong>No saved prompts yet.</strong>
                Generate a prompt and it will appear here.
            `;


        library.appendChild(
            empty
        );


        return;

    }


    prompts.forEach(
        prompt => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "prompt-card";


            /*
             * Make the card draggable.
             */

            card.draggable =
                true;


            card.dataset.promptId =
                prompt.id;


            const nameContainer =
                document.createElement(
                    "div"
                );


            nameContainer.className =
                "prompt-name";


            const icon =
                document.createElement(
                    "span"
                );


            icon.className =
                "prompt-icon";


            icon.textContent =
                "📦";


            const name =
                document.createElement(
                    "span"
                );


            name.textContent =
                prompt.name;


            nameContainer.appendChild(
                icon
            );


            nameContainer.appendChild(
                name
            );


            const arrow =
                document.createElement(
                    "span"
                );


            arrow.className =
                "prompt-arrow";


            arrow.textContent =
                "›";


            card.appendChild(
                nameContainer
            );


            card.appendChild(
                arrow
            );


            /*
             * Click = open prompt.
             */

            card.addEventListener(
                "click",
                () => {

                    openPreview(
                        prompt
                    );

                }
            );


            /*
             * Drag = provide prompt text.
             */

            card.addEventListener(
                "dragstart",
                event => {

                    event.dataTransfer.setData(
                        "text/plain",
                        prompt.content
                    );


                    event.dataTransfer.effectAllowed =
                        "copy";


                    setStatus(
                        `Dragging ${prompt.name}...`
                    );

                }
            );


            library.appendChild(
                card
            );

        }
    );
}



// ========================================
// STARTUP
// ========================================

renderLibrary();