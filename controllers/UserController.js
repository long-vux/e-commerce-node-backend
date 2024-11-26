exports.recoverPassword = async (req, res) => {
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
