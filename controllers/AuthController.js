const axios = require('axios')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const VerifyToken = require('../models/VerifyToken')
const sendEmail = require('../utils/sendEmail')
const Cart = require('../models/Cart')

exports.googleLogin = async (req, res) => {
  const token = req.body.token
  let payload = {}

  // Verify the token with Google
  try {
    const googleResponse = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    )
    const userObject = googleResponse.data
    if (!userObject) {
      return res.status(401).json({ message: 'Invalid token' })
    }
    let user = await User.findOne({ email: userObject.email })

    if (!user) {
      user = new User({
        email: userObject.email,
        password: userObject.sub,
        firstName: userObject.given_name,
        lastName: userObject.family_name,
        role: 'user',
        verified: true,
        image: userObject.picture,
        addresses: [],
        orders: [],
        isBanned: false
      })
      await user.save()
      if (user.isBanned) {
        return res.status(403).json({ message: 'This account is banned' })
      }
      payload = {
        id: user._id,
        email: userObject.email,
        firstName: userObject.given_name,
        lastName: userObject.family_name,
        role: 'user',
        image: userObject.picture
      }
    } else {
      const imageUrl = `${process.env.CLOUDFRONT_URL}${user.image}`
      payload = {
        id: user._id,
        email: userObject.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        image: imageUrl
      }
    }
  } catch (error) {
    return res.status(401).json({ message: error.message })
  }

  const newToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '5h'
  })

  res.status(200).json({ message: 'Google login successful', token: newToken })
}

exports.login = async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email })
  if (!user) {
    return res.status(401).json({ message: 'Email does not exist' })
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    return res.status(401).json({ message: 'Wrong password' })
  }

  if (user.isBanned) {
    return res.status(403).json({ message: 'This account is banned' })
  }

  if (!user.verified) {
    let token = await VerifyToken.findOne({ userId: user._id })
    if (!token) {
      token = await VerifyToken.create({
        userId: user._id,
        token: crypto.randomBytes(32).toString('hex')
      })
    }

    const url = `${process.env.FRONTEND_URL}/verify-email/${user._id}/${token.token}`

    //   Send OTP via email
    const subject = 'Verify Your Email'
    const text = `Welcome to MADNESS! Please click <a href="${url}">here</a> to verify your email. This OTP will expire in 1 hour.`
    await sendEmail(email, subject, text)
    return res
      .status(403)
      .json({
        message: 'Email not verified. A verification email has been sent.'
      })
  }

  // Initialize session cart
  req.session.user = user._id

  // merge user cart with session cart
  if (req.session.cart && req.session.cart.length > 0) {
    const userCart = await Cart.findOne({ user: user._id })
    if (!userCart) {
      await Cart.create({ user: user._id, items: req.session.cart })
    } else {
      req.session.cart.forEach(item => {
        const existingItem = userCart.items.find(
          i => i.product.toString() === item.productId
        )
        if (existingItem) {
          existingItem.quantity += item.quantity
        } else {
          userCart.items.push(item)
        }
      })
      await userCart.save()
    }
    req.session.cart = []
  }

  const payload = {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    image: user.image,
    role: user.role
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })
  res.status(200).json({ message: 'Login successful', token })
}

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password } = req.body
    let user = await User.findOne({ $or: [{ email }, { phone: phoneNumber }] })
    if (user) {
      return res
        .status(400)
        .json({
          message:
            'User already exists. Please log in or use a different email.'
        })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber
    })

    const token = await VerifyToken.create({
      userId: user._id,
      token: crypto.randomBytes(32).toString('hex')
    })

    const url = `${process.env.FRONTEND_URL}/verify-email/${user._id}/${token.token}`

    //   Send OTP via email
    const subject = 'Verify Your Email'
    let htmlContent = `
      <h1>Welcome to MADNESS!</h1>
      <p>Thank you for signing up with MADNESS!</p>
      <p>Please click the link below to verify your email:</p>
      <a href="${url}">Verify Email</a>
      <p>This OTP will expire in 1 hour.</p>
    `
    await sendEmail(email, subject, htmlContent)
    res
      .status(200)
      .json({
        message:
          'An email has been sent to your email address. Please verify to complete registration.'
      })
  } catch (error) {
    res.status(500).json({ message: 'Error registering user' })
  }
}

exports.verifyEmail = async (req, res) => {
  try {
    const { id, token } = req.params
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    const verifyToken = await VerifyToken.findOne({ userId: id, token })
    if (!verifyToken) {
      return res.status(401).json({ message: 'Invalid link' })
    }
    user.verified = true
    await user.save()
    res.status(200).json({ message: 'Email verified successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error verifying email' })
  }
}
