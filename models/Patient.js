// models/Patient.js
const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },

  patientType: {
    type: String,
    enum: ["OPD", "IPD"],
    required: true,
  },

  name: String,
  age: Number,
  gender: String,
  disease: String,

  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
  },

  // 🔥 PRESCRIPTION
  prescription: [
    {
      medicine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Medicine",
      },
      quantity: Number,
      dosage: String, // optional (e.g. 1-0-1)
    },
  ],

  admissionDate: {
    type: Date,
    default: Date.now,
  },
  // models/Patient.js (add this)
profile: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "PatientProfile",
},


  dischargeDate: Date,
});

module.exports = mongoose.model("Patient", PatientSchema);
