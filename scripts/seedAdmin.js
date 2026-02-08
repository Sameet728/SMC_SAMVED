require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

/**
 * Seed Admin User
 * Creates the default admin account for SMC Command Center
 * Email: admin@gmail.com
 * Password: Ashish@1927
 */

const ADMIN_CREDENTIALS = {
  name: "SMC Administrator",
  username: "Admin1927",
  email: "admin@gmail.com",
  password: "Ashish@1927",
  role: "admin"
};

async function seedAdmin() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/smc_health";
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: ADMIN_CREDENTIALS.username });
    
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log("Username:", ADMIN_CREDENTIALS.username);
      console.log("Updating credentials...");
      
      // Update password
      const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.name = ADMIN_CREDENTIALS.name;
      existingAdmin.email = ADMIN_CREDENTIALS.email;
      await existingAdmin.save();
      
      console.log("✅ Admin credentials updated successfully!");
      console.log("✉️  Email:", ADMIN_CREDENTIALS.email);
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, 10);
      
      const admin = await User.create({
        name: ADMIN_CREDENTIALS.name,
        username: ADMIN_CREDENTIALS.username,
        email: ADMIN_CREDENTIALS.email,
        password: hashedPassword,
        role: ADMIN_CREDENTIALS.role
      });

      console.log("✅ Admin user created successfully!");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📋 Admin Login Credentials:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("Username:", ADMIN_CREDENTIALS.username);
      console.log("Password:", ADMIN_CREDENTIALS.password);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }

    console.log("\n🎯 Admin can now login at: http://localhost:3000/login");
    console.log("🔐 Use email:", ADMIN_CREDENTIALS.email);
    console.log("🔐 Password:", ADMIN_CREDENTIALS.password);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
}

seedAdmin();
