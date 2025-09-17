# KMRL Management System

A comprehensive web-based management system for Kochi Metro Rail Limited (KMRL) operations.

## Features

### 🔐 Login System
- Simple admin authentication
- Demo credentials: `admin` / `admin123`
- Secure session management with localStorage

### 📊 Dashboard
- **Top Navigation**: KMRL logo and user profile dropdown
- **Left Sidebar**: Navigation menu (Dashboard, Constraints, Schedules, Reports)
- **Quick Stats Cards**: 
  - Total Trains (24)
  - Active Routes (8)
  - Daily Passengers (45,230)
  - System Efficiency (94.2%)
- **Interactive Tabs**:
  - **Table View**: Real-time train schedule overview
  - **Calendar View**: Schedule calendar interface
  - **Charts View**: Passenger flow and performance charts

### ⚙️ Constraints Management
- **Input Form** with:
  - Constraint type dropdown (Maintenance, Weather, Traffic, Emergency, Other)
  - Route selection (Aluva-Petta, Petta-Aluva, All Routes)
  - Date/time pickers for start and end times
  - Severity level selection (Low, Medium, High, Critical)
  - Description textarea
  - Passenger notification checkbox
- **Constraints Table**: View, edit, and delete existing constraints
- **Real-time Updates**: Dynamic table updates with color-coded severity badges

### 📈 Reports & Analytics
- **Efficiency Metrics Cards**:
  - On-Time Performance (94.2%)
  - System Availability (98.7%)
  - Daily Passengers (45,230)
  - Delay Rate (2.3%)
- **Interactive Charts**:
  - Performance trends over time
  - Route-specific performance comparison
  - Passenger flow patterns
  - System efficiency doughnut chart
- **Detailed Reports Table**: Comprehensive performance data

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5.3.0
- **Icons**: Font Awesome 6.0.0
- **Charts**: Chart.js
- **Date/Time Picker**: Flatpickr
- **Styling**: Custom CSS with KMRL branding

## File Structure

```
web development/
├── index.html          # Main application file
├── styles.css          # Custom styling and KMRL theme
├── script.js           # Application logic and functionality
└── README.md           # This documentation
```

## Getting Started

1. **Open the Application**:
   - Simply open `index.html` in any modern web browser
   - No server setup required for basic functionality

2. **Login**:
   - Use demo credentials: `admin` / `admin123`
   - Session persists across browser refreshes

3. **Navigate**:
   - Use the left sidebar to switch between different sections
   - Dashboard provides overview and quick access to key metrics
   - Constraints section for managing operational constraints
   - Reports section for detailed analytics

## Key Features

### 🎨 Design
- **KMRL Branding**: Custom color scheme with KMRL blue (#0066cc)
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional interface with smooth animations
- **Accessibility**: Proper contrast ratios and keyboard navigation

### 📱 Responsive Layout
- **Desktop**: Full sidebar navigation with expanded content
- **Tablet**: Collapsible sidebar with touch-friendly interface
- **Mobile**: Stacked layout with mobile-optimized navigation

### 🔧 Functionality
- **Real-time Updates**: Dynamic data refresh and live updates
- **Form Validation**: Client-side validation for all input forms
- **Data Persistence**: Local storage for user sessions and constraints
- **Interactive Charts**: Multiple chart types with real-time data
- **Notification System**: User feedback for all actions

### 🚀 Performance
- **Fast Loading**: Optimized CSS and JavaScript
- **Smooth Animations**: CSS transitions and JavaScript animations
- **Efficient Rendering**: Minimal DOM manipulation
- **Caching**: Local storage for improved performance

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Demo Data

The application includes realistic demo data:
- 24 active trains across 8 routes
- Daily passenger count of 45,230
- 94.2% system efficiency
- Sample constraints and schedules
- Historical performance data

## Customization

### Colors
The KMRL theme can be customized by modifying CSS variables in `styles.css`:
```css
:root {
    --kmrl-blue: #0066cc;
    --kmrl-light-blue: #e6f2ff;
    --kmrl-dark-blue: #004499;
}
```

### Data Sources
In a production environment, replace the demo data in `script.js` with actual API calls to your backend services.

## Security Notes

- This is a demo application with client-side authentication
- For production use, implement proper server-side authentication
- Add HTTPS for secure data transmission
- Implement proper input validation and sanitization

## Support

For technical support or feature requests, please contact the development team.

---

**KMRL Management System** - Streamlining metro operations with modern web technology.

