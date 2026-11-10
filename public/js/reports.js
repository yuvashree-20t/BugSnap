
const API_URL = "/api/reports";

// ==========================================
// 1. GET ALL REPORTS
// ==========================================

async function getReports() {
    const response = await authFetch(API_URL);

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Unable to fetch reports.");
    }

    return result.data;
}


// ==========================================
// 2. CREATE REPORT
// ==========================================

async function createReport(report) {
    const response = await authFetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(report)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Unable to create report.");
    }

    return result.data;
}


// ==========================================
// 3. UPDATE REPORT
// ==========================================

async function updateReport(id, changes) {
    const response = await authFetch(
        `${API_URL}/${encodeURIComponent(id)}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(changes)
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Unable to update report.");
    }

    return result.data;
}


// ==========================================
// 4. DELETE REPORT
// ==========================================

async function deleteReport(id) {
    const response = await authFetch(
        `${API_URL}/${encodeURIComponent(id)}`,
        {
            method: "DELETE"
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Unable to delete report.");
    }

    return result;
}


// ==========================================
// 5. GET SINGLE REPORT
// ==========================================

async function getReportById(id) {
    const response = await authFetch(
        `${API_URL}/${encodeURIComponent(id)}`
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Unable to fetch report.");
    }

    return result.data;
}


// ==========================================
// 6. RENDER ALL REPORTS
// ==========================================

async function renderAllReports() {
    const tableBody = document.getElementById("allReports");
    const emptyState = document.getElementById("allEmpty");

    if (!tableBody || !emptyState) return;

    try {
        let reports = await getReports();

        // SEARCH FILTER
        const searchInput = document.getElementById("searchInput");
        const searchTerm = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        if (searchTerm) {
            reports = reports.filter(report =>
                (report.title || "").toLowerCase().includes(searchTerm) ||
                (report.description || "").toLowerCase().includes(searchTerm)
            );
        }

        // STATUS FILTER
        const statusFilter = document.getElementById("statusFilter");
        const selectedStatus = statusFilter
            ? statusFilter.value
            : "all";

        if (selectedStatus && selectedStatus !== "all") {
            reports = reports.filter(report =>
                report.status === selectedStatus
            );
        }

        // SEVERITY FILTER
        const severityFilter = document.getElementById("severityFilter");
        const selectedSeverity = severityFilter
            ? severityFilter.value
            : "all";

        if (selectedSeverity && selectedSeverity !== "all") {
            reports = reports.filter(report =>
                report.severity === selectedSeverity
            );
        }

        // SORT FILTER
        const sortFilter = document.getElementById("sortFilter");
        const sortValue = sortFilter
            ? sortFilter.value
            : "newest";

        reports.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();

            return sortValue === "oldest"
                ? dateA - dateB
                : dateB - dateA;
        });

        // EMPTY STATE
        if (reports.length === 0) {
            tableBody.innerHTML = "";
            emptyState.classList.remove("hidden");
            return;
        }

        emptyState.classList.add("hidden");

        // RENDER TABLE
        tableBody.innerHTML = reports.map(report => `
            <tr class="report-row" data-id="${escapeHTML(report._id)}">

                <td>
                    <div class="report-title-cell">
                        <strong>${escapeHTML(report.title)}</strong>
                        <small>${formatDate(report.createdAt)}</small>
                    </div>
                </td>

                <td>
                    <span class="severity-badge ${severityClass(report.severity)}">
                        ${escapeHTML(report.severity)}
                    </span>
                </td>

                <td>
                    <span class="status-badge ${statusClass(report.status)}">
                        ${escapeHTML(report.status)}
                    </span>
                </td>

                <td>
                    <span class="priority-text">
                        ${escapeHTML(report.priority || "Medium")}
                    </span>
                </td>

                <td>
                    <button
                        type="button"
                        class="view-report-button"
                        data-report-id="${escapeHTML(report._id)}"
                    >
                        View →
                    </button>
                </td>

            </tr>
        `).join("");

        // OPEN REPORT DETAILS
        tableBody.querySelectorAll("[data-report-id]").forEach(button => {
            button.addEventListener("click", () => {
                openReport(button.dataset.reportId);
            });
        });

    } catch (error) {
        console.error("Unable to render reports:", error);

        tableBody.innerHTML = "";

        emptyState.classList.remove("hidden");

        showToast(error.message || "Unable to load reports.");
    }
}


// ==========================================
// 7. FILTER EVENT LISTENERS
// ==========================================

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const severityFilter = document.getElementById("severityFilter");
const sortFilter = document.getElementById("sortFilter");

if (searchInput) {
    searchInput.addEventListener("input", renderAllReports);
}

if (statusFilter) {
    statusFilter.addEventListener("change", renderAllReports);
}

if (severityFilter) {
    severityFilter.addEventListener("change", renderAllReports);
}

if (sortFilter) {
    sortFilter.addEventListener("change", renderAllReports);
}


// ==========================================
// 8. REFRESH REPORTS AFTER LOGIN
// ==========================================

document.addEventListener("bugsnap:authenticated", () => {
    renderAllReports();
});
