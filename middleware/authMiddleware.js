const jwt = require('jsonwebtoken');

function authOptional(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return next(); // Proceed without attaching user
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
  } catch (err) {
    console.log('Token invalid, proceeding without attaching user')
  }
  next();
}

module.exports = authOptional;