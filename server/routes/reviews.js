const express = require('express');
const router = express.Router();
const { run, get } = require('../db');

// Post a review for a product
const { authenticateAdmin } = require('./auth');

router.post('/', async (req, res) => {
  try {
    const { product_id, user_name, rating, title, comment, verified, created_at } = req.body;

    if (!product_id || !user_name || !rating || !title || !comment) {
      return res.status(400).json({ error: 'All review fields are required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    // Verify product exists
    const product = await get('SELECT id FROM products WHERE id = ?', [product_id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Generate initials
    const nameParts = user_name.trim().split(/\s+/);
    let initials = '';
    if (nameParts.length > 0 && nameParts[0]) {
      initials += nameParts[0][0].toUpperCase();
      if (nameParts.length > 1 && nameParts[nameParts.length - 1]) {
        initials += nameParts[nameParts.length - 1][0].toUpperCase();
      }
    } else {
      initials = 'U';
    }

    const isVerified = verified ? 1 : 0;
    const createdAt = created_at || new Date().toISOString();

    const result = await run(
      `INSERT INTO reviews (product_id, user_name, user_initials, rating, title, comment, verified, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [product_id, user_name, initials, rating, title, comment, isVerified, createdAt]
    );

    const newReview = {
      id: result.id,
      product_id,
      user_name,
      user_initials: initials,
      rating,
      title,
      comment,
      verified: isVerified,
      created_at: createdAt
    };

    res.status(201).json(newReview);
  } catch (err) {
    console.error('Submit review error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a review (Admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const { user_name, rating, title, comment, verified, created_at } = req.body;

    if (!user_name || !rating || !title || !comment) {
      return res.status(400).json({ error: 'All review fields are required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    // Generate initials
    const nameParts = user_name.trim().split(/\s+/);
    let initials = '';
    if (nameParts.length > 0 && nameParts[0]) {
      initials += nameParts[0][0].toUpperCase();
      if (nameParts.length > 1 && nameParts[nameParts.length - 1]) {
        initials += nameParts[nameParts.length - 1][0].toUpperCase();
      }
    } else {
      initials = 'U';
    }

    const isVerified = verified ? 1 : 0;
    const createdAt = created_at || new Date().toISOString();

    await run(
      `UPDATE reviews SET user_name = ?, user_initials = ?, rating = ?, title = ?, comment = ?, verified = ?, created_at = ? WHERE id = ?`,
      [user_name, initials, rating, title, comment, isVerified, createdAt, reviewId]
    );

    res.json({ success: true, message: 'Review updated successfully' });
  } catch (err) {
    console.error('Update review error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a review (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    await run('DELETE FROM reviews WHERE id = ?', [reviewId]);
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
