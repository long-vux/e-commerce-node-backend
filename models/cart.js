const { Schema, model } = require('mongoose');

const cartItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },  // price of the product * quantity
  variant: { type: String, default: null },
  selected: { type: Boolean, default: true },
});

const CartSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
  items: [cartItemSchema],
  coupon: { type: Schema.Types.ObjectId, ref: 'Coupon', default: null }, // Reference to the coupon applied to the cart
  total: { type: Number, default: 0 },
}, { timestamps: true });

const Cart = model('Cart', CartSchema);

module.exports = Cart;
