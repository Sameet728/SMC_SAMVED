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

router.get("/", ensureAdmin, (req, res) => {
  res.render("dashboards/admin");
});

router.get("/city-analytics", ensureAdmin, async (req, res) => {
  try {
    // Fetch all required data
    const totalUsers = await User.countDocuments();
    const totalCitizens = await Citizen.countDocuments();
    const totalHospitals = await Hospital.countDocuments();
    
    // Get active patients (IPD patients without discharge date)
    const activePatients = await Patient.countDocuments({ 
      patientType: "IPD", 
      dischargeDate: null 
    });
    
    res.render("dashboards/admin", { 
      page: "city-analytics",
      stats: {
        totalUsers,
        totalCitizens,
        totalHospitals,
        activePatients
      }
    });
  } catch (error) {
    console.error("Error fetching city analytics:", error);
    res.render("dashboards/admin", { 
      page: "city-analytics",
      stats: {
        totalUsers: 0,
        totalCitizens: 0,
        totalHospitals: 0,
        activePatients: 0
      }
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

router.get("/alerts", ensureAdmin, (req, res) => {
  res.render("dashboards/admin", { page: "alerts" });
});

module.exports = router;
