const mongoose = require("mongoose");

const HospitalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  hospitalName: String,
  ward: String,
  localArea: String,
  zone: String,
  address: String,
  contactNumber: String,

  beds: {
    general: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
    icu: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
    isolation: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
  },
});

module.exports = mongoose.model("Hospital", HospitalSchema);
