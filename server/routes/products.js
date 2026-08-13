const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query, get, run } = require('../db');
const { authenticateAdmin } = require('./auth');

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '../public/uploads');
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `sleepora-${uniqueSuffix}${ext}`);
  }
});

// Strictly allow only safe media extensions
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.mov', '.webm'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Security Check: Only images and videos are permitted.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size limit
});

// Secure API endpoint to upload multiple product files
router.post('/upload', authenticateAdmin, upload.array('files', 15), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const urls = req.files.map(file => {
      const port = process.env.PORT || 5000;
      return `http://localhost:${port}/uploads/${file.filename}`;
    });

    res.json({ urls });
  } catch (err) {
    console.error('Upload handler error:', err);
    res.status(500).json({ error: err.message || 'File upload failed' });
  }
}, (err, req, res, next) => {
  res.status(400).json({ error: err.message });
});

// List products with dynamic search, filter, and sort
router.get('/', async (req, res) => {
  try {
    const { category, search, size, min_price, max_price, rating, sort } = req.query;

    let sql = `
      SELECT p.*, 
        COALESCE(avg_tbl.avg_rating, 0) as avg_rating,
        COALESCE(avg_tbl.review_count, 0) as review_count,
        (SELECT MIN(base_price + price_modifier) FROM product_variants WHERE product_id = p.id) as min_price,
        (SELECT MAX(base_price + price_modifier) FROM product_variants WHERE product_id = p.id) as max_price
      FROM products p
      LEFT JOIN (
        SELECT product_id, AVG(rating) as avg_rating, COUNT(id) as review_count 
        FROM reviews 
        GROUP BY product_id
      ) avg_tbl ON p.id = avg_tbl.product_id
    `;

    const whereClauses = [];
    const params = [];

    // Filter by Category
    if (category) {
      whereClauses.push('p.category = ?');
      params.push(category.toLowerCase());
    }

    // Filter by Search Text
    if (search) {
      whereClauses.push('(p.name LIKE ? OR p.description LIKE ?)');
      const searchWild = `%${search}%`;
      params.push(searchWild, searchWild);
    }

    // Filter by Size (must match at least one variant size)
    if (size) {
      whereClauses.push('p.id IN (SELECT DISTINCT product_id FROM product_variants WHERE size = ?)');
      params.push(size);
    }

    // Filter by Min/Max Price (uses base_price or discount_price + variant modifiers)
    // To keep it simple, we compare using the base/discount price of the product
    if (min_price) {
      whereClauses.push('COALESCE(p.discount_price, p.base_price) >= ?');
      params.push(parseFloat(min_price));
    }
    if (max_price) {
      whereClauses.push('COALESCE(p.discount_price, p.base_price) <= ?');
      params.push(parseFloat(max_price));
    }

    // Filter by Rating
    if (rating) {
      whereClauses.push('COALESCE(avg_tbl.avg_rating, 0) >= ?');
      params.push(parseFloat(rating));
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Sorting
    if (sort === 'price_asc') {
      sql += ' ORDER BY COALESCE(p.discount_price, p.base_price) ASC';
    } else if (sort === 'price_desc') {
      sql += ' ORDER BY COALESCE(p.discount_price, p.base_price) DESC';
    } else if (sort === 'newest') {
      sql += ' ORDER BY p.created_at DESC';
    } else if (sort === 'rating_desc') {
      sql += ' ORDER BY avg_rating DESC, review_count DESC';
    } else {
      sql += ' ORDER BY p.id ASC';
    }

    const productsList = await query(sql, params);
    
    // Parse image_urls back into JS Array
    const formattedProducts = productsList.map(p => ({
      ...p,
      image_urls: JSON.parse(p.image_urls),
      avg_rating: Math.round(p.avg_rating * 10) / 10
    }));

    res.json(formattedProducts);
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Fetch single product details with variants, reviews, and rating statistics
router.get('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    const product = await get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.image_urls = JSON.parse(product.image_urls);

    const variants = await query(
      'SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC',
      [productId]
    );

    const reviews = await query(
      'SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC',
      [productId]
    );

    // Calculate rating statistics
    const ratingCount = reviews.length;
    const ratingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0;

    // Distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
    });

    res.json({
      product,
      variants,
      reviews,
      stats: {
        avg_rating: avgRating,
        review_count: ratingCount,
        distribution
      }
    });
  } catch (err) {
    console.error('Fetch product details error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create product (Admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, description, category, base_price, discount_price, image_urls, variants } = req.body;

    if (!name || !description || !category || base_price === undefined || !image_urls) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const cleanName = name.trim();
    const cleanDesc = description.trim();
    const cleanCat = category.trim().toLowerCase();
    const parsedBase = parseFloat(base_price);
    const parsedDiscount = discount_price ? parseFloat(discount_price) : null;
    const imagesJson = Array.isArray(image_urls) ? JSON.stringify(image_urls) : JSON.stringify([image_urls]);

    const result = await run(
      'INSERT INTO products (name, description, category, base_price, discount_price, image_urls) VALUES (?, ?, ?, ?, ?, ?)',
      [cleanName, cleanDesc, cleanCat, parsedBase, parsedDiscount, imagesJson]
    );

    const productId = result.id;

    // Add variants if supplied
    if (variants && Array.isArray(variants)) {
      for (const v of variants) {
        await run(
          'INSERT INTO product_variants (product_id, size, price_modifier, stock_qty) VALUES (?, ?, ?, ?)',
          [productId, v.size.trim(), parseFloat(v.price_modifier || 0), parseInt(v.stock_qty || 0)]
        );
      }
    } else {
      // Create default size if none specified
      await run(
        'INSERT INTO product_variants (product_id, size, price_modifier, stock_qty) VALUES (?, ?, ?, ?)',
        [productId, 'Queen', 0, 10]
      );
    }

    res.status(201).json({ success: true, productId });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product (Admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, description, category, base_price, discount_price, image_urls, variants } = req.body;

    if (!name || !description || !category || base_price === undefined || !image_urls) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const cleanName = name.trim();
    const cleanDesc = description.trim();
    const cleanCat = category.trim().toLowerCase();
    const parsedBase = parseFloat(base_price);
    const parsedDiscount = discount_price ? parseFloat(discount_price) : null;
    const imagesJson = Array.isArray(image_urls) ? JSON.stringify(image_urls) : JSON.stringify([image_urls]);

    // Check product exists
    const existing = await get('SELECT id FROM products WHERE id = ?', [productId]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await run(
      'UPDATE products SET name = ?, description = ?, category = ?, base_price = ?, discount_price = ?, image_urls = ? WHERE id = ?',
      [cleanName, cleanDesc, cleanCat, parsedBase, parsedDiscount, imagesJson, productId]
    );

    // Replace variants
    await run('DELETE FROM product_variants WHERE product_id = ?', [productId]);
    if (variants && Array.isArray(variants)) {
      for (const v of variants) {
        await run(
          'INSERT INTO product_variants (product_id, size, price_modifier, stock_qty) VALUES (?, ?, ?, ?)',
          [productId, v.size.trim(), parseFloat(v.price_modifier || 0), parseInt(v.stock_qty || 0)]
        );
      }
    } else {
      await run(
        'INSERT INTO product_variants (product_id, size, price_modifier, stock_qty) VALUES (?, ?, ?, ?)',
        [productId, 'Queen', 0, 10]
      );
    }

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete product (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    // Check product exists
    const existing = await get('SELECT id FROM products WHERE id = ?', [productId]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete product (Cascades automatically deletes variants, reviews, cart_items)
    await run('DELETE FROM products WHERE id = ?', [productId]);

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
