const viewButton = document.getElementById("viewButton");
const capsuleOutput = document.getElementById("capsuleOutput");

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