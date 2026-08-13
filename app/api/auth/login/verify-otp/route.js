import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { run } from '@/lib/db';
import { activeOtps } from '@/lib/activeOtps';

const JWT_SECRET = process.env.JWT_SECRET || 'dreamnest_secret_key_123';

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and verification code are required' }, { status: 400 });
    }

    const record = activeOtps.get(email.toLowerCase());
    if (!record) {
      return NextResponse.json({ error: 'Session expired or invalid security sequence' }, { status: 400 });
    }

    if (Date.now() > record.expiry) {
      activeOtps.delete(email.toLowerCase());
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    if (record.code !== otp.trim()) {
      return NextResponse.json({ error: 'Invalid security verification code' }, { status: 400 });
    }

    // Success -> delete OTP record and sign token
    activeOtps.delete(email.toLowerCase());
    const activeUser = record.user;
    
    // Ensure cart exists
    await run('INSERT OR IGNORE INTO carts (user_id) VALUES (?)', [activeUser.id]);

    const token = jwt.sign(
      { id: activeUser.id, email: activeUser.email, name: activeUser.name, role: activeUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({ token, user: activeUser });

  } catch (err) {
    console.error('Verify admin OTP API error:', err);
    return NextResponse.json({ error: 'Server verification error' }, { status: 500 });
  }
}
