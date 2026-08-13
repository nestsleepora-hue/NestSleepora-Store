import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateAdmin } from '@/lib/authHelper';

export async function GET(req) {
  try {
    const decodedAdmin = await authenticateAdmin(req);
    const callerEmail = decodedAdmin.email;
    let users;

    if (callerEmail === 'mateen@itdepartment.com') {
      users = await query('SELECT id, email, name, role, created_at FROM users WHERE email != ?', ['mateen@itdepartment.com']);
    } else {
      users = await query('SELECT id, email, name, role, created_at FROM users WHERE role = ? AND email != ?', ['user', 'mateen@itdepartment.com']);
    }

    return NextResponse.json(users);

  } catch (err) {
    console.error('List users API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: err.message?.includes('denied') ? 403 : 500 });
  }
}
