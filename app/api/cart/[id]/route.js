import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { authenticateToken } from '@/lib/authHelper';

export async function DELETE(req, { params }) {
  try {
    const decodedUser = await authenticateToken(req);
    const { id } = await params;
    const cartItemId = parseInt(id);

    const cart = await get('SELECT id FROM carts WHERE user_id = ?', [decodedUser.id]);
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    const item = await get('SELECT id FROM cart_items WHERE id = ? AND cart_id = ?', [cartItemId, cart.id]);
    if (!item) {
      return NextResponse.json({ error: 'Item not found in your cart' }, { status: 404 });
    }

    await run('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Delete cart item API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: err.message?.includes('token') ? 401 : 500 });
  }
}
