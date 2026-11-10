
async function renderAllReports() {
    const tbody = document.getElementById("allReports");
    const empty = document.getElementById("allEmpty");

    tbody.innerHTML = "";

    try {
        const allReports = await getReports();

        const search = document.getElementById("searchInput").value.toLowerCase();
        const status = document.getElementById("statusFilter").value;
        const severity = document.getElementById("severityFilter").value;
        const sort = document.getElementById("sortFilter").value;

        let reports = allReports.filter(report => {
            const matchesSearch =
                report.title.toLowerCase().includes(search) ||
                report.description.toLowerCase().includes(search);

            const matchesStatus = !status || report.status === status;
            const matchesSeverity = !severity || report.severity === severity;

            return matchesSearch && matchesStatus && matchesSeverity;
        });

        reports.sort((a, b) => {
            const difference =
                new Date(a.createdAt) - new Date(b.createdAt);

            return sort === "newest" ? -difference : difference;
        });

        empty.classList.toggle("hidden", reports.length > 0);

        reports.forEach(report => {
            const row = document.createElement("tr");

            const values = [
                report.title,
                report.category,
                report.severity,
                report.status,
                formatDate(report.createdAt)
            ];

            values.forEach((value, index) => {
                const cell = document.createElement("td");

                if (index === 2) {
                    cell.innerHTML =
                        `<span class="severity-badge ${severityClass(value)}">${escapeHTML(value)}</span>`;
                } else if (index === 3) {
                    cell.innerHTML =
                        `<span class="status-badge ${statusClass(value)}">${escapeHTML(value)}</span>`;
                } else {
                    cell.textContent = value;
                }

                row.appendChild(cell);
            });

            const actionCell = document.createElement("td");
            const button = document.createElement("button");

            button.className = "row-action";
            button.textContent = "View report";

            button.addEventListener("click", () => openReport(report._id));

            actionCell.appendChild(button);
            row.appendChild(actionCell);
            tbody.appendChild(row);
        });

    } catch (error) {
        empty.classList.remove("hidden");
        showToast("Unable to load reports.");
        console.error(error);
    }
}

// Search and filtering
["searchInput", "statusFilter", "severityFilter", "sortFilter"]
    .forEach(id => {
        document.getElementById(id).addEventListener("input", renderAllReports);
        document.getElementById(id).addEventListener("change", renderAllReports);
    });
