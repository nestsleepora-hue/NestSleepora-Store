import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { get, run, query } from '@/lib/db';

const sendOrderConfirmationEmail = async (order, items) => {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const recipientEmail = 'support@nestsleepora.store';

    if (!emailUser || !emailPass) {
      console.log('Skipping order confirmation email: EMAIL_USER or EMAIL_PASS not set in ENV.');
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass.replace(/\s+/g, '')
      }
    });

    const itemsHtml = items.map(item => `
      <tr style="border-bottom: 1px solid #f1eee8;">
        <td style="padding: 10px; font-size: 13px; color: #1d2a3a; font-weight: bold;">
          ${item.product_name}
          <div style="font-size: 10px; color: #8a8f98; font-weight: normal;">Size: ${item.variant_size}</div>
        </td>
        <td style="padding: 10px; font-size: 13px; color: #1d2a3a; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; font-size: 13px; color: #ff7a3d; text-align: right; font-weight: bold;">
          $${(item.price_at_purchase * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const isCod = order.status === 'cod';

    const mailOptions = {
      from: `"NestSleepora Orders" <${emailUser}>`,
      to: recipientEmail,
      subject: `New NestSleepora Order Notification - #${order.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #f1eee8; border-radius: 12px; background-color: #fffdfb; text-align: left;">
          <div style="text-align: center; border-bottom: 2px solid #ff7a3d; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="color: #1d2a3a; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; font-family: 'Poppins', sans-serif;">
              NestSleep<span style="color: #ff7a3d;">ora</span>
            </h1>
            <p style="font-size: 11px; color: #8a8f98; margin: 5px 0 0 0; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">
              Order Receipt &amp; Notification
            </p>
          </div>

          <p style="font-size: 14px; color: #1d2a3a; font-weight: 600; margin-bottom: 5px;">
            Hello Admin,
          </p>
          <p style="font-size: 13px; color: #8a8f98; margin-bottom: 20px;">
            A new order has been placed on <strong>NestSleepora</strong>. Below are the details:
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; background: #ffffff; border: 1px solid #f1eee8; border-radius: 8px;">
            <tr style="background: #1d2a3a; color: #ffffff;">
              <th colspan="2" style="padding: 12px; text-align: left; font-size: 12px; font-weight: 800; text-transform: uppercase;">
                Customer & Shipping Information
              </th>
            </tr>
            <tr>
              <td style="padding: 10px; font-size: 12px; color: #8a8f98; border-bottom: 1px solid #f1eee8; width: 140px;">Recipient Name:</td>
              <td style="padding: 10px; font-size: 12px; color: #1d2a3a; font-weight: bold; border-bottom: 1px solid #f1eee8;">${order.shipping_name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-size: 12px; color: #8a8f98; border-bottom: 1px solid #f1eee8;">Address:</td>
              <td style="padding: 10px; font-size: 12px; color: #1d2a3a; font-weight: 600; border-bottom: 1px solid #f1eee8;">${order.shipping_address}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-size: 12px; color: #8a8f98; border-bottom: 1px solid #f1eee8;">City:</td>
              <td style="padding: 10px; font-size: 12px; color: #1d2a3a; font-weight: 600; border-bottom: 1px solid #f1eee8;">${order.shipping_city}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-size: 12px; color: #8a8f98; border-bottom: 1px solid #f1eee8;">Postal Code:</td>
              <td style="padding: 10px; font-size: 12px; color: #1d2a3a; font-weight: 600; border-bottom: 1px solid #f1eee8;">${order.shipping_zip}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-size: 12px; color: #8a8f98; border-bottom: 1px solid #f1eee8;">Payment Method:</td>
              <td style="padding: 10px; font-size: 12px; color: #ff7a3d; font-weight: bold; border-bottom: 1px solid #f1eee8;">
                ${isCod ? '💵 Cash on Delivery (COD)' : '💳 Paid (Online Advance)'}
              </td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; background: #ffffff; border: 1px solid #f1eee8; border-radius: 8px;">
            <thead>
              <tr style="background: #1d2a3a; color: #ffffff;">
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 800; text-transform: uppercase;">Product</th>
                <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 800; text-transform: uppercase; width: 60px;">Qty</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 800; text-transform: uppercase; width: 100px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr style="background: #fffdfb; font-weight: bold;">
                <td colspan="2" style="padding: 12px; font-size: 13px; color: #1d2a3a; text-align: right; border-top: 2px solid #ff7a3d;">Total:</td>
                <td style="padding: 12px; font-size: 15px; color: #ff7a3d; text-align: right; border-top: 2px solid #ff7a3d;">
                  $${order.total_amount.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          <div style="text-align: center; margin-top: 30px; border-top: 1px solid #f1eee8; padding-top: 20px;">
            <p style="font-size: 10px; color: #8a8f98; margin: 0;">
              &copy; ${new Date().getFullYear()} NestSleepora Sleep Products Inc. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to support@nestsleepora.store for order #${order.id}.`);
  } catch (error) {
    console.error('Failed to send order notification email:', error);
  }
};

const pushOrderToGoogleSheets = async (order, items) => {
  try {
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log('Skipping Google Sheets push: GOOGLE_SHEET_WEBHOOK_URL not set in ENV.');
      return;
    }

    const payload = {
      order_id: order.id,
      customer_name: order.shipping_name,
      shipping_address: order.shipping_address,
      shipping_city: order.shipping_city,
      shipping_zip: order.shipping_zip,
      payment_method: order.status === 'cod' ? 'Cash on Delivery (COD)' : 'Advance Online Payment',
      total_amount: order.total_amount,
      order_date: new Date().toISOString(),
      items: items.map(item => `${item.product_name} (Size: ${item.variant_size}, Qty: ${item.quantity})`).join(', ')
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`Successfully pushed order #${order.id} to Google Sheet.`);
    } else {
      console.error(`Google Sheets push returned status: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to push order to Google Sheets webhook:', error);
  }
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required.' }, { status: 400 });
    }

    const order = await get('SELECT * FROM orders WHERE stripe_payment_id = ?', [session_id]);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const isCod = session_id.startsWith('cod_');
    const newStatus = isCod ? 'cod' : 'paid';
    const isFirstConfirmation = order.status === 'pending';

    if (isFirstConfirmation) {
      await run('UPDATE orders SET status = ? WHERE id = ?', [newStatus, order.id]);
    }

    if (order.user_id) {
      const cart = await get('SELECT id FROM carts WHERE user_id = ?', [order.user_id]);
      if (cart) {
        await run('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
      }
    }

    const items = await query(
      `SELECT oi.*, p.name as product_name, COALESCE(pv.size, CAST(oi.variant_id AS VARCHAR)) as variant_size
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       LEFT JOIN product_variants pv ON CAST(oi.variant_id AS VARCHAR) = CAST(pv.id AS VARCHAR) OR CAST(oi.variant_id AS VARCHAR) = pv.size
       WHERE oi.order_id = ?`,
      [order.id]
    );

    if (isFirstConfirmation) {
      const enrichedOrder = { ...order, status: newStatus };
      sendOrderConfirmationEmail(enrichedOrder, items);
      pushOrderToGoogleSheets(enrichedOrder, items);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        total_amount: order.total_amount,
        status: newStatus,
        shipping_name: order.shipping_name,
        shipping_address: order.shipping_address,
        shipping_city: order.shipping_city,
        shipping_zip: order.shipping_zip,
        created_at: order.created_at,
        items
      }
    });

  } catch (err) {
    console.error('Order confirmation API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
