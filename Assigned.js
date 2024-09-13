import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getDatabase, ref, get, child, update } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js";

// Firebase configuration

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


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

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

onAuthStateChanged(auth, (user) => {
    if (user) {
        loggedInUser = user;
        console.log('Logged in user:', loggedInUser.email); // Add this to log the logged-in user's email

        // Assign specialization based on the user's email
        let specialization = '';
        switch (loggedInUser.email) {
            case 'eskom@gmail.com':
                specialization = 'Electricity';
                break;
            case 'water@gmail.com':
                specialization = 'Water';
                break;
            case 'road@gmail.com':
                specialization = 'Potholes';
                break;
            // Add other cases for different specializations
            default:
                console.log('No specialization found for the user.');
                break;
        }

        console.log('Specialization:', specialization); // Log the specialization
        fetchReports(specialization); // Fetch reports after specialization is set
    } else {
        console.log('No user is signed in.');
    }
});

async function fetchReports(specialization) {
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'Make Report Instance'));
        if (snapshot.exists()) {
            const reports = snapshot.val();
            console.log('All reports:', reports); // Log all the reports to verify the data

            // Filter reports based on status and user specialization
            const filteredReports = Object.fromEntries(
                Object.entries(reports).filter(([key, report]) => {
                    console.log(`Report ID: ${key}, Status: ${report.status}, IncidentType: ${report.incidentType}`);
                    return report.status === 'In Progress' && report.incidentType === specialization;
                })
            );
            
            console.log('Filtered reports:', filteredReports); // Log the filtered reports
            displayReports(filteredReports); 
        } else {
            console.log("No data available");
        }
    } catch (error) {
        console.error('Error fetching reports:', error.message);
    }
}



document.getElementById('updateReportStatus').addEventListener('click', async () => {
    const reportId = document.getElementById('updateReportStatus').getAttribute('data-report-id');
    const newStatus = document.getElementById('modalReportStatus').value;

    if (newStatus === 'Resolved') {
        const fileInput = document.getElementById('modalReportImageUpload');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please upload an image before updating the status to "Resolved".');
            return;
        }

        // Upload the image to Firebase Storage
        const imageRef = storageRef(storage, `report-images/${reportId}`);
        try {
            const snapshot = await uploadBytes(imageRef, file);
            console.log('Upload successful:', snapshot);

            // You can still get the image URL if needed for other uses (e.g., displaying in the UI)
            const imageUrl = await getDownloadURL(imageRef);
            console.log('Image URL:', imageUrl);

            // Update the report status in the Realtime Database
            const reportRef = ref(db, 'Make Report Instance/' + reportId);
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
            console.error('Error uploading image or updating report status:', error.message);
        }
    } else {
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
    }
});

window.onload = fetchReports;
