import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { run, get } from '@/lib/db';
import { authenticateAdmin } from '@/lib/authHelper';

export async function POST(req) {
  try {
    const decodedAdmin = await authenticateAdmin(req);
    const callerEmail = decodedAdmin.email;

    if (callerEmail !== 'mateen@itdepartment.com') {
      return NextResponse.json({ error: 'Access denied: Only the Super-Admin can manage other administrators.' }, { status: 403 });
    }

    const { email, password, name } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const existingUser = await get('SELECT id, role FROM users WHERE email = ?', [email]);
    if (existingUser) {
      await run('UPDATE users SET role = ? WHERE email = ?', ['admin', email]);
      return NextResponse.json({ success: true, message: 'User role updated to administrator.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await run(
      'INSERT INTO users (email, password_hash, name, role, must_change_password) VALUES (?, ?, ?, ?, ?)',
      [email, hash, name, 'admin', 1]
    );
    await run('INSERT OR IGNORE INTO carts (user_id) VALUES (?)', [result.id]);

    return NextResponse.json({ success: true, message: 'Administrator created successfully.' });

  } catch (err) {
    console.error('Create admin API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: err.message?.includes('denied') ? 403 : 500 });
  }
}
