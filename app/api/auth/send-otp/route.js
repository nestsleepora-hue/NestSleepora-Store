import { NextResponse } from 'next/server';
import { activeOtps } from '@/lib/activeOtps';
import { sendOtpEmail } from '@/lib/mailHelper';

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    activeOtps.set(email.toLowerCase().trim(), {
      code: otp,
      expiry: Date.now() + 5 * 60 * 1000
    });

    console.log('\n=============================================================');
    console.log(`[SECURITY DISPATCH] Shopper OTP for ${email} is: ${otp}`);
    console.log('=============================================================\n');

    let isSent = false;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      isSent = await sendOtpEmail(email.toLowerCase().trim(), otp);
    }

    const isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    if (isConfigured) {
      return NextResponse.json({ status: 'success', email, code: null });
    } else {
      return NextResponse.json({ status: 'success', email, code: otp });
    }

  } catch (err) {
    console.error('Send OTP API error:', err);
    return NextResponse.json({ error: 'Server error generating code' }, { status: 500 });
  }
}
