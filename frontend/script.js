// KMRL Management System JavaScript
// Initialize Lenis
const lenis = new Lenis({
    autoRaf: true,
  });
  
  // Listen for the scroll event and log the event data
  lenis.on('scroll', (e) => {
    // This can be noisy in the console, you can comment it out if not needed for debugging
    // console.log(e);
  });

// Global variables
let currentUser = null;
let constraints = []; // Already declared
let schedules = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    initializeRevealOnScroll();
    initializeTheme();
});

function initializeApp() {
    initializeDatePickers();
    initializeCharts();
    setupEventListeners();
    checkLoginStatus();
}

function initializeRevealOnScroll() {
    const revealElements = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || revealElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach(el => observer.observe(el));
}

function setupEventListeners() {
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('constraintsForm')?.addEventListener('submit', handleConstraintsSubmit);
    document.getElementById('scheduleForm')?.addEventListener('submit', handleScheduleRequest); // Renamed for clarity
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'admin' && password === 'admin') {
        currentUser = { username: username, role: 'admin' };
        localStorage.setItem('kmrl_user', JSON.stringify(currentUser));
        document.getElementById('loginPage').classList.add('d-none');
        document.getElementById('dashboardPage').classList.remove('d-none');
        showDashboard();
    } else {
        const errorMsg = document.getElementById('loginErrorMsg');
        errorMsg.textContent = 'Invalid credentials. Use admin/admin for demo.';
        errorMsg.style.display = 'block';
    }
}

function checkLoginStatus() {
    const savedUser = localStorage.getItem('kmrl_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('loginPage').classList.add('d-none');
        document.getElementById('dashboardPage').classList.remove('d-none');
        showDashboard();
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('kmrl_user');
    document.getElementById('dashboardPage').classList.add('d-none');
    document.getElementById('loginPage').classList.remove('d-none');
}

// --- Content Visibility Functions ---
function showDashboard() {
    setActiveNav('navDashboard');
    showContent('dashboardContent');
    refreshDashboardData();
    initializeDashboardCalendar(); // <-- Add this line
}

function showConstraints() {
    setActiveNav('navConstraints');
    showContent('constraintsContent');
}

function showSchedules() {
    setActiveNav('navSchedules');
    showContent('schedulesContent');
    // Clear previous results when navigating to the page
    const resultContainer = document.getElementById('scheduleApiResult');
    if(resultContainer) {
        resultContainer.innerHTML = "";
    }
}

function showReports() {
    setActiveNav('navReports');
    showContent('reportsContent');
    refreshReportsData();
}

function showContent(contentId) {
    // Hide all main content sections
    ['dashboardContent', 'constraintsContent', 'schedulesContent', 'reportsContent'].forEach(id => {
        document.getElementById(id)?.classList.add('d-none');
    });
    
    // Show the selected one
    const selectedContent = document.getElementById(contentId);
    if (selectedContent) {
        selectedContent.classList.remove('d-none');
        selectedContent.classList.add('fade-in');
    }
}

function setActiveNav(navId) {
    document.querySelectorAll('#mainNavbar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.getElementById(navId)?.classList.add('active');
}
// ------------------------------------

function initializeDatePickers() {
    if (typeof flatpickr !== 'undefined') {
        flatpickr("#fitnessDate", { dateFormat: "Y-m-d" });
        flatpickr("#startDate", { dateFormat: "Y-m-d" });
        flatpickr("#endDate", { dateFormat: "Y-m-d" });
    }
}

function handleConstraintsSubmit(e) {
    e.preventDefault();
    const formData = {
        id: Date.now(), // Unique id
        trainId: document.getElementById('trainId').value,
        fitnessDate: document.getElementById('fitnessDate').value,
        jobCardStatus: document.getElementById('jobCardStatus').value,
        brandingPriority: document.getElementById('brandingPriority').value,
        mileage: document.getElementById('mileage').value,
        cleaningSlot: document.getElementById('cleaningSlot').value,
        stablingPosition: document.getElementById('stablingPosition').value
    };
    constraints.push(formData);
    showNotification('Constraints submitted successfully!', 'success');
    document.getElementById('constraintsForm').reset();
    renderConstraintsList();
}

function renderConstraintsList() {
    const container = document.getElementById('formRequestMsg');
    if (!container) return;
    if (constraints.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }
    container.style.display = 'block';
    container.innerHTML = `
        <h5 class="mt-3">Submitted Constraints</h5>
        <table class="table table-bordered table-sm">
            <thead>
                <tr>
                    <th>Train ID</th>
                    <th>Fitness Date</th>
                    <th>Job Card Status</th>
                    <th>Branding Priority</th>
                    <th>Mileage</th>
                    <th>Cleaning Slot</th>
                    <th>Stabling Position</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${constraints.map(item => `
                    <tr>
                        <td>${item.trainId}</td>
                        <td>${item.fitnessDate}</td>
                        <td>${item.jobCardStatus}</td>
                        <td>${item.brandingPriority}</td>
                        <td>${item.mileage}</td>
                        <td>${item.cleaningSlot}</td>
                        <td>${item.stablingPosition}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="editConstraint(${item.id})">Edit</button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteConstraint(${item.id})">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

window.editConstraint = function(id) {
    const item = constraints.find(c => c.id === id);
    if (!item) return;
    document.getElementById('trainId').value = item.trainId;
    document.getElementById('fitnessDate').value = item.fitnessDate;
    document.getElementById('jobCardStatus').value = item.jobCardStatus;
    document.getElementById('brandingPriority').value = item.brandingPriority;
    document.getElementById('mileage').value = item.mileage;
    document.getElementById('cleaningSlot').value = item.cleaningSlot;
    document.getElementById('stablingPosition').value = item.stablingPosition;
    // Remove old entry so submit will update
    constraints = constraints.filter(c => c.id !== id);
    renderConstraintsList();
};

window.deleteConstraint = function(id) {
    constraints = constraints.filter(c => c.id !== id);
    renderConstraintsList();
};

function handleScheduleRequest(e) {
    e.preventDefault();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const resultContainer = document.getElementById('scheduleApiResult');

    if (!startDate || !endDate) {
        showNotification("Please select both start and end dates.", "warning");
        return;
    }

    // Show loader
    resultContainer.innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="height: 120px;">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <span class="ms-3">Fetching schedules...</span>
        </div>
    `;

    setTimeout(() => {
        // Calculate date difference
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

        // Train names and routes
        const trainNames = Array.from({length: 24}, (_, i) => `KM-${(i+1).toString().padStart(3, '0')}`);
        const trainRoutes = [
            'Aluva - Petta',
            'Petta - Aluva',
            'Maharaja - Muttom',
            'Muttom - Maharaja',
            'Aluva - Maharaja',
            'Petta - Muttom'
        ];
        const statuses = ['On Time', 'Delayed', 'Cancelled'];

        let scheduleData = [];

        for (let i = 0; i < diffDays; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);

            for (let t = 0; t < 24; t++) {
                const trainId = trainNames[t];
                const route = trainRoutes[Math.floor(Math.random() * trainRoutes.length)];
                // Departure between 6:00 and 20:00
                const depHour = 6 + Math.floor(Math.random() * 14);
                const depMinute = Math.floor(Math.random() * 60);
                const departureTime = `${depHour.toString().padStart(2, '0')}:${depMinute.toString().padStart(2, '0')}`;
                // Arrival 30-90 min after departure
                const arrOffset = 30 + Math.floor(Math.random() * 61);
                const arrDate = new Date(date);
                arrDate.setHours(depHour, depMinute + arrOffset);
                const arrivalTime = `${arrDate.getHours().toString().padStart(2, '0')}:${arrDate.getMinutes().toString().padStart(2, '0')}`;
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                const passengers = 100 + Math.floor(Math.random() * 400); // 100-500

                scheduleData.push({
                    date: date.toISOString().slice(0, 10),
                    trainId,
                    route,
                    departureTime,
                    arrivalTime,
                    status,
                    passengers
                });
            }
        }

        // Show in table
        let html = `
            <div class="table-responsive mt-3">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Train ID</th>
                            <th>Route</th>
                            <th>Departure Time</th>
                            <th>Arrival Time</th>
                            <th>Status</th>
                            <th>Passengers</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${scheduleData.map(item => `
                            <tr>
                                <td>${item.date}</td>
                                <td>${item.trainId}</td>
                                <td>${item.route}</td>
                                <td>${item.departureTime}</td>
                                <td>${item.arrivalTime}</td>
                                <td>${item.status}</td>
                                <td>${item.passengers}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        resultContainer.innerHTML = html;
        showNotification('Schedules generated successfully!', 'success');
    }, 2000); // 2 second delay
}

function refreshDashboardData() {
    updateQuickStats();
    updateDashboardCards();
}

function updateQuickStats() {
    const stats = {
        totalTrains: 24,
        activeRoutes: 8,
        dailyPassengers: 0,
        systemEfficiency: 5
    };
    
    Object.keys(stats).forEach(key => {
        const element = document.querySelector(`[data-stat="${key}"]`);
        if (element) {
            animateNumber(element, stats[key]);
        }
    });
}

function updateDashboardCards() {
    // Yahan apni values daalein
    const data = {
        totalTrains: 30,         // Naya data
        readyForService: 22,     // Naya data
        standby: 5,              // Naya data
        maintenance: 3           // Naya data
    };

    const totalTrainsEl = document.getElementById('totalTrainsCount');
    if (totalTrainsEl) {
        animateNumber(totalTrainsEl, data.totalTrains);
    }

    const readyForServiceEl = document.getElementById('readyForServiceCount');
    if (readyForServiceEl) {
        animateNumber(readyForServiceEl, data.readyForService);
    }

    const standbyEl = document.getElementById('standbyCount');
    if (standbyEl) {
        animateNumber(standbyEl, data.standby);
    }

    const maintenanceEl = document.getElementById('maintenanceCount');
    if (maintenanceEl) {
        animateNumber(maintenanceEl, data.maintenance);
    }
}

function refreshReportsData() {
    initializeCharts();
}

function initializeCharts() {
    if (typeof Chart === 'undefined') return;
    
    // NOTE: This is a simplified chart initialization. In a real app,
    // you might want to destroy old charts before creating new ones
    // to prevent memory leaks if the data is dynamic.
    
    // Passenger Flow Chart
    const passengerCtx = document.getElementById('passengerChart');
    if (passengerCtx) {
        new Chart(passengerCtx, {
            type: 'line',
            data: {
                labels: ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'],
                datasets: [{
                    label: 'Passenger Flow',
                    data: [1200, 4200, 2200, 2100, 2600, 3200, 4500, 2800],
                    borderColor: '#0066cc',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    fill: true
                }]
            }
        });
    }

    // Performance Chart
    const performanceCtx = document.getElementById('performanceChart');
    if (performanceCtx) {
        new Chart(performanceCtx, {
            type: 'doughnut',
            data: {
                labels: ['On Time', 'Delayed', 'Cancelled'],
                datasets: [{ data: [94.2, 4.8, 1.0], backgroundColor: ['#28a745', '#ffc107', '#dc3545'] }]
            }
        });
    }

    // Add other chart initializations (trends, route) here if needed
}

function animateNumber(element, targetValue) {
    const suffix = element.getAttribute('data-suffix') || '';
    const startValue = parseFloat(element.textContent.replace(/[^0-9.]/g, '')) || 0;
    const duration = 1500;
    const startTime = performance.now();

    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = startValue + (targetValue - startValue) * progress;

        if (targetValue % 1 !== 0 || suffix === '%') { // Handle decimals
            element.textContent = currentValue.toFixed(1) + suffix;
        } else {
            element.textContent = Math.round(currentValue).toLocaleString();
        }

        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        } else {
            // Ensure final value is accurate
            if (targetValue % 1 !== 0 || suffix === '%') {
                 element.textContent = targetValue.toFixed(1) + suffix;
            } else {
                 element.textContent = targetValue.toLocaleString();
            }
        }
    }
    requestAnimationFrame(updateNumber);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
    notification.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

function initializeDashboardCalendar() {
    const calendarEl = document.getElementById('dashboardCalendar');
    if (!calendarEl || typeof FullCalendar === 'undefined') return;

    // Generate random train schedules and maintenance windows for calendar
    const today = new Date();
    let events = [];
    const trainNames = Array.from({length: 24}, (_, i) => `KM-${(i+1).toString().padStart(3, '0')}`);
    const trainRoutes = [
        'Aluva - Petta',
        'Petta - Aluva',
        'Maharaja - Muttom',
        'Muttom - Maharaja',
        'Aluva - Maharaja',
        'Petta - Muttom'
    ];

    // Add train schedules for next 7 days
    for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() + d);
        const dateStr = date.toISOString().slice(0, 10);

        // 5 random trains per day
        for (let t = 0; t < 5; t++) {
            const trainId = trainNames[Math.floor(Math.random() * trainNames.length)];
            const route = trainRoutes[Math.floor(Math.random() * trainRoutes.length)];
            const depHour = 6 + Math.floor(Math.random() * 14);
            const depMinute = Math.floor(Math.random() * 60);
            const arrOffset = 30 + Math.floor(Math.random() * 61);
            const startTime = `${dateStr}T${depHour.toString().padStart(2, '0')}:${depMinute.toString().padStart(2, '0')}:00`;
            const arrDate = new Date(date);
            arrDate.setHours(depHour, depMinute + arrOffset);
            const endTime = `${dateStr}T${arrDate.getHours().toString().padStart(2, '0')}:${arrDate.getMinutes().toString().padStart(2, '0')}:00`;

            events.push({
                title: `${trainId} (${route})`,
                start: startTime,
                end: endTime,
                color: '#0066cc'
            });
        }

        // 1 maintenance window per day
        const maintHour = 12 + Math.floor(Math.random() * 6);
        events.push({
            title: `Maintenance Window`,
            start: `${dateStr}T${maintHour}:00:00`,
            end: `${dateStr}T${maintHour + 2}:00:00`,
            color: '#dc3545'
        });
    }

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        height: 500,
        events: events,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }
    });
    calendar.render();
}

// Global access for onclick attributes
window.showDashboard = showDashboard;
window.showConstraints = showConstraints;
window.showSchedules = showSchedules;
window.showReports = showReports;
window.logout = logout;

/*  Add in <head> section 
<link href="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/main.min.css" rel="stylesheet">
*/
/*  Add before closing </body> tag 
<script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/main.min.js"></script>
*/
