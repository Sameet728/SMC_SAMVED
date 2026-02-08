const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },

  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },

  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Patient Details
  patientName: {
    type: String,
    required: true,
  },

  patientAge: {
    type: Number,
    required: true,
  },

  patientGender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: true,
  },

  patientPhone: {
    type: String,
    required: true,
  },

  // Appointment Details
  appointmentDate: {
    type: Date,
    required: true,
  },

  appointmentTime: {
    type: String,
    required: true,
  },

  reason: {
    type: String,
    required: true,
  },

  // Disease Surveillance Fields
  diseaseType: {
    type: String,
    enum: ["Dengue", "Malaria", "TB", "Viral Fever", "Diabetes", "Typhoid", "Cholera", "COVID-19", "Other"],
    default: "Other",
  },

  severity: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Low",
  },

  ward: {
    type: String,
    trim: true,
  },

  zone: {
    type: String,
    trim: true,
  },

  // Status
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },

  notes: {
    type: String,
    default: "",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
