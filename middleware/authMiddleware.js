const jwt = require('jsonwebtoken');

// Auth Middleware: Requires a valid token
const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // Attach user information to the request object
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }
};

// Auth Optional Middleware: Allows access with or without a token
const authOptional = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Attach user information if token is valid
    }

    next(); // Proceed regardless of token presence or validity
  } catch (error) {
    // Proceed without attaching user information
    next();
  }
};

module.exports = { auth, authOptional };