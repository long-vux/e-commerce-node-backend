const jwt = require('jsonwebtoken');
const User = require('../models/User');

function authOptional(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return next(); // Proceed without attaching user
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;  
    // console.log('req.user', req.user)
  } catch (err) {
    console.log('Token invalid, proceeding without attaching user')
  }
  next();
}

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new Error();
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

module.exports = { auth, authOptional };