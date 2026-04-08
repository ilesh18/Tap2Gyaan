import { supabaseAdmin } from '../config/supabase.js';

/**
 * Middleware to protect routes that require a valid signed-in user
 */
export const requireAuth = async (req, res, next) => {
  try {
    // 1. Get token from cookies or Authorization header
    let token;
    if (req.cookies && req.cookies.sb_access_token) {
      token = req.cookies.sb_access_token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ status: 'error', message: 'You are not logged in! Please log in to get access.' });
    }
    
    // 2. Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ status: 'error', message: 'The user belonging to this token does no longer exist.' });
    }
    
    // 3. Grant access to protected route
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
