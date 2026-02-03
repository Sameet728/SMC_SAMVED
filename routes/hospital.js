const express = require("express");
const router = express.Router();

const Patient = require("../models/Patient");
const Hospital = require("../models/Hospital");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const PatientProfile = require("../models/PatientProfile");

const { ensureHospital } = require("../middleware/auth");
const Equipment = require("../models/Equipment");
const Medicine = require("../models/Medicine");

const PDFDocument = require("pdfkit");

// ================= PATIENT HISTORY PDF =================
router.get("/patients/profile/:profileId/pdf", ensureHospital, async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id });

    const profile = await PatientProfile.findOne({
      _id: req.params.profileId,
      hospital: hospital._id,
    });

    const visits = await Patient.find({
      profile: profile._id,
      hospital: hospital._id,
    })
      .populate("doctor")
      .populate("prescription.medicine")
      .sort({ admissionDate: -1 }); // Newest first usually looks better on reports

    // ==========================================
    // 1. SETUP & STYLING CONSTANTS
    // ==========================================
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Modern Color Palette (Matches your Navbar)
    const COLORS = {
      primary: "#10b981",    // Emerald 500
      primaryDark: "#047857",// Emerald 700
      secondary: "#334155",  // Slate 700
      text: "#475569",       // Slate 600
      textLight: "#94a3b8",  // Slate 400
      bgLight: "#f8fafc",    // Slate 50
      border: "#e2e8f0"      // Slate 200
    };

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${profile.name.replace(/\s+/g, '_')}_Medical_History.pdf"`
    );

    doc.pipe(res);

    // Helper: Draw a horizontal line
    const drawLine = (y) => {
      doc.strokeColor(COLORS.border).lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
    };

    // Helper: Check for page bottom to avoid awkward cuts
    const checkPageBreak = (neededSpace) => {
      if (doc.y + neededSpace > 750) {
        doc.addPage();
        return true;
      }
      return false;
    };

    // ==========================================
    // 2. HEADER SECTION
    // ==========================================
    
    // Top Accent Bar
    doc.rect(0, 0, 600, 10).fill(COLORS.primary);

    // Hospital Name & Info
    doc.moveDown(2);
    doc.font("Helvetica-Bold").fontSize(20).fillColor(COLORS.secondary).text(hospital.hospitalName);
    
    doc.fontSize(10).font("Helvetica").fillColor(COLORS.textLight)
       .text("Comprehensive Medical History Report", { spacing: 1 });
       
    // Right side: Report Date
    doc.fontSize(9).fillColor(COLORS.text)
       .text(`Generated: ${new Date().toLocaleDateString()}`, 400, 75, { align: "right" });

    drawLine(110);

    // ==========================================
    // 3. PATIENT PROFILE CARD
    // ==========================================
    doc.moveDown(2);
    const startY = 130;

    // Background Box for Patient Info
    doc.roundedRect(50, startY, 500, 85, 8).fill(COLORS.bgLight);
    
    doc.fillColor(COLORS.secondary).font("Helvetica-Bold").fontSize(12)
       .text("Patient Information", 70, startY + 15);

    // Data Grid (2 Columns)
    const col1 = 70;
    const col2 = 300;
    const row1 = startY + 40;
    const row2 = startY + 60;

    doc.font("Helvetica").fontSize(10).fillColor(COLORS.textLight);
    
    // Name
    doc.text("Full Name:", col1, row1);
    doc.fillColor(COLORS.secondary).font("Helvetica-Bold").text(profile.name, col1 + 60, row1);
    
    // Age/Gender
    doc.fillColor(COLORS.textLight).font("Helvetica").text("Age / Sex:", col2, row1);
    doc.fillColor(COLORS.secondary).font("Helvetica-Bold").text(`${profile.age || "--"} / ${profile.gender || "--"}`, col2 + 60, row1);

    // Phone
    doc.fillColor(COLORS.textLight).font("Helvetica").text("Phone:", col1, row2);
    doc.fillColor(COLORS.secondary).font("Helvetica-Bold").text(profile.phone || "N/A", col1 + 60, row2);

    // ID
    doc.fillColor(COLORS.textLight).font("Helvetica").text("Patient ID:", col2, row2);
    doc.fillColor(COLORS.secondary).font("Helvetica-Bold").text(profile._id.toString().substring(0, 8).toUpperCase(), col2 + 60, row2);

    doc.y = startY + 110; // Reset Y cursor below the card

    // ==========================================
    // 4. VISIT TIMELINE LOOP
    // ==========================================
    doc.font("Helvetica-Bold").fontSize(14).fillColor(COLORS.primary).text("Visit History", 50, doc.y);
    doc.moveDown(0.5);

    if (visits.length === 0) {
      doc.font("Helvetica").fontSize(12).fillColor(COLORS.textLight).text("No medical visits recorded.", { align: 'center' });
    }

    visits.forEach((v, index) => {
      // Ensure we don't break a card in half
      checkPageBreak(150);

      const cardY = doc.y;
      
      // -- VISIT HEADER (Date & Type) --
      // Small colored pill for Type
      const typeColor = v.patientType === "IPD" ? "#ef4444" : "#3b82f6"; // Red for IPD, Blue for OPD
      doc.roundedRect(50, cardY, 500, 25, 4).fill(COLORS.bgLight);
      
      // Date
      doc.fillColor(COLORS.secondary).font("Helvetica-Bold").fontSize(10)
         .text(v.admissionDate ? new Date(v.admissionDate).toDateString() : "Unknown Date", 60, cardY + 7);
      
      // Type Tag
      doc.fillColor(typeColor).font("Helvetica-Bold").text(v.patientType, 480, cardY + 7, { align: "right" });

      // -- VISIT DETAILS --
      doc.moveDown(2);
      const detailY = doc.y;

      // Doctor & Disease
      doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.secondary).text(v.disease || "General Checkup", 60, detailY);
      doc.font("Helvetica").fontSize(9).fillColor(COLORS.textLight).text(`Dr. ${v.doctor ? v.doctor.name : "Unassigned"}`, 60, detailY + 15);

      // Status (for IPD)
      if (v.patientType === "IPD") {
        const status = v.dischargeDate ? `Discharged: ${new Date(v.dischargeDate).toLocaleDateString()}` : "Currently Admitted";
        doc.text(status, 300, detailY, { align: "right" });
      }

      // -- PRESCRIPTION TABLE --
      doc.moveDown(2.5);
      
      if (v.prescription && v.prescription.length > 0) {
        // Table Header
        const tableTop = doc.y;
        doc.rect(60, tableTop, 480, 20).fill(COLORS.primary);
        doc.fillColor("white").font("Helvetica-Bold").fontSize(9);
        doc.text("Medicine", 70, tableTop + 5);
        doc.text("Dosage", 250, tableTop + 5);
        doc.text("Qty", 350, tableTop + 5);
        doc.text("Frequency", 420, tableTop + 5);

        let rowY = tableTop + 20;

        v.prescription.forEach((p, i) => {
          checkPageBreak(30);
          
          // Alternating Row Color
          if (i % 2 === 0) doc.rect(60, rowY, 480, 20).fill(COLORS.bgLight);

          doc.fillColor(COLORS.text).font("Helvetica").fontSize(9);
          
          // Medicine Name
          doc.text(p.medicine?.name || "Unknown", 70, rowY + 5, { width: 170, ellipsis: true });
          // Dosage (mg)
          doc.text(p.medicine?.dosage || "-", 250, rowY + 5);
          // Quantity
          doc.text(p.quantity?.toString() || "-", 350, rowY + 5);
          // Dosage Text (e.g. 1-0-1)
          doc.text(p.dosage || "-", 420, rowY + 5);

          rowY += 20;
          doc.y = rowY; // Update cursor
        });
      } else {
        doc.font("Helvetica-Oblique").fontSize(9).fillColor(COLORS.textLight).text("No medicines prescribed.", 60, doc.y);
      }

      // Spacer between visits
      doc.moveDown(2);
      doc.strokeColor(COLORS.border).lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1.5);
    });

    // ==========================================
    // 5. FOOTER (Page Numbers)
    // ==========================================
    const range = doc.bufferedPageRange(); // Get range of pages
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      
      // Bottom Line
      doc.strokeColor(COLORS.primary).lineWidth(2).moveTo(0, 830).lineTo(600, 830).stroke();
      
      // Footer Text
      doc.fontSize(8).fillColor(COLORS.textLight)
         .text("Confidential Medical Record - For Official Hospital Use Only", 50, 810, { align: "left" });
         
      doc.text(`Page ${i + 1} of ${range.count}`, 50, 810, { align: "right" });
    }

    doc.end();

  } catch (error) {
    console.error("PDF Generation Error:", error);
    res.status(500).send("Error generating PDF");
  }
});



router.get("/dashboard", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  // ================= FETCH DATA =================
  const patients = await Patient
    .find({ hospital: hospital._id })
    .populate("doctor");

  const doctors = await Doctor.find({ hospital: hospital._id });

  // ================= FETCH APPOINTMENTS =================
  const appointments = await Appointment.find({ hospital: hospital._id })
    .populate("doctor")
    .populate("citizen")
    .sort({ appointmentDate: -1 });

  // ================= PATIENT METRICS =================
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysOPD = patients.filter(p =>
    p.patientType === "OPD" &&
    p.admissionDate &&
    new Date(p.admissionDate) >= today
  ).length;

  const currentIPD = patients.filter(
    p => p.patientType === "IPD" && !p.dischargeDate
  ).length;

  // ================= BED CALCULATION =================
  let totalBeds = 0;
  let availableBeds = 0;

  if (hospital.beds) {
    Object.values(hospital.beds).forEach(bed => {
      totalBeds += bed.total || 0;
      availableBeds += bed.available || 0;
    });
  }

  const occupiedBeds = totalBeds - availableBeds;

  const bedOccupancyPercent =
    totalBeds > 0
      ? Math.round((occupiedBeds / totalBeds) * 100)
      : 0;

  const emergencyStatus =
    bedOccupancyPercent >= 80 ? "High Load" : "Normal";

  // ================= RENDER =================
  res.render("dashboards/hospital", {
    hospital,
    patients,
    doctors,
    appointments,
    totalBeds,
    availableBeds,
    stats: {
      todaysOPD,
      currentIPD,
      bedOccupancyPercent,
      emergencyStatus,
    },
  });
});





// ---------- PATIENT ----------

// ================= PATIENT HISTORY TIMELINE =================
router.get("/patients/profile/:profileId", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  const profile = await PatientProfile.findOne({
    _id: req.params.profileId,
    hospital: hospital._id,
  });

  if (!profile) {
    return res.status(404).send("Patient profile not found");
  }

  const visits = await Patient.find({
    profile: profile._id,
    hospital: hospital._id,
  })
    .populate("doctor")
    .populate("prescription.medicine")
    .sort({ admissionDate: -1 });

  res.render("hospital/patientHistory", {
    hospital,
    profile,
    visits,
  });
});



// Register patient
router.post("/patients", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  const {
    profileId,
    name,
    age,
    gender,
    phone,
    patientType,
    disease,
    doctor,
    bedType,
    admissionDate,
  } = req.body;

  let profile = null;

  // =============================
  // 1️⃣ TRY PROFILE BY ID (from search)
  // =============================
  if (profileId) {
    profile = await PatientProfile.findOne({
      _id: profileId,
      hospital: hospital._id,
    });
  }

  // =============================
  // 2️⃣ TRY PROFILE BY PHONE (AUTO MATCH)
  // =============================
  if (!profile && phone) {
    profile = await PatientProfile.findOne({
      hospital: hospital._id,
      phone: phone.trim(),
    });
  }

  // =============================
  // 3️⃣ CREATE NEW PROFILE IF NOT FOUND
  // =============================
  if (!profile) {
    if (!name || !name.trim()) {
      return res.status(400).send("Patient name is required");
    }

    profile = await PatientProfile.create({
      hospital: hospital._id,
      name: name.trim(),
      age,
      gender,
      phone,
    });
  }

  // =============================
  // 4️⃣ CREATE VISIT (OPD / IPD)
  // =============================
  const finalAdmissionDate =
    patientType === "IPD" && admissionDate
      ? new Date(admissionDate)
      : new Date();

  await Patient.create({
    hospital: hospital._id,
    profile: profile._id,

    // snapshot (important for history)
    name: profile.name,
    age: profile.age,
    gender: profile.gender,
    phone: profile.phone,

    patientType,
    disease,
    doctor: doctor || null,
    bedType: patientType === "IPD" ? bedType : undefined,
    admissionDate: finalAdmissionDate,
  });

  res.redirect("/hospital/dashboard");
});









// Discharge patient
router.post("/patients/:id/discharge", ensureHospital, async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (patient.dischargeDate) return res.redirect("/hospital/dashboard");

  patient.dischargeDate = new Date();
  await patient.save();

  const hospital = await Hospital.findById(patient.hospital);

  // 🔺 Increase bed availability
  if (patient.bedType) {
    hospital.beds[patient.bedType].available += 1;
    await hospital.save();
  }

  res.redirect("/hospital/dashboard");
});

// Save prescription & reduce medicine stock
router.post("/patients/:id/prescription", ensureHospital, async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  const medicines = await Medicine.find({ hospital: patient.hospital });

  for (let med of medicines) {
    const qty = parseInt(req.body[`quantity_${med._id}`]);
    const dosage = req.body[`dosage_${med._id}`];

    if (qty && qty > 0) {
      if (med.quantity < qty) {
        return res.send(`Not enough stock for ${med.name}`);
      }

      // 🔻 Reduce stock
      med.quantity -= qty;
      await med.save();

      // ✅ Save prescription
      patient.prescription.push({
        medicine: med._id,
        quantity: qty,
        dosage,
      });
    }
  }

  await patient.save();

  res.redirect("/hospital/dashboard");
});


// AJAX patient lookup
router.get("/patients/lookup", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });
  const q = req.query.q || "";

  if (!q || q.length < 2) {
    return res.json([]);
  }

  const profiles = await PatientProfile.find({
    hospital: hospital._id,
    $or: [
      { name: new RegExp(q, "i") },
      { phone: new RegExp(q, "i") },
    ],
  })
    .limit(5)
    .select("name age gender phone");

  res.json(profiles);
});

// Show Add Patient page
// Show Add Patient page
// ================= ADD PATIENT PAGE =================
router.get("/patients/new", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  const doctors = await Doctor.find({
    hospital: hospital._id,
    isAvailable: true,
  });

  const profiles = await PatientProfile.find({
    hospital: hospital._id,
  });

  console.log("PatientProfile collection:",
    PatientProfile.collection.collectionName
  );
  console.log("Profiles:", profiles);

  res.render("hospital/addPatient", {
    doctors,
    profiles,
  });
});






// Show prescription page
router.get("/patients/:id/prescription", ensureHospital, async (req, res) => {
  const patient = await Patient
    .findById(req.params.id)
    .populate("doctor")
    .populate("prescription.medicine");

  if (!patient) {
    return res.status(404).send("Patient not found");
  }

  const hospital = await Hospital.findById(patient.hospital);

  const medicines = await Medicine.find({
    hospital: hospital._id,
  });

  res.render("hospital/prescription", {
    hospital,
    patient,
    medicines,
  });
});





// ---------- DOCTOR ----------

// Show all doctors
router.get("/doctors", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });
  const doctors = await Doctor.find({ hospital: hospital._id });

  res.render("hospital/doctors", { hospital, doctors });
});

// Show add doctor form
router.get("/doctors/new", ensureHospital, async (req, res) => {
  res.render("hospital/addDoctor");
});

// Handle add doctor
router.post("/doctors", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  const { name, specialization, opdTimings, phone, experienceYears } = req.body;

  await Doctor.create({
    hospital: hospital._id,
    name,
    specialization,
    opdTimings,
    phone,
    experienceYears,
  });

  res.redirect("/hospital/doctors");
});

router.get("/doctors/workload", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  const doctors = await Doctor.find({ hospital: hospital._id });

  // Fetch all patients of this hospital
  const patients = await Patient
    .find({ hospital: hospital._id })
    .populate("doctor");

  // Build workload data
  const workload = doctors.map(doc => {
    const opdCount = patients.filter(
      p => p.doctor && p.doctor._id.equals(doc._id) && p.patientType === "OPD"
    ).length;

    const ipdAdmitted = patients.filter(
      p =>
        p.doctor &&
        p.doctor._id.equals(doc._id) &&
        p.patientType === "IPD" &&
        !p.dischargeDate
    ).length;

    const ipdDischarged = patients.filter(
      p =>
        p.doctor &&
        p.doctor._id.equals(doc._id) &&
        p.patientType === "IPD" &&
        p.dischargeDate
    ).length;

    return {
      doctor: doc,
      opdCount,
      ipdAdmitted,
      ipdDischarged,
      total: opdCount + ipdAdmitted + ipdDischarged,
    };
  });

  res.render("hospital/doctorWorkload", {
    hospital,
    workload,
  });
});

router.post("/doctors/:id/toggle", ensureHospital, async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    return res.status(404).send("Doctor not found");
  }

  doctor.isAvailable = !doctor.isAvailable;
  await doctor.save();

  res.redirect("/hospital/doctors");
});



// ---------- equipments ----------

router.get("/resources", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  const equipments = await Equipment.find({ hospital: hospital._id });
  const medicines = await Medicine.find({ hospital: hospital._id });

  res.render("hospital/resources", {
    hospital,
    equipments,
    medicines,
  });
});


router.post("/equipment", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  const { name, quantity, condition } = req.body;

  await Equipment.create({
    hospital: hospital._id,
    name,
    quantity,
    condition,
  });

  res.redirect("/hospital/resources");
});

router.post("/equipment/:id/edit", ensureHospital, async (req, res) => {
  console.log("EDIT EQUIPMENT BODY:", req.body); // 👈 ADD THIS

  const { name, quantity, condition } = req.body;

  await Equipment.findByIdAndUpdate(req.params.id, {
    name,
    quantity,
    condition,
    lastUpdated: new Date(),
  });

  res.redirect("/hospital/resources");
});


router.post("/equipment/:id/delete", ensureHospital, async (req, res) => {
  await Equipment.findByIdAndDelete(req.params.id);
  res.redirect("/hospital/resources");
});



router.post("/medicine", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  const { name, quantity, unit, status } = req.body;

  await Medicine.create({
    hospital: hospital._id,
    name,
    quantity,
    unit,
    status,
  });

  res.redirect("/hospital/resources");
});

router.post("/medicine/:id/edit", ensureHospital, async (req, res) => {
  const { name, quantity, unit, status } = req.body;

  await Medicine.findByIdAndUpdate(req.params.id, {
    name,
    quantity,
    unit,
    status,
    lastUpdated: new Date(),
  });

  res.redirect("/hospital/resources");
});

router.post("/medicine/:id/delete", ensureHospital, async (req, res) => {
  await Medicine.findByIdAndDelete(req.params.id);
  res.redirect("/hospital/resources");
});








// ---------- BEDS ----------

// Update bed availability
router.post("/beds/update", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  hospital.availableBeds = req.body.availableBeds;
  await hospital.save();

  res.redirect("/hospital/dashboard");
});



// ---------- ANALYTICS DASHBOARD ----------
router.get("/analytics", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  // ================= PATIENT DATA =================
  const patients = await Patient
    .find({ hospital: hospital._id })
    .populate("doctor");

  const opdCount = patients.filter(p => p.patientType === "OPD").length;

  const ipdCount = patients.filter(
    p => p.patientType === "IPD" && !p.dischargeDate
  ).length;

  // Today OPD
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOpdCount = patients.filter(
    p =>
      p.patientType === "OPD" &&
      p.admissionDate &&
      new Date(p.admissionDate) >= today
  ).length;

  // ================= BED CALCULATION =================
  let totalBeds = 0;
  let availableBeds = 0;

  if (hospital.beds) {
    Object.values(hospital.beds).forEach(bed => {
      totalBeds += bed.total || 0;
      availableBeds += bed.available || 0;
    });
  }

  // ================= DOCTOR LOAD =================
  const doctors = await Doctor.find({ hospital: hospital._id });

  const doctorStats = doctors.map(doc => {
    const patientsCount = patients.filter(
      p => p.doctor && p.doctor._id.equals(doc._id)
    ).length;

    return {
      name: doc.name,
      specialization: doc.specialization,
      patientsCount,
    };
  });

  // ================= MEDICINE =================
  const medicines = await Medicine.find({ hospital: hospital._id });

  const medicineStats = medicines.map(m => ({
    name: m.name,
    quantity: m.quantity,
    status: m.status,
  }));

  // ================= EQUIPMENT =================
  const equipments = await Equipment.find({ hospital: hospital._id });

  const equipmentStats = equipments.map(e => ({
    name: e.name,
    quantity: e.quantity,
    condition: e.condition,
  }));

  // ================= RENDER =================
  res.render("hospital/analytics", {
    hospital,

    totalBeds,
    availableBeds,
    bedsByType: hospital.beds || {},

    opdCount,
    ipdCount,
    todayOpdCount,

    doctorStats,
    medicineStats,
    equipmentStats,
  });
});

// =====================================================
// APPOINTMENT MANAGEMENT
// =====================================================

// Update appointment status
router.post("/appointments/:id/status", ensureHospital, async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id });
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      hospital: hospital._id
    });

    if (!appointment) {
      return res.status(404).send("Appointment not found");
    }

    appointment.status = req.body.status;
    if (req.body.notes) {
      appointment.notes = req.body.notes;
    }
    await appointment.save();

    res.redirect("/hospital/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating appointment");
  }
});

// Get appointments as JSON (for AJAX)
router.get("/appointments/json", ensureHospital, async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id });
    const appointments = await Appointment.find({ hospital: hospital._id })
      .populate("doctor")
      .populate("citizen")
      .sort({ appointmentDate: -1 });

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: "Error fetching appointments" });
  }
});

module.exports = router;
