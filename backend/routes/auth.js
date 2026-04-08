import express from 'express';
import { supabaseAdmin, supabasePublic } from '../config/supabase.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';
import { validateSignup, validateLogin, validateOTP, checkValidationResult } from '../middleware/validator.js';
import { generateOTP, verifyOTP } from '../utils/otp.js';
import { sendOTPEmail } from '../utils/email.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/signup
 * Complete secure signup: Validates -> Checks limits -> Creates user in Supabase -> Sends OTP
 */
router.post('/signup', authLimiter, validateSignup, checkValidationResult, async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    // 1. Create unverified user in Supabase Auth
    // Note: ensure 'Confirm email' is turned on in Supabase Auth settings
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    // 2. Generate our secure custom OTP
    const otpCode = generateOTP(email);
    
    // 3. Send securely via Email (SMTP)
    const emailSent = await sendOTPEmail(email, otpCode, username);
    if (!emailSent) {
      // In a real scenario, you might want to delete the unverified auth user here to allow them to retry cleanly
      return res.status(500).json({ status: 'error', message: 'Failed to send verification email.' });
    }

    res.status(200).json({ 
      status: 'success', 
      message: 'Signup successful! Please check your email for the verification code.' 
    });

  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/verify-otp
 * Verifies email ownership via custom OTP, then confirms the user via Supabase Admin
 */
router.post('/verify-otp', otpLimiter, validateOTP, checkValidationResult, async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // 1. Verify our secure custom OTP
    const verification = verifyOTP(email, otp);
    if (!verification.valid) {
      return res.status(400).json({ status: 'error', message: verification.message });
    }

    // 2. Automatically confirm the user in Supabase (bypassing normal Supabase email link)
    const { data: users, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();
    if (fetchError) throw fetchError;
    
    const userToConfirm = users.users.find(u => u.email === email);
    if (!userToConfirm) {
      return res.status(404).json({ status: 'error', message: 'User not found in auth system' });
    }

    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
      userToConfirm.id,
      { email_confirm: true }
    );

    if (confirmError) throw confirmError;

    res.status(200).json({ 
      status: 'success', 
      message: 'Email verified successfully! You can now log in.' 
    });
    
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Validates -> Checks limits -> Logs in user -> Sets secure cookie HTTPOnly
 */
router.post('/login', authLimiter, validateLogin, checkValidationResult, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Authenticate with public client
    const { data, error } = await supabasePublic.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ status: 'error', message: error.message });
    }

    // Set secure HTTP-only cookie to prevent XSS attacks grabbing the token
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };

    res.cookie('sb_access_token', data.session.access_token, cookieOptions);

    res.status(200).json({ 
      status: 'success', 
      message: 'Logged in successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata.username
      }
    });

  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Protected route to get current session identity
 */
router.get('/me', requireAuth, (req, res) => {
  res.status(200).json({
    status: 'success',
    user: {
      id: req.user.id,
      email: req.user.email,
      username: req.user.user_metadata?.username
    }
  });
});

/**
 * POST /api/auth/logout
 * Security best practice: destroy HTTP-only cookie
 */
router.post('/logout', (req, res) => {
  res.cookie('sb_access_token', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  // Clear from frontend client as well implicitly
  res.status(200).json({ status: 'success', message: 'Logged out successfully' });
});

export default router;
