const { Schema, model } = require('mongoose');

const cartItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
});

const CartSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
  items: [cartItemSchema],
}, { timestamps: true });

const Cart = model('Cart', CartSchema);

module.exports = Cart;
