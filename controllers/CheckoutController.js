const twilio = require('../config/twilio')
const User = require('../models/User')

exports.sendOTP = async (req, res) => {
  const { phoneNumber } = req.body
}