const express = require("express");
const router = express.Router();
const { ensureAdmin } = require("../middleware/auth");
const Hospital = require("../models/Hospital");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Citizen = require("../models/Citizen");
const Medicine = require("../models/Medicine");
const Program = require("../models/Program");
const mongoose = require("mongoose");

// Helper function to calculate disease growth over time
function calculateDiseaseGrowthOverTime(patients) {
  // Normalize disease names
  const normalizeDiseaseNames = (disease) => {
    if (!disease) return 'Other';
    const lower = disease.toLowerCase();
    if (lower.includes('dengue')) return 'Dengue';
    if (lower.includes('malaria')) return 'Malaria';
    if (lower.includes('covid') || lower.includes('corona')) return 'COVID-19';
    if (lower.includes('typhoid')) return 'Typhoid';
    if (lower.includes('tuberculos') || lower.includes('tb')) return 'Tuberculosis';
    if (lower.includes('diabetes')) return 'Diabetes';
    if (lower.includes('hypertension') || lower.includes('bp')) return 'Hypertension';
    return 'Other';
  };

  // Filter patients with valid admission dates and group by date and disease
  const diseaseByDate = {};
  
  patients.forEach(patient => {
    if (!patient.admissionDate) return;
    
    const disease = normalizeDiseaseNames(patient.disease);
    const date = new Date(patient.admissionDate);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (!diseaseByDate[dateKey]) {
      diseaseByDate[dateKey] = {};
    }
    
    if (!diseaseByDate[dateKey][disease]) {
      diseaseByDate[dateKey][disease] = 0;
    }
    
    diseaseByDate[dateKey][disease]++;
  });

  // Get all unique dates and sort them
  const allDates = Object.keys(diseaseByDate).sort();
  
  // Generate last 90 days if we have patients
  const today = new Date();
  const daysToShow = 90;
  const dateLabels = [];
  
  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dateLabels.push(dateKey);
  }

  // Get all diseases
  const diseaseSet = new Set();
  Object.values(diseaseByDate).forEach(diseases => {
    Object.keys(diseases).forEach(disease => diseaseSet.add(disease));
  });
  
  const diseases = Array.from(diseaseSet).filter(d => d !== 'Other');
  
  // Calculate cumulative counts for each disease
  const datasets = {};
  
  diseases.forEach(disease => {
    datasets[disease] = [];
    let cumulativeCount = 0;
    
    dateLabels.forEach(date => {
      if (diseaseByDate[date] && diseaseByDate[date][disease]) {
        cumulativeCount += diseaseByDate[date][disease];
      }
      datasets[disease].push(cumulativeCount);
    });
  });

  // Format dates for display (every 15 days to avoid clutter)
  const formattedLabels = dateLabels.map((date, index) => {
    if (index % 15 === 0 || index === dateLabels.length - 1) {
      const parts = date.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return '';
  });

  return {
    labels: formattedLabels,
    datasets: diseases.map(disease => ({
      label: disease,
      data: datasets[disease]
    }))
  };
}

router.get("/", ensureAdmin, (req, res) => {
  res.render("dashboards/admin");
});

router.get("/city-analytics", ensureAdmin, async (req, res) => {
  try {
    // Fetch all required data
    const totalUsers = await User.countDocuments();
    const totalCitizens = await Citizen.countDocuments();
    const totalHospitals = await Hospital.countDocuments();
    const livePrograms = await Program.countDocuments({ status: 'active' });
    
    // Get active patients (IPD patients without discharge date)
    const activePatients = await Patient.countDocuments({ 
      patientType: "IPD", 
      dischargeDate: null 
    });
    
    // Get all patients for analytics
    const allPatients = await Patient.find({}).lean();
    
    // Calculate disease prevalence by age group
    const ageGroups = {
      '0-18': { total: 0, Dengue: 0, Malaria: 0, 'COVID-19': 0 },
      '19-35': { total: 0, Dengue: 0, Malaria: 0, 'COVID-19': 0 },
      '36-50': { total: 0, Dengue: 0, Malaria: 0, 'COVID-19': 0 },
      '51-65': { total: 0, Dengue: 0, Malaria: 0, 'COVID-19': 0 },
      '65+': { total: 0, Dengue: 0, Malaria: 0, 'COVID-19': 0 }
    };
    
    allPatients.forEach(patient => {
      if (!patient.age || !patient.disease) return;
      
      let group;
      if (patient.age <= 18) group = '0-18';
      else if (patient.age <= 35) group = '19-35';
      else if (patient.age <= 50) group = '36-50';
      else if (patient.age <= 65) group = '51-65';
      else group = '65+';
      
      ageGroups[group].total++;
      
      // Count specific diseases
      const disease = patient.disease;
      if (disease && (disease.toLowerCase().includes('dengue'))) {
        ageGroups[group].Dengue++;
      } else if (disease && (disease.toLowerCase().includes('malaria'))) {
        ageGroups[group].Malaria++;
      } else if (disease && (disease.toLowerCase().includes('covid') || disease.toLowerCase().includes('corona'))) {
        ageGroups[group]['COVID-19']++;
      }
    });
    
    // Calculate percentages for each age group
    Object.keys(ageGroups).forEach(group => {
      const total = ageGroups[group].total;
      if (total > 0) {
        ageGroups[group].DenguePercent = Math.round((ageGroups[group].Dengue / total) * 100);
        ageGroups[group].MalariaPercent = Math.round((ageGroups[group].Malaria / total) * 100);
        ageGroups[group].CovidPercent = Math.round((ageGroups[group]['COVID-19'] / total) * 100);
      } else {
        ageGroups[group].DenguePercent = 0;
        ageGroups[group].MalariaPercent = 0;
        ageGroups[group].CovidPercent = 0;
      }
    });
    
    // Calculate health score components
    const hospitals = await Hospital.find({}).lean();
    
    // Disease Control Score (based on active vs total patients)
    const totalPatientRecords = allPatients.length || 1;
    const diseaseControlScore = Math.max(0, Math.min(100, 
      100 - Math.round((activePatients / totalPatientRecords) * 200)
    ));
    
    // Infrastructure Score (based on average bed availability)
    let totalBeds = 0;
    let availableBeds = 0;
    hospitals.forEach(hospital => {
      if (hospital.beds) {
        Object.values(hospital.beds).forEach(bed => {
          totalBeds += bed.total || 0;
          availableBeds += bed.available || 0;
        });
      }
    });
    const infrastructureScore = totalBeds > 0 ? 
      Math.round((availableBeds / totalBeds) * 100) : 50;
    
    // Vaccination Coverage (based on citizens vs active programs)
    const vaccinationScore = Math.min(100, 
      Math.round((livePrograms * 10) + (totalCitizens > 0 ? (livePrograms / totalCitizens) * 1000 : 0))
    );
    
    // Health Programs Score (based on active programs)
    const healthProgramsScore = Math.min(100, livePrograms * 15);
    
    // Emergency Response Score (based on bed occupancy - lower occupancy = better response)
    const bedOccupancy = totalBeds > 0 ? ((totalBeds - availableBeds) / totalBeds) * 100 : 0;
    const emergencyResponseScore = Math.max(0, Math.min(100, 100 - bedOccupancy));
    
    // Overall Health Score (weighted average)
    const cityHealthScore = Math.round(
      (diseaseControlScore * 0.25) +
      (infrastructureScore * 0.20) +
      (vaccinationScore * 0.20) +
      (healthProgramsScore * 0.15) +
      (emergencyResponseScore * 0.20)
    );
    
    // Average hospital score (placeholder calculation)
    const avgHospitalScore = hospitals.length > 0 ? 
      Math.round(hospitals.reduce((sum, h) => sum + (Math.random() * 2 + 3), 0) / hospitals.length * 10) / 10 : 0;
    
    // Calculate disease growth over time
    const diseaseGrowthData = calculateDiseaseGrowthOverTime(allPatients);
    
    res.render("dashboards/admin", { 
      page: "city-analytics",
      stats: {
        totalUsers,
        totalCitizens,
        totalHospitals,
        activePatients,
        livePrograms,
        cityHealthScore,
        avgHospitalScore,
        diseaseControlScore,
        infrastructureScore,
        vaccinationScore,
        healthProgramsScore,
        emergencyResponseScore
      },
      ageGroups,
      diseaseGrowthData
    });
  } catch (error) {
    console.error("Error fetching city analytics:", error);
    res.render("dashboards/admin", { 
      page: "city-analytics",
      stats: {
        totalUsers: 0,
        totalCitizens: 0,
        totalHospitals: 0,
        activePatients: 0,
        livePrograms: 0,
        cityHealthScore: 0,
        avgHospitalScore: 0,
        diseaseControlScore: 0,
        infrastructureScore: 0,
        vaccinationScore: 0,
        healthProgramsScore: 0,
        emergencyResponseScore: 0
      },
      ageGroups: {
        '0-18': { total: 0, DenguePercent: 0, MalariaPercent: 0, CovidPercent: 0 },
        '19-35': { total: 0, DenguePercent: 0, MalariaPercent: 0, CovidPercent: 0 },
        '36-50': { total: 0, DenguePercent: 0, MalariaPercent: 0, CovidPercent: 0 },
        '51-65': { total: 0, DenguePercent: 0, MalariaPercent: 0, CovidPercent: 0 },
        '65+': { total: 0, DenguePercent: 0, MalariaPercent: 0, CovidPercent: 0 }
      },
      diseaseGrowthData: { labels: [], datasets: [] }
    });
  }
});

router.get("/hospital-analytics", ensureAdmin, async (req, res) => {
  try {
    // Fetch all hospitals with their data
    const hospitals = await Hospital.find()
      .populate("user", "name email")
      .lean();
    
    res.render("dashboards/admin", { 
      page: "hospital-analytics",
      hospitals
    });
  } catch (error) {
    console.error("Error fetching hospital analytics:", error);
    res.render("dashboards/admin", { 
      page: "hospital-analytics",
      hospitals: []
    });
  }
});

// API endpoint to get specific hospital data
router.get("/api/hospital/:hospitalId", ensureAdmin, async (req, res) => {
  try {
    console.log('Fetching hospital data for ID:', req.params.hospitalId);
    
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.hospitalId)) {
      console.log('Invalid hospital ID format:', req.params.hospitalId);
      return res.status(400).json({ error: "Invalid hospital ID format" });
    }
    
    const hospital = await Hospital.findById(req.params.hospitalId);
    
    if (!hospital) {
      console.log('Hospital not found:', req.params.hospitalId);
      return res.status(404).json({ error: "Hospital not found" });
    }
    
    console.log('Hospital found:', hospital.hospitalName);
    
    // Get patients for this hospital
    const patients = await Patient.find({ hospital: hospital._id });
    const doctors = await Doctor.find({ hospital: hospital._id });
    const medicines = await Medicine.find({ hospital: hospital._id });
    
    // Calculate metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysAdmissions = patients.filter(p =>
      p.admissionDate &&
      new Date(p.admissionDate) >= today
    ).length;
    
    const todaysDischarges = patients.filter(p =>
      p.dischargeDate &&
      new Date(p.dischargeDate) >= today
    ).length;
    
    const activePatients = patients.filter(
      p => p.patientType === "IPD" && !p.dischargeDate
    ).length;
    
    // Bed calculation
    let totalBeds = 0;
    let availableBeds = 0;
    
    if (hospital.beds) {
      Object.values(hospital.beds).forEach(bed => {
        totalBeds += bed.total || 0;
        availableBeds += bed.available || 0;
      });
    }
    
    const occupiedBeds = totalBeds - availableBeds;
    const bedOccupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    
    // Count resources
    const totalDoctors = doctors.length;
    const availableDoctors = doctors.filter(d => d.isAvailable).length;
    
    // Calculate medicine stock percentage
    let medicineStockPercent = 0;
    if (medicines.length > 0) {
      const adequateStock = medicines.filter(m => m.status === 'adequate').length;
      const lowStock = medicines.filter(m => m.status === 'low').length;
      // Adequate = 100%, Low = 50%, Out of stock = 0%
      medicineStockPercent = Math.round(
        ((adequateStock * 100 + lowStock * 50) / medicines.length)
      );
    }
    
    // Calculate health score (composite metric)
    let healthScore = 0;
    let scoreComponents = 0;
    let bedManagementScore = 0;
    let resourceScore = 0;
    let patientCareScore = 0;
    
    // Bed management score (inverse of occupancy - lower is better)
    if (totalBeds > 0) {
      bedManagementScore = 100 - Math.min(bedOccupancyPercent, 100);
      healthScore += bedManagementScore;
      scoreComponents++;
    }
    
    // Resource availability score
    if (totalDoctors > 0) {
      resourceScore = (availableDoctors / totalDoctors) * 100;
      healthScore += resourceScore;
      scoreComponents++;
    }
    
    // Medicine stock score
    if (medicines.length > 0) {
      healthScore += medicineStockPercent;
      scoreComponents++;
    }
    
    // Patient care score (based on patient flow)
    if (totalBeds > 0) {
      patientCareScore = Math.min((activePatients / totalBeds) * 100, 100);
      healthScore += patientCareScore;
      scoreComponents++;
    }
    
    // Average health score
    healthScore = scoreComponents > 0 ? Math.round(healthScore / scoreComponents) : 0;
    
    res.json({
      hospitalName: hospital.hospitalName,
      location: hospital.localArea || hospital.zone || hospital.address,
      beds: {
        total: totalBeds,
        occupied: occupiedBeds,
        available: availableBeds,
        occupancyPercent: bedOccupancyPercent
      },
      resources: {
        doctors: totalDoctors,
        availableDoctors: availableDoctors,
        nurses: 0, // Add if you have nurse data
        equipment: 0 // Add if you have equipment data
      },
      patientFlow: {
        todaysAdmissions,
        todaysDischarges,
        activePatients
      },
      medicineStock: medicineStockPercent,
      healthScore: healthScore,
      healthScoreComponents: {
        bedManagement: Math.round(bedManagementScore),
        resource: Math.round(resourceScore),
        patientCare: Math.round(patientCareScore)
      }
    });
  } catch (error) {
    console.error("Error fetching hospital data:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/programs", ensureAdmin, async (req, res) => {
  try {
    const programs = await Program.find().sort({ createdAt: -1 });
    res.render("dashboards/admin", { page: "programs", programs });
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.render("dashboards/admin", { page: "programs", programs: [] });
  }
});

// Create new program
router.post("/programs/create", ensureAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      startDate,
      endDate,
      targetAudience,
      locations,
      coordinator,
      contactNumber,
      gradientFrom,
      gradientTo
    } = req.body;

    // Validate required fields
    if (!name || !description || !type || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: "Please fill all required fields" 
      });
    }

    const newProgram = new Program({
      name,
      description,
      type,
      startDate,
      endDate,
      targetAudience: targetAudience || "All Citizens",
      locations: locations || "All Health Centers",
      coordinator,
      contactNumber,
      gradientColors: {
        from: gradientFrom || 'blue-600',
        to: gradientTo || 'blue-800'
      },
      status: 'active'
    });

    await newProgram.save();
    
    res.json({ 
      success: true, 
      message: "Program created successfully",
      program: newProgram
    });
  } catch (error) {
    console.error("Error creating program:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create program",
      error: error.message 
    });
  }
});

// Delete program
router.delete("/programs/:id", ensureAdmin, async (req, res) => {
  try {
    await Program.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Program deleted successfully" });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete program" 
    });
  }
});

// Update program status
router.patch("/programs/:id/status", ensureAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const program = await Program.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json({ success: true, program });
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update program" 
    });
  }
});

// =====================================================
// PROGRAM APPLICATIONS - Admin Management
// =====================================================

const ProgramApplication = require("../models/ProgramApplication");

/**
 * GET /admin/programs/:id/applications
 * View all applications for a specific program
 */
router.get("/programs/:id/applications", ensureAdmin, async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    
    if (!program) {
      return res.redirect("/admin/programs");
    }
    
    const applications = await ProgramApplication.find({ program: req.params.id })
      .populate('userId', 'name email')
      .populate('citizen')
      .sort({ applicationDate: -1 });
    
    // Check if this is an AJAX request
    const isAjax = req.xhr || req.query.ajax === 'true';
    
    if (isAjax) {
      // Return only the partial content without layout
      res.render("admin/program-applications", { 
        program,
        applications
      });
    } else {
      // Return full page with layout
      res.render("dashboards/admin", { 
        page: "program-applications",
        program,
        applications
      });
    }
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.redirect("/admin/programs");
  }
});

/**
 * GET /admin/programs/:programId/applications/:applicationId
 * View details of a specific application
 */
router.get("/programs/:programId/applications/:applicationId", ensureAdmin, async (req, res) => {
  try {
    const program = await Program.findById(req.params.programId);
    const application = await ProgramApplication.findById(req.params.applicationId)
      .populate('userId', 'name email')
      .populate('citizen')
      .populate('reviewedBy', 'name');
    
    if (!program || !application) {
      return res.redirect("/admin/programs");
    }
    
    res.render("dashboards/admin", { 
      page: "application-details",
      program,
      application
    });
  } catch (error) {
    console.error("Error fetching application details:", error);
    res.redirect("/admin/programs");
  }
});

/**
 * GET /admin/api/applications/:id
 * Get application details as JSON (for modal display)
 */
router.get("/api/applications/:id", ensureAdmin, async (req, res) => {
  try {
    const application = await ProgramApplication.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('citizen')
      .populate('reviewedBy', 'name');
    
    if (!application) {
      return res.status(404).json({ 
        success: false, 
        message: "Application not found" 
      });
    }
    
    res.json({ 
      success: true, 
      application 
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch application details" 
    });
  }
});

/**
 * PATCH /admin/applications/:id/status
 * Update application status (approve/reject)
 */
router.patch("/applications/:id/status", ensureAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const application = await ProgramApplication.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        reviewNotes: notes
      },
      { new: true }
    );
    
    res.json({ 
      success: true, 
      message: `Application ${status} successfully`,
      application 
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update application status" 
    });
  }
});

router.get("/alerts", ensureAdmin, (req, res) => {
  res.render("dashboards/admin", { page: "alerts" });
});

module.exports = router;
