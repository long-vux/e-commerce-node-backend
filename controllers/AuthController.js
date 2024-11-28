const axios = require('axios')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const VerifyToken = require('../models/VerifyToken')
const sendEmail = require('../utils/sendEmail')

exports.googleLogin = async (req, res) => {
  const token = req.body.token
  let payload = {}

  // Verify the token with Google
  try {
    const googleResponse = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    );
    const userObject = googleResponse.data
    if (!userObject) {
      return res.status(401).json({ message: 'Invalid token' })
    }
    const user = await User.findOne({ email: userObject.email })
    if (!user) {
      const newUser = new User({
        email: userObject.email,
        password: userObject.sub,
        firstName: userObject.given_name,
        lastName: userObject.family_name,
        role: 'user',
        image: userObject.picture,
      })
      await newUser.save()
    } else {
      payload.role = user.role
    }

    payload = {
      email: userObject.email,
      firstName: userObject.given_name,
      lastName: userObject.family_name,
      role: payload.role || 'user',
      image: userObject.picture,
    }
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  const newToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' })

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

  if(!user.verified) {
    let token = await VerifyToken.findOne({ userId: user._id })
    if(!token) {
      token = await VerifyToken.create({ userId: user._id, token: crypto.randomBytes(32).toString('hex') })
    }

    const url = `${process.env.FRONTEND_URL}/verify-email/${user._id}/${token.token}`

    //   Send OTP via email
    const subject = 'Verify Your Email'
    const text = `Welcome to MADNESS! Please click <a href="${url}">here</a> to verify your email. This OTP will expire in 1 hour.`
    await sendEmail(email, subject, text)
    return res.status(403).json({ message: 'Email not verified. A verification email has been sent.' })
  }
  
  const payload = {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    image: user.image,
    role: user.role,
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' })
  res.status(200).json({ message: 'Login successful', token })
}

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password, confirmPassword } = req.body
    let user = await User.findOne({ $or: [{ email }, { phone: phoneNumber }] })
    if (user) {
      return res.status(400).json({ message: 'User already exists. Please log in or use a different email.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create new user
    user = await User.create({ email, password: hashedPassword, firstName, lastName, phoneNumber })

    const token = await VerifyToken.create({ 
      userId: user._id, 
      token: crypto.randomBytes(32).toString('hex') 
    })

    const url = `${process.env.FRONTEND_URL}/verify-email/${user._id}/${token.token}`

    //   Send OTP via email
    const subject = 'Verify Your Email'
    const text = `Welcome to MADNESS! Please click <a href="${url}">here</a> to verify your email. This OTP will expire in 1 hour.`
    await sendEmail(email, subject, text)
    res.status(200).json({ message: 'An email has been sent to your email address. Please verify to complete registration.' })
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


// Create a new user when checkout but not login
// exports.createUser = async (req, res) => {
//   const { lastName, firstName, phoneNumber, address } = req.body
//   const user = await User.findOne({ phone: phoneNumber })
//   if (user) {
//     return res.status(401).json({ message: 'User already created, please login to see more from your cart' })
//   }
  
//   const parsedPhoneNumber = parsePhoneNumberFromString(phoneNumber, 'VN')
//   if(!parsedPhoneNumber || !parsedPhoneNumber.isValid()) {
//     return res.status(401).json({ message: 'Invalid phone number' })
//   }
//   const formattedPhoneNumber = parsedPhoneNumber.number // E.164 format
//   const password = generateRandomPassword()
//   try {
//     await sendSms(formattedPhoneNumber, `Welcome! Your account has been created. Your password is: ${password}. Please don't share it with anyone.`)
//     console.log('password', password);
//   } catch (error) {
//     return res.status(500).json({ error: error.message })
//   }

//   try {
//     const hashedPassword = await bcrypt.hash(password, 10)
//     const newUser = await User.create({ lastName, firstName, phoneNumber, address, password: hashedPassword })
//     return res.status(200).json({ message: 'User created successfully', user: newUser })
//   } catch (error) {
//     return res.status(500).json({ message: 'Error creating user' })
//   }
// }

