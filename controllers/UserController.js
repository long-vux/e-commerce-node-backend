const bcrypt = require('bcrypt')
const User = require('../models/User')
const VerifyToken = require('../models/VerifyToken')
const sendEmail = require('../utils/sendEmail')
const crypto = require('crypto')

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.changePassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Wrong old password' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await user.updateOne({ password: hashedPassword })

    return res.status(200).json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Server error' })
  }
}

exports.recoverPassword = async (req, res) => {
  const { email } = req.body

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const token = await VerifyToken.create({
      userId: user._id,
      token: crypto.randomBytes(32).toString('hex')
    })

    const url = `${process.env.FRONTEND_URL}/reset-password/${user._id}/${token.token}`
    const subject = 'Reset Your Password'
    const htmlContent = `
      <h1>Hi ${user.firstName}!</h1>
      <p>Please click the link below to reset your password:</p>
      <a href="${url}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>Best regards,<br/>MADNESS Team</p>
    `
    await sendEmail(email, subject, htmlContent)

    return res.status(200).json({ message: 'Password recovery email sent' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Server error' })
  }
}

exports.resetPassword = async (req, res) => {
  const { userId, token } = req.params
  const { newPassword } = req.body

  try {
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    const verifyToken = await VerifyToken.findOne({ userId, token })
    if (!verifyToken) {
      return res.status(401).json({ message: 'Invalid link' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await user.updateOne({ password: hashedPassword })

    return res.status(200).json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Server error' })
  }
}


// ==============================================================================
//                            Addresses
// ==============================================================================

exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    res.status(200).json({ success: true, data: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
} 

// User Action: User adds a new address.
exports.addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const address = req.body;
    const user = await User.findById(userId);
    console.log('address', user.addresses);
    user.addresses.push(address);
    await user.save();

    res.status(200).json({ success: true, data: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// User Action: User updates an existing address.
exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const updateData = req.body;
    const user = await User.findById(userId);
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    address.set(updateData);
    await user.save();

    res.status(200).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// User Action: User deletes an existing address.
exports.deleteAddress = async (req, res) => { 
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    const user = await User.findById(userId);
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    user.addresses.pull(addressId);
    await user.save();

    res.status(200).json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}