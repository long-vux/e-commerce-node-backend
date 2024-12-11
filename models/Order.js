const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  variant: { type: String, default: null }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [orderItemSchema],
  total: { type: Number, required: true },
  shippingAddress: { type: String, required: true },
  receiverEmail: { type: String, required: true },
  receiverName: { type: String, required: true },
  receiverPhone: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Order', orderSchema)
