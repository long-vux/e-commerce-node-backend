const mongoose = require("mongoose");
const bcrypt = require('bcrypt')

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
  },
  firstName: { type: String },
  lastName: { type: String },
  image: { type: String },
  password: { type: String },
  phone: { type: String },
  address: { type: String },
  role: { type: String, enum: ["admin", "user"], default: "user" },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
