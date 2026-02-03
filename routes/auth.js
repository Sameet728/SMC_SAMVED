const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
require("../config/passport")(passport);

const User = require("../models/User");
const router = express.Router();

// Home
router.get("/", (req, res) => res.render("home"));

// Register
router.get("/register", (req, res) => res.render("auth/register"));



const Hospital = require("../models/Hospital");

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      hospitalName,
      ward,
      address,
      contactNumber,

      generalTotal,
      generalAvailable,
      icuTotal,
      icuAvailable,
      isolationTotal,
      isolationAvailable,
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1️⃣ Create User
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // 2️⃣ Create Hospital if role is hospital
    if (role === "hospital") {
      const hospital = await Hospital.create({
        user: user._id,
        hospitalName,
        ward,
        address,
        contactNumber,

        beds: {
          general: {
            total: Number(generalTotal || 0),
            available: Number(generalAvailable || generalTotal || 0),
          },
          icu: {
            total: Number(icuTotal || 0),
            available: Number(icuAvailable || icuTotal || 0),
          },
          isolation: {
            total: Number(isolationTotal || 0),
            available: Number(isolationAvailable || isolationTotal || 0),
          },
        },
      });

      // Link back
      user.hospital = hospital._id;
      await user.save();
      console.log(user);
    }

    res.redirect("/login");
  } catch (err) {
    console.error(err);
    req.flash("error", "Registration failed");
    res.status(500).send("Registration failed");
  }
});



// Login
router.get("/login", (req, res) => res.render("auth/login"));

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  })
);

// Role-based redirect
router.get("/dashboard", (req, res) => {
  if (req.user.role === "admin") return res.redirect("/admin/dashboard");
  if (req.user.role === "hospital") return res.redirect("/hospital/dashboard");
  return res.redirect("/citizen/dashboard");
});



// Logout
router.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/login"));
});

module.exports = router;
