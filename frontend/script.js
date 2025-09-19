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
let constraints = [];
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
}

function showConstraints() {
    setActiveNav('navConstraints');
    showContent('constraintsContent');
}

// CORRECTED FUNCTION
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
        trainId: document.getElementById('trainId').value,
        fitnessDate: document.getElementById('fitnessDate').value,
        jobCardStatus: document.getElementById('jobCardStatus').value,
        brandingPriority: document.getElementById('brandingPriority').value,
        mileage: document.getElementById('mileage').value,
        cleaningSlot: document.getElementById('cleaningSlot').value,
        stablingPosition: document.getElementById('stablingPosition').value
    };
    console.log("Constraint form submitted:", formData);
    showNotification('Constraints submitted successfully!', 'success');
    document.getElementById('constraintsForm').reset();
}

function handleScheduleRequest(e) {
    e.preventDefault();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        showNotification("Please select both start and end dates.", "warning");
        return;
    }

    // This is where you would make a real API call
    console.log(`Fetching schedules from ${startDate} to ${endDate}`);
    showNotification('Fetching schedules...', 'info');

    // MOCKUP: Displaying dummy data after a short delay
    setTimeout(() => {
         const dummyData = [
            { trainName: 'KM-004', trainPath: 'Aluva - Petta', time: '09:00' },
            { trainName: 'KM-005', trainPath: 'Petta - Aluva', time: '09:15' }
        ];
        
        let html = `
            <div class="table-responsive mt-3">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Train Name</th>
                            <th>Train Path</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dummyData.map(item => `
                            <tr>
                                <td>${item.trainName}</td>
                                <td>${item.trainPath}</td>
                                <td>${item.time}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('scheduleApiResult').innerHTML = html;
    }, 1000);
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

// Global access for onclick attributes
window.showDashboard = showDashboard;
window.showConstraints = showConstraints;
window.showSchedules = showSchedules;
window.showReports = showReports;
window.logout = logout;
