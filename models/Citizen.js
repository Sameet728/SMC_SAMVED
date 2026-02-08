const mongoose = require("mongoose");

/**
 * Citizen Profile Schema
 * Stores comprehensive citizen health and demographic information
 * for Smart Public Health Management System
 */
const CitizenSchema = new mongoose.Schema(
  {
    // Reference to User account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Basic Information
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number"],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          // Allow empty/undefined, but validate if provided
          return !v || /^\S+@\S+\.\S+$/.test(v);
        },
        message: "Please enter a valid email address"
      }
    },

    dob: {
      type: Date,
      required: true,
    },

    // Auto-calculated age field
    age: {
      type: Number,
      required: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    occupation: {
      type: String,
      trim: true,
    },

    // Address Information
    address: {
      street: {
        type: String,
        trim: true,
      },
      ward: {
        type: String,
        required: true,
        trim: true,
      },
      pincode: {
        type: String,
        trim: true,
        validate: {
          validator: function(v) {
            // Allow empty/undefined, but validate if provided
            return !v || /^\d{6}$/.test(v);
          },
          message: "Please enter a valid 6-digit pincode"
        }
      },
      city: {
        type: String,
        default: "Solapur",
        trim: true,
      },
    },

    // Emergency Contact
    emergencyContact: {
      name: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
        validate: {
          validator: function(v) {
            // Allow empty/undefined, but validate if provided
            return !v || /^[6-9]\d{9}$/.test(v);
          },
          message: "Please enter a valid 10-digit mobile number"
        }
      },
      relation: {
        type: String,
        trim: true,
      },
    },

    // System Fields
    zone: {
      type: String,
      trim: true,
    },

    // Profile Image - Store only the file path, NOT the image itself
    profileImage: {
      type: String,
      default: "/default-avatar.png",
    },

    // Profile Completion Status
    profileCompleted: {
      type: Boolean,
      default: false,
    },

    // Health-related metadata (for future use)
    healthMetadata: {
      bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
        default: "",
      },
      allergies: [String],
      chronicConditions: [String],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// =====================================================
// VIRTUAL FIELDS
// =====================================================

// Virtual field to calculate age dynamically if needed
CitizenSchema.virtual("calculatedAge").get(function () {
  if (!this.dob) return null;
  const today = new Date();
  const birthDate = new Date(this.dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// =====================================================
// STATIC METHODS
// =====================================================

/**
 * Calculate age from date of birth
 * @param {Date} dob - Date of birth
 * @returns {Number} - Calculated age
 */
CitizenSchema.statics.calculateAge = function (dob) {
  if (!dob) return 0;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Find citizen by userId
 * @param {ObjectId} userId - User ID
 * @returns {Object} - Citizen document
 */
CitizenSchema.statics.findByUserId = function (userId) {
  return this.findOne({ userId }).populate("userId");
};

// =====================================================
// INSTANCE METHODS
// =====================================================

/**
 * Mark profile as completed
 */
CitizenSchema.methods.markProfileCompleted = function () {
  this.profileCompleted = true;
  return this.save();
};

/**
 * Update age based on current DOB
 */
CitizenSchema.methods.updateAge = function () {
  this.age = this.constructor.calculateAge(this.dob);
  return this.age;
};

// =====================================================
// MIDDLEWARE
// =====================================================

// Pre-save middleware to auto-calculate age before saving
CitizenSchema.pre("save", async function () {
  if (this.dob) {
    this.age = this.constructor.calculateAge(this.dob);
  }
});

// =====================================================
// INDEXES
// =====================================================

// Index for faster lookups (userId uses unique index from schema definition)
CitizenSchema.index({ phone: 1 });
CitizenSchema.index({ "address.ward": 1 });
CitizenSchema.index({ profileCompleted: 1 });

module.exports = mongoose.model("Citizen", CitizenSchema);
