const { body, validationResult } = require('express-validator');


const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
];


const loginValidation = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];


const postValidation = [
    body('caption')
        .optional()
        .isLength({ max: 2200 })
        .withMessage('Caption must be less than 2200 characters'),
    body('title')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Title must be less than 100 characters')
];


const commentValidation = [
    body('comment')
        .trim()
        .notEmpty()
        .withMessage('Comment cannot be empty')
        .isLength({ max: 1000 })
        .withMessage('Comment must be less than 1000 characters')
];


const profileValidation = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('name')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Name must be less than 50 characters'),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage('Bio must be less than 150 characters'),
    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail()
];


const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(400).json({ errors: errors.array() });
        }
       
        req.flash('error', errors.array()[0].msg);
        return res.redirect('back');
    }
    next();
};

module.exports = {
    registerValidation,
    loginValidation,
    postValidation,
    commentValidation,
    profileValidation,
    validate
};
