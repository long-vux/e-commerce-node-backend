const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema({
  province: { type: String },
  district: { type: String },
  ward: { type: String },
  street: { type: String },
  receiverName: { type: String },
  receiverPhone: { type: String },
  deliveryCode: { type: String },
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
