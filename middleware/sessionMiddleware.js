const generateSessionId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const sessionMiddleware = (req, res, next) => {
  let sessionId = req.cookies.sessionId;

  if (!sessionId) {
    sessionId = generateSessionId();
    res.cookie('sessionId', sessionId, { maxAge: 1000 * 60 * 60 * 24 * 7 }); // 7 days
  }

  req.sessionId = sessionId;
  next();
};

module.exports = sessionMiddleware;
