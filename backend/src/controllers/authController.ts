import { Request, Response } from 'express';

export async function login(req: Request, res: Response) {
  try {
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

    // DEV-ONLY: Mock authentication — replace with real JWT/OAuth in production
    res.json({
      ok: true,
      accessToken: 'dev-mock-jwt-token',
      refreshToken: 'dev-mock-refresh-token',
      expiresIn: 3600,
      redirectTo: '/dashboard',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Internal server error during login' });
  }
}
