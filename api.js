import express from 'express';

const router = express.Router();

function getSession(req) {
  const raw = req.cookies?.bh_session;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

router.get('/me', (req, res) => {
  const session = getSession(req);
  if (!session) return res.json({ loggedIn: false });

  res.json({
    loggedIn: true,
    user: {
      id: session.sub,
      name: session.name,
      email: session.email,
      picture: session.picture,
    },
  });
});

export default router;

