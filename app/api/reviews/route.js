import { NextResponse } from 'next/server';
import { run, get } from '@/lib/db';

export async function POST(req) {
  try {
    const { product_id, user_name, rating, title, comment, verified } = await req.json();

    if (!product_id || !user_name || !rating || !title || !comment) {
      return NextResponse.json({ error: 'All review fields are required.' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
    }

    // Verify product exists
    const product = await get('SELECT id FROM products WHERE id = ?', [product_id]);
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
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

    const isVerified = verified ? true : false;

    const result = await run(
      `INSERT INTO reviews (product_id, user_name, user_initials, rating, title, comment, verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [product_id, user_name, initials, rating, title, comment, isVerified]
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
      created_at: new Date().toISOString()
    };

    return NextResponse.json(newReview, { status: 201 });

  } catch (err) {
    console.error('Submit review API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
