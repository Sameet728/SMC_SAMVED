const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  password: String,

  role: {
    type: String,
    enum: ["admin", "hospital", "citizen", "lab"],
    required: true,
  },

  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    default: null,
  },
});

module.exports = mongoose.model("User", UserSchema);
