const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema({
  products: [
    {
      type: mongoose.Schema.Types.ObjectId, ref: 'Product',
      quantity: { type: Number, required: true },
      total: { type: Number, required: true },
    }
  ],
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  total: { type: Number, required: true },
})

module.exports = mongoose.model('OrderItem', orderItemSchema)
