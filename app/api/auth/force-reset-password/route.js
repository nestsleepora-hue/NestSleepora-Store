import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { run } from '@/lib/db';
import { authenticateToken } from '@/lib/authHelper';

export async function POST(req) {
  try {
    const decodedUser = await authenticateToken(req);
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must contain at least 6 characters.' }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await run('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?', [hash, decodedUser.id]);

    return NextResponse.json({ success: true, message: 'Password updated successfully.' });

  } catch (err) {
    console.error('Force password reset API error:', err);
    return NextResponse.json({ error: err.message || 'Server error updating password' }, { status: err.message?.includes('token') ? 401 : 500 });
  }
}
