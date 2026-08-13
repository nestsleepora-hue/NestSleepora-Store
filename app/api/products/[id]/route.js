import { NextResponse } from 'next/server';
import { query, get, run } from '@/lib/db';
import { authenticateAdmin } from '@/lib/authHelper';

// GET: Fetch single product details with variants, reviews, and rating statistics
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    const product = await get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
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

    return NextResponse.json({
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
    console.error('Fetch product details API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT: Update product (Admin only)
export async function PUT(req, { params }) {
  try {
    await authenticateAdmin(req);
    const { id } = await params;
    const productId = parseInt(id);

    const body = await req.json();
    const { 
      name, description, category, base_price, discount_price, image_urls, variants,
      price_usd, price_eur, price_gbp, original_price_usd, original_price_eur, original_price_gbp
    } = body;

    if (!name || !description || !category || base_price === undefined || !image_urls) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
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
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await run(
      `UPDATE products 
       SET name = ?, description = ?, category = ?, base_price = ?, discount_price = ?, image_urls = ?,
           price_usd = ?, price_eur = ?, price_gbp = ?, original_price_usd = ?, original_price_eur = ?, original_price_gbp = ?
       WHERE id = ?`,
      [
        cleanName, cleanDesc, cleanCat, parsedBase, parsedDiscount, imagesJson,
        price_usd ? parseFloat(price_usd) : null,
        price_eur ? parseFloat(price_eur) : null,
        price_gbp ? parseFloat(price_gbp) : null,
        original_price_usd ? parseFloat(original_price_usd) : null,
        original_price_eur ? parseFloat(original_price_eur) : null,
        original_price_gbp ? parseFloat(original_price_gbp) : null,
        productId
      ]
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

    return NextResponse.json({ success: true, message: 'Product updated successfully' });

  } catch (err) {
    console.error('Update product API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: err.message?.includes('denied') ? 403 : 500 });
  }
}

// DELETE: Delete product (Admin only)
export async function DELETE(req, { params }) {
  try {
    await authenticateAdmin(req);
    const { id } = await params;
    const productId = parseInt(id);

    // Check product exists
    const existing = await get('SELECT id FROM products WHERE id = ?', [productId]);
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete product and cascade delete all related tables explicitly (since SQLite/Postgres schemas don't enforce ON DELETE CASCADE)
    await run('DELETE FROM product_variants WHERE product_id = ?', [productId]);
    await run('DELETE FROM reviews WHERE product_id = ?', [productId]);
    await run('DELETE FROM cart_items WHERE product_id = ?', [productId]);
    await run('DELETE FROM wishlists WHERE product_id = ?', [productId]);
    await run('DELETE FROM products WHERE id = ?', [productId]);

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });

  } catch (err) {
    console.error('Delete product API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: err.message?.includes('denied') ? 403 : 500 });
  }
}
