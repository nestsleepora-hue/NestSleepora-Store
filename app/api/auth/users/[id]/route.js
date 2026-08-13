import { NextResponse } from 'next/server';
import { run, get } from '@/lib/db';
import { authenticateAdmin } from '@/lib/authHelper';

export async function DELETE(req, { params }) {
  try {
    const decodedAdmin = await authenticateAdmin(req);
    const callerEmail = decodedAdmin.email;
    const { id } = await params;
    const userId = parseInt(id);

    const user = await get('SELECT email, role FROM users WHERE id = ?', [userId]);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.email === 'mateen@itdepartment.com') {
      return NextResponse.json({ error: 'Access denied: System administrators cannot be deleted.' }, { status: 403 });
    }

    if (callerEmail !== 'mateen@itdepartment.com') {
      if (user.role === 'admin') {
        return NextResponse.json({ error: 'Access denied: Only the Super-Admin can manage other administrators.' }, { status: 403 });
      }
    }

    // Cascade delete user-related database records (carts, cart_items, wishlists)
    await run('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ?)', [userId]);
    await run('DELETE FROM carts WHERE user_id = ?', [userId]);
    await run('DELETE FROM wishlists WHERE user_id = ?', [userId]);
    await run('DELETE FROM users WHERE id = ?', [userId]);

    return NextResponse.json({ success: true, message: 'User deleted successfully' });

  } catch (err) {
    console.error('Delete user API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: err.message?.includes('denied') ? 403 : 500 });
  }
}
