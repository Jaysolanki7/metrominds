// KMRL Management System JavaScript

// Global variables
let currentUser = null;
let constraints = [];
let schedules = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    initializeRevealOnScroll();
});

function initializeApp() {
    // Initialize date/time pickers
    initializeDatePickers();
    
    // Initialize charts
    initializeCharts();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check if user is already logged in
    checkLoginStatus();
}

// Smooth reveal on scroll using IntersectionObserver
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

// Login functionality
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const constraintsForm = document.getElementById('constraintsForm');
    if (constraintsForm) {
        constraintsForm.addEventListener('submit', handleConstraintsSubmit);
    }

    const generateBtn = document.getElementById('generateScheduleBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerateSchedule);
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Simple authentication (in real app, this would be server-side)
    if (username === 'admin' && password === 'admin123') {
        currentUser = { username: username, role: 'admin' };
        localStorage.setItem('kmrl_user', JSON.stringify(currentUser));
        showDashboard();
    } else {
        alert('Invalid credentials. Use admin/admin123 for demo.');
    }
}

function checkLoginStatus() {
    const savedUser = localStorage.getItem('kmrl_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('kmrl_user');
    showLogin();
}

function showLogin() {
    document.getElementById('loginPage').classList.remove('d-none');
    document.getElementById('dashboardPage').classList.add('d-none');
}

function showDashboard() {
    document.getElementById('loginPage').classList.add('d-none');
    document.getElementById('dashboardPage').classList.remove('d-none');
    
    // Show dashboard content and hide others
    showContent('dashboardContent');
    
    // Update active nav item
    updateActiveNavItem('dashboard');
    
    // Refresh dashboard data
    refreshDashboardData();
}

// Navigation functions
function showConstraints() {
    showContent('constraintsContent');
    updateActiveNavItem('constraints');
}

function showSchedules() {
    showContent('schedulesContent');
    updateActiveNavItem('schedules');
}

function showReports() {
    showContent('reportsContent');
    updateActiveNavItem('reports');
    refreshReportsData();
}

function showContent(contentId) {
    // Hide all content sections
    const contentSections = ['dashboardContent', 'constraintsContent', 'schedulesContent', 'reportsContent'];
    contentSections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('d-none');
        }
    });
    
    // Show selected content
    const selectedContent = document.getElementById(contentId);
    if (selectedContent) {
        selectedContent.classList.remove('d-none');
        selectedContent.classList.add('fade-in');
    }
}

function updateActiveNavItem(activeItem) {
    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.sidebar .nav-link');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to selected item
    const activeNavItem = document.querySelector(`[onclick="show${activeItem.charAt(0).toUpperCase() + activeItem.slice(1)}()"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
}

// Date/Time picker initialization
function initializeDatePickers() {
    // Initialize Flatpickr for date/time inputs
    if (typeof flatpickr !== 'undefined') {
        flatpickr("#startDate", {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            time_24hr: true,
            minDate: "today"
        });
        
        flatpickr("#endDate", {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            time_24hr: true,
            minDate: "today"
        });

        // Schedules planner date pickers (if present)
        flatpickr("#planStart", {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            time_24hr: true,
            minDate: "today"
        });

        flatpickr("#planEnd", {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            time_24hr: true,
            minDate: "today"
        });
    }
}

// Constraints management
function handleConstraintsSubmit(e) {
    e.preventDefault();
    
    const formData = {
        type: document.getElementById('constraintType').value,
        route: document.getElementById('route').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        severity: document.getElementById('severity').value,
        description: document.getElementById('description').value,
        notifyPassengers: document.getElementById('notifyPassengers').checked,
        id: Date.now(), // Simple ID generation
        status: 'Active',
        createdAt: new Date().toISOString()
    };
    
    // Add to constraints array
    constraints.push(formData);
    
    // Update constraints table
    updateConstraintsTable();
    
    // Show success message
    showNotification('Constraint added successfully!', 'success');
    
    // Reset form
    resetConstraintsForm();
}

function updateConstraintsTable() {
    const tbody = document.getElementById('constraintsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    constraints.forEach(constraint => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${constraint.type}</td>
            <td>${constraint.route}</td>
            <td>${constraint.startDate}</td>
            <td>${constraint.endDate}</td>
            <td><span class="badge bg-${getSeverityColor(constraint.severity)}">${constraint.severity}</span></td>
            <td><span class="badge bg-success">${constraint.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editConstraint(${constraint.id})">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteConstraint(${constraint.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getSeverityColor(severity) {
    const colors = {
        'low': 'success',
        'medium': 'warning',
        'high': 'danger',
        'critical': 'dark'
    };
    return colors[severity] || 'secondary';
}

function resetConstraintsForm() {
    document.getElementById('constraintsForm').reset();
}

function editConstraint(id) {
    const constraint = constraints.find(c => c.id === id);
    if (constraint) {
        // Populate form with constraint data
        document.getElementById('constraintType').value = constraint.type;
        document.getElementById('route').value = constraint.route;
        document.getElementById('startDate').value = constraint.startDate;
        document.getElementById('endDate').value = constraint.endDate;
        document.getElementById('severity').value = constraint.severity;
        document.getElementById('description').value = constraint.description;
        document.getElementById('notifyPassengers').checked = constraint.notifyPassengers;
        
        // Scroll to form
        document.getElementById('constraintsForm').scrollIntoView({ behavior: 'smooth' });
    }
}

function deleteConstraint(id) {
    if (confirm('Are you sure you want to delete this constraint?')) {
        constraints = constraints.filter(c => c.id !== id);
        updateConstraintsTable();
        showNotification('Constraint deleted successfully!', 'success');
    }
}

// Dashboard data refresh
function refreshDashboardData() {
    // Simulate data refresh
    updateQuickStats();
    updateScheduleTable();
}

function updateQuickStats() {
    // In a real application, this would fetch data from an API
    const stats = {
        totalTrains: 24,
        activeRoutes: 8,
        dailyPassengers: 45230,
        systemEfficiency: 94.2
    };
    
    // Update the stats display (if elements exist)
    const elements = {
        'totalTrains': stats.totalTrains,
        'activeRoutes': stats.activeRoutes,
        'dailyPassengers': stats.dailyPassengers.toLocaleString(),
        'systemEfficiency': stats.systemEfficiency + '%'
    };
    
    // Animate number changes
    Object.keys(elements).forEach(key => {
        const element = document.querySelector(`[data-stat="${key}"]`);
        if (element) {
            animateNumber(element, elements[key]);
        }
    });
}

function updateScheduleTable() {
    const tbody = document.getElementById('schedulesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    schedules.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.trainId}</td>
            <td>${item.route}</td>
            <td>${item.time}</td>
            <td><span class="badge bg-${item.statusColor}">${item.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// Generate schedules between selected start and end times at 15-min intervals
function handleGenerateSchedule() {
    const startInput = document.getElementById('planStart');
    const endInput = document.getElementById('planEnd');
    
    const startVal = startInput ? startInput.value : '';
    const endVal = endInput ? endInput.value : '';

    if (!startVal || !endVal) {
        showNotification('Please select Start and End date/time.', 'warning');
        return;
    }

    const start = new Date(startVal.replace(' ', 'T'));
    const end = new Date(endVal.replace(' ', 'T'));

    if (isNaN(start) || isNaN(end)) {
        showNotification('Invalid date/time format.', 'danger');
        return;
    }

    if (end <= start) {
        showNotification('End must be after Start.', 'danger');
        return;
    }

    const intervalMinutes = 15;
    const routes = ['Aluva - Petta', 'Petta - Aluva'];
    const statusOptions = [
        { label: 'On Time', color: 'success' },
        { label: 'Boarding', color: 'warning' },
        { label: 'Delayed', color: 'danger' }
    ];

    const generated = [];
    let current = new Date(start.getTime());
    let trainCounter = 100;

    while (current <= end) {
        const route = routes[generated.length % routes.length];
        const status = statusOptions[generated.length % statusOptions.length];
        const timeStr = current.toTimeString().slice(0,5);

        generated.push({
            trainId: `KM${trainCounter++}`,
            route: route,
            time: timeStr,
            status: status.label,
            statusColor: status.color
        });

        current = new Date(current.getTime() + intervalMinutes * 60000);
    }

    schedules = generated;
    updateScheduleTable();
    showNotification('Schedule generated successfully!', 'success');
}

// Reports data refresh
function refreshReportsData() {
    // Initialize or refresh charts
    initializeCharts();
}

// Chart initialization
function initializeCharts() {
    // Passenger Flow Chart
    const passengerCtx = document.getElementById('passengerChart');
    if (passengerCtx) {
        new Chart(passengerCtx, {
            type: 'line',
            data: {
                labels: ['6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
                datasets: [{
                    label: 'Passenger Flow',
                    data: [1200, 2500, 4200, 3800, 2200, 1800, 2100, 2400, 2600, 2200, 1800, 3200, 4500, 4200, 2800],
                    borderColor: '#0066cc',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
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
                datasets: [{
                    data: [94.2, 4.8, 1.0],
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Trends Chart (Reports page)
    const trendsCtx = document.getElementById('trendsChart');
    if (trendsCtx) {
        new Chart(trendsCtx, {
            type: 'line',
            data: {
                labels: ['Jan 1', 'Jan 2', 'Jan 3', 'Jan 4', 'Jan 5', 'Jan 6', 'Jan 7', 'Jan 8', 'Jan 9', 'Jan 10', 'Jan 11', 'Jan 12', 'Jan 13', 'Jan 14', 'Jan 15'],
                datasets: [{
                    label: 'On-Time Performance %',
                    data: [92.5, 93.1, 94.2, 93.8, 94.5, 95.1, 94.8, 93.9, 94.2, 94.7, 95.0, 94.3, 94.6, 94.9, 94.2],
                    borderColor: '#0066cc',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'System Availability %',
                    data: [98.2, 98.5, 98.7, 98.4, 98.8, 98.9, 98.6, 98.3, 98.7, 98.8, 98.9, 98.5, 98.7, 98.8, 98.7],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 90,
                        max: 100,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Route Performance Chart (Reports page)
    const routeCtx = document.getElementById('routeChart');
    if (routeCtx) {
        new Chart(routeCtx, {
            type: 'bar',
            data: {
                labels: ['Aluva-Petta', 'Petta-Aluva', 'Aluva-Kakkanad', 'Kakkanad-Aluva'],
                datasets: [{
                    label: 'Efficiency %',
                    data: [95.8, 94.9, 93.2, 94.5],
                    backgroundColor: ['#0066cc', '#28a745', '#ffc107', '#17a2b8'],
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 90,
                        max: 100,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// Utility functions
function animateNumber(element, targetValue) {
    const suffix = element.getAttribute('data-suffix') || '';
    const parseNumeric = (v) => {
        if (typeof v === 'number') return v;
        const cleaned = String(v).replace(/[^0-9.\-]/g, '');
        const n = Number(cleaned);
        return isNaN(n) ? 0 : n;
    };

    const startValue = parseNumeric(element.textContent);
    const endValue = parseNumeric(targetValue);
    const hasDecimals = String(endValue).includes('.')
    const duration = 1000;
    const startTime = performance.now();

    function formatValue(v) {
        const options = hasDecimals ? { maximumFractionDigits: 1, minimumFractionDigits: 1 } : {};
        const formatted = hasDecimals ? Number(v).toFixed(1) : Math.round(v).toLocaleString();
        return `${formatted}${suffix}`;
    }

    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = startValue + (endValue - startValue) * progress;
        element.textContent = formatValue(currentValue);

        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        } else {
            element.textContent = formatValue(endValue);
        }
    }

    requestAnimationFrame(updateNumber);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Export functions for global access
window.showDashboard = showDashboard;
window.showConstraints = showConstraints;
window.showSchedules = showSchedules;
window.showReports = showReports;
window.logout = logout;
window.resetConstraintsForm = resetConstraintsForm;
window.editConstraint = editConstraint;
window.deleteConstraint = deleteConstraint;
