const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { ensureAdmin } = require("../middleware/auth");

/**
 * Admin Routes
 * SMC Command Center - Smart Public Health Management System
 * All routes protected with ensureAdmin middleware
 */

// ==========================================
// MAIN DASHBOARD
// ==========================================

// Admin dashboard - Executive Summary
router.get("/dashboard", ensureAdmin, adminController.getDashboard);

// ==========================================
// ANALYTICS API ENDPOINTS
// ==========================================

// Ward-wise map data for geospatial visualization
router.get("/api/map-data", ensureAdmin, adminController.getWardMapData);

// Disease time-series data for trend analysis
router.get("/api/disease-trends", ensureAdmin, adminController.getDiseaseTimeSeriesData);

// Resource allocation suggestions
router.get("/api/resource-suggestions", ensureAdmin, adminController.getResourceAllocationSuggestions);

// ==========================================
// EMERGENCY RESPONSE
// ==========================================

// Broadcast emergency alert
router.post("/api/emergency-alert", ensureAdmin, adminController.broadcastEmergencyAlert);

module.exports = router;
