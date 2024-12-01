const User = require('../models/User')
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const VerifyToken = require('../models/VerifyToken')
const sendEmail = require('../utils/sendEmail')
const Order = require('../models/Order')
const Cart = require('../models/Cart')

// Create a new user when checkout but not login
exports.checkout = async (req, res) => {
  const { lastName, firstName, email, address, total } = req.body
  try {
    let user = await User.findOne({ email })

    if (!user) {
      const randomPassword = crypto.randomBytes(10).toString('hex').slice(0, 8)
      const hashedPassword = await bcrypt.hash(randomPassword, 10)
      user = await User.create({ lastName, firstName, email, address, password: hashedPassword })

      const token = await VerifyToken.create({
        userId: user._id,
        token: crypto.randomBytes(8).toString('hex')
      })

      //   Send verification email
      const url = `${process.env.FRONTEND_URL}/${user._id}/verify/${token.token}`
      const subject = 'Verify Your Email and Set Your Password'
      const htmlContent = `
      <h1>Welcome to MADNESS!</h1>
      <p>Thank you for browing and making purchases at MADNESS!</p>
      <p>Please click the link below to verify your email and set your password:</p>
      <a href="${url}">Verify Email</a>
      <p>Your temporary password is: <strong>${randomPassword}</strong></p>
      <p>Please change your password after logging in for security reasons.</p>
      <p>Best regards,<br/>MADNESS Team</p>
    `
      await sendEmail(email, subject, htmlContent)
    } else {
      if (!req.user) {
        return res.status(401).json({ message: 'User already exists. Please log in to use your cart' })
      }
    }

    let cartItems = []
    if (req.user) {
      const cart = await Cart.findOne({ user: req.user._id })
      if (cart) {
        cartItems = cart.items
      }
    } else {
      cartItems = req.session.cart || []
    }

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' })
    }

    const order = await Order.create({
      user: user._id,
      items: cartItems.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.price
      })),
      total: total,
      shippingAddress: address,
      status: 'pending'
    })

    user.orders.push(order._id)
    await user.save()

    if (req.user) {
      await Cart.deleteOne({ user: req.user._id })
    } else {
      req.session.cart = []
    }

    res.status(200).json({ message: 'Order placed successfully, Please check your email to verify your account and complete the purchase.', order })
  } catch (error) {
    return res.status(500).json({ message: 'Error processing checkout', error: error.message })
  }
}