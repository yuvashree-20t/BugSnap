
function renderDashboard() {
    const reports = getReports();

    const total = reports.length;
    const open = reports.filter(r => r.status === "Open").length;
    const progress = reports.filter(r => r.status === "In Progress").length;
    const resolved = reports.filter(r => r.status === "Resolved").length;

    document.getElementById("totalStat").textContent = total;
    document.getElementById("openStat").textContent = open;
    document.getElementById("progressStat").textContent = progress;
    document.getElementById("resolvedStat").textContent = resolved;

    document.getElementById("reportCount").textContent = total;

    renderRecentReports(reports.slice(0, 5));
    renderSeverityOverview(reports);
}

function renderRecentReports(reports) {
    const tbody = document.getElementById("recentReports");
    const empty = document.getElementById("recentEmpty");

    tbody.innerHTML = "";

    empty.classList.toggle("hidden", reports.length > 0);

    reports.forEach(report => {
        const row = document.createElement("tr");

        const title = document.createElement("td");
        title.textContent = report.title;

        const severity = document.createElement("td");
        severity.innerHTML = `<span class="severity-badge ${severityClass(report.severity)}">${escapeHTML(report.severity)}</span>`;

        const status = document.createElement("td");
        status.innerHTML = `<span class="status-badge ${statusClass(report.status)}">${escapeHTML(report.status)}</span>`;

        const date = document.createElement("td");
        date.textContent = formatDate(report.createdAt);

        row.append(title, severity, status, date);
        tbody.appendChild(row);

        row.addEventListener("click", () => openReport(report.id));
        row.style.cursor = "pointer";
    });
}

function renderSeverityOverview(reports) {
    const container = document.getElementById("severityOverview");

    const levels = ["Critical", "High", "Medium", "Low"];
    const colors = {
        Critical: "#fb7185",
        High: "#fb923c",
        Medium: "#a78bfa",
        Low: "#4ade80"
    };

    container.innerHTML = "";

    levels.forEach(level => {
        const count = reports.filter(r => r.severity === level).length;
        const percentage = reports.length
            ? (count / reports.length) * 100
            : 0;

        const item = document.createElement("div");
        item.className = "severity-item";

        const label = document.createElement("div");
        label.className = "severity-label";

        const name = document.createElement("span");
        name.textContent = level;

        const value = document.createElement("span");
        value.textContent = `${count} (${Math.round(percentage)}%)`;

        label.append(name, value);

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
