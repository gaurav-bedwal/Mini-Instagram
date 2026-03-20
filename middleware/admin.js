const jwt = require('jsonwebtoken');
const User = require('../models/User');


const adminAuth = async (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.redirect('/login');
        }

        if (user.role !== 'admin' && user.role !== 'moderator') {
            return res.status(403).render('404', { 
                user: user,
                message: 'Access Denied. Admin privileges required.'
            });
        }

        req.user = user;
        res.locals.user = user;
        next();
    } catch (err) {
        return res.redirect('/login');
    }
};

const isAdmin = async (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'moderator')) {
        return res.status(403).json({ error: 'Access denied' });
    }
    next();
};

module.exports = { adminAuth, isAdmin };
