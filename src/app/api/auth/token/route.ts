import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Return a compact JWT string that can be used as Bearer token
    // Re-sign a short-lived token with sub claim for server APIs.
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Server auth misconfigured' }, { status: 500 });
    }
    
    const bearer = jwt.sign({ sub: session.user.id }, secret, { expiresIn: '30m' });
    return NextResponse.json({ token: bearer });
  } catch (error) {
    console.error('Error in token endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}