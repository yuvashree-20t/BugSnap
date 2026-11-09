
const pages = {
    dashboard: "dashboardPage",
    create: "createPage",
    reports: "reportsPage",
    details: "detailsPage",
    settings: "settingsPage"
};

let currentReportId = null;

function navigateTo(pageName) {
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

    const title = pageName.charAt(0).toUpperCase() + pageName.slice(1);

    document.getElementById("breadcrumbTitle").textContent =
        pageName === "create" ? "Create Report" :
        pageName === "reports" ? "All Reports" :
        pageName === "details" ? "Report Details" : title;

    document.getElementById("sidebar").classList.remove("open");

    if (pageName === "dashboard") renderDashboard();
    if (pageName === "reports") renderAllReports();
}

document.addEventListener("click", event => {
    const navigation = event.target.closest("[data-page]");

    if (navigation) {
        event.preventDefault();
        navigateTo(navigation.dataset.page);
    }
});

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

// Mobile navigation
document.getElementById("mobileMenu").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
});

// Create report
document.getElementById("reportForm").addEventListener("submit", event => {
    event.preventDefault();

    const description = document.getElementById("bugDescription").value.trim();

    if (description.length < 10) {
        showToast("Please provide a more detailed description.");
        return;
    }

    const report = createReport({
        description,
        category: document.getElementById("bugCategory").value,
        severity: document.getElementById("bugSeverity").value,
        priority: document.getElementById("bugPriority").value,
        expectedBehavior: document.getElementById("expectedBehavior").value.trim(),
        actualBehavior: document.getElementById("actualBehavior").value.trim(),
        reproductionSteps: document.getElementById("reproductionSteps").value.trim(),
        screenshot: getSelectedImage()
    });

    document.getElementById("reportForm").reset();
    clearImage();

    showToast("Bug report saved successfully!");
    renderDashboard();
    navigateTo("details");
    openReport(report.id);
});

// Open report details
function openReport(id) {
    const report = getReportById(id);

    if (!report) {
        showToast("Report not found.");
        return;
    }

    currentReportId = id;

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

        ${report.screenshot ? `
            <div class="detail-section">
                <h3>Screenshot evidence</h3>
                <img class="detail-image" src="${report.screenshot}" alt="Bug screenshot">
            </div>
        ` : ""}

        <div class="detail-actions">
            <button class="secondary-button" id="editReportButton">Edit report</button>
            <button class="secondary-button" id="changeStatusButton">Change status</button>
            <button class="secondary-button" id="deleteReportButton">Delete report</button>
        </div>
    `;

    navigateTo("details");

    document.getElementById("editReportButton").addEventListener("click", () => {
        editReport(report);
    });

    document.getElementById("changeStatusButton").addEventListener("click", () => {
        const statuses = ["Open", "In Progress", "Resolved"];
        const current = statuses.indexOf(report.status);
        const next = statuses[(current + 1) % statuses.length];

        updateReport(id, { status: next });

        showToast(`Status updated to ${next}`);
        renderDashboard();
        openReport(id);
    });

    document.getElementById("deleteReportButton").addEventListener("click", () => {
        if (!confirm("Are you sure you want to delete this report?")) return;

        deleteReport(id);
        currentReportId = null;

        showToast("Report deleted.");
        renderDashboard();
        navigateTo("reports");
    });
}

// Edit report
function editReport(report) {
    const newTitle = prompt("Edit bug title:", report.title);
    if (newTitle === null) return;

    const newDescription = prompt("Edit description:", report.description);
    if (newDescription === null) return;

    if (!newTitle.trim() || !newDescription.trim()) {
        showToast("Title and description cannot be empty.");
        return;
    }

    updateReport(report.id, {
        title: newTitle.trim(),
        description: newDescription.trim()
    });

    showToast("Report updated successfully.");
    renderDashboard();
    openReport(report.id);
}

// Clear demo data
document.getElementById("clearDataButton").addEventListener("click", () => {
    if (!confirm("Delete all demo bug reports?")) return;

    localStorage.removeItem("bugsnap_reports");

    renderDashboard();
    renderAllReports();
    showToast("Demo data cleared.");
    navigateTo("dashboard");
});

// Notification
document.getElementById("notificationButton").addEventListener("click", () => {
    showToast("You're all caught up!");
});

// Initial rendering
renderDashboard();
navigateTo("dashboard");

// Reset screenshot when the form is reset
document.getElementById("reportForm").addEventListener("reset", () => {
    clearImage();
});

// Update the dashboard and report list after changes
window.addEventListener("storage", () => {
    renderDashboard();
    renderAllReports();
});
