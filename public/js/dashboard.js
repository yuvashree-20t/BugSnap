
// ==========================================
// BUGSNAP - DASHBOARD
// ==========================================


// ==========================================
// 1. MAIN DASHBOARD RENDERER
// ==========================================

async function renderDashboard() {
    try {
        const reports = await getReports();

        const total = reports.length;

        const open = reports.filter(
            report => report.status === "Open"
        ).length;

        const progress = reports.filter(
            report => report.status === "In Progress"
        ).length;

        const resolved = reports.filter(
            report => report.status === "Resolved"
        ).length;


        // Update statistics

        updateElement("totalStat", total);
        updateElement("openStat", open);
        updateElement("progressStat", progress);
        updateElement("resolvedStat", resolved);
        updateElement("reportCount", total);


        // Render dashboard sections

        renderRecentReports(reports.slice(0, 5));

        renderSeverityOverview(reports);


        // Update profile information

        updateProfileInformation();


    } catch (error) {
        console.error("Dashboard loading error:", error);

        showToast(
            error.message || "Unable to load dashboard data."
        );
    }
}


// ==========================================
// 2. SAFE ELEMENT UPDATE
// ==========================================

function updateElement(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


// ==========================================
// 3. PROFILE INFORMATION
// ==========================================

function updateProfileInformation() {
    // Supports the user object exposed by auth.js.
    // Adjust the candidate names if your auth.js
    // uses a different user variable.

    const user =
        window.currentUser ||
        window.bugsnapUser ||
        window.user ||
        null;

    if (!user) return;

    const name =
        user.name ||
        user.fullName ||
        "Developer";

    const email =
        user.email ||
        "";

    updateElement("profileName", name);
    updateElement("profileEmail", email);
    updateElement("settingsName", name);
    updateElement("settingsEmail", email);

    updateElement(
        "profileAvatar",
        name.charAt(0).toUpperCase()
    );
}


// ==========================================
// 4. RECENT REPORTS
// ==========================================

function renderRecentReports(reports) {
    const tbody = document.getElementById("recentReports");
    const empty = document.getElementById("recentEmpty");

    if (!tbody || !empty) return;

    tbody.innerHTML = "";

    empty.classList.toggle(
        "hidden",
        reports.length > 0
    );

    reports.forEach(report => {
        const row = document.createElement("tr");

        row.className = "recent-report-row";
        row.style.cursor = "pointer";


        // Report title

        const title = document.createElement("td");

        title.textContent = report.title || "Untitled report";


        // Severity

        const severity = document.createElement("td");

        const severityBadge = document.createElement("span");

        severityBadge.className =
            `severity-badge ${severityClass(report.severity)}`;

        severityBadge.textContent =
            report.severity || "Medium";

        severity.appendChild(severityBadge);


        // Status

        const status = document.createElement("td");

        const statusBadge = document.createElement("span");

        statusBadge.className =
            `status-badge ${statusClass(report.status)}`;

        statusBadge.textContent =
            report.status || "Open";

        status.appendChild(statusBadge);


        // Date

        const date = document.createElement("td");

        date.textContent = formatDate(report.createdAt);


        // Assemble row

        row.append(
            title,
            severity,
            status,
            date
        );


        // Open report details

        row.addEventListener("click", () => {
            openReport(report._id);
        });


        tbody.appendChild(row);
    });
}


// ==========================================
// 5. SEVERITY OVERVIEW
// ==========================================

function renderSeverityOverview(reports) {
    const container = document.getElementById(
        "severityOverview"
    );

    if (!container) return;

    const levels = [
        "Critical",
        "High",
        "Medium",
        "Low"
    ];

    const colors = {
        Critical: "#fb7185",
        High: "#fb923c",
        Medium: "#a78bfa",
        Low: "#4ade80"
    };

    container.innerHTML = "";


    levels.forEach(level => {

        const count = reports.filter(
            report => report.severity === level
        ).length;

        const percentage = reports.length
            ? (count / reports.length) * 100
            : 0;


        // Severity item

        const item = document.createElement("div");

        item.className = "severity-item";


        // Label row

        const label = document.createElement("div");

        label.className = "severity-label";


        const name = document.createElement("span");

        name.textContent = level;


        const value = document.createElement("span");

        value.textContent =
            `${count} (${Math.round(percentage)}%)`;


        label.append(name, value);


        // Progress bar

        const track = document.createElement("div");

        track.className = "progress-track";


        const fill = document.createElement("div");

        fill.className = "progress-fill";

        fill.style.width = `${percentage}%`;

        fill.style.background = colors[level];


        track.appendChild(fill);

        item.append(label, track);

        container.appendChild(item);
    });
}


// ==========================================
// 6. DASHBOARD REFRESH
// ==========================================

async function refreshDashboard() {
    await renderDashboard();
}


// ==========================================
// 7. REPORT COUNT
// ==========================================

async function getDashboardReportCount() {
    try {
        const reports = await getReports();

        return reports.length;

    } catch (error) {
        console.error(
            "Unable to get report count:",
            error
        );

        return 0;
    }
}
