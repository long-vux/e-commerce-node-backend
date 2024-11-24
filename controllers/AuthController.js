const axios = require('axios')
const User = require('../models/User')
const jwt = require('jsonwebtoken')

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