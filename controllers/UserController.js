const bcrypt = require('bcrypt')
const { parseIdentifier } = require('../utils/identifierHelper')
const User = require('../models/User')

exports.changePassword = async (req, res) => {
  const { identifier, oldPassword, newPassword } = req.body

  // Determine if the identifier is an email or phone number
  const { query, error } = parseIdentifier(identifier)
  if (error) {
    return res.status(error.status).json({ message: error.message })
  }

  try {
    const user = await User.findOne(query)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Wrong password' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await user.updateOne({ password: hashedPassword })

    return res.status(200).json({ message: 'Password reset successful' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Server error' })
  }
}

exports.addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const address = req.body;

    const user = await User.findById(userId);
    user.addresses.push(address);
    await user.save();

    res.status(200).json({ success: true, data: user.addresses });
  } catch (error) {
      res.status(500).json({ success: false, message: error.message });
  }
}

exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const { updatedAddress } = req.body;

    const user = await User.findById(userId);
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    address.set(updatedAddress);
    await user.save();

    res.status(200).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.deleteAddress = async (req, res) => { 
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    const user = await User.findById(userId);
    user.addresses.id(addressId).remove();
    await user.save();

    res.status(200).json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.updateProfile = async (req, res) => {
  console.log(req.user)
  try {
    const userId = req.user.id;
    const { updatedProfile } = req.body;

    const user = await User.findByIdAndUpdate(userId, updatedProfile, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// exports.resetPassword = async (req, res) => {
  
// }

// exports.updateProfile = async (req, res) => {
  
// }

