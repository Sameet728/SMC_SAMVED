const mongoose = require("mongoose");

const programApplicationSchema = new mongoose.Schema({
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Program",
    required: true
  },
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Citizen",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // Application Form Fields
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other']
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    street: {
      type: String,
      required: true
    },
    area: {
      type: String,
      required: true
    },
    ward: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    }
  },
  aadharNumber: {
    type: String,
    trim: true
  },
  // Medical Information
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Not Known']
  },
  medicalHistory: {
    type: String,
    default: ""
  },
  allergies: {
    type: String,
    default: ""
  },
  currentMedications: {
    type: String,
    default: ""
  },
  previousVaccinations: {
    type: String,
    default: ""
  },
  // Program Specific
  preferredCenter: {
    type: String,
    default: ""
  },
  preferredDate: {
    type: Date
  },
  emergencyContact: {
    name: {
      type: String
    },
    relation: {
      type: String
    },
    phone: {
      type: String
    }
  },
  // Application Status
  status: {
    type: String,
    enum: ['approved', 'completed'],
    default: 'approved'
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
programApplicationSchema.index({ program: 1, citizen: 1 });
programApplicationSchema.index({ status: 1 });
programApplicationSchema.index({ applicationDate: -1 });

module.exports = mongoose.model("ProgramApplication", programApplicationSchema);
