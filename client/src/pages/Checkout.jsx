import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CreditCard, ShieldCheck, ShoppingBag, ArrowRight, Loader } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const { cart, cartTotal, API_URL, user, clearCart, formatPrice } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Route indicator: Are we on checkout form or mock payment portal?
  const mockSessionId = searchParams.get('session_id') || '';
  const isMockPaymentView = window.location.pathname.includes('/mock-payment') || mockSessionId;

  // Checkout Form states
  const [paymentMethod, setPaymentMethod] = useState('cod'); // always COD
  const [shippingName, setShippingName] = useState('');
  const [shippingEmail, setShippingEmail] = useState(user ? user.email : '');
  const [shippingWhatsapp, setShippingWhatsapp] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCountry, setShippingCountry] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingZip, setShippingZip] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Payment states (for Mock Portal)
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [mockCardNumber, setMockCardNumber] = useState('4242 4242 4242 4242');
  const [mockExpiry, setMockExpiry] = useState('12/29');
  const [mockCvc, setMockCvc] = useState('123');

  // Sync profile details if logged in
  useEffect(() => {
    if (user && !shippingEmail) {
      setShippingEmail(user.email || '');
    }
  }, [user]);

  // Protect route if cart is empty and not in payment view
  useEffect(() => {
    if (cart.length === 0 && !isMockPaymentView) {
      navigate('/cart');
    }
  }, [cart, isMockPaymentView]);

  // Handler: Start Checkout / Create Session
  const handleStartCheckout = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    setCheckoutLoading(true);

    const payload = {
      items: cart.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        name: item.name,
        size: item.size,
        base_price: item.base_price,
        discount_price: item.discount_price,
        price_modifier: item.price_modifier
      })),
      shipping: {
        name: shippingName,
        address: paymentMethod === 'cod'
          ? `${shippingAddress} (Country: ${shippingCountry}, Phone: ${shippingPhone}, WhatsApp: ${shippingWhatsapp}, Email: ${shippingEmail})`
          : shippingAddress,
        city: shippingCity,
        zip: shippingZip
      },
      userId: user ? (user.uid || user.id) : null,
      paymentMethod: paymentMethod
    };

    try {
      const res = await fetch(`${API_URL}/checkout/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setCheckoutLoading(false);

      if (!res.ok) {
        throw new Error(data.error || 'Checkout session failed');
      }

      // If it returns a Stripe Checkout URL or Mock Gateway URL, we navigate/redirect there
      if (data.url.startsWith('http')) {
        window.location.href = data.url; // Real Stripe Checkout redirect
      } else {
        navigate(data.url); // Mock gateway page route
      }
    } catch (err) {
      console.error('Checkout creation error:', err);
      setCheckoutError(err.message || 'Server error creating checkout session.');
      setCheckoutLoading(false);
    }
  };

  // Handler: Mock Card Payment Completion
  const handleMockPaySubmit = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setPaymentLoading(true);

    // Simulate payment authorization delay
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/checkout/confirm?session_id=${mockSessionId}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setPaymentSuccess(true);
          // Empty guest or DB cart
          clearCart();
          // Navigate to order confirmation
          setTimeout(() => {
            navigate(`/order-confirmation?session_id=${mockSessionId}`);
          }, 1000);
        } else {
          throw new Error(data.error || 'Payment confirmation failed');
        }
      } catch (err) {
        console.error('Mock payment error:', err);
        setPaymentError('Payment processing failed. Please verify order session details.');
        setPaymentLoading(false);
      }
    }, 1500);
  };

  // Render: Mock Payment Gateway Portal
  if (isMockPaymentView) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 space-y-6 text-left">
        <div className="bg-white border border-dreamBorder rounded-premiumLarge shadow-xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-dreamNavy text-white p-6 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-dreamAccent">Secure Gateway (Test Mode)</span>
            <h2 className="text-xl font-bold font-poppins flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-dreamAccent" />
              NestSleepora Payment
            </h2>
          </div>

          <div className="p-6 space-y-6">
            <div className="p-3.5 bg-dreamBlush rounded-premium border border-dreamAccent/10 text-xs text-dreamNavy">
              🛡️ <strong>Test Environment Enabled:</strong> Feel free to input any simulated card parameters below. No money will be transferred.
            </div>

            {paymentError && (
              <div className="p-3 bg-dreamRed/10 border border-dreamRed/20 text-dreamRed text-xs font-semibold rounded-premium">
                {paymentError}
              </div>
            )}

            <form onSubmit={handleMockPaySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dreamNavy mb-1">Cardholder Name</label>
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  className="w-full h-11 px-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-dreamBackground text-dreamNavy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dreamNavy mb-1">Card Number</label>
                <input
                  type="text"
                  required
                  value={mockCardNumber}
                  onChange={(e) => setMockCardNumber(e.target.value)}
                  placeholder="4242 4242 4242 4242"
                  className="w-full h-11 px-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-dreamBackground text-dreamNavy font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dreamNavy mb-1">Expiration Date</label>
                  <input
                    type="text"
                    required
                    value={mockExpiry}
                    onChange={(e) => setMockExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full h-11 px-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-dreamBackground text-dreamNavy font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dreamNavy mb-1">CVC / CVV</label>
                  <input
                    type="text"
                    required
                    value={mockCvc}
                    onChange={(e) => setMockCvc(e.target.value)}
                    placeholder="123"
                    className="w-full h-11 px-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-dreamBackground text-dreamNavy font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={paymentLoading || paymentSuccess}
                className="w-full h-12 bg-dreamGreen hover:bg-dreamGreen/90 text-white font-bold rounded-premium text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-dreamGreen/10 disabled:opacity-50"
              >
                {paymentLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing Authorized Payment...
                  </>
                ) : paymentSuccess ? (
                  'Payment Completed Successfully!'
                ) : (
                  'Confirm and Complete Purchase'
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="flex justify-center items-center gap-1.5 text-xs text-dreamMuted">
          <ShieldCheck className="w-4 h-4 text-dreamGreen" />
          <span>SSL Encryption verified. Payments simulated locally.</span>
        </div>
      </div>
    );
  }

  // Render: Shipping Checkout Details Form
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
      <h1 className="text-3xl font-extrabold font-poppins text-dreamNavy border-b border-dreamBorder pb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Shipping Form */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-dreamBorder rounded-premiumLarge p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold font-poppins text-dreamNavy border-b border-dreamBorder pb-3">
              Shipping &amp; Delivery Details (Cash on Delivery)
            </h3>

            {checkoutError && (
              <div className="p-3 bg-dreamRed/10 border border-dreamRed/20 text-dreamRed text-xs font-semibold rounded-premium">
                {checkoutError}
              </div>
            )}

            <form onSubmit={handleStartCheckout} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dreamNavy mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={shippingName}
                    onChange={(e) => setShippingName(e.target.value)}
                    className="w-full h-11 px-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-dreamBackground text-dreamNavy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dreamNavy mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    value={shippingEmail}
                    onChange={(e) => setShippingEmail(e.target.value)}
                    className="w-full h-11 px-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-dreamBackground text-dreamNavy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dreamNavy mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +49 170 1234567"
                    value={shippingWhatsapp}
                    onChange={(e) => setShippingWhatsapp(e.target.value)}
                    className="w-full h-11 px-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-dreamBackground text-dreamNavy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dreamNavy mb-1">Telephone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +44 20 7946 0958"
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value)}
                    className="w-full h-11 px-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-dreamBackground text-dreamNavy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dreamNavy mb-1">Shipping Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 221B Baker St, London"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full h-11 px-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-dreamBackground text-dreamNavy"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dreamNavy mb-1">Country</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Germany"
                    value={shippingCountry}
                    onChange={(e) => setShippingCountry(e.target.value)}
                    className="w-full h-11 px-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-dreamBackground text-dreamNavy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dreamNavy mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Berlin"
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    className="w-full h-11 px-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-dreamBackground text-dreamNavy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dreamNavy mb-1">Zip / Postal Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10115"
                    value={shippingZip}
                    onChange={(e) => setShippingZip(e.target.value)}
                    className="w-full h-11 px-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-dreamBackground text-dreamNavy"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={checkoutLoading}
                className="w-full h-12 mt-6 bg-dreamGreen hover:bg-dreamGreen/90 text-white font-bold rounded-premium text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-dreamGreen/10 disabled:opacity-50"
              >
                {checkoutLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Placing your COD Order...
                  </>
                ) : (
                  <>
                    Confirm Order (Cash on Delivery)
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Checkout Items Summary sidebar */}
        <div className="border border-dreamBorder rounded-premiumLarge p-6 bg-white space-y-6">
          <h3 className="text-base font-bold font-poppins text-dreamNavy border-b border-dreamBorder pb-4 flex items-center justify-between">
            <span>Your Order</span>
            <span className="text-xs text-dreamMuted">({cart.length} items)</span>
          </h3>

          <div className="max-h-60 overflow-y-auto divide-y divide-dreamBorder pr-1">
            {cart.map((item, idx) => {
              const itemPrice = (item.discount_price !== null ? item.discount_price : item.base_price) + item.price_modifier;
              return (
                <div key={idx} className="py-3 flex justify-between gap-4 text-xs font-medium text-dreamNavy">
                  <div className="min-w-0">
                    <span className="font-bold block truncate">{item.name}</span>
                    <span className="text-[10px] text-dreamMuted">Size: {item.size} &times; {item.quantity}</span>
                  </div>
                  <span className="font-bold shrink-0">{formatPrice(itemPrice * item.quantity)}</span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-dreamBorder pt-4 space-y-3 text-xs font-medium text-dreamNavy">
            <div className="flex justify-between">
              <span className="text-dreamMuted">Shipping</span>
              <span className="text-dreamGreen font-bold">FREE</span>
            </div>
            <div className="border-t border-dreamBorder pt-3 flex justify-between text-sm font-extrabold">
              <span>Order Total</span>
              <span className="text-dreamAccent">{formatPrice(cartTotal)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
