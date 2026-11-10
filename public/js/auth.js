
const TOKEN_KEY = "b51c4b89697e44857ea8c185b2454041b82cba265941a75b022a55eab0fde94593b3c5045fa94b869ce4684bd44d4f3fa3e91452cf2d32214136d843a3d10ddf";

// GET TOKEN
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

// AUTHENTICATED API REQUEST HELPER
async function authFetch(url, options = {}) {
    const token = getToken();

    const headers = {
        ...options.headers
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        showAuthScreen();
        throw new Error("Session expired. Please log in again.");
    }

    return response;
}

// SHOW LOGIN SCREEN
function showAuthScreen() {
    const authScreen = document.getElementById("authScreen");
    const shell = document.querySelector(".app-shell");

    authScreen.classList.remove("hidden");

    shell.classList.add("hidden");
    shell.classList.remove("authenticated");

    document.getElementById("loginCard").classList.remove("hidden");
    document.getElementById("registerCard").classList.add("hidden");

    document.getElementById("loginForm").reset();
    document.getElementById("registerForm").reset();
}

// SHOW MAIN APPLICATION
function showApplication(user) {
    const authScreen = document.getElementById("authScreen");
    const shell = document.querySelector(".app-shell");

    // Hide authentication screen
    authScreen.classList.add("hidden");

    // IMPORTANT: Remove hidden from dashboard
    shell.classList.remove("hidden");
    shell.classList.add("authenticated");

    // Update user profile
    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileEmail").textContent = user.email;

    document.getElementById("profileAvatar").textContent =
        user.name.charAt(0).toUpperCase();

    // Notify other application scripts
    document.dispatchEvent(new Event("bugsnap:authenticated"));
}

// SWITCH TO REGISTER
document.getElementById("showRegister").addEventListener("click", () => {
    document.getElementById("loginCard").classList.add("hidden");
    document.getElementById("registerCard").classList.remove("hidden");
});

// SWITCH TO LOGIN
document.getElementById("showLogin").addEventListener("click", () => {
    document.getElementById("registerCard").classList.add("hidden");
    document.getElementById("loginCard").classList.remove("hidden");
});

// REGISTER
document.getElementById("registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const button = event.submitter;

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        showToast("Passwords do not match.");
        return;
    }

    button.disabled = true;
    button.textContent = "Creating account...";

    try {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Registration failed.");
        }

        localStorage.setItem(TOKEN_KEY, result.token);

        showToast("Account created successfully!");

        showApplication(result.user);

    } catch (error) {
        showToast(error.message);
    } finally {
        button.disabled = false;
        button.textContent = "Create account →";
    }
});

// LOGIN
document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const button = event.submitter;

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    button.disabled = true;
    button.textContent = "Signing in...";

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Login failed.");
        }

        localStorage.setItem(TOKEN_KEY, result.token);

        showToast("Welcome back!");

        showApplication(result.user);

    } catch (error) {
        showToast(error.message);
    } finally {
        button.disabled = false;
        button.textContent = "Sign in →";
    }
});

// LOGOUT
document.getElementById("logoutButton").addEventListener("click", () => {
    localStorage.removeItem(TOKEN_KEY);

    showAuthScreen();

    showToast("You have been logged out.");
});

// RESTORE EXISTING SESSION
async function initializeAuthentication() {
    const token = getToken();

    if (!token) {
        showAuthScreen();
        return;
    }

    try {
        const response = await fetch("/api/auth/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            localStorage.removeItem(TOKEN_KEY);
            showAuthScreen();
            return;
        }

        const result = await response.json();

        showApplication(result.user);

    } catch (error) {
        console.error("Session verification failed:", error);

        showAuthScreen();

        showToast("Unable to verify your session.");
    }
}

// INITIALIZE AUTHENTICATION
initializeAuthentication();
