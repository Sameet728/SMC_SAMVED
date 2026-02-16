# Samved - Smart Healthcare Management System 🏥

## 🌟 Project Overview

**Samved** is a comprehensive healthcare management system designed for the **Solapur Municipal Corporation (SMC)** to streamline hospital operations, citizen healthcare services, and administrative management. The platform provides a unified solution for disease surveillance, resource management, health programs, and real-time analytics across the entire municipal healthcare ecosystem.

### Vision
To create a digitally empowered healthcare infrastructure that enables:
- **Early disease outbreak detection** and prevention
- **Efficient resource allocation** across hospitals
- **Citizen-centric healthcare services** with easy access
- **Data-driven decision making** for administrators
- **Seamless coordination** between hospitals, citizens, and government

---

## 🛠️ Technology Stack

### **Backend Technologies**
- **Runtime Environment:** Node.js (JavaScript runtime)
- **Web Framework:** Express.js v5.2.1 (Fast, unopinionated web framework)
- **Database:** MongoDB (NoSQL database for flexible schema)
- **ODM:** Mongoose v9.1.5 (Elegant MongoDB object modeling)
- **Authentication:** 
  - Passport.js (Authentication middleware)
  - Passport-Local Strategy (Username/password authentication)
  - BCrypt v6.0.0 (Password hashing with salt rounds)
- **Session Management:** Express-Session v1.19.0 (Server-side session storage)

### **Frontend Technologies**
- **Template Engine:** EJS v4.0.1 (Embedded JavaScript templates)
- **Styling:** 
  - Tailwind CSS (Utility-first CSS framework)
  - Custom CSS3
  - Responsive design for all devices
- **Client-Side JavaScript:** Vanilla JS with modern ES6+ features

### **Middleware & Utilities**
- **File Upload:** Multer v2.0.2 (Multipart form-data handling for profile images)
- **PDF Generation:** PDFKit v0.17.2 (Professional medical reports)
- **Flash Messages:** Connect-Flash v0.1.1 (User feedback notifications)
- **Environment Variables:** Dotenv v17.2.3 (Secure configuration management)

### **Development Tools**
- **Development Server:** Nodemon v3.1.11 (Auto-restart on file changes)
- **Version Control:** Git & GitHub

---

## 🏗️ System Architecture

### **Multi-Tier Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│                    (Web Browsers)                           │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER (EJS)                   │
│  • Home & Landing Pages                                     │
│  • Role-based Dashboards (Admin/Hospital/Citizen)           │
│  • Dynamic Forms & Data Visualization                       │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│           APPLICATION LAYER (Express.js)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Routes    │  │ Controllers  │  │  Middleware  │       │
│  │ + admin.js  │  │ + adminCtrl  │  │ + auth.js    │       │
│  │ + hospital  │  │ + citizenCtrl│  │ + upload.js  │       │
│  │ + citizen   │  │              │  │ + passport   │       │
│  │ + auth      │  │              │  │              │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│           BUSINESS LOGIC LAYER (Mongoose Models)            │
│  User • Hospital • Doctor • Patient • Citizen               │
│  Program • ProgramApplication • Notification                │
│  Outbreak • Medicine • Equipment • Appointment              │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER (MongoDB)                      │
│            Collections with Indexed Queries                 │
└─────────────────────────────────────────────────────────────┘
```

### **Key Architectural Patterns**
- **MVC Pattern:** Separation of Models, Views, and Controllers
- **Middleware Chain:** Request processing pipeline
- **RESTful API Design:** Standard HTTP methods and routes
- **Role-Based Access Control (RBAC):** Secure role-specific functionality
- **Session-Based Authentication:** Server-side user sessions

---

## 🎯 Core Features & Functionality

### **1. Multi-Role Authentication System** 🔐

#### **User Roles**
- **Admin** - Municipal Corporation administrators
- **Hospital** - Hospital staff and management
- **Citizen** - General public users

#### **Authentication Features**
- **Secure Registration & Login**
  - Email/Username-based authentication
  - BCrypt password hashing (10 salt rounds)
  - Passport.js local strategy
  - Session persistence across requests
  
- **Role-Based Dashboards**
  - Automatic redirect based on user role after login
  - Admin → `/admin/dashboard`
  - Hospital → `/hospital/dashboard`
  - Citizen → `/citizen/dashboard`

- **Session Security**
  - Server-side session storage
  - Session expiry management
  - Secure cookie configuration
  - CSRF protection (implicit)

- **Default Admin Account**
  - Email: `admin@gmail.com`
  - Password: `Ashish@1927`
  - Auto-initialized on server startup
  - Can be regenerated using: `npm run seed-admin`

#### **Implementation Details**
```javascript
// Authentication Middleware
ensureAuthenticated() - Validates user session
ensureAdmin() - Restricts to admin role
ensureHospital() - Restricts to hospital role
ensureCitizen() - Restricts to citizen role
```

---

### **2. Admin Dashboard & Command Center** 📊

The Admin Dashboard provides a comprehensive control panel for municipal healthcare management.

#### **2.1 City-Wide Health Analytics**

**Health Score Metrics** (Multi-dimensional scoring system):
- **City Health Score** (Weighted composite score 0-100)
  - Disease Control Score (25% weight)
  - Infrastructure Score (20% weight)
  - Vaccination Coverage (20% weight)
  - Health Programs Score (15% weight)
  - Emergency Response Score (20% weight)

- **Real-time Statistics**:
  - Total registered users
  - Total citizens with complete profiles
  - Total registered hospitals
  - Active IPD patients (currently admitted)
  - Live health programs
  - Average hospital performance score

**Disease Prevalence Analytics**:
- **Age Group Analysis** (5 age groups):
  - 0-18 years (Children)
  - 19-35 years (Young adults)
  - 36-50 years (Middle-aged)
  - 51-65 years (Senior adults)
  - 65+ years (Elderly)
  
- **Disease Tracking per Age Group**:
  - Dengue prevalence percentage
  - Malaria prevalence percentage
  - COVID-19 prevalence percentage
  - Total patient count per group

**Disease Growth Visualization**:
- **90-Day Cumulative Disease Trends**
  - Tracks disease progression over time
  - Cumulative case counting
  - Multiple disease overlay (Dengue, Malaria, COVID-19, Typhoid, TB)
  - Chart.js visualization with smooth curves
  - Normalized disease names for consistency
  - Date-based aggregation (daily granularity)

**How Disease Growth Calculation Works**:
```javascript
1. Fetches all patients from database
2. Extracts admission dates and disease types
3. Normalizes disease names (dengue, malaria, covid, etc.)
4. Groups cases by date (YYYY-MM-DD format)
5. Calculates cumulative counts for each disease
6. Generates 90-day timeline (last 3 months)
7. Formats data for Chart.js rendering
8. Displays incremental growth curves
```

#### **2.2 Hospital Analytics Dashboard**

**Per-Hospital Metrics**:
- Today's admissions count
- Today's discharges count
- Active IPD patients
- Total bed capacity
- Available beds by type (General, ICU, Isolation)
- Bed occupancy percentage
- Total doctors on staff
- Critical medicine stock alerts
- Doctor workload distribution
- Patient demographics

**Bed Management**:
- General Ward beds (total & available)
- ICU beds (total & available)
- Isolation beds (total & available)
- Real-time occupancy calculation
- Visual bed status indicators

**Resource Tracking**:
- Medicine inventory levels
- Equipment status monitoring
- Low stock alerts (below 10 units)
- Doctor availability status

#### **2.3 Healthcare Programs Management**

**Program Creation**:
- Comprehensive program registration form
- Fields:
  - Program name
  - Detailed description
  - Program type (Vaccination, Health Camp, Maternal Health, Child Health, Awareness, Other)
  - Start and end dates
  - Target audience specification
  - Locations (health centers)
  - Coordinator details
  - Contact information
- Color gradient theming for visual distinction
- Automatic status management (Active, Completed, Cancelled)

**Program Monitoring**:
- Live program listing with filters
- Enrollment statistics
- Application deadline tracking
- Program status updates
- Bulk program management

**Application Review System**:
- View all applications per program
- Individual application details
- Applicant information:
  - Personal details (name, age, gender, contact)
  - Address with ward mapping
  - Aadhar number
  - Medical history
  - Blood group
  - Allergies and current medications
  - Previous vaccinations
  - Emergency contact details
- **Review Actions**:
  - Approve application
  - Reject application
  - Add review notes
  - Track reviewer (admin) and review timestamp
- Filter applications by status (Pending, Approved, Rejected)
- Export application data

#### **2.4 Disease Outbreak Alerts** (In Development) 🚧

**Outbreak Tracking Schema**:
- Disease type (Dengue, Malaria, Typhoid, TB, COVID-19, Cholera, Chikungunya)
- Ward and zone identification
- Case count
- Severity levels (Low, Medium, High, Critical)
- Status (Active, Controlled, Resolved)
- Geospatial coordinates (latitude, longitude)
- Affected population count
- Report and resolution dates
- Actions taken documentation

**Geospatial Features** (Planned):
- 2D sphere indexing for location-based queries
- Heat map visualization of outbreak zones
- Ward-wise disease distribution
- Real-time outbreak updates

**Machine Learning Integration** (Planned) 🤖:
- **Predictive Analytics**:
  - Historical disease pattern analysis
  - Seasonal outbreak prediction
  - High-risk zone identification
  - Early warning system triggers
  
- **ML Model Architecture** (Future Implementation):
  - Time series forecasting (ARIMA/LSTM)
  - Classification models for severity prediction
  - Clustering for hotspot detection
  - Feature engineering from patient data
  
- **Data Pipeline** (Designed but not yet implemented):
  ```
  Patient Data → Feature Extraction → ML Model → 
  Outbreak Prediction → Alert Generation → 
  SMS/Notification Dispatch
  ```

#### **2.5 Notification System**

**Notification Types**:
- Outbreak alerts
- Vaccination reminders
- Emergency notifications
- Medicine stock alerts
- Appointment confirmations
- General announcements
- Program reminders

**Targeting Options**:
- Broadcast to all citizens
- Ward-specific notifications
- Zone-specific notifications
- Individual user notifications

**Notification Scheduling**:
- Scheduled notifications for future dates
- Program start date reminders
- Daily scheduler (runs at 6 AM)
- Weekly cleanup of old notifications
- Immediate push notifications

**Priority Levels**:
- Low (Informational)
- Medium (Standard)
- High (Important)
- Critical (Emergency)

**Notification Lifecycle**:
```javascript
Create → Schedule → Store in DB → 
Daily Scheduler Check → Send on Date → 
Mark as Read → Auto-cleanup after 30 days
```

---

### **3. Hospital Management System** 🏥

The Hospital portal provides complete patient care and resource management capabilities.

#### **3.1 Patient Management**

**Patient Registration**:
- **OPD (Outpatient Department)**:
  - Quick registration form
  - Basic patient details (name, age, gender)
  - Disease/symptom recording
  - Doctor assignment
  - Walk-in patient support
  
- **IPD (Inpatient Department)**:
  - Detailed admission form
  - Bed allocation
  - Admission date recording
  - Long-term care tracking
  - Discharge date management

**Patient Profile System**:
- Unique profile per patient
- Consolidated medical history
- Multiple visit tracking
- Link all visits to single profile
- Reusable patient data for subsequent visits

**Patient History & Medical Records**:
- Complete visit timeline
- Chronological medical history
- All previous diagnoses
- Treatment history
- Prescription records
- Doctor consultation notes
- Admission and discharge dates

#### **3.2 Doctor Management**

**Doctor Registration**:
- Doctor name and credentials
- Specialization (Cardiology, Orthopedics, Pediatrics, etc.)
- OPD timings
- Contact phone number
- Years of experience
- Availability status

**Doctor Workload Analytics**:
- Patient count per doctor
- OPD vs IPD patient distribution
- Utilization percentage
- Workload balancing insights
- Performance metrics

**Doctor Assignment**:
- Assign doctor to patient during registration
- Track doctor-patient relationships
- Historical doctor consultations

#### **3.3 Prescription Management**

**Digital Prescription System**:
- Medicine selection from hospital inventory
- Quantity specification
- Dosage instructions (e.g., 1-0-1, 1-1-1)
- Multiple medicines per prescription
- Linked to specific patient visit

**Prescription Display**:
- Clean, professional interface
- Medicine list with dosages
- Patient information header
- Doctor details
- Date and time stamp
- Hospital branding

**PDF Generation** (Professional Medical Reports):
- **High-quality PDF export** using PDFKit
- **Modern Design Elements**:
  - Emerald green accent colors matching navbar
  - Hospital header with branding
  - Patient information card with rounded borders
  - Visit timeline with type indicators (IPD/OPD)
  - Structured prescription tables
  - Professional typography
- **Report Sections**:
  - Hospital name and report metadata
  - Patient profile card (Name, Age, Gender, Phone, Patient ID)
  - Visit history in chronological order
  - Each visit shows:
    - Visit date and type (IPD/OPD badge)
    - Disease/diagnosis
    - Assigned doctor
    - Admission and discharge dates
    - Complete prescription with medicines and dosages
- **Export Features**:
  - Download as PDF file
  - Filename: `PatientName_Medical_History.pdf`
  - A4 size format
  - Print-ready quality
  - Professional margins and spacing

**How PDF Generation Works**:
```javascript
1. Fetch patient profile with all visits
2. Populate doctor and medicine references
3. Create PDFDocument with custom styling
4. Add header with hospital branding
5. Render patient information card
6. Loop through visits chronologically
7. Format each visit as a card with prescription
8. Apply color-coded badges for visit types
9. Add page breaks for long reports
10. Stream PDF to HTTP response
11. Set content-disposition for download
```

#### **3.4 Resource Management**

**Medicine Inventory**:
- Add new medicines to stock
- Track medicine quantities
- Update stock levels
- Low stock alerts (< 10 units)
- Medicine search and filter
- Expiry date tracking (planned)
- Batch management (planned)

**Equipment Management**:
- Equipment registration (name, quantity)
- Condition tracking:
  - Working
  - Under Maintenance
  - Out of Order
- Last updated timestamp
- Equipment availability status

**Bed Management**:
- Three bed categories:
  - General Ward
  - ICU (Intensive Care Unit)
  - Isolation Ward
- Track total beds per category
- Track available beds per category
- Automatic occupancy calculation
- Real-time bed status updates

#### **3.5 Hospital Analytics**

**Patient Analytics**:
- Total patients treated (all time)
- OPD patient count
- IPD patient count
- Today's admissions
- Today's discharges
- Active patients (current IPD)
- Disease distribution

**Resource Analytics**:
- Bed occupancy rate
- Medicine consumption trends
- Equipment utilization
- Doctor workload distribution

**Date Range Filters**:
- Today's statistics
- This week's data
- This month's data
- Custom date range selection

---

### **4. Citizen Portal** 👥

The Citizen Portal empowers residents with easy access to healthcare services.

#### **4.1 Citizen Profile Management**

**Comprehensive Profile Form**:
- **Personal Information**:
  - Full name
  - Phone number
  - Email address
  - Date of birth (auto-calculates age)
  - Gender selection (Male, Female, Other)
  - Occupation
  - Profile photo upload (up to 5MB)

- **Address Details**:
  - Street address
  - Ward number (crucial for analytics and notifications)
  - Pincode
  - City (default: Solapur)
  - Zone designation

- **Emergency Contact**:
  - Emergency contact name
  - Emergency contact phone
  - Relationship to patient

- **Health Metadata**:
  - Blood group (A+, A-, B+, B-, AB+, AB-, O+, O-)
  - Allergies (comma-separated list)
  - Chronic conditions (comma-separated list)

**Profile Features**:
- Image upload with validation (images only, 5MB limit)
- Automatic age calculation from DOB
- Profile completion tracking
- Edit profile capability
- Profile image preview
- Session syncing with ward information

**Profile Photo Upload**:
- **Storage**: `public/uploads/profiles/`
- **Naming**: `profile-{userId}-{timestamp}.{ext}`
- **Validation**: Image files only, max 5MB
- **Error Handling**: Graceful fallback to default avatar
- **Display**: Profile image shown in navbar and profile page

#### **4.2 Healthcare Programs**

**Program Discovery**:
- Browse all active health programs
- Program cards with gradient backgrounds
- Program details:
  - Name and description
  - Program type (Vaccination, Health Camp, etc.)
  - Start and end dates
  - Target audience
  - Locations (health centers)
  - Coordinator and contact info
  - Current enrollment count

**Program Application System**:
- **Detailed Application Form**:
  - Auto-fills from citizen profile
  - Personal information section
  - Address with ward mapping
  - Aadhar number for verification
  - Medical history
  - Blood group
  - Known allergies
  - Current medications
  - Previous vaccinations
  - Preferred health center
  - Preferred date for program
  - Emergency contact details
  - Terms and conditions acceptance

- **Application Submission**:
  - Form validation (all required fields)
  - Server-side processing
  - Database storage
  - Automatic status: "pending"
  - Email/SMS confirmation (planned)
  - Application number generation

- **Application Tracking**:
  - View all submitted applications
  - Application status (Pending, Approved, Rejected)
  - Application date
  - Review notes from admin
  - Reviewer information

**Notification Integration**:
- Scheduled reminders for program start dates
- Application status updates
- Program-related announcements
- Health tips and awareness messages

#### **4.3 Dashboard Features**

**Quick Stats**:
- Upcoming appointments
- Active program enrollments
- Pending applications
- Recent notifications
- Health alerts for your ward

**Notification Center**:
- Real-time notifications
- Priority-based sorting
- unread notification badges
- Notification history
- Mark as read functionality

**SMS Alerts** (Planned - UI Ready) 📱:
- **Features Designed**:
  - SMS inbox section in dashboard
  - Emergency and appointment SMS
  - OTP verification for phone
  - Two-factor authentication
  - SMS preferences toggle
  
- **SMS Infrastructure** (Not Yet Implemented):
  - Twilio/Nexmo integration pending
  - SMS templates designed
  - Backend hooks ready for SMS service
  - Phone number verification system
  - SMS delivery logging
  
- **Planned SMS Triggers**:
  - Program application confirmation
  - Appointment reminders (24h before)
  - Outbreak alerts in your ward
  - Vaccination due date reminders
  - Emergency health advisories
  - OTP for sensitive actions

---

### **5. Advanced Features** 🚀

#### **5.1 Appointment Booking** (Partial Implementation)

**Appointment System**:
- Select hospital from registered list
- Choose doctor by specialization
- Select date and time
- Provide patient details
- Reason for visit
- Disease type selection (for surveillance)
- Ward and location data
- Appointment status tracking

**Appointment Model Schema**:
```javascript
- Hospital reference
- Doctor reference
- Citizen (user) reference
- Patient name, age, gender, phone
- Appointment date and time
- Reason for visit
- Disease type (for epidemiological tracking)
- Severity level
- Ward, local area, zone
- Status: pending, confirmed, completed, cancelled
- Notes field
```

**Surveillance Integration**:
- Links appointments to disease tracking
- Captures disease type and severity
- Geographic data (ward, zone) for outbreak mapping
- Early warning system data feed

#### **5.2 Notification Scheduler**

**Automated Scheduling System**:
- **Daily Scheduler**:
  - Runs at 6 AM every day
  - Checks for notifications scheduled for today
  - Processes program reminders
  - Sends due notifications
  - Logs notification delivery

- **Weekly Cleanup**:
  - Runs every Sunday at midnight
  - Deletes read notifications older than 30 days
  - Maintains database efficiency
  - Prevents notification bloat

**Implementation**:
```javascript
// File: utils/notificationScheduler.js

initializeDailyScheduler() {
  - Executes immediately on startup
  - Calculates time until 6 AM
  - Schedules first run
  - Sets up 24-hour interval
  - Initializes weekly cleanup
}

checkDailyProgramNotifications() {
  - Finds notifications scheduled for today
  - Filters by type: 'program_reminder'
  - Populates target users
  - Logs notification count
  - Returns notification list
}

cleanupOldNotifications() {
  - Finds notifications > 30 days old
  - Filters only read notifications
  - Deletes from database
  - Logs cleanup count
}
```

**Notification Delivery** (Current Implementation):
- Database storage (immediate access)
- Dashboard notification center
- Real-time badge updates
- Read/unread tracking

**Future Integration Points**:
- Email delivery (SMTP)
- SMS delivery (Twilio/Nexmo)
- Push notifications (Web Push API)
- Mobile app notifications

#### **5.3 Disease Outbreak Detection with ML** (Framework Ready) 🤖

**Current Implementation**:
- Outbreak data model fully defined
- Geospatial indexing configured
- Disease case aggregation
- Ward-wise tracking
- Status management (Active, Controlled, Resolved)

**ML Framework Design** (Not Yet Trained):
```
┌─────────────────────────────────────────────────┐
│          DATA COLLECTION LAYER                  │
│  • Patient admissions (disease, date, ward)     │
│  • Appointment records (disease type, severity) │
│  • Hospital IPD data (active cases)             │
│  • Historical outbreak records                  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         FEATURE ENGINEERING LAYER               │
│  • Time-based features (day, week, month)       │
│  • Geographic features (ward, zone clusters)    │
│  • Disease diversity index                      │
│  • Case growth rate (daily, weekly)             │
│  • Weather correlation (temperature, humidity)  │
│  • Population density factors                   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│       MACHINE LEARNING MODEL LAYER              │
│  Model 1: Outbreak Prediction (Binary Class)    │
│    - Algorithm: Random Forest / XGBoost         │
│    - Input: 7-day disease trends + features     │
│    - Output: Outbreak probability (0-1)         │
│                                                  │
│  Model 2: Severity Classification               │
│    - Algorithm: Multi-class Classifier          │
│    - Input: Case count + growth rate            │
│    - Output: Low/Medium/High/Critical           │
│                                                  │
│  Model 3: Geographic Hotspot Detection          │
│    - Algorithm: DBSCAN Clustering               │
│    - Input: Ward-wise case coordinates          │
│    - Output: Cluster centers (hotspots)         │
│                                                  │
│  Model 4: Time Series Forecasting               │
│    - Algorithm: LSTM / Prophet                  │
│    - Input: Historical case time series         │
│    - Output: 14-day case prediction             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         ALERT GENERATION LAYER                  │
│  • Threshold-based triggers                     │
│  • ML confidence scoring                        │
│  • Multi-factor validation                      │
│  • Ward-specific alert targeting                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│       NOTIFICATION DISPATCH LAYER               │
│  • Admin dashboard alerts (High priority)       │
│  • Ward-specific citizen notifications          │
│  • SMS to affected areas (Planned)              │
│  • Email to health officials (Planned)          │
└─────────────────────────────────────────────────┘
```

**How ML Outbreak Detection Would Work** (Planned):

1. **Data Aggregation**:
   - Collect all patient records with disease and ward
   - Extract appointment disease surveillance data
   - Aggregate by date and location
   - Calculate daily case counts per disease per ward

2. **Pattern Analysis**:
   - Sliding window analysis (7-day, 14-day periods)
   - Calculate growth rate: `(current_cases - previous_cases) / previous_cases`
   - Detect anomalies: Cases > (mean + 2 * std_dev)
   - Identify sudden spikes (> 50% increase in 3 days)

3. **ML Model Training** (Future):
   ```python
   # Pseudocode for Outbreak Prediction Model
   
   import pandas as pd
   from sklearn.ensemble import RandomForestClassifier
   
   # Feature engineering
   features = [
     'daily_cases', 'weekly_growth_rate', 
     'population_density', 'ward_id',
     'day_of_week', 'month', 'temperature',
     'previous_outbreak_history'
   ]
   
   target = 'outbreak_within_7_days'  # Binary: 0 or 1
   
   # Train model
   model = RandomForestClassifier(n_estimators=100)
   model.fit(X_train[features], y_train[target])
   
   # Predict future outbreaks
   predictions = model.predict_proba(X_test[features])
   
   # Alert if probability > 0.7
   if predictions[:, 1] > 0.7:
       send_outbreak_alert(ward_id, disease, probability)
   ```

4. **Real-time Monitoring**:
   - Scheduled ML model runs (daily at 2 AM)
   - Automated data pipeline from MongoDB
   - Feature computation from raw data
   - Model inference on latest data
   - Alert generation for high-risk predictions

5. **Alert Triggering**:
   - Threshold: Outbreak probability > 70%
   - Create notification in database
   - Target all citizens in affected ward
   - Priority: Critical
   - Type: outbreak_alert
   - Include recommended preventive actions

**Why ML is Not Fully Implemented Yet**:
- **Data Requirements**: ML models need substantial historical data (6-12 months minimum)
- **Training Data**: Currently collecting data; insufficient for training
- **Model Validation**: Need real outbreak examples to validate predictions
- **Infrastructure**: Requires Python ML service integration with Node.js backend
- **Testing**: ML models need extensive testing before production deployment

**Current Workaround**:
- Manual outbreak reporting by admins
- Rule-based thresholds for alerts
- Statistical spike detection (mean + 2σ)
- Geographic clustering (high case density areas)

---

### **6. Security & Data Protection** 🔒

#### **Authentication Security**:
- Password hashing with BCrypt (10 salt rounds)
- Salted password storage (never plain text)
- Session-based authentication
- Secure cookie configuration
- Role-based access control (RBAC)
- Protected routes with middleware

#### **Data Validation**:
- Server-side input validation
- Mongoose schema validation
- File upload restrictions (type, size)
- Email format validation
- Phone number format checking
- Date range validation

#### **Session Management**:
- Server-side session storage
- Session expiry after inactivity
- Secure session cookie (httpOnly)
- Session regeneration after login
- Logout clears session completely

#### **File Upload Security**:
- File type validation (images only for profiles)
- File size limits (5MB for profile images)
- Unique filename generation (prevents overwrites)
- Secure file path storage
- No direct file execution

#### **Database Security**:
- MongoDB connection string in .env (not in code)
- No exposed credentials in repository
- Input sanitization (Mongoose handles)
- NoSQL injection prevention
- Index-based query optimization

---

## 📁 Project Structure

```
Samved_hackthon/
│
├── config/                    # Configuration files
│   ├── db.js                  # MongoDB connection setup
│   └── passport.js            # Passport authentication strategy
│
├── controllers/               # Business logic controllers
│   ├── adminController.js     # Admin operations (empty - logic in routes)
│   └── citizenController.js   # Citizen profile operations
│
├── middleware/                # Custom middleware
│   ├── auth.js                # Authentication & authorization middleware
│   └── upload.js              # Multer file upload configuration
│
├── models/                    # Mongoose data models
│   ├── User.js                # User authentication model
│   ├── Citizen.js             # Citizen profile model
│   ├── Hospital.js            # Hospital registration model
│   ├── Doctor.js              # Doctor management model
│   ├── Patient.js             # Patient records model
│   ├── PatientProfile.js      # Patient profile for history tracking
│   ├── Appointment.js         # Appointment booking model
│   ├── Program.js             # Health program model
│   ├── ProgramApplication.js  # Program application model
│   ├── Notification.js        # Notification system model
│   ├── Outbreak.js            # Disease outbreak tracking model
│   ├── Medicine.js            # Medicine inventory model
│   └── Equipment.js           # Medical equipment model
│
├── routes/                    # Express route definitions
│   ├── auth.js                # Authentication routes (login, register, logout)
│   ├── admin.js               # Admin dashboard routes
│   ├── hospital.js            # Hospital management routes
│   └── citizen.js             # Citizen portal routes
│
├── views/                     # EJS templates
│   ├── home.ejs               # Landing page
│   ├── layouts/
│   │   └── main.ejs           # Main layout template
│   ├── partials/
│   │   ├── navbar.ejs         # Navigation bar component
│   │   └── footer.ejs         # Footer component
│   ├── auth/
│   │   ├── login.ejs          # Login page
│   │   └── register.ejs       # Registration page
│   ├── dashboards/
│   │   ├── admin.ejs          # Admin dashboard
│   │   ├── hospital.ejs       # Hospital dashboard
│   │   └── citizen.ejs        # Citizen dashboard
│   ├── admin/
│   │   ├── home.ejs           # Admin home view
│   │   ├── city-analytics.ejs # City health analytics
│   │   ├── hospital-analytics.ejs # Hospital performance analytics
│   │   ├── programs.ejs       # Health programs management
│   │   ├── program-applications.ejs # Application listings
│   │   ├── application-details.ejs # Individual application view
│   │   └── alerts.ejs         # Outbreak alerts management
│   ├── hospital/
│   │   ├── addDoctor.ejs      # Doctor registration form
│   │   ├── doctors.ejs        # Doctor listing
│   │   ├── doctorWorkload.ejs # Doctor workload analytics
│   │   ├── addPatient.ejs     # Patient registration form
│   │   ├── patientHistory.ejs # Patient medical history
│   │   ├── prescription.ejs   # Prescription management
│   │   ├── resources.ejs      # Medicine & equipment management
│   │   └── analytics.ejs      # Hospital analytics dashboard
│   └── citizen/
│       ├── profile.ejs        # Citizen profile form
│       ├── programs.ejs       # Health programs listing
│       └── program-application.ejs # Program application form
│
├── public/                    # Static assets
│   └── uploads/
│       └── profiles/          # User profile images
│
├── scripts/                   # Utility scripts
│   └── seedAdmin.js           # Admin user seeding script
│
├── utils/                     # Utility functions
│   └── notificationScheduler.js # Automated notification scheduler
│
├── .env                       # Environment variables (not in repo)
├── .gitignore                 # Git ignore rules
├── app.js                     # Main application entry point
├── package.json               # NPM dependencies and scripts
├── about.md                   # Project documentation
├── ADMIN_LOGIN.md             # Admin credentials
└── README.md                  # This file
```

---

## 🚀 Installation & Setup

### **Prerequisites**
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
  - Or use MongoDB Atlas (cloud database)
- **Git** - [Download](https://git-scm.com/)

### **Step 1: Clone the Repository**
```bash
git clone <repository-url>
cd Samved_hackthon
```

### **Step 2: Install Dependencies**
```bash
npm install
```

This will install all required packages:
- express, ejs, mongoose
- passport, bcrypt, multer
- pdfkit, connect-flash
- dotenv, nodemon

### **Step 3: Configure Environment Variables**
Create a `.env` file in the root directory:
```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/samved

# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/samved

# Session Secret (change in production)
SESSION_SECRET=smc_health_secret

# Port
PORT=3000

# Admin Email
ADMIN_EMAIL=admin@gmail.com

# Future: SMS/Email Configuration
# TWILIO_SID=your_twilio_sid
# TWILIO_AUTH_TOKEN=your_twilio_token
# TWILIO_PHONE=your_twilio_phone
```

### **Step 4: Start MongoDB**
**Option A: Local MongoDB**
```bash
mongod
```

**Option B: MongoDB Atlas**
- Create free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Get connection string
- Add to `.env` as MONGODB_URI

### **Step 5: Create Admin User**
```bash
npm run seed-admin
```

This creates the default admin account (if not exists):
- Email: `admin@gmail.com`
- Password: `Ashish@1927`

### **Step 6: Start the Application**

**Development Mode** (with auto-restart):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

### **Step 7: Access the Application**
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 📖 Usage Guide

### **For Administrators**

1. **Login**:
   - Go to `http://localhost:3000/login`
   - Email: `admin@gmail.com`
   - Password: `Ashish@1927`

2. **Dashboard Features**:
   - **City Analytics**: View city-wide health metrics, disease trends, age group analysis
   - **Hospital Analytics**: Monitor all hospitals, bed occupancy, resource status
   - **Programs**: Create and manage health programs (vaccination drives, health camps)
   - **Applications**: Review citizen applications for programs (approve/reject)
   - **Alerts**: Manage disease outbreak alerts (planned feature)

3. **Create Health Program**:
   - Navigate to Programs section
   - Click "Create New Program"
   - Fill in program details (name, type, dates, locations)
   - Set program status (Active, Completed, Cancelled)
   - Monitor enrollments and applications

4. **Review Applications**:
   - Go to Programs → View Applications
   - Click on specific application to see details
   - Review applicant information and medical history
   - Approve or reject with notes
   - Track application status

### **For Hospitals**

1. **Register Hospital**:
   - Register as new user with role: Hospital
   - Complete hospital profile (name, ward, beds, contact)

2. **Add Doctors**:
   - Go to Doctors section
   - Add doctor details (name, specialization, timings, phone)
   - Set availability status

3. **Register Patients**:
   - Choose OPD or IPD
   - For new patients: Create patient profile first
   - For returning patients: Link to existing profile
   - Fill patient details and assign doctor
   - Record disease/diagnosis

4. **Manage Prescriptions**:
   - Select patient visit
   - Add medicines from inventory
   - Specify quantity and dosage
   - Save prescription
   - Download PDF report

5. **Manage Resources**:
   - **Medicine**: Add new medicines, update stock, view low stock alerts
   - **Equipment**: Register equipment, update condition status
   - **Beds**: Update bed availability (general, ICU, isolation)

6. **View Analytics**:
   - Today's admissions and discharges
   - Active patient count
   - Bed occupancy rates
   - Doctor workload distribution
   - Medicine stock levels

### **For Citizens**

1. **Register & Create Profile**:
   - Register as new user with role: Citizen
   - Complete profile with personal details
   - Upload profile photo (optional)
   - Add address with ward number (important for notifications)
   - Include emergency contact
   - Add health metadata (blood group, allergies, chronic conditions)

2. **Browse Health Programs**:
   - Navigate to Programs section
   - View available programs (vaccination, health camps, etc.)
   - Read program details and eligibility

3. **Apply for Programs**:
   - Click "Apply Now" on desired program
   - Fill application form (auto-filled from profile)
   - Review medical history section
   - Submit application
   - Track application status

4. **View Notifications**:
   - Check notification center in dashboard
   - View ward-specific health alerts
   - Read program reminders
   - Stay updated on vaccination schedules

5. **Book Appointments** (Partial):
   - Select hospital and doctor
   - Choose date and time
   - Provide appointment details
   - Wait for confirmation

---

## 🔧 API Endpoints

### **Authentication Routes** (`/`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Home/Landing page | Public |
| GET | `/login` | Login page | Public |
| POST | `/login` | Process login | Public |
| GET | `/register` | Registration page | Public |
| POST | `/register` | Create new account | Public |
| GET | `/logout` | Logout user | Authenticated |

### **Admin Routes** (`/admin`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/admin` | Admin dashboard | Admin |
| GET | `/admin/city-analytics` | City health analytics | Admin |
| GET | `/admin/hospital-analytics` | Hospital performance | Admin |
| GET | `/admin/api/hospital/:id` | Hospital details (JSON) | Admin |
| GET | `/admin/programs` | List all programs | Admin |
| POST | `/admin/programs` | Create new program | Admin |
| DELETE | `/admin/programs/:id` | Delete program | Admin |
| PATCH | `/admin/programs/:id/status` | Update program status | Admin |
| GET | `/admin/programs/:id/applications` | View program applications | Admin |
| GET | `/admin/programs/:pid/applications/:aid` | Application details | Admin |
| GET | `/admin/api/applications/:id` | Application JSON | Admin |
| PATCH | `/admin/applications/:id/status` | Approve/Reject application | Admin |
| GET | `/admin/alerts` | Disease outbreak alerts | Admin |

### **Hospital Routes** (`/hospital`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/hospital` | Hospital dashboard | Hospital |
| GET | `/hospital/addPatient` | Patient registration form | Hospital |
| POST | `/hospital/patient` | Create patient record | Hospital |
| GET | `/hospital/patientHistory` | Patient history listing | Hospital |
| GET | `/hospital/patients/profile/:id/pdf` | Download patient PDF | Hospital |
| GET | `/hospital/addDoctor` | Doctor registration form | Hospital |
| POST | `/hospital/doctor` | Create doctor record | Hospital |
| GET | `/hospital/doctors` | List all doctors | Hospital |
| GET | `/hospital/doctorWorkload` | Doctor workload analytics | Hospital |
| GET | `/hospital/resources` | Manage medicines & equipment | Hospital |
| POST | `/hospital/medicine` | Add medicine to inventory | Hospital |
| POST | `/hospital/equipment` | Add equipment | Hospital |
| GET | `/hospital/prescription/:id` | View prescription | Hospital |
| POST | `/hospital/prescription/:id` | Create prescription | Hospital |
| PATCH | `/hospital/beds` | Update bed availability | Hospital |

### **Citizen Routes** (`/citizen`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/citizen` | Citizen dashboard | Citizen |
| GET | `/citizen/profile` | View profile (JSON) | Citizen |
| GET | `/citizen/profile/edit` | Profile form | Citizen |
| POST | `/citizen/profile` | Save/Update profile | Citizen |
| POST | `/citizen/profile/image` | Update profile photo | Citizen |
| DELETE | `/citizen/profile` | Delete profile | Citizen |
| GET | `/citizen/programs` | Browse health programs | Citizen |
| GET | `/citizen/programs/:id/apply` | Program application form | Citizen |
| POST | `/citizen/programs/:id/apply` | Submit application | Citizen |

---

## 📊 Database Schema

### **Core Collections**

#### **Users** (Authentication)
```javascript
{
  name: String,
  username: String (unique),
  email: String (unique),
  password: String (hashed with bcrypt),
  role: String (enum: ['admin', 'hospital', 'citizen']),
  profileImage: String (file path),
  createdAt: Date
}
```

#### **Citizens** (Citizen Profiles)
```javascript
{
  userId: ObjectId (ref: User),
  fullName: String,
  phone: String,
  email: String,
  dob: Date,
  age: Number (calculated),
  gender: String (enum: ['Male', 'Female', 'Other']),
  occupation: String,
  address: {
    street: String,
    ward: String,
    pincode: String,
    city: String
  },
  zone: String,
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  profileImage: String,
  healthMetadata: {
    bloodGroup: String,
    allergies: [String],
    chronicConditions: [String]
  },
  profileCompleted: Boolean,
  createdAt: Date
}
```

#### **Hospitals**
```javascript
{
  user: ObjectId (ref: User),
  hospitalName: String,
  ward: String,
  localArea: String,
  zone: String,
  address: String,
  contactNumber: String,
  beds: {
    general: { total: Number, available: Number },
    icu: { total: Number, available: Number },
    isolation: { total: Number, available: Number }
  }
}
```

#### **Doctors**
```javascript
{
  hospital: ObjectId (ref: Hospital),
  name: String,
  specialization: String,
  opdTimings: String,
  phone: String,
  experienceYears: Number,
  isAvailable: Boolean
}
```

#### **Patients**
```javascript
{
  hospital: ObjectId (ref: Hospital),
  profile: ObjectId (ref: PatientProfile),
  patientType: String (enum: ['OPD', 'IPD']),
  name: String,
  age: Number,
  gender: String,
  disease: String,
  doctor: ObjectId (ref: Doctor),
  prescription: [{
    medicine: ObjectId (ref: Medicine),
    quantity: Number,
    dosage: String
  }],
  admissionDate: Date,
  dischargeDate: Date
}
```

#### **Programs** (Health Initiatives)
```javascript
{
  name: String,
  description: String,
  type: String (enum: ['vaccination', 'health_camp', 'maternal_health', 'child_health', 'awareness', 'other']),
  bannerImage: String,
  startDate: Date,
  endDate: Date,
  targetAudience: String,
  locations: String,
  coordinator: String,
  contactNumber: String,
  enrolled: Number,
  status: String (enum: ['active', 'completed', 'cancelled']),
  gradientColors: { from: String, to: String },
  createdAt: Date
}
```

#### **ProgramApplications**
```javascript
{
  program: ObjectId (ref: Program),
  citizen: ObjectId (ref: Citizen),
  userId: ObjectId (ref: User),
  fullName: String,
  dateOfBirth: Date,
  age: Number,
  gender: String,
  mobileNumber: String,
  email: String,
  address: { street, area, ward, pincode },
  aadharNumber: String,
  bloodGroup: String,
  medicalHistory: String,
  allergies: String,
  currentMedications: String,
  previousVaccinations: String,
  preferredCenter: String,
  preferredDate: Date,
  emergencyContact: { name, phone, relation },
  status: String (enum: ['pending', 'approved', 'rejected']),
  applicationDate: Date,
  reviewedBy: ObjectId (ref: User),
  reviewedAt: Date,
  reviewNotes: String
}
```

#### **Notifications**
```javascript
{
  type: String (enum: ['outbreak_alert', 'vaccination', 'emergency', 'medicine_stock', 'appointment', 'general', 'program_reminder']),
  priority: String (enum: ['low', 'medium', 'high', 'critical']),
  title: String,
  message: String,
  targetAudience: String (enum: ['all', 'ward', 'zone', 'specific_users']),
  ward: String,
  zone: String,
  targetUsers: [ObjectId] (ref: User),
  isRead: Boolean,
  isBroadcast: Boolean,
  sentBy: ObjectId (ref: User),
  relatedEntity: {
    entityType: String,
    entityId: ObjectId
  },
  scheduledFor: Date,
  createdAt: Date
}
```

#### **Outbreaks** (Disease Surveillance)
```javascript
{
  disease: String (enum: ['Dengue', 'Malaria', 'Typhoid', 'TB', 'COVID-19', 'Cholera', 'Chikungunya', 'Other']),
  ward: String,
  zone: String,
  cases: Number,
  severity: String (enum: ['Low', 'Medium', 'High', 'Critical']),
  status: String (enum: ['Active', 'Controlled', 'Resolved']),
  location: {
    type: 'Point',
    coordinates: [Number, Number] // [longitude, latitude]
  },
  affectedPopulation: Number,
  reportedDate: Date,
  resolvedDate: Date,
  description: String,
  actionsTaken: String,
  createdAt: Date
}
```

---

## 🌟 Key Features Summary

### ✅ **Fully Implemented**
- ✔️ Multi-role authentication (Admin, Hospital, Citizen)
- ✔️ Admin dashboard with city health analytics
- ✔️ Disease growth tracking (90-day trends)
- ✔️ Age group disease prevalence analysis
- ✔️ Hospital analytics and performance monitoring
- ✔️ Healthcare programs management
- ✔️ Program application system with review workflow
- ✔️ Patient registration (OPD/IPD)
- ✔️ Patient profile and medical history tracking
- ✔️ Doctor management
- ✔️ Prescription system
- ✔️ PDF medical report generation
- ✔️ Medicine and equipment inventory
- ✔️ Bed availability tracking
- ✔️ Citizen profile management with photo upload
- ✔️ Notification system with scheduling
- ✔️ Daily notification scheduler
- ✔️ Ward-based targeting

### 🚧 **Partially Implemented**
- ⚠️ Appointment booking (model ready, UI partial)
- ⚠️ Disease outbreak tracking (model ready, ML not trained)

### 📋 **Planned/Not Yet Implemented**
- ❌ **SMS Notifications** (UI ready, Twilio integration pending)
- ❌ **Machine Learning for Outbreak Prediction** (framework designed, model not trained)
- ❌ **Email Notifications** (infrastructure ready, SMTP not configured)
- ❌ **Real-time Web Push Notifications** (Web Push API integration pending)
- ❌ **Mobile App** (Backend API-ready for future mobile integration)
- ❌ **ML Training Pipeline** (requires 6-12 months of historical data)
- ❌ **Geospatial Heat Maps** (Outbreak model has coordinates, visualization pending)
- ❌ **Medicine Expiry Tracking** (model field not added yet)
- ❌ **Equipment Maintenance Scheduling** (basic tracking exists)
- ❌ **Two-Factor Authentication** (SMS OTP infrastructure ready)

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is created for **Solapur Municipal Corporation (SMC)** as part of a hackathon initiative to improve public healthcare management.

---

## 👨‍💻 Development Team

**Project Name**: Samved Healthcare Management System  
**Developed For**: Solapur Municipal Corporation  
**Purpose**: Smart Public Health Management  
**Year**: 2026  

---

## 🙏 Acknowledgments

- Solapur Municipal Corporation for the opportunity
- Node.js and Express.js communities
- MongoDB for flexible data storage
- Passport.js for authentication framework
- Chart.js for data visualization
- Tailwind CSS for modern UI design

---

## 📞 Support & Contact

For questions, issues, or feature requests:
- Admin Email: admin@gmail.com
- Create an issue in the repository
- Contact SMC Health Department

---

## 🔮 Future Roadmap

### **Phase 1: Core Enhancements** (Next 3 months)
- [ ] Complete appointment booking system
- [ ] Implement SMS notifications (Twilio)
- [ ] Add email notifications (SMTP)
- [ ] Enhance dashboard with more visualizations

### **Phase 2: ML Integration** (6-12 months)
- [ ] Collect sufficient historical data
- [ ] Train outbreak prediction models
- [ ] Implement ML pipeline
- [ ] Deploy ML-based early warning system

### **Phase 3: Advanced Features** (12+ months)
- [ ] Mobile application (React Native)
- [ ] Real-time chat for consultations
- [ ] Telemedicine integration
- [ ] AI-powered health chatbot
- [ ] Advanced geospatial analytics
- [ ] Integration with government health databases

### **Phase 4: Scale & Optimization**
- [ ] Multi-city deployment
- [ ] Load balancing and scaling
- [ ] Advanced caching (Redis)
- [ ] Performance optimization
- [ ] Comprehensive unit and integration tests

---

## 📚 Additional Documentation

- [ADMIN_LOGIN.md](ADMIN_LOGIN.md) - Admin credentials and setup
- [about.md](about.md) - Detailed project architecture
- API documentation (coming soon)
- Deployment guide (coming soon)

---

**Built with ❤️ for better healthcare management in Solapur**

