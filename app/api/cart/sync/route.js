import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { authenticateToken } from '@/lib/authHelper';

export async function POST(req) {
  try {
    const decodedUser = await authenticateToken(req);
    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array required' }, { status: 400 });
    }

    let cart = await get('SELECT id FROM carts WHERE user_id = ?', [decodedUser.id]);
    if (!cart) {
      const result = await run('INSERT INTO carts (user_id) VALUES (?)', [decodedUser.id]);
      cart = { id: result.id };
    }

    for (const item of items) {
      const { product_id, variant_id, quantity } = item;
      const existing = await get(
        'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id = ?',
        [cart.id, product_id, variant_id]
      );

      if (existing) {
        await run('UPDATE cart_items SET quantity = ? WHERE id = ?', [existing.quantity + quantity, existing.id]);
      } else {
        await run(
          'INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)',
          [cart.id, product_id, variant_id, quantity]
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Cart sync API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: err.message?.includes('token') ? 401 : 500 });
  }
}
