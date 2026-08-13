import jwt from 'jsonwebtoken';
import { get } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'dreamnest_secret_key_123';

/**
 * Extracts and verifies standard Authorization JWT token from Request headers.
 */
export async function authenticateToken(req) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new Error('Access token required');
    }

    return new Promise((resolve, reject) => {
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) reject(new Error('Invalid or expired token'));
        else resolve(decoded);
      });
    });
  } catch (err) {
    throw new Error(err.message || 'Authentication check failed');
  }
}

/**
 * Verifies if user authenticated via token is an administrator in the database.
 */
export async function authenticateAdmin(req) {
  try {
    const decodedUser = await authenticateToken(req);
    const email = decodedUser.email;

    // Direct check for Super-Admin override or database queries
    if (email === 'mateen@itdepartment.com' || email === 'admin@nestsleepora.com') {
      return decodedUser;
    }

    const user = await get('SELECT role FROM users WHERE email = ?', [email]);
    if (user && user.role === 'admin') {
      return decodedUser;
    }

    throw new Error('Access denied: Administrator privileges required');
  } catch (err) {
    throw new Error(err.message || 'Authorization check failed');
  }
}
