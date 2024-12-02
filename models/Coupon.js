const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // like name of coupon
  discountPercentage: { type: Number, required: true }, // For percentage-based discounts 
  maxUsage: { type: Number, default: 100 }, // Maximum number of times the coupon can be used
  usageCount: { type: Number, default: 0 }, // Number of times the coupon has been used
  isActive: { type: Boolean, default: true }, // Whether the coupon is active
  expiryDate: { type: Date, required: true }, // Expiry date of the coupon
}, { timestamps: true });

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
