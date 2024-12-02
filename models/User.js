const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema({
  street: { type: String },
  district: { type: String },
  city: { type: String },
  country: { type: String },
  contactName: { type: String },
  contactPhone: { type: String },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  phone: { type: String },
  image: { type: String },
  addresses: [AddressSchema],
  orders: { 
    type: [mongoose.Schema.Types.ObjectId], 
    ref: 'Order', 
    default: [] 
  },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  verified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
