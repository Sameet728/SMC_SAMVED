const mongoose = require("mongoose");

/**
 * Outbreak Schema
 * Tracks disease outbreaks and epidemiological data
 * for Smart Public Health Management System
 */
const OutbreakSchema = new mongoose.Schema({
  disease: {
    type: String,
    required: true,
    enum: ["Dengue", "Malaria", "Typhoid", "TB", "COVID-19", "Cholera", "Chikungunya", "Other"],
  },

  ward: {
    type: String,
    required: true,
  },

  zone: {
    type: String,
  },

  cases: {
    type: Number,
    default: 1,
    required: true,
  },

  severity: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Low",
  },

  status: {
    type: String,
    enum: ["Active", "Controlled", "Resolved"],
    default: "Active",
  },

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [75.9064, 17.6599], // Solapur coordinates
    },
  },

  affectedPopulation: {
    type: Number,
    default: 0,
  },

  reportedDate: {
    type: Date,
    default: Date.now,
  },

  resolvedDate: {
    type: Date,
  },

  description: {
    type: String,
  },

  actionsTaken: {
    type: String,
  },
}, {
  timestamps: true,
});

// Geospatial index for location-based queries
OutbreakSchema.index({ location: "2dsphere" });
OutbreakSchema.index({ disease: 1, status: 1 });
OutbreakSchema.index({ ward: 1 });

module.exports = mongoose.model("Outbreak", OutbreakSchema);
