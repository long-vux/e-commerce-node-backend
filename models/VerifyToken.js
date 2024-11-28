const mongoose = require('mongoose')

const VerifyTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  token: { type: String },
  createdAt: { type: Date, expires: 3600 },
})

module.exports = mongoose.model('VerifyToken', VerifyTokenSchema)