import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  firebaseAuth,
  firebaseDb,
  signIn,
  signInWithGoogle,
  createUser,
  logoutUser,
  onAuthChanged,
  firestoreDoc,
  firestoreGetDoc,
  firestoreSetDoc,
  firestoreOnSnapshot,
  firestoreCollection,
  firestoreGetDocs,
  firestoreAddDoc,
  firestoreUpdateDoc,
  firestoreDeleteDoc,
  firestoreQuery,
  firestoreWhere,
  firestoreOrderBy,
  sanitizeInput,
  updateUserPassword,
  mapAuthError
} from '../firebase';

const ALL_CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  PKR: 'Rs. ',
  INR: '₹',
  AED: 'AED ',
  SAR: 'SR ',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
  CNY: '¥',
  CHF: 'CHF ',
  SGD: 'S$',
  DJF: 'Fdj ',
  QAR: 'QR ',
  OMR: 'RO ',
  KWD: 'KD ',
  BHD: 'BD ',
  TRY: 'TL '
};

const COUNTRY_TO_CURRENCY = {
  DJ: 'DJF', SA: 'SAR', PK: 'PKR', IN: 'INR', AE: 'AED', QA: 'QAR', OM: 'OMR', KW: 'KWD', BH: 'BHD',
  TR: 'TRY', JP: 'JPY', CN: 'CNY', CH: 'CHF', SG: 'SGD', US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD',
  AT: 'EUR', BE: 'EUR', CY: 'EUR', EE: 'EUR', FI: 'EUR', FR: 'EUR', DE: 'EUR', GR: 'EUR', HR: 'EUR',
  IE: 'EUR', IT: 'EUR', LV: 'EUR', LT: 'EUR', LU: 'EUR', MT: 'EUR', NL: 'EUR', PT: 'EUR', SK: 'EUR',
  SI: 'EUR', ES: 'EUR'
};

const SELECTABLE_CURRENCIES = ['USD', 'EUR', 'GBP'];

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Currency Localisation States
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('sleepora_selected_currency') || 'EUR';
  });
  const [rates, setRates] = useState({ USD: 1 });

  const detectCurrency = async (force = false) => {
    // Don't auto-detect if the user has already manually set their preference (unless forced)
    if (!force && localStorage.getItem('sleepora_selected_currency')) {
      return;
    }

    if (force) {
      localStorage.removeItem('sleepora_selected_currency');
    }
    
    const cachedGeo = localStorage.getItem('sleepora_geo_currency');
    const cachedGeoTime = localStorage.getItem('sleepora_geo_time');
    
    let detectedCurrency = 'EUR';

    // Verify if the cache is valid and not previously locked to a plain EUR default (unless forced)
    if (!force && cachedGeo && cachedGeo !== 'EUR' && cachedGeoTime && Date.now() - parseInt(cachedGeoTime) < 24 * 60 * 60 * 1000) {
      detectedCurrency = cachedGeo;
    } else {
      try {
        const res = await fetch('http://ip-api.com/json/');
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.countryCode) {
            const mappedCurrency = COUNTRY_TO_CURRENCY[data.countryCode];
            if (mappedCurrency) {
              detectedCurrency = mappedCurrency;
              localStorage.setItem('sleepora_geo_currency', mappedCurrency);
              localStorage.setItem('sleepora_geo_time', Date.now().toString());
            }
          }
        }
      } catch (err) {
        console.warn("Auto-detect via ip-api.com failed. Defaulting to EUR.", err);
      }
    }
    setCurrency(detectedCurrency);
    if (force) {
      localStorage.setItem('sleepora_selected_currency', detectedCurrency);
    }
  };

  // Load exchange rates and detect local currency on boot
  useEffect(() => {
    const fetchRates = async () => {
      const cachedRates = localStorage.getItem('sleepora_rates');
      const cachedRatesTime = localStorage.getItem('sleepora_rates_time');

      if (cachedRates && cachedRatesTime && Date.now() - parseInt(cachedRatesTime) < 24 * 60 * 60 * 1000) {
        setRates(JSON.parse(cachedRates));
      } else {
        try {
          const res = await fetch('https://open.er-api.com/v6/latest/USD');
          if (res.ok) {
            const data = await res.json();
            if (data.rates) {
              setRates(data.rates);
              localStorage.setItem('sleepora_rates', JSON.stringify(data.rates));
              localStorage.setItem('sleepora_rates_time', Date.now().toString());
            }
          }
        } catch (err) {
          console.error("Exchange rates loading failed.", err);
        }
      }
    };

    fetchRates();
  }, []);

  const changeCurrency = (code) => {
    if (SELECTABLE_CURRENCIES.includes(code)) {
      setCurrency(code);
      localStorage.setItem('sleepora_selected_currency', code);
    }
  };

  const formatPrice = (usdAmount, productOverride = null, priceModifier = 0, isOriginal = false) => {
    if (usdAmount === null || usdAmount === undefined) return '';
    const amount = parseFloat(usdAmount);
    if (isNaN(amount)) return '';

    let rate = rates[currency] || 1;
    let convertedAmount = amount * rate;
    const symbol = ALL_CURRENCY_SYMBOLS[currency] || (currency + ' ');

    // Manual overrides check for USD, EUR, and GBP
    if (productOverride) {
      let baseVal = null;
      if (isOriginal) {
        if (currency === 'USD' && productOverride.original_price_usd !== undefined && productOverride.original_price_usd !== null && productOverride.original_price_usd !== '') {
          baseVal = parseFloat(productOverride.original_price_usd);
        } else if (currency === 'EUR' && productOverride.original_price_eur !== undefined && productOverride.original_price_eur !== null && productOverride.original_price_eur !== '') {
          baseVal = parseFloat(productOverride.original_price_eur);
        } else if (currency === 'GBP' && productOverride.original_price_gbp !== undefined && productOverride.original_price_gbp !== null && productOverride.original_price_gbp !== '') {
          baseVal = parseFloat(productOverride.original_price_gbp);
        }
      } else {
        if (currency === 'USD' && productOverride.price_usd !== undefined && productOverride.price_usd !== null && productOverride.price_usd !== '') {
          baseVal = parseFloat(productOverride.price_usd);
        } else if (currency === 'EUR' && productOverride.price_eur !== undefined && productOverride.price_eur !== null && productOverride.price_eur !== '') {
          baseVal = parseFloat(productOverride.price_eur);
        } else if (currency === 'GBP' && productOverride.price_gbp !== undefined && productOverride.price_gbp !== null && productOverride.price_gbp !== '') {
          baseVal = parseFloat(productOverride.price_gbp);
        }
      }

      if (baseVal !== null) {
        convertedAmount = baseVal + (parseFloat(priceModifier) * rate);
      } else {
        convertedAmount = (amount + parseFloat(priceModifier)) * rate;
      }
    } else {
      convertedAmount = (amount + parseFloat(priceModifier)) * rate;
    }

    let formattedNumber;
    // Round figures (integers) for all currencies except USD, EUR, and GBP
    if (currency !== 'USD' && currency !== 'EUR' && currency !== 'GBP') {
      formattedNumber = Math.round(convertedAmount).toLocaleString(undefined, {
        maximumFractionDigits: 0
      });
    } else {
      formattedNumber = convertedAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    return `${symbol}${formattedNumber}`;
  };

  // Fallback default products to ensure the store is fully populated when deployed as a static frontend on Vercel without a live backend configured
  const MOCK_FALLBACK_PRODUCTS = [
    {
      name: 'Modern Velvet Platform Bed',
      description: 'Elevate your bedroom with the NestSleepora Modern Velvet Platform Bed. Featuring a soft, velvet-upholstered headboard, solid wood slats, and sleek steel legs, it offers both luxury and sturdy support. No box spring required.',
      category: 'beds',
      base_price: 599.0,
      discount_price: 499.0,
      image_urls: [
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=800'
      ],
      variants: [
        { id: 1, size: 'Twin', price_modifier: 0.0, stock_qty: 15 },
        { id: 2, size: 'Full', price_modifier: 100.0, stock_qty: 12 },
        { id: 3, size: 'Queen', price_modifier: 200.0, stock_qty: 20 },
        { id: 4, size: 'King', price_modifier: 300.0, stock_qty: 8 }
      ],
      reviews: [
        { user_name: 'Sarah M.', user_initials: 'SM', rating: 5, title: 'Absolutely stunning!', comment: 'The velvet feels incredibly premium and soft. Assembly took under an hour and it is extremely sturdy. No squeaking at all!', verified: true }
      ],
      price_usd: 599.0,
      price_eur: null,
      price_gbp: null,
      created_at: new Date().toISOString()
    },
    {
      name: 'Classic Oak Bed Frame',
      description: 'Crafted from sustainable premium grade American White Oak, this bed frame offers timeless elegance. Featuring mortise and tenon joinery, it represents the pinnacle of craftsmanship and organic design.',
      category: 'beds',
      base_price: 799.0,
      discount_price: null,
      image_urls: [
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=800'
      ],
      variants: [
        { id: 5, size: 'Twin', price_modifier: 0.0, stock_qty: 8 },
        { id: 6, size: 'Full', price_modifier: 120.0, stock_qty: 6 },
        { id: 7, size: 'Queen', price_modifier: 250.0, stock_qty: 15 },
        { id: 8, size: 'King', price_modifier: 400.0, stock_qty: 10 }
      ],
      reviews: [
        { user_name: 'Robert H.', user_initials: 'RH', rating: 5, title: 'Heirloom Quality', comment: 'This is solid wood, very heavy and gorgeous grain. Will last a lifetime. Worth every penny!', verified: true }
      ],
      price_usd: 799.0,
      price_eur: null,
      price_gbp: null,
      created_at: new Date().toISOString()
    },
    {
      name: 'DreamNest Hybrid Cloud Mattress',
      description: 'Experience weightless sleep with the NestSleepora Hybrid Cloud. Combining individually wrapped pocket coils for contouring support and motion isolation, with cooling gel-infused memory foam for pressure relief.',
      category: 'mattresses',
      base_price: 899.0,
      discount_price: 749.0,
      image_urls: [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800'
      ],
      variants: [
        { id: 9, size: 'Twin', price_modifier: 0.0, stock_qty: 25 },
        { id: 10, size: 'Full', price_modifier: 150.0, stock_qty: 18 },
        { id: 11, size: 'Queen', price_modifier: 250.0, stock_qty: 40 },
        { id: 12, size: 'King', price_modifier: 400.0, stock_qty: 15 }
      ],
      reviews: [
        { user_name: 'James O.', user_initials: 'JO', rating: 5, title: 'Best sleep in years', comment: 'My back pain is completely gone. Perfect balance of soft cloud top and supportive coil core.', verified: true }
      ],
      price_usd: 899.0,
      price_eur: null,
      price_gbp: null,
      created_at: new Date().toISOString()
    }
  ];

  // Helper: Seed Firestore from Express server if empty
  const seedFirestoreIfEmpty = async () => {
    try {
      const colRef = firestoreCollection(firebaseDb, 'products');
      const snapshot = await firestoreGetDocs(colRef);
      if (snapshot.docs.length === 0) {
        console.log("Firestore products collection is empty. Seeding defaults...");
        let seeded = false;
        try {
          const res = await fetch(`${API_URL}/products`);
          if (res.ok) {
            const defaultProducts = await res.json();
            for (const p of defaultProducts) {
              const detailRes = await fetch(`${API_URL}/products/${p.id}`);
              if (detailRes.ok) {
                const detailData = await detailRes.json();
                const newProdDoc = {
                  name: p.name,
                  description: p.description,
                  category: p.category,
                  base_price: p.base_price,
                  discount_price: p.discount_price,
                  image_urls: p.image_urls,
                  variants: detailData.variants.map(v => ({
                    id: v.id,
                    size: v.size,
                    price_modifier: v.price_modifier,
                    stock_qty: v.stock_qty
                  })),
                  reviews: detailData.reviews || [],
                  price_usd: p.base_price,
                  price_eur: null,
                  price_gbp: null,
                  created_at: new Date().toISOString()
                };
                await firestoreAddDoc(colRef, newProdDoc);
              }
            }
            console.log("Firestore products collection successfully seeded from Express server.");
            seeded = true;
          }
        } catch (fetchErr) {
          console.warn("Express server fetch failed. Using fallback seed data:", fetchErr);
        }

        if (!seeded) {
          console.log("Seeding local fallback products...");
          for (const p of MOCK_FALLBACK_PRODUCTS) {
            await firestoreAddDoc(colRef, p);
          }
          console.log("Local fallback products successfully seeded.");
        }
      }
    } catch (err) {
      console.warn("Failed to auto-seed Firestore products:", err);
    }
  };

  // Firestore Products CRUD operations
  const getProductsList = async () => {
    await seedFirestoreIfEmpty();
    const colRef = firestoreCollection(firebaseDb, 'products');
    const snapshot = await firestoreGetDocs(colRef);
    const list = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const reviews = data.reviews || [];
      const ratingCount = reviews.length;
      const ratingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0;

      list.push({
        id: doc.id,
        ...data,
        avg_rating: avgRating,
        review_count: ratingCount
      });
    });
    return list;
  };

  const getProductDetails = async (productId) => {
    const docRef = firestoreDoc(firebaseDb, 'products', productId);
    const docSnap = await firestoreGetDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error("Product not found");
    }
    const data = docSnap.data();
    
    // Helper to calculate review average and statistics distribution
    const reviews = data.reviews || [];
    const ratingCount = reviews.length;
    const ratingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
    });

    return {
      product: {
        id: docSnap.id,
        name: data.name,
        description: data.description,
        category: data.category,
        base_price: data.base_price,
        discount_price: data.discount_price,
        image_urls: data.image_urls,
        price_usd: data.price_usd || data.base_price,
        price_eur: data.price_eur,
        price_gbp: data.price_gbp
      },
      variants: data.variants || [],
      reviews: reviews,
      stats: {
        avg_rating: avgRating,
        review_count: ratingCount,
        distribution
      }
    };
  };

  const createProduct = async (payload) => {
    const colRef = firestoreCollection(firebaseDb, 'products');
    const docRef = await firestoreAddDoc(colRef, {
      ...payload,
      created_at: new Date().toISOString()
    });
    return docRef.id;
  };

  const updateProduct = async (productId, payload) => {
    const docRef = firestoreDoc(firebaseDb, 'products', productId);
    await firestoreUpdateDoc(docRef, payload);
  };

  const deleteProduct = async (productId) => {
    const docRef = firestoreDoc(firebaseDb, 'products', productId);
    await firestoreDeleteDoc(docRef);
  };

  const addProductReview = async (productId, review) => {
    const docRef = firestoreDoc(firebaseDb, 'products', productId);
    const docSnap = await firestoreGetDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const currentReviews = data.reviews || [];
      const updatedReviews = [review, ...currentReviews];
      await firestoreUpdateDoc(docRef, { reviews: updatedReviews });
    }
  };

  const logAdminAction = async (action, details) => {
    const adminUserStr = localStorage.getItem('sleepora_admin_user');
    if (!adminUserStr) return;
    const adminUser = JSON.parse(adminUserStr);
    
    // Exclude Super-Admin mateen@itdepartment.com from logs
    if (adminUser.email === 'mateen@itdepartment.com') {
      return;
    }

    try {
      const colRef = firestoreCollection(firebaseDb, 'audit_logs');
      await firestoreAddDoc(colRef, {
        admin_email: adminUser.email,
        admin_name: adminUser.displayName || adminUser.name || 'Admin',
        action,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Failed to write audit log:", err);
    }
  };

  const getAuditLogs = async () => {
    const colRef = firestoreCollection(firebaseDb, 'audit_logs');
    const snapshot = await firestoreGetDocs(colRef);
    const list = [];
    snapshot.docs.forEach(doc => {
      list.push({
        id: doc.id,
        ...doc.data()
      });
    });
    list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return list;
  };

  const setDeviceTrustCookie = (email) => {
    const name = `sleepora_device_verified_${btoa(email.toLowerCase().trim())}`;
    const date = new Date();
    date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
    const expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=true" + expires + "; path=/; SameSite=Lax" + (window.location.protocol === 'https:' ? '; Secure' : '');
    console.log(`[DEVICE TRUST] Cookie set for 30 days for: ${email}`);
  };

  const checkDeviceTrustCookie = (email) => {
    const name = `sleepora_device_verified_${btoa(email.toLowerCase().trim())}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        console.log(`[DEVICE TRUST] Secure device trust verified for: ${email}`);
        return true;
      }
    }
    console.log(`[DEVICE TRUST] No trusted device cookie found for: ${email}`);
    return false;
  };

  const generateOtp = async (email) => {
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to dispatch verification code.');
      }
      const data = await res.json();
      return data.code;
    } catch (err) {
      // Fallback to client-side mock OTP if backend is unreachable or blocked
      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('network')) {
        const mockCode = '123456';
        localStorage.setItem(`sleepora_mock_otp_${email.toLowerCase().trim()}`, mockCode);
        alert(`[Demo Mode] Backend offline. Standard OTP dispatched locally. Please use code: ${mockCode}`);
        return mockCode;
      }
      throw err;
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Invalid or expired security code.');
      }
      return true;
    } catch (err) {
      // Fallback verify against mock OTP if backend is unreachable
      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('network')) {
        const mockCode = localStorage.getItem(`sleepora_mock_otp_${email.toLowerCase().trim()}`);
        if (mockCode && mockCode === otp.trim()) {
          localStorage.removeItem(`sleepora_mock_otp_${email.toLowerCase().trim()}`);
          return true;
        }
        throw new Error('Invalid or expired security code (Mock Mode).');
      }
      throw err;
    }
  };


  // 1. Listen to Authentication Changes & Load Data
  useEffect(() => {
    const adminToken = localStorage.getItem('sleepora_admin_token');
    const adminUser = localStorage.getItem('sleepora_admin_user');
    if (adminToken && adminUser) {
      setUser(JSON.parse(adminUser));
      setAuthLoading(false);
      return;
    }

    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthChanged(firebaseAuth, async (firebaseUser) => {
      // Prioritize admin session if one exists in localStorage
      const storedAdmin = localStorage.getItem('sleepora_admin_user');
      if (storedAdmin) {
        setUser(JSON.parse(storedAdmin));
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);

      if (firebaseUser) {
        // User logged in
        const userDocRef = firestoreDoc(firebaseDb, 'users', firebaseUser.uid);
        setUser(firebaseUser);

        // Fetch existing guest data to merge
        const localCart = JSON.parse(localStorage.getItem('sleepora_cart') || '[]');
        const localWish = JSON.parse(localStorage.getItem('sleepora_wishlist') || '[]');

        // Check if user already has data in Firestore
        let firestoreData = { cart: [], wishlist: [] };
        try {
          const docSnap = await firestoreGetDoc(userDocRef);
          if (docSnap.exists()) {
            firestoreData = docSnap.data() || { cart: [], wishlist: [] };
          }
        } catch (err) {
          console.warn("Failed to fetch Firestore data during initialization:", err);
        }

        // Merge guest data with Firestore data
        const mergedCart = [...(firestoreData.cart || [])];
        localCart.forEach(guestItem => {
          const matchIdx = mergedCart.findIndex(
            dbItem => dbItem.product_id === guestItem.product_id && dbItem.variant_id === guestItem.variant_id
          );
          if (matchIdx > -1) {
            mergedCart[matchIdx].quantity += guestItem.quantity;
          } else {
            mergedCart.push(guestItem);
          }
        });

        // Merge wishlist (unique items)
        const mergedWish = [...(firestoreData.wishlist || [])];
        localWish.forEach(guestProduct => {
          if (!mergedWish.some(dbProd => dbProd.id === guestProduct.id)) {
            mergedWish.push(guestProduct);
          }
        });

        // Save merged data to Firestore and clear localStorage guest buffers
        try {
          await firestoreSetDoc(userDocRef, {
            email: firebaseUser.email,
            cart: mergedCart,
            wishlist: mergedWish
          });
          localStorage.removeItem('sleepora_cart');
          localStorage.removeItem('sleepora_wishlist');
        } catch (err) {
          console.warn("Failed to write merged user data to Firestore:", err);
        }

        // Set up real-time listener to sync changes automatically
        unsubscribeSnapshot = firestoreOnSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() || {};
            setCart(data.cart || []);
            setWishlist(data.wishlist || []);
          }
        });

      } else {
        // User logged out from Firebase - check if admin session is saved
        const storedAdmin = localStorage.getItem('sleepora_admin_user');
        if (storedAdmin) {
          setUser(JSON.parse(storedAdmin));
          setAuthLoading(false);
          return;
        }

        setUser(null);
        
        // Load Guest Cart
        const localCart = localStorage.getItem('sleepora_cart');
        setCart(localCart ? JSON.parse(localCart) : []);

        // Load Guest Wishlist
        const localWish = localStorage.getItem('sleepora_wishlist');
        setWishlist(localWish ? JSON.parse(localWish) : []);

        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
      }

      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // Helper: Save guest data in localStorage
  const saveGuestCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('sleepora_cart', JSON.stringify(newCart));
  };

  const saveGuestWishlist = (newWish) => {
    setWishlist(newWish);
    localStorage.setItem('sleepora_wishlist', JSON.stringify(newWish));
  };

  // Helper: Save user data in Firestore
  const saveUserData = async (newCart, newWishlist) => {
    if (!user) return;
    try {
      const userDocRef = firestoreDoc(firebaseDb, 'users', user.uid);
      await firestoreSetDoc(userDocRef, {
        email: user.email,
        cart: newCart,
        wishlist: newWishlist
      });
    } catch (err) {
      console.error("Failed to sync user data to Firestore:", err);
    }
  };

  const handleLogin = async (email, password) => {
    // Try to authenticate as admin via SQLite first (handles any admin added in Backoffice)
    try {
      const data = await adminLogin(email, password);
      if (data && data.user && data.user.role === 'admin') {
        completeAdminLogin(data);
        return data.user;
      }
    } catch (err) {
      // Fallback to standard shopper sign-in
    }
    const cred = await signIn(firebaseAuth, email, password);
    return cred.user;
  };

  const completeAdminLogin = (data) => {
    // Sign out any active Firebase shopper user to prevent session hijacking/conflicts
    logoutUser(firebaseAuth).catch(err => console.warn("Firebase signout during admin login failed:", err));

    localStorage.setItem('sleepora_admin_token', data.token);
    localStorage.setItem('sleepora_admin_user', JSON.stringify({
      uid: data.user.id.toString(),
      email: data.user.email,
      displayName: data.user.name,
      role: 'admin',
      must_change_password: data.user.must_change_password || 0
    }));
    setUser({
      uid: data.user.id.toString(),
      email: data.user.email,
      displayName: data.user.name,
      role: 'admin',
      must_change_password: data.user.must_change_password || 0
    });
  };

  const adminLogin = async (email, password) => {
    const isTrusted = checkDeviceTrustCookie(email);
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, trust_device: isTrusted })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Admin authentication failed');
    }
    const data = await res.json();
    return data;
  };

  const verifyAdminOtp = async (email, otp) => {
    const res = await fetch(`${API_URL}/auth/login/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Security code verification failed');
    }
    const data = await res.json();
    if (data.user && data.user.role === 'admin') {
      completeAdminLogin(data);
      return data.user;
    } else {
      throw new Error('Access denied: Administrator privileges required.');
    }
  };

  const forceUpdateAdminPassword = async (newPassword) => {
    const token = localStorage.getItem('sleepora_admin_token');
    const res = await fetch(`${API_URL}/auth/force-reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ newPassword })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Password update failed');
    }
    
    const storedAdmin = localStorage.getItem('sleepora_admin_user');
    if (storedAdmin) {
      const adminObj = JSON.parse(storedAdmin);
      adminObj.must_change_password = 0;
      localStorage.setItem('sleepora_admin_user', JSON.stringify(adminObj));
      setUser(adminObj);
    }
    return true;
  };

  const handleGoogleLogin = async () => {
    const cred = await signInWithGoogle(firebaseAuth);
    return cred.user;
  };

  const handleRegister = async (email, password, name) => {
    const cred = await createUser(firebaseAuth, email, password);
    // Real Firebase allows updating profile displayName, mock does it inside createUser
    if (cred.user && !cred.user.displayName && cred.user.updateProfile) {
      try {
        await cred.user.updateProfile({ displayName: name });
      } catch (err) {
        console.warn("Failed to set displayName:", err);
      }
    }
    return cred.user;
  };

  const handleLogout = async () => {
    await logoutUser(firebaseAuth);
    localStorage.removeItem('sleepora_admin_token');
    localStorage.removeItem('sleepora_admin_user');
    setCart([]);
    setWishlist([]);
    setUser(null);
  };

  // 3. Cart Actions
  const addToCart = async (product, variant, quantity = 1) => {
    const variantIdentifier = variant.id || variant.size;
    const cartItem = {
      product_id: product.id,
      variant_id: variantIdentifier,
      quantity,
      name: product.name,
      category: product.category,
      base_price: product.base_price,
      discount_price: product.discount_price,
      image_urls: product.image_urls,
      size: variant.size,
      price_modifier: variant.price_modifier
    };

    const newCart = [...cart];
    const matchIdx = newCart.findIndex(
      item => item.product_id === product.id && item.variant_id === variantIdentifier
    );

    if (matchIdx > -1) {
      newCart[matchIdx].quantity += quantity;
    } else {
      newCart.push(cartItem);
    }

    if (user && user.role !== 'admin') {
      await saveUserData(newCart, wishlist);
    } else {
      saveGuestCart(newCart);
    }
  };

  const updateCartQty = async (productId, variantId, newQty) => {
    if (newQty <= 0) {
      await removeFromCart(productId, variantId);
      return;
    }

    const newCart = cart.map(item => {
      if (item.product_id === productId && item.variant_id === variantId) {
        return { ...item, quantity: newQty };
      }
      return item;
    });

    if (user && user.role !== 'admin') {
      await saveUserData(newCart, wishlist);
    } else {
      saveGuestCart(newCart);
    }
  };

  const removeFromCart = async (productId, variantId) => {
    const newCart = cart.filter(
      item => !(item.product_id === productId && item.variant_id === variantId)
    );

    if (user && user.role !== 'admin') {
      await saveUserData(newCart, wishlist);
    } else {
      saveGuestCart(newCart);
    }
  };

  const clearCart = async () => {
    if (user && user.role !== 'admin') {
      await saveUserData([], wishlist);
    } else {
      saveGuestCart([]);
    }
  };

  // 4. Wishlist Actions
  const toggleWishlist = async (product) => {
    const exists = wishlist.some(item => item.id === product.id);
    let newWishlist;
    if (exists) {
      newWishlist = wishlist.filter(item => item.id !== product.id);
    } else {
      newWishlist = [...wishlist, product];
    }

    if (user && user.role !== 'admin') {
      await saveUserData(cart, newWishlist);
    } else {
      saveGuestWishlist(newWishlist);
    }
  };

  const cartTotal = cart.reduce((total, item) => {
    const price = (item.discount_price !== null ? item.discount_price : item.base_price) + item.price_modifier;
    return total + price * item.quantity;
  }, 0);

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        user,
        authLoading,
        cartTotal,
        cartCount,
        login: handleLogin,
        adminLogin,
        completeAdminLogin,
        forceUpdateAdminPassword,
        loginWithGoogle: handleGoogleLogin,
        register: handleRegister,
        logout: handleLogout,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        toggleWishlist,
        sanitizeInput,
        generateOtp,
        verifyOtp,
        updateUserPassword,
        mapAuthError,
        API_URL,
        currency,
        changeCurrency,
        formatPrice,
        supportedCurrencies: SELECTABLE_CURRENCIES,
        detectCurrency,
        firestoreCollection,
        firestoreGetDocs,
        firestoreAddDoc,
        firestoreUpdateDoc,
        firestoreDeleteDoc,
        firestoreQuery,
        firestoreWhere,
        firestoreOrderBy,
        getProductsList,
        getProductDetails,
        createProduct,
        updateProduct,
        deleteProduct,
        addProductReview,
        logAdminAction,
        getAuditLogs,
        verifyAdminOtp,
        setDeviceTrustCookie,
        checkDeviceTrustCookie
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
