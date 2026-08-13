import { NextResponse } from 'next/server';
import { query, run } from '@/lib/db';
import { authenticateAdmin } from '@/lib/authHelper';

// GET: List products with dynamic filtering, search, and sorting parameters
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const size = searchParams.get('size');
    const min_price = searchParams.get('min_price');
    const max_price = searchParams.get('max_price');
    const rating = searchParams.get('rating');
    const sort = searchParams.get('sort');

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

    // Category Filter
    if (category) {
      whereClauses.push('p.category = ?');
      params.push(category.toLowerCase());
    }

    // Search Filter
    if (search) {
      whereClauses.push('(p.name LIKE ? OR p.description LIKE ?)');
      const searchWild = `%${search}%`;
      params.push(searchWild, searchWild);
    }

    // Size Filter
    if (size) {
      whereClauses.push('p.id IN (SELECT DISTINCT product_id FROM product_variants WHERE size = ?)');
      params.push(size);
    }

    // Price Filters
    if (min_price) {
      whereClauses.push('COALESCE(p.discount_price, p.base_price) >= ?');
      params.push(parseFloat(min_price));
    }
    if (max_price) {
      whereClauses.push('COALESCE(p.discount_price, p.base_price) <= ?');
      params.push(parseFloat(max_price));
    }

    // Rating Filter
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
    
    const formattedProducts = [];
    for (const p of productsList) {
      const variants = await query(
        'SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC',
        [p.id]
      );
      const reviews = await query(
        'SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC',
        [p.id]
      );
      formattedProducts.push({
        ...p,
        image_urls: JSON.parse(p.image_urls),
        avg_rating: Math.round(p.avg_rating * 10) / 10,
        variants,
        reviews
      });
    }

    return NextResponse.json(formattedProducts);

  } catch (err) {
    console.error('Fetch products API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: Create product (Admin only)
export async function POST(req) {
  try {
    await authenticateAdmin(req);
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

    const result = await run(
      `INSERT INTO products (
        name, description, category, base_price, discount_price, image_urls, 
        price_usd, price_eur, price_gbp, original_price_usd, original_price_eur, original_price_gbp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cleanName, cleanDesc, cleanCat, parsedBase, parsedDiscount, imagesJson,
        price_usd ? parseFloat(price_usd) : null,
        price_eur ? parseFloat(price_eur) : null,
        price_gbp ? parseFloat(price_gbp) : null,
        original_price_usd ? parseFloat(original_price_usd) : null,
        original_price_eur ? parseFloat(original_price_eur) : null,
        original_price_gbp ? parseFloat(original_price_gbp) : null
      ]
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

    return NextResponse.json({ success: true, productId }, { status: 201 });

  } catch (err) {
    console.error('Create product API error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: err.message?.includes('denied') ? 403 : 500 });
  }
}
