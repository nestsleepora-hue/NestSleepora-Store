import { NextResponse } from 'next/server';
import { activeOtps } from '@/lib/activeOtps';

export async function POST(req) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and verification code are required' }, { status: 400 });
    }

    const record = activeOtps.get(email.toLowerCase().trim());
    if (!record) {
      return NextResponse.json({ error: 'Session expired or invalid security sequence' }, { status: 400 });
    }

    if (Date.now() > record.expiry) {
      activeOtps.delete(email.toLowerCase().trim());
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    if (record.code !== otp.trim()) {
      return NextResponse.json({ error: 'Invalid security verification code' }, { status: 400 });
    }

    activeOtps.delete(email.toLowerCase().trim());
    return NextResponse.json({ status: 'verified' });

  } catch (err) {
    console.error('Verify OTP API error:', err);
    return NextResponse.json({ error: 'Server verification error' }, { status: 500 });
  }
}
