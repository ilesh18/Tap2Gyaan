import { body, validationResult } from 'express-validator';
import xss from 'xss-filters';

export const validateSignup = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain a number')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain a special character'),
    
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .escape() // Sanitizes HTML characters
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

export const validateOTP = [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Invalid OTP format')
];

// Middleware to check validation results and XSS sanitization
export const checkValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  
  // Deep filter req.body to prevent XSS payloads in valid fields
  for (let key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = xss.inHTMLData(req.body[key]);
    }
  }
  
  next();
};
