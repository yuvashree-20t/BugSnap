
// ==========================================
// BUGSNAP - MAIN APPLICATION
// ==========================================


// ==========================================
// 1. GLOBAL HELPERS
// ==========================================

function showToast(message) {
    const container = document.getElementById("toastContainer");

    if (!container) {
        console.log(message);
        return;
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}


function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}


function formatDate(date) {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "Not available";
    }

    return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


function severityClass(severity) {
    const classes = {
        Critical: "severity-critical",
        High: "severity-high",
        Medium: "severity-medium",
        Low: "severity-low"
    };

    return classes[severity] || "severity-medium";
}


function statusClass(status) {
    const classes = {
        Open: "status-open",
        "In Progress": "status-in-progress",
        Resolved: "status-resolved"
    };

    return classes[status] || "status-open";
}


// ==========================================
// 2. NAVIGATION
// ==========================================

async function navigateTo(pageName) {
    const pages = {
        dashboard: "dashboardPage",
        create: "createPage",
        reports: "reportsPage",
        details: "detailsPage",
        settings: "settingsPage"
    };

    if (!pages[pageName]) {
        console.error("Unknown page:", pageName);
        return;
    }

    // Hide all application pages

    Object.values(pages).forEach(id => {
        const page = document.getElementById(id);

        if (page) {
            page.classList.add("hidden");
            page.classList.remove("active");
        }
    });

    // Display selected page

    const selectedPage = document.getElementById(
        pages[pageName]
    );

    if (selectedPage) {
        selectedPage.classList.remove("hidden");
        selectedPage.classList.add("active");
    }

    // Update sidebar navigation

    document.querySelectorAll("[data-page]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    // Update breadcrumb if present

    const breadcrumb = document.getElementById("breadcrumbPage");

    if (breadcrumb) {
        breadcrumb.textContent =
            pageName.charAt(0).toUpperCase() + pageName.slice(1);
    }

    // Close mobile sidebar

    const sidebar = document.getElementById("sidebar");

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    // Refresh page data

    try {
        if (pageName === "dashboard") {
            await renderDashboard();
        }

        if (pageName === "reports") {
            await renderAllReports();
        }

    } catch (error) {
        console.error("Navigation data loading error:", error);
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================
// 3. NAVIGATION EVENT LISTENERS
// ==========================================

document.addEventListener("click", event => {
    const navigationButton = event.target.closest("[data-page]");

    if (!navigationButton) return;

    const pageName = navigationButton.dataset.page;

    if (pageName) {
        navigateTo(pageName);
    }
});


// ==========================================
// 4. MOBILE MENU
// ==========================================

const mobileMenu = document.getElementById("mobileMenu");
const sidebar = document.getElementById("sidebar");

if (mobileMenu && sidebar) {
    mobileMenu.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}


// ==========================================
// 5. PROFILE INFORMATION
// ==========================================

function updateApplicationProfile() {
    const user =
        window.currentUser ||
        window.bugsnapUser ||
        window.user ||
        null;

    if (!user) return;

    const name = user.name || user.fullName || "Developer";
    const email = user.email || "";

    const elements = {
        profileName: name,
        profileEmail: email,
        profileAvatar: name.charAt(0).toUpperCase(),
        settingsName: name,
        settingsEmail: email
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    });
}


// ==========================================
// 6. CREATE REPORT FORM
// ==========================================

const reportForm = document.getElementById("reportForm");

if (reportForm) {

    reportForm.addEventListener("submit", async event => {
        event.preventDefault();

        const submitButton = reportForm.querySelector(
            'button[type="submit"]'
        );

        if (!submitButton) return;

        const originalButtonText = submitButton.textContent;

        try {
            submitButton.disabled = true;
            submitButton.textContent = "Saving report...";

            // Collect form information

            const description = document
                .getElementById("bugDescription")
                .value.trim();

            if (description.length < 10) {
                throw new Error(
                    "Description must contain at least 10 characters."
                );
            }

            const reportData = {
                title: description.slice(0, 55),
                description,

                category: document.getElementById("bugCategory").value,
                severity: document.getElementById("bugSeverity").value,
                priority: document.getElementById("bugPriority").value,

                expectedBehavior: document
                    .getElementById("expectedBehavior").value.trim(),

                actualBehavior: document
                    .getElementById("actualBehavior").value.trim(),

                reproductionSteps: document
                    .getElementById("reproductionSteps").value.trim()
            };


            // Get selected screenshot

            const screenshot = getSelectedFile();

            if (screenshot) {
                validateScreenshot(screenshot);
            }


            // Step 1: Create report in MongoDB

            const report = await createReport(reportData);

            if (!report || !report._id) {
                throw new Error(
                    "Report creation failed: no report ID was returned."
                );
            }


            // Step 2: Upload screenshot to Cloudinary

            if (screenshot) {
                submitButton.textContent = "Uploading screenshot...";

                await uploadScreenshot(report._id, screenshot);
            }


            // Step 3: Clear form after success

            reportForm.reset();

            if (typeof clearImage === "function") {
                clearImage();
            }


            showToast(
                screenshot
                    ? "Report and screenshot saved successfully!"
                    : "Bug report created successfully!"
            );


            // Step 4: Refresh dashboard

            await navigateTo("dashboard");


            // Step 5: Open created report

            await openReport(report._id);

        } catch (error) {
            console.error("Report submission error:", error);

            showToast(
                error.message || "Unable to save bug report."
            );

        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}


// ==========================================
// 7. OPEN REPORT DETAILS
// ==========================================

async function openReport(reportId) {
    try {
        const report = await getReportById(reportId);

        if (!report) {
            throw new Error("Report not found.");
        }

        const title = document.getElementById("detailTitle");
        const subtitle = document.getElementById("detailSubtitle");
        const content = document.getElementById("detailContent");

        if (!title || !subtitle || !content) {
            throw new Error("Report details elements are missing.");
        }

        title.textContent = report.title || "Untitled Report";

        subtitle.textContent =
            `Created on ${formatDate(report.createdAt)}`;


        // Build report details safely

        const screenshotSection = report.screenshotUrl
            ? `
                <div class="detail-section screenshot-detail">
                    <h3>Screenshot</h3>

                    <img
                        src="${escapeHTML(report.screenshotUrl)}"
                        alt="Bug report screenshot"
                        class="report-screenshot"
                        loading="lazy"
                    >

                    <button
                        type="button"
                        class="delete-screenshot-button"
                        id="deleteScreenshotButton"
                    >
                        Remove Screenshot
                    </button>
                </div>
            `
            : `
                <div class="detail-section">
                    <h3>Screenshot</h3>
                    <p>No screenshot attached.</p>
                </div>
            `;


        content.innerHTML = `
            <div class="detail-section">
                <h3>Description</h3>
                <p>${escapeHTML(report.description)}</p>
            </div>

            <div class="detail-section">
                <h3>Category</h3>
                <p>${escapeHTML(report.category)}</p>
            </div>

            <div class="detail-section">
                <h3>Severity</h3>
                <span class="severity-badge ${severityClass(report.severity)}">
                    ${escapeHTML(report.severity)}
                </span>
            </div>

            <div class="detail-section">
                <h3>Priority</h3>
                <p>${escapeHTML(report.priority)}</p>
            </div>

            <div class="detail-section">
                <h3>Status</h3>
                <span class="status-badge ${statusClass(report.status)}">
                    ${escapeHTML(report.status)}
                </span>
            </div>

            <div class="detail-section">
                <h3>Expected Behavior</h3>
                <p>${escapeHTML(report.expectedBehavior || "Not provided")}</p>
            </div>

            <div class="detail-section">
                <h3>Actual Behavior</h3>
                <p>${escapeHTML(report.actualBehavior || "Not provided")}</p>
            </div>

            <div class="detail-section">
                <h3>Reproduction Steps</h3>
                <p>${escapeHTML(report.reproductionSteps || "Not provided")}</p>
            </div>

            ${screenshotSection}

            <div class="detail-actions">

                <button
                    type="button"
                    class="secondary-button"
                    id="editReportButton"
                >
                    Edit Report
                </button>

                <button
                    type="button"
                    class="secondary-button"
                    id="changeStatusButton"
                >
                    Change Status
                </button>

                <button
                    type="button"
                    class="danger-button"
                    id="deleteReportButton"
                >
                    Delete Report
                </button>

            </div>
        `;


        // Navigate to details page

        await navigateTo("details");


        // Attach action handlers

        document.getElementById("editReportButton")
            ?.addEventListener("click", () => editReport(report));

        document.getElementById("changeStatusButton")
            ?.addEventListener("click", () => changeReportStatus(report));

        document.getElementById("deleteReportButton")
            ?.addEventListener("click", () => deleteReportById(report._id));

        document.getElementById("deleteScreenshotButton")
            ?.addEventListener("click", () => removeReportScreenshot(report._id));

    } catch (error) {
        console.error("Open report error:", error);

        showToast(error.message || "Unable to open report.");
    }
}


// ==========================================
// 8. EDIT REPORT
// ==========================================

async function editReport(report) {
    const newTitle = prompt(
        "Enter updated report title:",
        report.title
    );

    if (newTitle === null) return;

    const newDescription = prompt(
        "Enter updated description:",
        report.description
    );

    if (newDescription === null) return;

    if (newDescription.trim().length < 10) {
        showToast("Description must contain at least 10 characters.");
        return;
    }

    try {
        await updateReport(report._id, {
            title: newTitle.trim(),
            description: newDescription.trim()
        });

        showToast("Report updated successfully!");

        await openReport(report._id);

    } catch (error) {
        console.error(error);
        showToast(error.message || "Unable to update report.");
    }
}


// ==========================================
// 9. CHANGE REPORT STATUS
// ==========================================

async function changeReportStatus(report) {
    const statuses = [
        "Open",
        "In Progress",
        "Resolved"
    ];

    const currentIndex = statuses.indexOf(report.status);

    const nextStatus = statuses[
        (currentIndex + 1) % statuses.length
    ];

    const confirmed = confirm(
        `Change report status from "${report.status}" to "${nextStatus}"?`
    );

    if (!confirmed) return;

    try {
        await updateReport(report._id, {
            status: nextStatus
        });

        showToast(`Report status changed to ${nextStatus}.`);

        await openReport(report._id);

    } catch (error) {
        console.error(error);
        showToast(error.message || "Unable to change status.");
    }
}


// ==========================================
// 10. DELETE REPORT
// ==========================================

async function deleteReportById(reportId) {
    const confirmed = confirm(
        "Are you sure you want to permanently delete this bug report and its screenshot?"
    );

    if (!confirmed) return;

    try {
        await deleteReport(reportId);

        showToast("Bug report deleted successfully.");

        await navigateTo("reports");

    } catch (error) {
        console.error(error);

        showToast(error.message || "Unable to delete report.");
    }
}


// ==========================================
// 11. DELETE SCREENSHOT
// ==========================================

async function removeReportScreenshot(reportId) {
    const confirmed = confirm(
        "Are you sure you want to remove this screenshot?"
    );

    if (!confirmed) return;

    try {
        await deleteStoredScreenshot(reportId);

        showToast("Screenshot removed successfully.");

        await openReport(reportId);

    } catch (error) {
        console.error(error);

        showToast(error.message || "Unable to remove screenshot.");
    }
}


// ==========================================
// 12. SETTINGS
// ==========================================

const clearDataButton = document.getElementById(
    "clearDataButton"
);

if (clearDataButton) {
    clearDataButton.addEventListener("click", () => {

        const confirmed = confirm(
            "Clear local browser preferences? Your MongoDB reports will not be deleted."
        );

        if (!confirmed) return;

        // Deliberately do not clear authentication tokens
        // or server-side MongoDB reports.

        showToast("Local preferences cleared.");
    });
}


// ==========================================
// 13. NOTIFICATION BUTTON
// ==========================================

const notificationButton = document.getElementById(
    "notificationButton"
);

if (notificationButton) {
    notificationButton.addEventListener("click", () => {
        showToast("You're all caught up!");
    });
}


// ==========================================
// 14. LOGOUT BUTTON
// ==========================================

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {

        const confirmed = confirm("Are you sure you want to log out?");

        if (!confirmed) return;

        // Delegate to the authentication module if it
        // exposes a logout function.

        if (typeof logout === "function") {
            await logout();
        } else if (typeof logoutUser === "function") {
            await logoutUser();
        } else {
            showToast(
                "Logout function is not available in auth.js."
            );
        }
    });
}


// ==========================================
// 15. APPLICATION INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    updateApplicationProfile();

    // Auth.js controls whether the login screen or
    // authenticated application should be visible.

    const authScreen = document.getElementById("authScreen");
    const appShell = document.querySelector(".app-shell");

    if (authScreen && appShell) {
        const loginVisible =
            !authScreen.classList.contains("hidden") &&
            getComputedStyle(authScreen).display !== "none";

        appShell.classList.toggle("hidden", loginVisible);
    }

    // Load dashboard only when the application is visible.

    if (appShell && !appShell.classList.contains("hidden")) {
        navigateTo("dashboard");
    }
});
