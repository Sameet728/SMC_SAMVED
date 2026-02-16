const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');

const Patient = require("../models/Patient");
const Hospital = require("../models/Hospital");
const Doctor = require("../models/Doctor");
const Medicine = require("../models/Medicine");
const Equipment = require("../models/Equipment");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Citizen = require("../models/Citizen");
const Program = require("../models/Program");
const Notification = require("../models/Notification");

const { ensureCitizen } = require("../middleware/auth");
const { uploadProfileImage, handleUploadError } = require("../middleware/upload");
const citizenController = require("../controllers/citizenController");

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/uploads/profiles/');
  },
  filename: function(req, file, cb) {
    const userId = req.user ? req.user._id : 'default';
    const extension = path.extname(file.originalname);
    cb(null, `profile-${userId}-${Date.now()}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// =====================================================
// CITIZEN PROFILE ROUTES - Production Ready
// =====================================================

/**
 * POST /citizen/profile
 * Save/Update complete citizen profile with image upload
 * - Accepts form data + profile image
 * - Calculates age from DOB
 * - Saves to MongoDB (Citizen model)
 * - Stores only image path, not image itself
 * - Marks profile as completed
 * - Updates session with ward
 */
router.post(
  "/profile",
  ensureCitizen,
  uploadProfileImage,
  handleUploadError,
  citizenController.saveProfile
);

/**
 * GET /citizen/profile
 * Retrieve citizen profile information
 */
router.get("/profile", ensureCitizen, citizenController.getProfile);

/**
 * GET /citizen/profile/edit
 * Display profile edit form
 */
router.get("/profile/edit", ensureCitizen, async (req, res) => {
  try {
    const citizen = await Citizen.findOne({ userId: req.user._id }).populate("userId");
    
    console.log('📝 Loading profile edit for user:', req.user._id);
    console.log('👤 Citizen data found:', citizen ? 'YES' : 'NO');
    
    if (citizen) {
      console.log('📋 Profile details:', {
        name: citizen.fullName,
        ward: citizen.address?.ward,
        completed: citizen.profileCompleted
      });
    }
    
    res.render("citizen/profile", { 
      user: req.user,
      citizen: citizen || {},
      success: req.query.success === 'true'
    });
  } catch (error) {
    console.error("❌ Error loading profile form:", error);
    res.redirect("/citizen/dashboard");
  }
});

/**
 * POST /citizen/profile/image
 * Update profile image only
 */
router.post(
  "/profile/image",
  ensureCitizen,
  uploadProfileImage,
  handleUploadError,
  citizenController.updateProfileImage
);

/**
 * DELETE /citizen/profile
 * Soft delete profile (mark as incomplete)
 */
router.delete("/profile", ensureCitizen, citizenController.deleteProfile);

// =====================================================
// PROGRAM ROUTES - Health Programs & Applications
// =====================================================

const ProgramApplication = require("../models/ProgramApplication");

/**
 * GET /citizen/programs
 * Display all available health programs and user's applied programs
 */
router.get("/programs", ensureCitizen, async (req, res) => {
  try {
    const programs = await Program.find({ status: 'active' }).sort({ createdAt: -1 });
    const citizen = await Citizen.findOne({ userId: req.user._id });
    
    // Fetch user's applied programs with program details
    const appliedPrograms = await ProgramApplication.find({ userId: req.user._id })
      .populate('program')
      .sort({ applicationDate: -1 });
    
    res.render("citizen/programs", {
      user: req.user,
      citizen,
      programs,
      appliedPrograms
    });
  } catch (error) {
    console.error("❌ Error loading programs:", error);
    res.redirect("/citizen/dashboard");
  }
});

/**
 * GET /citizen/program-apply/:id
 * Display application form for a specific program
 */
router.get("/program-apply/:id", ensureCitizen, async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    const citizen = await Citizen.findOne({ userId: req.user._id });
    
    if (!program) {
      return res.redirect("/citizen/programs");
    }
    
    // Check if already applied
    const existingApplication = await ProgramApplication.findOne({
      program: program._id,
      userId: req.user._id
    });
    
    res.render("citizen/program-application", {
      user: req.user,
      citizen,
      program,
      existingApplication
    });
  } catch (error) {
    console.error("❌ Error loading application form:", error);
    res.redirect("/citizen/programs");
  }
});

/**
 * POST /citizen/program-apply
 * Submit program application
 */
router.post("/program-apply", ensureCitizen, async (req, res) => {
  try {
    console.log("📝 Program application submission started");
    console.log("User ID:", req.user._id);
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const citizen = await Citizen.findOne({ userId: req.user._id });
    
    if (!citizen) {
      console.log("❌ Citizen profile not found");
      return res.status(400).json({ 
        success: false, 
        error: "Please complete your profile first" 
      });
    }
    
    console.log("✅ Citizen profile found:", citizen.fullName);
    
    // Check if already applied for this program
    const existingApplication = await ProgramApplication.findOne({
      program: req.body.programId,
      userId: req.user._id
    });
    
    if (existingApplication) {
      console.log("⚠️ User already applied for this program");
      return res.status(400).json({
        success: false,
        error: "You have already applied for this program"
      });
    }
    
    // Calculate age from date of birth
    const dob = new Date(req.body.dateOfBirth);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    
    console.log("📋 Creating application with data...");
    
    // Create application with approved status (no admin approval needed)
    const application = new ProgramApplication({
      program: req.body.programId,
      citizen: citizen._id,
      userId: req.user._id,
      fullName: req.body.fullName,
      dateOfBirth: req.body.dateOfBirth,
      age: age,
      gender: req.body.gender,
      mobileNumber: req.body.mobileNumber,
      email: req.body.email || "",
      address: {
        street: req.body.street,
        area: req.body.area,
        ward: req.body.ward,
        pincode: req.body.pincode
      },
      aadharNumber: req.body.aadharNumber || "",
      bloodGroup: req.body.bloodGroup || "Not Known",
      medicalHistory: req.body.medicalHistory || "",
      allergies: req.body.allergies || "",
      currentMedications: req.body.currentMedications || "",
      previousVaccinations: req.body.previousVaccinations || "",
      preferredCenter: req.body.preferredCenter || "",
      preferredDate: req.body.preferredDate || null,
      emergencyContact: {
        name: req.body.emergencyContactName || "",
        relation: req.body.emergencyContactRelation || "",
        phone: req.body.emergencyContactPhone || ""
      },
      status: 'approved'
    });
    
    console.log("💾 Saving application to database...");
    await application.save();
    console.log("✅ Application saved successfully! ID:", application._id);
    
    // Update program enrolled count
    console.log("📊 Updating program enrollment count...");
    await Program.findByIdAndUpdate(req.body.programId, {
      $inc: { enrolled: 1 }
    });
    console.log("✅ Program enrollment count updated");

    // Get the program details to create notification with program date
    const program = await Program.findById(req.body.programId);
    
    // Create a notification scheduled for the program start date
    if (program) {
      console.log("🔔 Creating notification for program:", program.name);
      const notification = new Notification({
        type: "program_reminder",
        priority: "medium",
        title: `Reminder: ${program.name}`,
        message: `Your registered program "${program.name}" is scheduled for today! Location: ${program.locations}. Please check the program details for more information.`,
        targetAudience: "specific_users",
        targetUsers: [req.user._id],
        scheduledFor: program.startDate,
        relatedEntity: {
          entityType: "program",
          entityId: program._id
        },
        isRead: false,
        isBroadcast: false
      });
      
      await notification.save();
      console.log(`✅ Program reminder notification created for ${req.user.name} on ${program.startDate}`);
    }
    
    console.log("✅ Program application completed successfully!");
    res.json({ 
      success: true, 
      message: "Registration completed successfully! You will receive a notification on the program date.",
      applicationId: application._id
    });
  } catch (error) {
    console.error("❌ Error submitting application:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Send detailed error message for debugging
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to submit application. Please try again.",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// =====================================================
// CITIZEN DASHBOARD - Smart Public Health Portal
// =====================================================

router.get("/dashboard", ensureCitizen, async (req, res) => {
  try {
    // Load citizen profile
    let citizen = await Citizen.findOne({ userId: req.user._id }).populate("userId");
    
    // If no profile exists, create a basic one
    if (!citizen) {
      citizen = {
        fullName: req.user.name || "Citizen",
        profileImage: "/default-avatar.png",
        profileCompleted: false
      };
    }
    
    // Fetch all hospitals with their data
    const hospitals = await Hospital.find();
    const patients = await Patient.find().populate("hospital").populate("doctor");
    const doctors = await Doctor.find().populate("hospital");
    const medicines = await Medicine.find().populate("hospital");
    const equipments = await Equipment.find().populate("hospital");
    const users = await User.find();
    
    // Fetch active programs
    const programs = await Program.find({ status: 'active' }).sort({ createdAt: -1 });
    
    // Fetch user's applied programs with program details
    const appliedPrograms = await ProgramApplication.find({ userId: req.user._id })
      .populate('program')
      .sort({ applicationDate: -1 });

    // ================= KPI CALCULATIONS =================
    
    // Active Outbreaks (diseases with > 10 cases in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentPatients = patients.filter(p => 
      p.admissionDate && new Date(p.admissionDate) >= thirtyDaysAgo
    );

    // Disease aggregation
    const diseaseCount = {};
    recentPatients.forEach(p => {
      if (p.disease) {
        diseaseCount[p.disease] = (diseaseCount[p.disease] || 0) + 1;
      }
    });

    const outbreaks = Object.entries(diseaseCount)
      .filter(([disease, count]) => count >= 5)
      .map(([disease, count]) => ({ disease, count }));

    // Total bed calculations
    let totalBeds = 0;
    let availableBeds = 0;
    let generalBeds = { total: 0, available: 0 };
    let icuBeds = { total: 0, available: 0 };
    let isolationBeds = { total: 0, available: 0 };

    hospitals.forEach(h => {
      if (h.beds) {
        generalBeds.total += h.beds.general?.total || 0;
        generalBeds.available += h.beds.general?.available || 0;
        icuBeds.total += h.beds.icu?.total || 0;
        icuBeds.available += h.beds.icu?.available || 0;
        isolationBeds.total += h.beds.isolation?.total || 0;
        isolationBeds.available += h.beds.isolation?.available || 0;
        
        totalBeds += (h.beds.general?.total || 0) + (h.beds.icu?.total || 0) + (h.beds.isolation?.total || 0);
        availableBeds += (h.beds.general?.available || 0) + (h.beds.icu?.available || 0) + (h.beds.isolation?.available || 0);
      }
    });

    const bedOccupancyPercent = totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0;

    // Medicine stock alerts
    const lowStockMedicines = medicines.filter(m => m.status === "low" || m.status === "out_of_stock");
    const criticalMedicineAlerts = lowStockMedicines.length;

    // Equipment status
    const workingEquipment = equipments.filter(e => e.condition === "working").length;
    const maintenanceEquipment = equipments.filter(e => e.condition === "maintenance").length;
    const outOfOrderEquipment = equipments.filter(e => e.condition === "out_of_order").length;

    // Emergency status calculation
    const emergencyStatus = bedOccupancyPercent >= 80 || criticalMedicineAlerts > 5 ? "Critical" : "Normal";

    // Active Patients (current IPD patients)
    const activePatients = patients.filter(p => 
      p.patientType === "IPD" && !p.dischargeDate
    );

    // Calculate vaccination programs based on available data
    // Count unique vaccination types from patient records or set based on government programs
    const govVaccinationPrograms = [
      "COVID-19", "Polio", "Hepatitis B", "Tetanus", "MMR", "DPT"
    ];
    const activeVaccinationPrograms = govVaccinationPrograms.length;

    // Total users breakdown
    const userStats = {
      total: users.length,
      citizens: users.filter(u => u.role === "citizen").length,
      hospitals: users.filter(u => u.role === "hospital").length,
      admin: users.filter(u => u.role === "admin").length
    };

    // ================= WARD-WISE DATA =================
    const wardData = {};
    hospitals.forEach(h => {
      if (!wardData[h.ward]) {
        wardData[h.ward] = {
          hospitals: 0,
          totalBeds: 0,
          availableBeds: 0,
          patients: 0,
          doctors: 0
        };
      }
      wardData[h.ward].hospitals++;
      wardData[h.ward].totalBeds += (h.beds?.general?.total || 0) + (h.beds?.icu?.total || 0) + (h.beds?.isolation?.total || 0);
      wardData[h.ward].availableBeds += (h.beds?.general?.available || 0) + (h.beds?.icu?.available || 0) + (h.beds?.isolation?.available || 0);
    });

    patients.forEach(p => {
      if (p.hospital && p.hospital.ward && wardData[p.hospital.ward]) {
        wardData[p.hospital.ward].patients++;
      }
    });

    doctors.forEach(d => {
      const hospital = hospitals.find(h => h._id.toString() === d.hospital?.toString());
      if (hospital && wardData[hospital.ward]) {
        wardData[hospital.ward].doctors++;
      }
    });

    // ================= DISEASE TRENDS =================
    const diseaseTrends = Object.entries(diseaseCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([disease, count]) => ({ disease, count }));

    // ================= HOSPITAL STATS =================
    const hospitalStats = hospitals.map(h => {
      const hPatients = patients.filter(p => p.hospital?._id?.toString() === h._id.toString());
      const hDoctors = doctors.filter(d => d.hospital?.toString() === h._id.toString());
      const hMedicines = medicines.filter(m => m.hospital?.toString() === h._id.toString());
      
      const hTotalBeds = (h.beds?.general?.total || 0) + (h.beds?.icu?.total || 0) + (h.beds?.isolation?.total || 0);
      const hAvailableBeds = (h.beds?.general?.available || 0) + (h.beds?.icu?.available || 0) + (h.beds?.isolation?.available || 0);
      
      return {
        _id: h._id,
        name: h.hospitalName,
        ward: h.ward,
        totalBeds: hTotalBeds,
        availableBeds: hAvailableBeds,
        occupancyPercent: hTotalBeds > 0 ? Math.round(((hTotalBeds - hAvailableBeds) / hTotalBeds) * 100) : 0,
        totalPatients: hPatients.length,
        totalDoctors: hDoctors.length,
        lowStockMedicines: hMedicines.filter(m => m.status !== "adequate").length
      };
    });

    // ================= RENDER DASHBOARD =================
    try {
      console.log("✅ Rendering citizen dashboard with data...");
      res.render("dashboards/citizen", {
        user: req.user,
        citizen, // Citizen profile data for display
        
        // KPIs
        kpis: {
          activeOutbreaks: outbreaks.length,
          bedOccupancyPercent,
          criticalMedicineAlerts,
          emergencyStatus,
          totalHospitals: hospitals.length,
          totalDoctors: doctors.length,
          totalPatients: patients.length,
          activePatients: activePatients.length,
          activeVaccinationPrograms,
          totalUsers: userStats.total,
          citizenUsers: userStats.citizens
        },

        // Bed data
        beds: {
          total: totalBeds,
          available: availableBeds,
          general: generalBeds,
          icu: icuBeds,
          isolation: isolationBeds
        },

        // Lists
        outbreaks,
        diseaseTrends,
        wardData,
        hospitalStats,
        lowStockMedicines,
        
        // Programs
        programs,
        appliedPrograms,

        // Equipment
        equipment: {
          working: workingEquipment,
          maintenance: maintenanceEquipment,
          outOfOrder: outOfOrderEquipment,
          total: equipments.length
        },

        // Raw data for charts
        hospitals,
        recentPatients
      });
    } catch (renderError) {
      console.error("❌ EJS Rendering Error:", renderError);
      console.error("Stack:", renderError.stack);
      res.status(500).send(`
        <h1>Dashboard Rendering Error</h1>
        <pre>${renderError.message}</pre>
        <pre>${renderError.stack}</pre>
      `);
    }

  } catch (err) {
    console.error("❌ Citizen Dashboard Error:", err);
    console.error("Stack:", err.stack);
    res.status(500).send(`
      <h1>Error Loading Dashboard</h1>
      <pre>${err.message}</pre>
      <pre>${err.stack}</pre>
    `);
  }
});

// =====================================================
// API ENDPOINTS FOR CITIZEN DASHBOARD
// =====================================================

// Get hospital details
router.get("/hospital/:id", ensureCitizen, async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    const doctors = await Doctor.find({ hospital: hospital._id });
    const medicines = await Medicine.find({ hospital: hospital._id });
    const equipments = await Equipment.find({ hospital: hospital._id });

    res.json({
      hospital,
      doctors,
      medicines,
      equipments
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching hospital data" });
  }
});

// Search hospitals
router.get("/search", ensureCitizen, async (req, res) => {
  try {
    const { ward, specialty, hasAvailableBeds } = req.query;
    let query = {};

    if (ward) {
      query.ward = ward;
    }

    let hospitals = await Hospital.find(query);

    if (hasAvailableBeds === "true") {
      hospitals = hospitals.filter(h => {
        const available = (h.beds?.general?.available || 0) + 
                         (h.beds?.icu?.available || 0) + 
                         (h.beds?.isolation?.available || 0);
        return available > 0;
      });
    }

    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});

// Get ward statistics
router.get("/ward/:wardName", ensureCitizen, async (req, res) => {
  try {
    const hospitals = await Hospital.find({ ward: req.params.wardName });
    const hospitalIds = hospitals.map(h => h._id);
    
    const patients = await Patient.find({ hospital: { $in: hospitalIds } });
    const doctors = await Doctor.find({ hospital: { $in: hospitalIds } });

    res.json({
      hospitals,
      totalPatients: patients.length,
      totalDoctors: doctors.length
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching ward data" });
  }
});

// =====================================================
// APPOINTMENT BOOKING APIS
// =====================================================

// Get doctors for a hospital (for appointment booking)
router.get("/hospital/:id/doctors", ensureCitizen, async (req, res) => {
  try {
    const doctors = await Doctor.find({ 
      hospital: req.params.id,
      isAvailable: true 
    });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: "Error fetching doctors" });
  }
});

// Book an appointment
router.post("/appointment", ensureCitizen, async (req, res) => {
  try {
    const {
      hospitalId,
      doctorId,
      patientName,
      patientAge,
      patientGender,
      patientPhone,
      appointmentDate,
      appointmentTime,
      reason
    } = req.body;

    const appointment = await Appointment.create({
      hospital: hospitalId,
      doctor: doctorId,
      citizen: req.user._id,
      patientName,
      patientAge,
      patientGender,
      patientPhone,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      reason,
      status: "pending"
    });

    res.json({ success: true, appointment });
  } catch (err) {
    console.error("Appointment booking error:", err);
    res.status(500).json({ error: "Failed to book appointment" });
  }
});

// Get user's appointments
router.get("/my-appointments", ensureCitizen, async (req, res) => {
  try {
    const appointments = await Appointment.find({ citizen: req.user._id })
      .populate("hospital")
      .populate("doctor")
      .sort({ appointmentDate: -1 });
    
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: "Error fetching appointments" });
  }
});

// Cancel appointment
router.post("/appointment/:id/cancel", ensureCitizen, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      citizen: req.user._id
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Error cancelling appointment" });
  }
});

// ================= PROFILE ROUTES =================

// Upload profile image
router.post('/upload-profile-image', ensureCitizen, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Update user profile image path in database
    const imagePath = `/uploads/profiles/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { profileImage: imagePath });

    res.json({ 
      success: true, 
      imagePath: imagePath,
      message: 'Profile image updated successfully!' 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
});

// Update profile information
router.post('/update-profile', ensureCitizen, async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove empty fields
    Object.keys(updates).forEach(key => {
      if (updates[key] === '' || updates[key] === null || updates[key] === undefined) {
        delete updates[key];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id, 
      updates, 
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      success: true, 
      user: updatedUser,
      message: 'Profile updated successfully!' 
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get all doctors
router.get('/doctors', ensureCitizen, async (req, res) => {
  try {
    const doctors = await Doctor.find({})
      .populate('hospital')
      .select('name specialization hospital availability contactNumber');

    res.json({ success: true, doctors });
  } catch (error) {
    console.error('Doctors error:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// Get doctors for specific hospital
router.get('/doctors/:hospitalId', ensureCitizen, async (req, res) => {
  try {
    const doctors = await Doctor.find({ hospital: req.params.hospitalId })
      .populate('hospital')
      .select('name specialization hospital availability contactNumber');

    res.json({ success: true, doctors });
  } catch (error) {
    console.error('Doctors error:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// =====================================================
// NOTIFICATIONS ROUTES
// =====================================================

/**
 * GET /citizen/notifications
 * Get all notifications for the current citizen
 * Only shows notifications that are scheduled for today or earlier
 */
router.get('/notifications', ensureCitizen, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    // Fetch notifications for this user that are:
    // 1. Targeted to this specific user, OR
    // 2. Broadcast to all, OR  
    // 3. Targeted to user's ward
    const citizen = await Citizen.findOne({ userId: req.user._id });
    
    const notifications = await Notification.find({
      $and: [
        {
          $or: [
            { targetUsers: req.user._id },
            { targetAudience: 'all' },
            { targetAudience: 'ward', ward: citizen?.address?.ward }
          ]
        },
        {
          $or: [
            { scheduledFor: { $exists: false } }, // No schedule, show immediately
            { scheduledFor: { $lte: today } } // Scheduled for today or earlier
          ]
        }
      ]
    })
    .populate('relatedEntity.entityId')
    .sort({ createdAt: -1, priority: -1 })
    .limit(50);
    
    res.json({ 
      success: true, 
      notifications,
      unreadCount: notifications.filter(n => !n.isRead).length
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notifications' 
    });
  }
});

/**
 * PUT /citizen/notifications/:id/read
 * Mark a notification as read
 */
router.put('/notifications/:id/read', ensureCitizen, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }
    
    res.json({ 
      success: true, 
      notification 
    });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update notification' 
    });
  }
});

/**
 * DELETE /citizen/notifications/:id
 * Delete a notification
 */
router.delete('/notifications/:id', ensureCitizen, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Notification deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete notification' 
    });
  }
});

module.exports = router;
