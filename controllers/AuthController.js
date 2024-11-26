const axios = require('axios')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
// const { parsePhoneNumberFromString } = require('libphonenumber-js')
// const { generateRandomPassword, sendSms } = require('../services/checkoutService')
const { parseIdentifier } = require('../utils/identifierHelper')

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
    return res.status(401).json({ message: 'Invalid email or password' })
  }
  
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    return res.status(401).json({ message: 'Wrong password' })
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
  const { email, password, firstName, lastName, phoneNumber } = req.body
  const user = await User.findOne({ $or: [{ email }, { phone: phoneNumber }] })
  if (user) {
    console.log(user);
    return res.status(401).json({ message: 'User already exists' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const newUser = await User.create({ email, password: hashedPassword, firstName, lastName, phoneNumber })

  res.status(200).json({ message: 'Register successful, please login', user: newUser })
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

