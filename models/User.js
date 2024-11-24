const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    role: { type: String, enum: ["admin", "user"], default: "user" },
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
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
