
const serverStatus = document.getElementById("serverStatus");
const startButton = document.getElementById("startButton");

// Check backend connection
async function checkServer() {
    try {
        const response = await fetch("/api/health");
        const data = await response.json();

        if (response.ok && data.success) {
            serverStatus.textContent = "● Server connected successfully";
            serverStatus.style.color = "#4ade80";
        } else {
            throw new Error("Server unavailable");
        }
    } catch (error) {
        serverStatus.textContent = "● Server connection failed";
        serverStatus.style.color = "#f87171";
    }
}

// Button interaction
startButton.addEventListener("click", () => {
    alert("Welcome to BugSnap! Your workspace is coming soon.");
});

checkServer();
