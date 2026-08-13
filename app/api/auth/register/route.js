import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { run, get } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'dreamnest_secret_key_123';

export async function POST(req) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await run(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [email, hash, name, 'user']
    );

    // Create cart
    await run('INSERT OR IGNORE INTO carts (user_id) VALUES (?)', [result.id]);

    const token = jwt.sign(
      { id: result.id, email, name, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Returns status 210 matching express registration configuration
    return NextResponse.json({
      token,
      user: { id: result.id, email, name, role: 'user' }
    }, { status: 210 });

  } catch (err) {
    console.error('Registration API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
