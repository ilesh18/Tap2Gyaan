import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// Require valid auth token for ALL class routes
router.use(requireAuth);

/**
 * GET - Protected route placeholder for classes endpoint
 */
router.get('/', async (req, res, next) => {
  try {
    // Example: fetch classes securely using admin bypass, but filtering strictly by RLS principles
    const { data, error } = await supabaseAdmin
      .from('classes')
      .select('*')
      .eq('isPublic', true);

    if (error) throw error;

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (err) {
    next(err);
  }
});

export default router;
