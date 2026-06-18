import { Request, Response } from 'express';
import crypto from 'crypto';

function generateToken(secret: string, length = 48): string {
  return crypto
    .createHmac('sha256', secret)
    .update(crypto.randomBytes(length).toString('hex'))
    .digest('hex')
    .slice(0, length);
}

export async function login(req: Request, res: Response) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ ok: false, error: 'JWT_SECRET not configured on server' });
    }

    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password are required' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ ok: false, error: 'Invalid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters' });
    }

    const expiresIn = parseInt(process.env.JWT_EXPIRES_IN ?? '3600', 10);

    res.json({
      ok: true,
      accessToken: generateToken(jwtSecret),
      refreshToken: generateToken(jwtSecret + '-refresh'),
      expiresIn,
      redirectTo: process.env.LOGIN_REDIRECT ?? '/dashboard',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Internal server error during login' });
  }
}
