const mongoose = require("mongoose");

const programSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['vaccination', 'health_camp', 'maternal_health', 'child_health', 'awareness', 'other']
  },
  bannerImage: {
    type: String,
    default: ""
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  targetAudience: {
    type: String,
    default: "All Citizens"
  },
  locations: {
    type: String,
    default: "All Health Centers"
  },
  coordinator: {
    type: String,
    default: ""
  },
  contactNumber: {
    type: String,
    default: ""
  },
  enrolled: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  gradientColors: {
    from: {
      type: String,
      default: 'blue-600'
    },
    to: {
      type: String,
      default: 'blue-800'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Program", programSchema);
