const mongoose = require("mongoose");

const PatientProfileSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },

  name: { type: String, required: true },
  age: Number,
  gender: String,
  phone: String,

}, { timestamps: true });

module.exports = mongoose.model("PatientProfile", PatientProfileSchema);
