
const pages = {
    dashboard: "dashboardPage",
    create: "createPage",
    reports: "reportsPage",
    details: "detailsPage",
    settings: "settingsPage"
};

function showToast(message) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");

    toast.className = "toast";
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function severityClass(value) {
    return "severity-" + value.toLowerCase();
}

function statusClass(value) {
    return "status-" + value.toLowerCase().replaceAll(" ", "-");
}

async function navigateTo(pageName) {
    if (!pages[pageName]) return;

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.getElementById(pages[pageName]).classList.add("active");

    document.querySelectorAll("[data-page]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    const titles = {
        dashboard: "Dashboard",
        create: "Create Report",
        reports: "All Reports",
        details: "Report Details",
        settings: "Settings"
    };

    document.getElementById("breadcrumbTitle").textContent = titles[pageName];

    document.getElementById("sidebar").classList.remove("open");

    if (pageName === "dashboard") await renderDashboard();
    if (pageName === "reports") await renderAllReports();
}

document.addEventListener("click", event => {
    const navigation = event.target.closest("[data-page]");

    if (navigation) {
        event.preventDefault();
        navigateTo(navigation.dataset.page);
    }
});

// Mobile navigation
document.getElementById("mobileMenu").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
});

// Create report
document.getElementById("reportForm").addEventListener("submit", async event => {
    event.preventDefault();

    const description = document.getElementById("bugDescription").value.trim();

    if (description.length < 10) {
        showToast("Description must contain at least 10 characters.");
        return;
    }

    const submitButton = event.submitter;
    submitButton.disabled = true;
    submitButton.textContent = "Saving...";

    try {
        const report = await createReport({
            title: description.slice(0, 55),
            description,
            category: document.getElementById("bugCategory").value,
            severity: document.getElementById("bugSeverity").value,
            priority: document.getElementById("bugPriority").value,
            expectedBehavior: document.getElementById("expectedBehavior").value.trim(),
            actualBehavior: document.getElementById("actualBehavior").value.trim(),
            reproductionSteps: document.getElementById("reproductionSteps").value.trim()
        });

        event.target.reset();
        clearImage();

        showToast("Report saved to MongoDB!");
        await navigateTo("dashboard");
        await openReport(report._id);

    } catch (error) {
        showToast(error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Save demo report →";
    }
});

// View report details
async function openReport(id) {
    try {
        const report = await getReportById(id);

        document.getElementById("detailTitle").textContent = report.title;
        document.getElementById("detailSubtitle").textContent =
            `Created on ${formatDate(report.createdAt)}`;

        const content = document.getElementById("detailContent");

        const section = (title, text) => `
            <div class="detail-section">
                <h3>${title}</h3>
                <p>${escapeHTML(text || "Not provided")}</p>
            </div>
        `;

        content.innerHTML = `
            <div class="detail-actions">
                <span class="severity-badge ${severityClass(report.severity)}">
                    ${escapeHTML(report.severity)} severity
                </span>

                <span class="status-badge ${statusClass(report.status)}">
                    ${escapeHTML(report.status)}
                </span>
            </div>

            ${section("Description", report.description)}
            ${section("Category", report.category)}
            ${section("Priority", report.priority)}
            ${section("Expected behavior", report.expectedBehavior)}
            ${section("Actual behavior", report.actualBehavior)}
            ${section("Steps to reproduce", report.reproductionSteps)}

            <div class="detail-actions">
                <button class="secondary-button" id="editReportButton">Edit report</button>
                <button class="secondary-button" id="changeStatusButton">Change status</button>
                <button class="secondary-button" id="deleteReportButton">Delete report</button>
            </div>
        `;

        await navigateTo("details");

        document.getElementById("editReportButton").addEventListener("click", async () => {
            const newTitle = prompt("Edit bug title:", report.title);
            if (newTitle === null) return;

            const newDescription = prompt("Edit description:", report.description);
            if (newDescription === null) return;

            if (!newTitle.trim() || newDescription.trim().length < 10) {
                showToast("Enter a valid title and description.");
                return;
            }

            try {
                await updateReport(id, {
                    title: newTitle.trim(),
                    description: newDescription.trim()
                });

                showToast("Report updated successfully!");
                await renderDashboard();
                await openReport(id);

            } catch (error) {
                showToast(error.message);
            }
        });

        document.getElementById("changeStatusButton").addEventListener("click", async () => {
            const statuses = ["Open", "In Progress", "Resolved"];
            const next = statuses[(statuses.indexOf(report.status) + 1) % statuses.length];

            try {
                await updateReport(id, { status: next });

                showToast(`Status updated to ${next}`);
                await renderDashboard();
                await openReport(id);

            } catch (error) {
                showToast(error.message);
            }
        });

        document.getElementById("deleteReportButton").addEventListener("click", async () => {
            if (!confirm("Are you sure you want to delete this report?")) return;

            try {
                await deleteReport(id);

                showToast("Report deleted successfully!");
                await renderDashboard();
                await navigateTo("reports");

            } catch (error) {
                showToast(error.message);
            }
        });

    } catch (error) {
        showToast(error.message);
    }
}

// Clear demo form
document.getElementById("reportForm").addEventListener("reset", () => {
    clearImage();
});

// Notification
document.getElementById("notificationButton").addEventListener("click", () => {
    showToast("You're all caught up!");
});

// Clear old localStorage demo reports
document.getElementById("clearDataButton").addEventListener("click", () => {
    if (!confirm("Clear the old browser demo data?")) return;

    localStorage.removeItem("bugsnap_reports");
    showToast("Old demo data cleared. MongoDB reports are unaffected.");
});

// Initial application load
navigateTo("dashboard");
