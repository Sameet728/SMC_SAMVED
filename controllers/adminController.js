const Hospital = require("../models/Hospital");
const Patient = require("../models/Patient");
const Citizen = require("../models/Citizen");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Medicine = require("../models/Medicine");
const Equipment = require("../models/Equipment");
const Outbreak = require("../models/Outbreak");
const Notification = require("../models/Notification");

/**
 * Admin Controller
 * Handles all admin dashboard analytics and operations
 * for Smart Public Health Management System - SMC Command Center
 */

// ==========================================
// MAIN DASHBOARD - EXECUTIVE SUMMARY
// ==========================================

exports.getDashboard = async (req, res) => {
  try {
    // Extract filter parameters from query string
    const filters = {
      disease: req.query.disease || null,
      zone: req.query.zone || null,
      ward: req.query.ward || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      ageGroup: req.query.ageGroup || null,
      gender: req.query.gender || null,
    };

    // Execute all analytics in parallel for better performance
    const [
      executiveSummary,
      bedOccupancy,
      medicineAlerts,
      diseaseAnalytics,
      wardStats,
      recentOutbreaks,
      infrastructureStatus,
      citizenMetrics,
      emergencyMetrics,
      diseaseTrends,
      wardWiseData,
      demographicBreakdown,
      riskLevels,
      appointmentSpikes,
      predictiveAlerts,
      filterOptions,
    ] = await Promise.all([
      getExecutiveSummary(),
      getBedOccupancyStats(),
      getMedicineAlerts(),
      getDiseaseAnalytics(),
      getWardWiseStats(),
      getRecentOutbreaks(),
      getInfrastructureStatus(),
      getCitizenServiceMetrics(),
      getEmergencyMetrics(),
      getDiseaseTrendData(filters),
      getWardWiseDiseaseData(filters),
      getDemographicBreakdownData(filters),
      getRiskLevelData(filters),
      getAppointmentSpikeData(filters),
      getPredictiveAlerts(filters),
      getSurveillanceFilterOptions(),
    ]);

    res.render("dashboards/admin", {
      executiveSummary,
      bedOccupancy,
      medicineAlerts,
      diseaseAnalytics,
      wardStats,
      recentOutbreaks,
      infrastructureStatus,
      citizenMetrics,
      emergencyMetrics,
      diseaseTrends,
      wardWiseData,
      demographicBreakdown,
      riskLevels,
      appointmentSpikes,
      predictiveAlerts,
      filterOptions,
      filters,
      user: req.user,
    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    res.status(500).send("Error loading admin dashboard");
  }
};

// ==========================================
// EXECUTIVE SUMMARY KPIs
// ==========================================

async function getExecutiveSummary() {
  try {
    const [
      activeOutbreaks,
      totalBeds,
      occupiedBeds,
      criticalMedicines,
      totalCitizens,
      todayAppointments,
    ] = await Promise.all([
      Outbreak.countDocuments({ status: "Active" }),
      Hospital.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $add: ["$beds.general.total", "$beds.icu.total", "$beds.isolation.total"],
              },
            },
          },
        },
      ]),
      Hospital.aggregate([
        {
          $group: {
            _id: null,
            occupied: {
              $sum: {
                $add: [
                  { $subtract: ["$beds.general.total", "$beds.general.available"] },
                  { $subtract: ["$beds.icu.total", "$beds.icu.available"] },
                  { $subtract: ["$beds.isolation.total", "$beds.isolation.available"] },
                ],
              },
            },
          },
        },
      ]),
      Medicine.countDocuments({ status: { $in: ["low", "out_of_stock"] } }),
      Citizen.countDocuments(),
      Appointment.countDocuments({
        appointmentDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      }),
    ]);

    const totalBedsCount = totalBeds.length > 0 ? totalBeds[0].total : 0;
    const occupiedBedsCount = occupiedBeds.length > 0 ? occupiedBeds[0].occupied : 0;
    const occupancyRate = totalBedsCount > 0 ? ((occupiedBedsCount / totalBedsCount) * 100).toFixed(1) : 0;

    // Calculate emergency response status based on outbreak severity
    const criticalOutbreaks = await Outbreak.countDocuments({ 
      status: "Active", 
      severity: { $in: ["High", "Critical"] } 
    });
    
    let emergencyStatus = "Normal";
    if (criticalOutbreaks >= 3) emergencyStatus = "Critical";
    else if (criticalOutbreaks >= 1) emergencyStatus = "Alert";
    else if (activeOutbreaks > 5) emergencyStatus = "Monitoring";

    return {
      activeOutbreaks,
      totalBeds: totalBedsCount,
      occupiedBeds: occupiedBedsCount,
      occupancyRate,
      criticalMedicines,
      emergencyStatus,
      totalCitizens,
      todayAppointments,
    };
  } catch (error) {
    console.error("Executive Summary Error:", error);
    return {
      activeOutbreaks: 0,
      totalBeds: 0,
      occupiedBeds: 0,
      occupancyRate: 0,
      criticalMedicines: 0,
      emergencyStatus: "Unknown",
      totalCitizens: 0,
      todayAppointments: 0,
    };
  }
}

// ==========================================
// BED OCCUPANCY ANALYTICS
// ==========================================

async function getBedOccupancyStats() {
  try {
    const bedStats = await Hospital.aggregate([
      {
        $project: {
          hospitalName: 1,
          ward: 1,
          generalTotal: "$beds.general.total",
          generalAvailable: "$beds.general.available",
          generalOccupied: { $subtract: ["$beds.general.total", "$beds.general.available"] },
          icuTotal: "$beds.icu.total",
          icuAvailable: "$beds.icu.available",
          icuOccupied: { $subtract: ["$beds.icu.total", "$beds.icu.available"] },
          isolationTotal: "$beds.isolation.total",
          isolationAvailable: "$beds.isolation.available",
          isolationOccupied: { $subtract: ["$beds.isolation.total", "$beds.isolation.available"] },
        },
      },
      {
        $addFields: {
          totalBeds: { $add: ["$generalTotal", "$icuTotal", "$isolationTotal"] },
          totalOccupied: { $add: ["$generalOccupied", "$icuOccupied", "$isolationOccupied"] },
        },
      },
      {
        $addFields: {
          occupancyRate: {
            $cond: [
              { $eq: ["$totalBeds", 0] },
              0,
              { $multiply: [{ $divide: ["$totalOccupied", "$totalBeds"] }, 100] },
            ],
          },
        },
      },
      { $sort: { occupancyRate: -1 } },
    ]);

    return bedStats;
  } catch (error) {
    console.error("Bed Occupancy Error:", error);
    return [];
  }
}

// ==========================================
// MEDICINE ALERTS & INVENTORY
// ==========================================

async function getMedicineAlerts() {
  try {
    const alerts = await Medicine.aggregate([
      {
        $match: {
          status: { $in: ["low", "out_of_stock"] },
        },
      },
      {
        $lookup: {
          from: "hospitals",
          localField: "hospital",
          foreignField: "_id",
          as: "hospitalInfo",
        },
      },
      { $unwind: { path: "$hospitalInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: 1,
          quantity: 1,
          unit: 1,
          status: 1,
          hospitalName: "$hospitalInfo.hospitalName",
          ward: "$hospitalInfo.ward",
          lastUpdated: 1,
        },
      },
      { $sort: { status: -1, quantity: 1 } },
      { $limit: 20 },
    ]);

    return alerts;
  } catch (error) {
    console.error("Medicine Alerts Error:", error);
    return [];
  }
}

// ==========================================
// DISEASE ANALYTICS & SURVEILLANCE
// ==========================================

async function getDiseaseAnalytics() {
  try {
    // Get disease distribution from patients
    const diseaseDistribution = await Patient.aggregate([
      {
        $match: {
          disease: { $exists: true, $ne: null, $ne: "" },
        },
      },
      {
        $group: {
          _id: "$disease",
          totalCases: { $sum: 1 },
          currentActive: {
            $sum: {
              $cond: [{ $eq: [{ $ifNull: ["$dischargeDate", null] }, null] }, 1, 0],
            },
          },
        },
      },
      { $sort: { totalCases: -1 } },
    ]);

    // Get disease trends from appointments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const diseaseTrends = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          reason: { $exists: true, $ne: null, $ne: "" },
        },
      },
      {
        $group: {
          _id: {
            disease: "$reason",
            week: { $week: "$createdAt" },
          },
          cases: { $sum: 1 },
        },
      },
      { $sort: { "_id.week": 1 } },
    ]);

    // Age group distribution
    const ageDistribution = await Patient.aggregate([
      {
        $bucket: {
          groupBy: "$age",
          boundaries: [0, 12, 18, 35, 50, 65, 100],
          default: "Unknown",
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    return {
      diseaseDistribution,
      diseaseTrends,
      ageDistribution,
    };
  } catch (error) {
    console.error("Disease Analytics Error:", error);
    return {
      diseaseDistribution: [],
      diseaseTrends: [],
      ageDistribution: [],
    };
  }
}

// ==========================================
// WARD-WISE STATISTICS
// ==========================================

async function getWardWiseStats() {
  try {
    const wardStats = await Patient.aggregate([
      {
        $lookup: {
          from: "hospitals",
          localField: "hospital",
          foreignField: "_id",
          as: "hospitalInfo",
        },
      },
      { $unwind: { path: "$hospitalInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$hospitalInfo.ward",
          totalPatients: { $sum: 1 },
          activeCases: {
            $sum: {
              $cond: [{ $eq: [{ $ifNull: ["$dischargeDate", null] }, null] }, 1, 0],
            },
          },
          diseases: { $addToSet: "$disease" },
        },
      },
      {
        $project: {
          ward: "$_id",
          totalPatients: 1,
          activeCases: 1,
          uniqueDiseases: { $size: { $ifNull: ["$diseases", []] } },
        },
      },
      { $sort: { activeCases: -1 } },
    ]);

    // Get outbreak data by ward
    const outbreaksByWard = await Outbreak.aggregate([
      {
        $match: {
          status: "Active",
        },
      },
      {
        $group: {
          _id: "$ward",
          outbreaks: { $sum: 1 },
          totalCases: { $sum: "$cases" },
          diseases: { $addToSet: "$disease" },
          maxSeverity: { $max: "$severity" },
        },
      },
    ]);

    // Merge ward stats with outbreak data
    const mergedStats = wardStats.map((ward) => {
      const outbreakData = outbreaksByWard.find((o) => o._id === ward.ward);
      return {
        ...ward,
        outbreaks: outbreakData ? outbreakData.outbreaks : 0,
        outbreakCases: outbreakData ? outbreakData.totalCases : 0,
        severity: outbreakData ? outbreakData.maxSeverity : "Low",
      };
    });

    return mergedStats;
  } catch (error) {
    console.error("Ward Stats Error:", error);
    return [];
  }
}

// ==========================================
// RECENT OUTBREAKS
// ==========================================

async function getRecentOutbreaks() {
  try {
    const outbreaks = await Outbreak.find({ status: "Active" })
      .sort({ severity: -1, reportedDate: -1 })
      .limit(10)
      .lean();

    return outbreaks;
  } catch (error) {
    console.error("Recent Outbreaks Error:", error);
    return [];
  }
}

// ==========================================
// INFRASTRUCTURE STATUS
// ==========================================

async function getInfrastructureStatus() {
  try {
    const [equipmentStatus, medicineStock, hospitalCount, doctorCount] = await Promise.all([
      Equipment.aggregate([
        {
          $group: {
            _id: "$condition",
            count: { $sum: "$quantity" },
          },
        },
      ]),
      Medicine.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Hospital.countDocuments(),
      Doctor.countDocuments(),
    ]);

    return {
      equipmentStatus,
      medicineStock,
      hospitalCount,
      doctorCount,
    };
  } catch (error) {
    console.error("Infrastructure Status Error:", error);
    return {
      equipmentStatus: [],
      medicineStock: [],
      hospitalCount: 0,
      doctorCount: 0,
    };
  }
}

// ==========================================
// CITIZEN SERVICE METRICS
// ==========================================

async function getCitizenServiceMetrics() {
  try {
    const [
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      languageStats,
      profileCompletion,
    ] = await Promise.all([
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: "completed" }),
      Appointment.countDocuments({ status: "pending" }),
      Citizen.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
          },
        },
      ]),
      Citizen.aggregate([
        {
          $group: {
            _id: "$profileCompleted",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const completionRate =
      totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(1) : 0;

    return {
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      completionRate,
      languageStats,
      profileCompletion,
    };
  } catch (error) {
    console.error("Citizen Metrics Error:", error);
    return {
      totalAppointments: 0,
      completedAppointments: 0,
      pendingAppointments: 0,
      completionRate: 0,
      languageStats: [],
      profileCompletion: [],
    };
  }
}

// ==========================================
// EMERGENCY RESPONSE METRICS
// ==========================================

async function getEmergencyMetrics() {
  try {
    const [criticalOutbreaks, emergencyNotifications, availableICUBeds] = await Promise.all([
      Outbreak.countDocuments({ status: "Active", severity: { $in: ["High", "Critical"] } }),
      Notification.countDocuments({ type: "emergency", createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Hospital.aggregate([
        {
          $group: {
            _id: null,
            availableICU: { $sum: "$beds.icu.available" },
          },
        },
      ]),
    ]);

    // Calculate health score (0-100)
    const executiveSummary = await getExecutiveSummary();
    const healthScore = calculateHealthScore(executiveSummary, criticalOutbreaks);

    return {
      criticalOutbreaks,
      emergencyNotifications,
      availableICUBeds: availableICUBeds.length > 0 ? availableICUBeds[0].availableICU : 0,
      healthScore,
      responseTimeAvg: "8 min", // Placeholder - would need historical data
    };
  } catch (error) {
    console.error("Emergency Metrics Error:", error);
    return {
      criticalOutbreaks: 0,
      emergencyNotifications: 0,
      availableICUBeds: 0,
      healthScore: 75,
      responseTimeAvg: "N/A",
    };
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function calculateHealthScore(executiveSummary, criticalOutbreaks) {
  let score = 100;

  // Deduct points for active outbreaks
  score -= executiveSummary.activeOutbreaks * 5;

  // Deduct points for critical outbreaks
  score -= criticalOutbreaks * 10;

  // Deduct points for high bed occupancy
  if (executiveSummary.occupancyRate > 90) score -= 15;
  else if (executiveSummary.occupancyRate > 75) score -= 10;
  else if (executiveSummary.occupancyRate > 60) score -= 5;

  // Deduct points for medicine shortages
  score -= executiveSummary.criticalMedicines * 2;

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

// ==========================================
// API ENDPOINTS FOR DYNAMIC DATA
// ==========================================

exports.getWardMapData = async (req, res) => {
  try {
    const mapData = await Outbreak.aggregate([
      {
        $match: {
          status: "Active",
        },
      },
      {
        $group: {
          _id: "$ward",
          totalCases: { $sum: "$cases" },
          outbreaks: { $sum: 1 },
          maxSeverity: { $max: "$severity" },
          location: { $first: "$location" },
          diseases: { $addToSet: "$disease" },
        },
      },
      {
        $project: {
          ward: "$_id",
          totalCases: 1,
          outbreaks: 1,
          severity: "$maxSeverity",
          location: 1,
          diseases: 1,
        },
      },
    ]);

    res.json({ success: true, data: mapData });
  } catch (error) {
    console.error("Map Data Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDiseaseTimeSeriesData = async (req, res) => {
  try {
    const { disease, days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const timeSeriesData = await Patient.aggregate([
      {
        $match: {
          admissionDate: { $gte: startDate },
          ...(disease && disease !== "all" ? { disease } : {}),
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$admissionDate" } },
            disease: "$disease",
          },
          cases: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    res.json({ success: true, data: timeSeriesData });
  } catch (error) {
    console.error("Time Series Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.broadcastEmergencyAlert = async (req, res) => {
  try {
    const { title, message, priority, targetAudience, ward } = req.body;

    const notification = new Notification({
      type: "emergency",
      priority: priority || "critical",
      title,
      message,
      targetAudience: targetAudience || "all",
      ward: targetAudience === "ward" ? ward : undefined,
      isBroadcast: true,
      sentBy: req.user._id,
    });

    await notification.save();

    res.json({ success: true, message: "Emergency alert broadcast successfully" });
  } catch (error) {
    console.error("Broadcast Alert Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getResourceAllocationSuggestions = async (req, res) => {
  try {
    // Get wards with high disease load and low resources
    const suggestions = await Hospital.aggregate([
      {
        $lookup: {
          from: "patients",
          localField: "_id",
          foreignField: "hospital",
          as: "patients",
        },
      },
      {
        $addFields: {
          totalBeds: { $add: ["$beds.general.total", "$beds.icu.total", "$beds.isolation.total"] },
          availableBeds: { $add: ["$beds.general.available", "$beds.icu.available", "$beds.isolation.available"] },
          patientCount: { $size: "$patients" },
        },
      },
      {
        $addFields: {
          occupancyRate: {
            $cond: [
              { $eq: ["$totalBeds", 0] },
              0,
              { $multiply: [{ $divide: [{ $subtract: ["$totalBeds", "$availableBeds"] }, "$totalBeds"] }, 100] },
            ],
          },
        },
      },
      {
        $match: {
          occupancyRate: { $gte: 75 }, // High occupancy
        },
      },
      {
        $project: {
          hospitalName: 1,
          ward: 1,
          occupancyRate: 1,
          availableBeds: 1,
          patientCount: 1,
          suggestion: {
            $concat: [
              "Increase bed capacity or transfer patients from ",
              "$ward",
              " ward (", { $toString: "$occupancyRate" }, "% occupancy)",
            ],
          },
        },
      },
      { $sort: { occupancyRate: -1 } },
    ]);

    res.json({ success: true, suggestions });
  } catch (error) {
    console.error("Resource Allocation Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// HELPER FUNCTIONS FOR SURVEILLANCE ANALYTICS
// ==========================================

/**
 * Disease Trend Time Series Data
 * Multi-line chart showing disease progression over time
 */
async function getDiseaseTrendData(filters) {
  try {
    const matchStage = buildMatchStage(filters);
    
    const trends = await Appointment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" },
            },
            disease: "$diseaseType",
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.date": 1 },
      },
      {
        $group: {
          _id: "$_id.disease",
          data: {
            $push: {
              date: "$_id.date",
              count: "$count",
            },
          },
        },
      },
    ]);

    return trends;
  } catch (error) {
    console.error("Disease Trend Error:", error);
    return [];
  }
}

/**
 * Ward-Wise Disease Distribution
 * Horizontal bar chart showing case counts per ward
 */
async function getWardWiseDiseaseData(filters) {
  try {
    const matchStage = buildMatchStage(filters);
    
    const wardData = await Appointment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            ward: "$ward",
            disease: "$diseaseType",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.ward",
          diseases: {
            $push: {
              disease: "$_id.disease",
              count: "$count",
            },
          },
          total: { $sum: "$count" },
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $limit: 15,
      },
    ]);

    return wardData;
  } catch (error) {
    console.error("Ward-Wise Data Error:", error);
    return [];
  }
}

/**
 * Demographic Breakdown by Age Group
 * Grouped bar chart showing disease distribution across age groups
 */
async function getDemographicBreakdownData(filters) {
  try {
    const matchStage = buildMatchStage(filters);
    
    const demographics = await Appointment.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          ageGroup: {
            $switch: {
              branches: [
                { case: { $lte: ["$patientAge", 12] }, then: "0-12" },
                { case: { $lte: ["$patientAge", 25] }, then: "13-25" },
                { case: { $lte: ["$patientAge", 45] }, then: "26-45" },
                { case: { $lte: ["$patientAge", 60] }, then: "46-60" },
              ],
              default: "60+",
            },
          },
        },
      },
      {
        $group: {
          _id: {
            ageGroup: "$ageGroup",
            disease: "$diseaseType",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.ageGroup",
          diseases: {
            $push: {
              disease: "$_id.disease",
              count: "$count",
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return demographics;
  } catch (error) {
    console.error("Demographic Breakdown Error:", error);
    return [];
  }
}

/**
 * Risk Level Classification
 * Donut chart showing ward risk levels based on case volume
 */
async function getRiskLevelData(filters) {
  try {
    const matchStage = buildMatchStage(filters);
    
    const wardCounts = await Appointment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$ward",
          count: { $sum: 1 },
          criticalCases: {
            $sum: { $cond: [{ $eq: ["$severity", "Critical"] }, 1, 0] },
          },
          highSeverity: {
            $sum: { $cond: [{ $eq: ["$severity", "High"] }, 1, 0] },
          },
        },
      },
    ]);

    // Classify wards into risk levels
    const riskLevels = { High: 0, Medium: 0, Safe: 0 };
    
    wardCounts.forEach((ward) => {
      if (ward.count > 50 || ward.criticalCases > 5) {
        riskLevels.High++;
      } else if (ward.count > 20 || ward.highSeverity > 3) {
        riskLevels.Medium++;
      } else {
        riskLevels.Safe++;
      }
    });

    return riskLevels;
  } catch (error) {
    console.error("Risk Level Error:", error);
    return { High: 0, Medium: 0, Safe: 0 };
  }
}

/**
 * Appointment Spike Detection
 * Bar chart showing daily OPD spikes
 */
async function getAppointmentSpikeData(filters) {
  try {
    const matchStage = buildMatchStage(filters);
    
    const spikes = await Appointment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" },
          },
          count: { $sum: 1 },
          criticalCount: {
            $sum: { $cond: [{ $eq: ["$severity", "Critical"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $limit: 30,
      },
    ]);

    return spikes.reverse();
  } catch (error) {
    console.error("Appointment Spike Error:", error);
    return [];
  }
}

/**
 * Predictive Alert Generation
 * AI-driven alerts based on pattern detection
 */
async function getPredictiveAlerts(filters) {
  try {
    const alerts = [];
    
    // Get recent appointment trends by ward and disease
    const recentData = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: {
            $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Last 14 days
          },
        },
      },
      {
        $group: {
          _id: {
            ward: "$ward",
            disease: "$diseaseType",
          },
          recent: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    "$appointmentDate",
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  ],
                },
                1,
                0,
              ],
            },
          },
          previous: {
            $sum: {
              $cond: [
                {
                  $lt: [
                    "$appointmentDate",
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  ],
                },
                1,
                0,
              ],
            },
          },
          severity: { $max: "$severity" },
        },
      },
    ]);

    // Detect outbreak patterns
    recentData.forEach((item) => {
      const increase = item.recent - item.previous;
      const percentageIncrease = item.previous > 0 
        ? ((increase / item.previous) * 100).toFixed(0) 
        : (item.recent > 5 ? 100 : 0);

      if (percentageIncrease >= 50 && item.recent >= 5) {
        alerts.push({
          type: "outbreak",
          severity: "Critical",
          message: `Ward ${item._id.ward} - ${item._id.disease} outbreak probability ${percentageIncrease}%`,
          ward: item._id.ward,
          disease: item._id.disease,
          caseCount: item.recent,
        });
      } else if (percentageIncrease >= 30 && item.recent >= 3) {
        alerts.push({
          type: "spike",
          severity: "High",
          message: `Ward ${item._id.ward} - ${item._id.disease} spike detected (+${percentageIncrease}%)`,
          ward: item._id.ward,
          disease: item._id.disease,
          caseCount: item.recent,
        });
      }
    });

    // Sort by severity
    alerts.sort((a, b) => {
      const severityOrder = { Critical: 0, High: 1, Medium: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return alerts.slice(0, 6); // Top 6 alerts
  } catch (error) {
    console.error("Predictive Alerts Error:", error);
    return [];
  }
}

/**
 * Get Filter Options for Dropdowns
 */
async function getSurveillanceFilterOptions() {
  try {
    const [diseases, zones, wards] = await Promise.all([
      Appointment.distinct("diseaseType"),
      Appointment.distinct("zone"),
      Appointment.distinct("ward"),
    ]);

    return {
      diseases: diseases.filter(Boolean),
      zones: zones.filter(Boolean),
      wards: wards.filter(Boolean).sort(),
      ageGroups: ["0-12", "13-25", "26-45", "46-60", "60+"],
      genders: ["Male", "Female", "Other"],
    };
  } catch (error) {
    console.error("Filter Options Error:", error);
    return {
      diseases: ["Dengue", "Malaria", "TB", "Viral Fever", "Diabetes"],
      zones: [],
      wards: [],
      ageGroups: ["0-12", "13-25", "26-45", "46-60", "60+"],
      genders: ["Male", "Female", "Other"],
    };
  }
}

/**
 * Build MongoDB Match Stage from Filters
 */
function buildMatchStage(filters) {
  const match = {};

  if (filters.disease) {
    match.diseaseType = filters.disease;
  }

  if (filters.zone) {
    match.zone = filters.zone;
  }

  if (filters.ward) {
    match.ward = filters.ward;
  }

  if (filters.gender) {
    match.patientGender = filters.gender;
  }

  if (filters.startDate || filters.endDate) {
    match.appointmentDate = {};
    if (filters.startDate) {
      match.appointmentDate.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      match.appointmentDate.$lte = new Date(filters.endDate);
    }
  }

  if (filters.ageGroup) {
    const ageRanges = {
      "0-12": [0, 12],
      "13-25": [13, 25],
      "26-45": [26, 45],
      "46-60": [46, 60],
      "60+": [61, 150],
    };
    const range = ageRanges[filters.ageGroup];
    if (range) {
      match.patientAge = { $gte: range[0], $lte: range[1] };
    }
  }

  return match;
}
