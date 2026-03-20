const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.redirect('/login');

    req.user = user; 
    res.locals.user = user; 
    next();
  } catch (err) {
    return res.redirect('/login');
  }
};

module.exports = auth;