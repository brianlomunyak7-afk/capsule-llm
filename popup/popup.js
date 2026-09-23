// ========================================
// LLM CAPSULE
// Powerful Conversation Handoff
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
// CREATE POWERFUL CONTINUATION PROMPT
// ========================================

function createContinuationPrompt(
    captured,
    messages
) {

    let prompt =

        `==================================================
LLM CAPSULE — CONVERSATION HANDOFF
==================================================

IMPORTANT:

You are continuing an existing AI conversation.

This is NOT a new task.

The user has moved this conversation from another
AI session into your current session.

Treat everything below as existing context.

Do NOT unnecessarily restart the work.

Do NOT ask the user to repeat information that is
already available in this conversation.

Continue from the exact point where the previous
conversation ended.

==================================================
CONVERSATION INFORMATION
==================================================

Title:
${captured.title || "Untitled Conversation"}

Source:
${captured.source || "Unknown AI"}

Original URL:
${captured.url || "Unknown"}

Message count:
${messages.length}

==================================================
CONTINUATION RULES
==================================================

Before responding, understand:

1. What the user is trying to accomplish.
2. What has already been completed.
3. What decisions have already been made.
4. What requirements and constraints exist.
5. What code, files, technologies, or tools are involved.
6. What problems have already been solved.
7. What problems remain unresolved.
8. What the user's latest request is.

Preserve the previous conversation's:

- requirements
- instructions
- decisions
- terminology
- project structure
- technical choices
- code
- configuration
- constraints
- unresolved problems
- completed work
- pending work

Do not discard previous decisions unless the user
explicitly asks for a change.

If the previous conversation contains code, preserve
the code accurately.

If the previous conversation contains technical
details, treat them as existing project context.

If the previous conversation contains a partially
completed task, continue from that point rather than
starting again.

The user's latest message has priority.

==================================================
FULL PREVIOUS CONVERSATION
==================================================
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

            } else if (
                role === "SYSTEM"
            ) {

                role =
                    "SYSTEM";

            } else {

                role =
                    "OTHER";

            }


            prompt +=
                `

--------------------------------------------------
${role} MESSAGE ${index + 1}
--------------------------------------------------

${message.content || ""}

`;

        }
    );


    prompt +=

        `==================================================
END OF PREVIOUS CONVERSATION
==================================================

FINAL CONTINUATION INSTRUCTION

Continue the conversation naturally from where it
ended.

Do not restart the project.

Do not unnecessarily summarize everything again.

Do not ask for information that is already present
above.

Use the previous conversation as your working context.

If the user was in the middle of implementing
something, continue that implementation.

If the user asked for a specific next step, address
that next step directly.

If code was already written, build on the existing
code rather than replacing it without a reason.

The goal is for the user to feel that you are the
same assistant continuing the same conversation,
even though the conversation has been moved to you.

==================================================
CONTINUE FROM HERE
==================================================
`;


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


            // ========================================
            // CAPTURE CONVERSATION
            // ========================================

            const results =
                await chrome.scripting.executeScript({

                    target: {

                        tabId:
                            tab.id

                    },


                    func: () => {

                        // ========================================
                        // FIND CONVERSATION MESSAGES
                        // ========================================

                        const elements =
                            document.querySelectorAll(
                                "[data-message-author-role]"
                            );


                        const messages = [];


                        // ========================================
                        // EXTRACT MESSAGE CONTENT
                        // ========================================

                        function extractMessageContent(
                            element
                        ) {

                            const clone =
                                element.cloneNode(
                                    true
                                );


                            // ----------------------------------------
                            // PRESERVE CODE BLOCKS
                            // ----------------------------------------

                            clone.querySelectorAll(
                                "pre"
                            ).forEach(
                                pre => {

                                    const code =
                                        pre.querySelector(
                                            "code"
                                        );


                                    const codeText =
                                        code
                                            ? code.innerText
                                            : pre.innerText;


                                    const language =
                                        code?.className
                                            ?.match(
                                                /language-([a-zA-Z0-9_-]+)/
                                            )?.[1] ||
                                        "";


                                    const fencedCode =
                                        `\n\n\`\`\`${language}\n` +
                                        `${codeText.trim()}\n` +
                                        `\`\`\`\n\n`;


                                    pre.replaceWith(
                                        document.createTextNode(
                                            fencedCode
                                        )
                                    );

                                }
                            );


                            // ----------------------------------------
                            // PRESERVE INLINE CODE
                            // ----------------------------------------

                            clone.querySelectorAll(
                                "code"
                            ).forEach(
                                code => {

                                    if (
                                        code.closest(
                                            "pre"
                                        )
                                    ) {

                                        return;

                                    }


                                    const codeText =
                                        code.innerText
                                            .trim();


                                    code.replaceWith(
                                        document.createTextNode(
                                            `\`${codeText}\``
                                        )
                                    );

                                }
                            );


                            // ----------------------------------------
                            // PRESERVE LINKS
                            // ----------------------------------------

                            clone.querySelectorAll(
                                "a[href]"
                            ).forEach(
                                link => {

                                    const text =
                                        link.innerText
                                            .trim();


                                    const href =
                                        link.href;


                                    if (
                                        href &&
                                        text &&
                                        text !== href
                                    ) {

                                        link.replaceWith(
                                            document.createTextNode(
                                                `[${text}](${href})`
                                            )
                                        );

                                    } else if (
                                        href
                                    ) {

                                        link.replaceWith(
                                            document.createTextNode(
                                                href
                                            )
                                        );

                                    }

                                }
                            );


                            // ----------------------------------------
                            // PRESERVE LIST STRUCTURE
                            // ----------------------------------------

                            clone.querySelectorAll(
                                "li"
                            ).forEach(
                                item => {

                                    const text =
                                        item.innerText
                                            .trim();


                                    if (
                                        text
                                    ) {

                                        item.insertBefore(
                                            document.createTextNode(
                                                "• "
                                            ),
                                            item.firstChild
                                        );

                                    }

                                }
                            );


                            // ----------------------------------------
                            // EXTRACT FINAL TEXT
                            // ----------------------------------------

                            return clone.innerText
                                .replace(
                                    /\n{3,}/g,
                                    "\n\n"
                                )
                                .trim();

                        }


                        // ========================================
                        // EXTRACT ALL MESSAGES
                        // ========================================

                        elements.forEach(
                            (
                                element,
                                index
                            ) => {

                                const role =
                                    element.getAttribute(
                                        "data-message-author-role"
                                    );


                                const content =
                                    extractMessageContent(
                                        element
                                    );


                                if (
                                    !content
                                ) {

                                    return;

                                }


                                messages.push({

                                    index:
                                        index + 1,

                                    role:
                                        role ||
                                        "unknown",

                                    content:
                                        content

                                });

                            }
                        );


                        // ========================================
                        // PAGE INFORMATION
                        // ========================================

                        return {

                            title:
                                document.title,

                            url:
                                window.location.href,

                            source:
                                "ChatGPT",

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


            // ========================================
            // CHECK CAPTURE
            // ========================================

            let messages =
                captured.messages;


            if (
                !messages ||
                messages.length === 0
            ) {

                messages = [

                    {

                        index:
                            1,

                        role:
                            "unknown",

                        content:
                            captured.pageText ||
                            ""

                    }

                ];

            }


            // ========================================
            // CREATE HANDOFF PROMPT
            // ========================================

            const promptContent =
                createContinuationPrompt(
                    captured,
                    messages
                );


            // ========================================
            // ASK FOR NAME
            // ========================================

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


            // ========================================
            // CREATE SAVED PROMPT
            // ========================================

            const prompt = {

                id:
                    generateId(),

                name:
                    name,

                content:
                    promptContent,

                source:
                    captured.source ||
                    "ChatGPT",

                sourceUrl:
                    captured.url,

                messageCount:
                    messages.length,

                createdAt:
                    new Date()
                        .toISOString()

            };


            // ========================================
            // SAVE
            // ========================================

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


            // ========================================
            // JSON FORMAT
            // ========================================

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

                // Not JSON.
                // Treat as plain text.

            }


            // ========================================
            // PLAIN TEXT
            // ========================================

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


            // ========================================
            // NAME IMPORTED PROMPT
            // ========================================

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


            // ========================================
            // SAVE
            // ========================================

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


            // ========================================
            // DRAGGABLE
            // ========================================

            card.draggable =
                true;


            card.dataset.promptId =
                prompt.id;


            // ========================================
            // NAME
            // ========================================

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


            // ========================================
            // ARROW
            // ========================================

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


            // ========================================
            // CLICK
            // ========================================

            card.addEventListener(
                "click",
                () => {

                    openPreview(
                        prompt
                    );

                }
            );


            // ========================================
            // DRAG
            // ========================================

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