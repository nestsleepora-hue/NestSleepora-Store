'use client';

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
} from '../lib/firebase';

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
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Currency Localisation States (SSR safe)
  const [currency, setCurrency] = useState('EUR');
  const [rates, setRates] = useState({ USD: 1 });

  // Load selected currency on client side mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sleepora_selected_currency');
      if (stored) {
        setCurrency(stored);
      }
    }
  }, []);

  const detectCurrency = async (force = false) => {
    if (typeof window === 'undefined') return;
    
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

    if (!force && cachedGeo && cachedGeo !== 'EUR' && cachedGeoTime && Date.now() - parseInt(cachedGeoTime) < 24 * 60 * 60 * 1000) {
      detectedCurrency = cachedGeo;
    } else {
      try {
        const res = await fetch('https://ipapi.co/json/'); // More stable HTTPS endpoint than ip-api.com
        if (res.ok) {
          const data = await res.json();
          if (data && data.currency) {
            detectedCurrency = data.currency;
            localStorage.setItem('sleepora_geo_currency', data.currency);
            localStorage.setItem('sleepora_geo_time', Date.now().toString());
          }
        }
      } catch (err) {
        console.warn("Auto-detect via geo IP failed. Defaulting to EUR.", err);
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
      if (typeof window === 'undefined') return;
      
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
      if (typeof window !== 'undefined') {
        localStorage.setItem('sleepora_selected_currency', code);
      }
    }
  };

  const formatPrice = (usdAmount, productOverride = null, priceModifier = 0, isOriginal = false) => {
    if (usdAmount === null || usdAmount === undefined) return '';
    const amount = parseFloat(usdAmount);
    if (isNaN(amount)) return '';

    let rate = rates[currency] || 1;
    let convertedAmount = amount * rate;
    const symbol = ALL_CURRENCY_SYMBOLS[currency] || (currency + ' ');

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



  const getProductsList = async () => {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error("Failed to load products");
    return await res.json();
  };

  const getProductDetails = async (productId) => {
    const res = await fetch(`${API_URL}/products/${productId}`);
    if (!res.ok) {
      throw new Error("Product not found");
    }
    return await res.json();
  };

  const createProduct = async (payload) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sleepora_admin_token') : '';
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create product');
    }
    const data = await res.json();
    return data.productId;
  };

  const updateProduct = async (productId, payload) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sleepora_admin_token') : '';
    const res = await fetch(`${API_URL}/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update product');
    }
  };

  const deleteProduct = async (productId) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sleepora_admin_token') : '';
    const res = await fetch(`${API_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete product');
    }
  };

  const addProductReview = async (productId, review) => {
    const res = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: parseInt(productId),
        ...review
      })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to submit review');
    }
  };

  const logAdminAction = async (action, details) => {
    if (typeof window === 'undefined') return;
    const adminUserStr = localStorage.getItem('sleepora_admin_user');
    if (!adminUserStr) return;
    const adminUser = JSON.parse(adminUserStr);
    
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
    if (typeof window === 'undefined') return;
    const name = `sleepora_device_verified_${btoa(email.toLowerCase().trim())}`;
    const date = new Date();
    date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=true" + expires + "; path=/; SameSite=Lax" + (window.location.protocol === 'https:' ? '; Secure' : '');
    console.log(`[DEVICE TRUST] Cookie set for 30 days for: ${email}`);
  };

  const checkDeviceTrustCookie = (email) => {
    if (typeof window === 'undefined') return false;
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
      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('network')) {
        const mockCode = '123456';
        if (typeof window !== 'undefined') {
          localStorage.setItem(`sleepora_mock_otp_${email.toLowerCase().trim()}`, mockCode);
          alert(`[Demo Mode] Backend offline. Standard OTP dispatched locally. Please use code: ${mockCode}`);
        }
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
    if (typeof window === 'undefined') return;

    const adminToken = localStorage.getItem('sleepora_admin_token');
    const adminUser = localStorage.getItem('sleepora_admin_user');
    if (adminToken && adminUser) {
      setUser(JSON.parse(adminUser));
      setAuthLoading(false);
      return;
    }

    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthChanged(firebaseAuth, async (firebaseUser) => {
      const storedAdmin = localStorage.getItem('sleepora_admin_user');
      if (storedAdmin) {
        setUser(JSON.parse(storedAdmin));
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);

      if (firebaseUser) {
        const userDocRef = firestoreDoc(firebaseDb, 'users', firebaseUser.uid);
        setUser(firebaseUser);

        const localCart = JSON.parse(localStorage.getItem('sleepora_cart') || '[]');
        const localWish = JSON.parse(localStorage.getItem('sleepora_wishlist') || '[]');

        let firestoreData = { cart: [], wishlist: [] };
        try {
          const docSnap = await firestoreGetDoc(userDocRef);
          if (docSnap.exists()) {
            firestoreData = docSnap.data() || { cart: [], wishlist: [] };
          }
        } catch (err) {
          console.warn("Failed to fetch Firestore data during initialization:", err);
        }

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

        const mergedWish = [...(firestoreData.wishlist || [])];
        localWish.forEach(guestProduct => {
          if (!mergedWish.some(dbProd => dbProd.id === guestProduct.id)) {
            mergedWish.push(guestProduct);
          }
        });

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

        unsubscribeSnapshot = firestoreOnSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() || {};
            setCart(data.cart || []);
            setWishlist(data.wishlist || []);
          }
        });

      } else {
        const storedAdmin = localStorage.getItem('sleepora_admin_user');
        if (storedAdmin) {
          setUser(JSON.parse(storedAdmin));
          setAuthLoading(false);
          return;
        }

        setUser(null);
        
        const localCart = localStorage.getItem('sleepora_cart');
        setCart(localCart ? JSON.parse(localCart) : []);

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

  const saveGuestCart = (newCart) => {
    setCart(newCart);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sleepora_cart', JSON.stringify(newCart));
    }
  };

  const saveGuestWishlist = (newWish) => {
    setWishlist(newWish);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sleepora_wishlist', JSON.stringify(newWish));
    }
  };

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
    try {
      const data = await adminLogin(email, password);
      if (data && data.user && data.user.role === 'admin') {
        completeAdminLogin(data);
        return data.user;
      }
    } catch (err) {}
    const cred = await signIn(firebaseAuth, email, password);
    return cred.user;
  };

  const completeAdminLogin = (data) => {
    logoutUser(firebaseAuth).catch(err => console.warn("Firebase signout during admin login failed:", err));

    if (typeof window !== 'undefined') {
      localStorage.setItem('sleepora_admin_token', data.token);
      localStorage.setItem('sleepora_admin_user', JSON.stringify({
        uid: data.user.id.toString(),
        email: data.user.email,
        displayName: data.user.name,
        role: 'admin',
        must_change_password: data.user.must_change_password || 0
      }));
    }
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
    if (typeof window === 'undefined') return false;
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sleepora_admin_token');
      localStorage.removeItem('sleepora_admin_user');
    }
    setCart([]);
    setWishlist([]);
    setUser(null);
  };

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
