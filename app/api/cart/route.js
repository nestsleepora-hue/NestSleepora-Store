import { NextResponse } from 'next/server';
import { query, get, run } from '@/lib/db';
import { authenticateToken } from '@/lib/authHelper';

// GET: Retrieve user cart items
export async function GET(req) {
  try {
    const decodedUser = await authenticateToken(req);
    
    let cart = await get('SELECT id FROM carts WHERE user_id = ?', [decodedUser.id]);
    if (!cart) {
      const result = await run('INSERT INTO carts (user_id) VALUES (?)', [decodedUser.id]);
      cart = { id: result.id };
    }

    const items = await query(
      `SELECT ci.id, ci.product_id, ci.variant_id, ci.quantity, 
              p.name, p.category, p.base_price, p.discount_price, p.image_urls,
              COALESCE(pv.size, CAST(ci.variant_id AS VARCHAR)) as size,
              COALESCE(pv.price_modifier, 0.0) as price_modifier
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN product_variants pv ON CAST(ci.variant_id AS VARCHAR) = CAST(pv.id AS VARCHAR) OR CAST(ci.variant_id AS VARCHAR) = pv.size
       WHERE ci.cart_id = ?`,
      [cart.id]
    );

    const formattedItems = items.map(item => ({
      ...item,
      image_urls: JSON.parse(item.image_urls)
    }));

    return NextResponse.json(formattedItems);

  } catch (err) {
    console.error('Fetch cart API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: err.message?.includes('token') ? 401 : 500 });
  }
}

// POST: Add or update cart item
export async function POST(req) {
  try {
    const decodedUser = await authenticateToken(req);
    const { product_id, variant_id, quantity, override } = await req.json();

    if (!product_id || !variant_id || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid product, variant, or quantity.' }, { status: 400 });
    }

    let cart = await get('SELECT id FROM carts WHERE user_id = ?', [decodedUser.id]);
    if (!cart) {
      const result = await run('INSERT INTO carts (user_id) VALUES (?)', [decodedUser.id]);
      cart = { id: result.id };
    }

    const existing = await get(
      'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id = ?',
      [cart.id, product_id, variant_id]
    );

    if (existing) {
      const newQty = override ? quantity : existing.quantity + quantity;
      await run('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
    } else {
      await run(
        'INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)',
        [cart.id, product_id, variant_id, quantity]
      );
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Update cart API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: err.message?.includes('token') ? 401 : 500 });
  }
}

// DELETE: Clear entire cart
export async function DELETE(req) {
  try {
    const decodedUser = await authenticateToken(req);
    const cart = await get('SELECT id FROM carts WHERE user_id = ?', [decodedUser.id]);
    if (cart) {
      await run('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
    }
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Clear cart API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: err.message?.includes('token') ? 401 : 500 });
  }
}
