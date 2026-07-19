import express from 'express';
import { verifyGoogleIdToken } from '../services/google.js';

const router = express.Router();

// Cookie-based session.
// Frontend sends: { idToken }
// Backend verifies and sets: bh_session cookie.
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

    const googleUser = await verifyGoogleIdToken(idToken);

    // Minimal user object stored in session cookie.
    // For real apps, store sessions in DB; for now cookie is fine.
    const session = {
      provider: 'google',
      sub: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    };

    res.cookie('bh_session', JSON.stringify(session), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    res.json({ ok: true, user: { id: session.sub, name: session.name, email: session.email, picture: session.picture } });
  } catch (err) {
    console.error('google login error:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('bh_session');
  res.json({ ok: true });
});

export default router;

