import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getDatabase, ref, get, child, update } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDXpT6oe6SNKk0kHJLePqlMmLnd1kRSWT8",
    authDomain: "civicalertoriginal.firebaseapp.com",
    databaseURL: "https://civicalertoriginal-default-rtdb.firebaseio.com",
    projectId: "civicalertoriginal",
    storageBucket: "civicalertoriginal.appspot.com",
    messagingSenderId: "858192785417",
    appId: "1:858192785417:web:424b1bec909661ab29c8d8",
    measurementId: "G-KJ0C1TE4JS"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function displayReports(reports) {
    const reportsContainer = document.getElementById('reports-container');
    reportsContainer.innerHTML = ''; // Clear previous content

    const groupedReports = {};

    // Grouping reports by incident type
    for (const key in reports) {
        const report = reports[key];
        const incidentType = report.incidentType;

        if (!groupedReports[incidentType]) {
            groupedReports[incidentType] = [];
        }

        groupedReports[incidentType].push(report);
    }

    // Displaying grouped reports
    for (const incidentType in groupedReports) {
        const reportSection = document.createElement('div');
        reportSection.classList.add('report-section');

        const reportTitle = document.createElement('h2');
        reportTitle.textContent = incidentType;
        reportSection.appendChild(reportTitle);

        const reportTable = document.createElement('table');
        const tableHeader = `
            <thead>
                <tr>
                    <th>UserID</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Reference Number</th>
                    <th>Location</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
        `;
        reportTable.innerHTML = tableHeader;

        const tableBody = document.createElement('tbody');

        groupedReports[incidentType].forEach(report => {
            const reportRow = `
                <tr data-report-id="${report.refNumber}">
                    <td>${report.userID}</td>
                    <td>${report.incidentType}</td>
                    <td>${report.dateTime}</td>
                    <td>${report.refNumber}</td>
                    <td>${report.location}</td>
                    <td>${report.description}</td>
                    <td>${report.status}</td>
                    <td>
                        <button data-toggle="modal" data-target="#reportModal" data-report-id="${report.refNumber}">View</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += reportRow;
        });

        reportTable.appendChild(tableBody);
        reportSection.appendChild(reportTable);
        reportsContainer.appendChild(reportSection);
    }

    // Add event listeners to view buttons after reports are displayed
    document.querySelectorAll('button[data-report-id]').forEach(button => {
        button.addEventListener('click', (event) => {
            const reportId = event.currentTarget.getAttribute('data-report-id');
            const report = reports[reportId];
            if (report) {
                document.getElementById('modalReportStatus').value = report.status;
                document.getElementById('modalReportDetails').innerHTML = `
                    <p><strong>UserID:</strong> ${report.userID}</p>
                    <p><strong>Category:</strong> ${report.incidentType}</p>
                    <p><strong>Date:</strong> ${report.dateTime}</p>
                    <p><strong>Reference Number:</strong> ${report.refNumber}</p>
                    <p><strong>Location:</strong> ${report.location}</p>
                    <p><strong>Description:</strong> ${report.description}</p>
                    <p><strong>Status:</strong> ${report.status}</p>
                `;
                document.getElementById('updateReportStatus').setAttribute('data-report-id', reportId);
                // Show the modal using Bootstrap
                $('#reportModal').modal('show');
            }
        });
    });
}

async function fetchReports() {
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'Make Report Instance'));
        if (snapshot.exists()) {
            const reports = snapshot.val();
            // Filter reports based on status "Submitted" before displaying
            const filteredReports = Object.fromEntries(
                Object.entries(reports).filter(([_, report]) => report.status === 'Submitted')
            );
            displayReports(filteredReports);
        } else {
            console.log("No data available");
        }
    } catch (error) {
        console.error('Error fetching reports:', error.message);
    }
}
fetchReports();

document.getElementById('updateReportStatus').addEventListener('click', async () => {
    const reportId = document.getElementById('updateReportStatus').getAttribute('data-report-id');
    const newStatus = document.getElementById('modalReportStatus').value;

    // Update the report status without requiring an image
    const reportRef = ref(db, 'Make Report Instance/' + reportId);
    try {
        await update(reportRef, { status: newStatus });
        console.log('Report status updated successfully');
        $('#reportModal').modal('hide');
        const reportRow = document.querySelector(`tr[data-report-id="${reportId}"]`);
        if (reportRow) {
            const statusCell = reportRow.querySelector('td:nth-child(7)'); // Assuming status is the 7th cell
            if (statusCell) {
                statusCell.textContent = newStatus;
            }
        }
    } catch (error) {
        console.error('Error updating report status:', error.message);
    }
    const auth = getAuth();

    // Add event listener to the logout button
    document.querySelector('.logout').addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default action of the link
        
        // Sign out the user
        signOut(auth)
            .then(() => {
                // Sign-out successful.
                console.log("User signed out successfully");
                window.location.href = "Login.html"; // Redirect to login page after logout
            })
            .catch((error) => {
                // An error happened.
                console.error("Error signing out:", error);
            });
    });
});

window.onload = fetchReports;
