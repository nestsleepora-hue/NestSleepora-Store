import { NextResponse } from 'next/server';
import stripePackage from 'stripe';
import { get, run } from '@/lib/db';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_SECRET_KEY ? stripePackage(STRIPE_SECRET_KEY) : null;

export async function POST(req) {
  try {
    const { items, shipping, userId, paymentMethod } = await req.json();

    if (!items || !items.length || !shipping) {
      return NextResponse.json({ error: 'Cart items and shipping details are required.' }, { status: 400 });
    }

    const { name, address, city, zip } = shipping;
    if (!name || !address || !city || !zip) {
      return NextResponse.json({ error: 'Complete shipping address is required.' }, { status: 400 });
    }

    let totalAmount = 0;
    const itemsDetails = [];

    for (const item of items) {
      let dbProduct = await get('SELECT id, name, base_price, discount_price FROM products WHERE id = ?', [item.product_id]);
      if (!dbProduct && item.name) {
        dbProduct = await get('SELECT id, name, base_price, discount_price FROM products WHERE name = ?', [item.name]);
      }

      let dbVariant = null;
      if (dbProduct) {
        dbVariant = await get('SELECT id, size, price_modifier FROM product_variants WHERE id = ?', [item.variant_id]);
        if (!dbVariant && item.size) {
          dbVariant = await get('SELECT id, size, price_modifier FROM product_variants WHERE product_id = ? AND size = ?', [dbProduct.id, item.size]);
        }
      }

      const resolvedProduct = dbProduct || { id: item.product_id, name: item.name || 'Product', base_price: item.base_price || 0, discount_price: item.discount_price };
      const resolvedVariant = dbVariant || { id: item.variant_id, size: item.size || 'Standard', price_modifier: item.price_modifier || 0 };

      const itemPrice = (resolvedProduct.discount_price !== null && resolvedProduct.discount_price !== undefined ? resolvedProduct.discount_price : resolvedProduct.base_price) + resolvedVariant.price_modifier;
      totalAmount += itemPrice * item.quantity;

      itemsDetails.push({
        product_id: resolvedProduct.id,
        variant_id: resolvedVariant.id,
        name: `${resolvedProduct.name} (${resolvedVariant.size})`,
        quantity: item.quantity,
        price: itemPrice
      });
    }

    let stripeSessionId;
    if (paymentMethod === 'cod') {
      stripeSessionId = `cod_${Math.random().toString(36).substring(2, 15)}`;
    } else {
      stripeSessionId = stripe ? `cs_test_${Math.random().toString(36).substring(2, 15)}` : `mock_chk_${Math.random().toString(36).substring(2, 15)}`;
    }

    // Create pending order
    const orderRes = await run(
      `INSERT INTO orders (user_id, total_amount, status, stripe_payment_id, shipping_name, shipping_address, shipping_city, shipping_zip)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)`,
      [userId || null, totalAmount, stripeSessionId, name, address, city, zip]
    );
    const orderId = orderRes.id;

    for (const item of itemsDetails) {
      await run(
        `INSERT INTO order_items (order_id, product_id, variant_id, quantity, price_at_purchase)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.variant_id, item.quantity, item.price]
      );
    }

    if (paymentMethod === 'cod') {
      const mockUrl = `/order-confirmation?session_id=${stripeSessionId}`;
      return NextResponse.json({ id: stripeSessionId, url: mockUrl });
    }

    if (stripe) {
      try {
        const origin = req.headers.get('origin') || 'http://localhost:3000';
        const lineItems = itemsDetails.map(item => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          success_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/cart`,
          metadata: {
            order_id: orderId,
            user_id: userId || null
          }
        });

        await run('UPDATE orders SET stripe_payment_id = ? WHERE id = ?', [session.id, orderId]);
        return NextResponse.json({ id: session.id, url: session.url });
      } catch (stripeErr) {
        console.error('Stripe session creation failed. Falling back to mock:', stripeErr);
      }
    }

    const mockUrl = `/checkout/mock-payment?session_id=${stripeSessionId}`;
    return NextResponse.json({ id: stripeSessionId, url: mockUrl });

  } catch (err) {
    console.error('Checkout API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
