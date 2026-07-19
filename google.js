import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';

const GOOGLE_ISSUER = 'https://accounts.google.com';

function getEnv(name, fallback) {
  return process.env[name] || fallback;
}

// Google Identity Tokens are JWTs signed with rotating keys.
// We fetch the JWKS and verify signature + aud/iss.
export async function verifyGoogleIdToken(idToken) {
  const clientId = getEnv('GOOGLE_CLIENT_ID');
  if (!clientId) throw new Error('Missing GOOGLE_CLIENT_ID');

  const decoded = jwt.decode(idToken, { complete: true });
  const kid = decoded?.header?.kid;
  if (!kid) throw new Error('Missing kid');

  const jwksUri = 'https://www.googleapis.com/oauth2/v3/certs';
  const jwksRes = await fetch(jwksUri);
  if (!jwksRes.ok) throw new Error('Failed to fetch JWKS');
  const jwks = await jwksRes.json();

  const key = jwks.keys.find(k => k.kid === kid);
  if (!key) throw new Error('No matching JWKS key');

  const pem = jwkToPem(key);

  const payload = jwt.verify(idToken, pem, {
    audience: clientId,
    issuer: [GOOGLE_ISSUER, 'accounts.google.com'],
  });

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    picture: payload.picture,
  };
}

