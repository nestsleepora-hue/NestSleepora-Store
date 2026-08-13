import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { authenticateToken } from '@/lib/authHelper';

export async function GET(req) {
  try {
    const decodedUser = await authenticateToken(req);
    
    const user = await get(
      'SELECT id, email, name, role, must_change_password, created_at FROM users WHERE id = ?',
      [decodedUser.id]
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });

  } catch (err) {
    console.error('Get profile API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: err.message?.includes('token') || err.message?.includes('required') ? 401 : 500 });
  }
}
