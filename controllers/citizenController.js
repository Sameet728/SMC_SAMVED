const Citizen = require("../models/Citizen");
const User = require("../models/User");

/**
 * CitizenController
 * Handles all citizen profile-related operations
 */

/**
 * Save/Update Citizen Profile
 * POST /citizen/profile
 * 
 * Accepts form data + profile image
 * - Calculates age from DOB
 * - Saves profile fields to MongoDB
 * - Saves image path (not image itself)
 * - Marks profileCompleted = true
 * - Updates session with ward info
 */
exports.saveProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Extract form data
    const {
      fullName,
      phone,
      email,
      dob,
      gender,
      occupation,
      street,
      ward,
      pincode,
      city,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      zone,
      bloodGroup,
      allergies,
      chronicConditions,
    } = req.body;

    // Validate required fields
    if (!fullName || !phone || !dob || !gender || !ward) {
      return res.status(400).json({
        success: false,
        error: "Please provide all required fields: fullName, phone, dob, gender, and ward",
      });
    }

    // Calculate age from DOB
    const age = Citizen.calculateAge(new Date(dob));

    // Prepare profile image path
    let profileImagePath = "/default-avatar.png";
    if (req.file) {
      profileImagePath = `/uploads/profiles/${req.file.filename}`;
    }

    // Prepare citizen data
    const citizenData = {
      userId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email && email.trim() ? email.trim() : undefined,
      dob: new Date(dob),
      age,
      gender: gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase(),
      occupation: occupation && occupation.trim() ? occupation.trim() : undefined,
      address: {
        street: street && street.trim() ? street.trim() : undefined,
        ward: ward.trim(),
        pincode: pincode && pincode.trim() ? pincode.trim() : undefined,
        city: city || "Solapur",
      },
      emergencyContact: {
        name: emergencyContactName && emergencyContactName.trim() ? emergencyContactName.trim() : undefined,
        phone: emergencyContactPhone && emergencyContactPhone.trim() ? emergencyContactPhone.trim() : undefined,
        relation: emergencyContactRelation && emergencyContactRelation.trim() ? emergencyContactRelation.trim() : undefined,
      },
      zone: zone && zone.trim() ? zone.trim() : undefined,
      profileImage: profileImagePath,
      profileCompleted: true,
    };

    // Add health metadata if provided
    if (bloodGroup || allergies || chronicConditions) {
      citizenData.healthMetadata = {
        bloodGroup: bloodGroup || "",
        allergies: allergies ? allergies.split(",").map(a => a.trim()) : [],
        chronicConditions: chronicConditions ? chronicConditions.split(",").map(c => c.trim()) : [],
      };
    }

    // Check if citizen profile already exists
    let citizen = await Citizen.findOne({ userId });

    if (citizen) {
      // Update existing profile
      Object.assign(citizen, citizenData);
      await citizen.save();
    } else {
      // Create new profile
      citizen = new Citizen(citizenData);
      await citizen.save();
    }

    // Update session with ward information (only essential data)
    req.session.ward = ward.trim();
    req.session.profileCompleted = true;

    // Save session before responding
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Update User model with profile image
    await User.findByIdAndUpdate(userId, { 
      profileImage: profileImagePath,
      name: fullName.trim() 
    });

    console.log('✅ Profile saved successfully for user:', userId);
    console.log('📊 Citizen data:', {
      fullName: citizen.fullName,
      ward: citizen.address.ward,
      profileCompleted: citizen.profileCompleted
    });

    // Success response
    res.json({
      success: true,
      message: "Profile saved successfully!",
      citizen: {
        id: citizen._id,
        fullName: citizen.fullName,
        profileImage: citizen.profileImage,
        profileCompleted: citizen.profileCompleted,
        ward: citizen.address.ward
      },
    });

  } catch (error) {
    console.error("❌ Error saving citizen profile:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      errors: error.errors
    });

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      console.error("Validation errors:", errors);
      return res.status(400).json({
        success: false,
        error: "Validation failed: " + errors.join(", "),
        details: errors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to save profile. Please try again.",
    });
  }
};

/**
 * Get Citizen Profile
 * GET /citizen/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const citizen = await Citizen.findOne({ userId }).populate("userId", "name email role");

    if (!citizen) {
      return res.status(404).json({
        success: false,
        error: "Profile not found",
      });
    }

    res.json({
      success: true,
      citizen,
    });

  } catch (error) {
    console.error("Error fetching citizen profile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch profile",
    });
  }
};

/**
 * Update Profile Image Only
 * POST /citizen/profile/image
 */
exports.updateProfileImage = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided",
      });
    }

    const profileImagePath = `/uploads/profiles/${req.file.filename}`;

    // Update citizen profile
    const citizen = await Citizen.findOneAndUpdate(
      { userId },
      { profileImage: profileImagePath },
      { new: true }
    );

    if (!citizen) {
      return res.status(404).json({
        success: false,
        error: "Citizen profile not found",
      });
    }

    // Also update user model
    await User.findByIdAndUpdate(userId, { profileImage: profileImagePath });

    res.json({
      success: true,
      message: "Profile image updated successfully",
      profileImage: profileImagePath,
    });

  } catch (error) {
    console.error("Error updating profile image:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update profile image",
    });
  }
};

/**
 * Delete Profile (Soft delete - mark as incomplete)
 * DELETE /citizen/profile
 */
exports.deleteProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const citizen = await Citizen.findOneAndUpdate(
      { userId },
      { profileCompleted: false },
      { new: true }
    );

    if (!citizen) {
      return res.status(404).json({
        success: false,
        error: "Profile not found",
      });
    }

    // Clear session data
    req.session.ward = null;
    req.session.profileCompleted = false;

    res.json({
      success: true,
      message: "Profile marked as incomplete",
    });

  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete profile",
    });
  }
};

module.exports = exports;
