require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const bcrypt = require("bcrypt");

const connectDB = require("./config/db");
const User = require("./models/User");

const app = express();
connectDB();

// Initialize default admin user
async function initializeAdmin() {
  try {
    const adminExists = await User.findOne({ username: "Admin1927" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("Ashish@1927", 10);
      await User.create({
        name: "SMC Administrator",
        username: "Admin1927",
        email: "admin@gmail.com",
        password: hashedPassword,
        role: "admin"
      });
      console.log("✅ Default admin user created (Email: admin@gmail.com)");
    }
  } catch (error) {
    console.error("Admin initialization error:", error.message);
  }
}

// Call admin initialization after a short delay to ensure DB is connected
setTimeout(initializeAdmin, 1000);

// View Engine
app.set("view engine", "ejs");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
const Hospital = require("./models/Hospital");

app.use(async (req, res, next) => {
  try {
    if (req.user && req.user.role === "hospital") {
      res.locals.hospital = await Hospital.findOne({
        user: req.user._id,
      });
    } else {
      res.locals.hospital = null;
    }
  } catch (err) {
    console.error("Navbar hospital load error:", err);
    res.locals.hospital = null;
  }
  next();
});



app.use(
  session({
    secret: "smc_health_secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

// Routes
app.use("/", require("./routes/auth"));
app.use("/admin", require("./routes/admin"));
app.use("/hospital", require("./routes/hospital"));
app.use("/citizen", require("./routes/citizen"));

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
