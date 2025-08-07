import jwt from 'jsonwebtoken';

export interface AuthCheckResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export async function verifyNextAuthBearerToken(authHeader: string | null): Promise<AuthCheckResult> {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Unauthorized' };
    }
    const token = authHeader.slice('Bearer '.length);
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return { success: false, error: 'Server auth misconfigured' };
    const decoded = jwt.verify(token, secret) as { sub?: string };
    if (!decoded?.sub) return { success: false, error: 'Invalid token' };
    return { success: true, userId: decoded.sub };
  } catch {
    return { success: false, error: 'Invalid token' };
  }
}


