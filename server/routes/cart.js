const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db');
const { authenticateToken } = require('./auth');

// Get cart items for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Find or create user cart
    let cart = await get('SELECT id FROM carts WHERE user_id = ?', [req.user.id]);
    if (!cart) {
      const result = await run('INSERT INTO carts (user_id) VALUES (?)', [req.user.id]);
      cart = { id: result.id };
    }

    const items = await query(
      `SELECT ci.id, ci.product_id, ci.variant_id, ci.quantity, 
              p.name, p.category, p.base_price, p.discount_price, p.image_urls,
              pv.size, pv.price_modifier
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       JOIN product_variants pv ON ci.variant_id = pv.id
       WHERE ci.cart_id = ?`,
      [cart.id]
    );

    // Format images
    const formattedItems = items.map(item => ({
      ...item,
      image_urls: JSON.parse(item.image_urls)
    }));

    res.json(formattedItems);
  } catch (err) {
    console.error('Fetch cart error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add or update cart item
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, variant_id, quantity } = req.body;

    if (!product_id || !variant_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid product, variant, or quantity.' });
    }

    // Get cart
    let cart = await get('SELECT id FROM carts WHERE user_id = ?', [req.user.id]);
    if (!cart) {
      const result = await run('INSERT INTO carts (user_id) VALUES (?)', [req.user.id]);
      cart = { id: result.id };
    }

    // Check if item already exists
    const existing = await get(
      'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id = ?',
      [cart.id, product_id, variant_id]
    );

    if (existing) {
      // Update quantity (upsert / reset or add, let's treat it as setting the absolute quantity or incrementing. Usually adding from product details increments, whereas updating on cart page sets absolute. Let's make an endpoint that sets absolute if we specify override, otherwise increments.)
      const newQty = req.body.override ? quantity : existing.quantity + quantity;
      await run('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
    } else {
      // Insert
      await run(
        'INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)',
        [cart.id, product_id, variant_id, quantity]
      );
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Sync local guest cart items to user database cart (merge)
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body; // Array of { product_id, variant_id, quantity }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array required' });
    }

    // Get cart
    let cart = await get('SELECT id FROM carts WHERE user_id = ?', [req.user.id]);
    if (!cart) {
      const result = await run('INSERT INTO carts (user_id) VALUES (?)', [req.user.id]);
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

    res.json({ success: true });
  } catch (err) {
    console.error('Cart sync error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove item from cart
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const cartItemId = parseInt(req.params.id);

    // Verify ownership
    const cart = await get('SELECT id FROM carts WHERE user_id = ?', [req.user.id]);
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const item = await get('SELECT id FROM cart_items WHERE id = ? AND cart_id = ?', [cartItemId, cart.id]);
    if (!item) return res.status(404).json({ error: 'Item not found in your cart' });

    await run('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete cart item error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Clear cart
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const cart = await get('SELECT id FROM carts WHERE user_id = ?', [req.user.id]);
    if (cart) {
      await run('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
