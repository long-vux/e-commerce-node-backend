const { Schema, model } = require('mongoose');

const cartItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
  selected: { type: Boolean, default: true },
});

const CartSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
  items: [cartItemSchema],
  coupons: { 
    type: [Schema.Types.ObjectId], 
    ref: 'Coupon', 
    default: []  // Initialize as an empty array
  }, // Reference to the coupon applied to the cart
  originalTotal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
}, { timestamps: true });

const Cart = model('Cart', CartSchema);

module.exports = Cart;
