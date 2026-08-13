import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { 
  Plus, Edit2, Trash2, Check, ShieldAlert, Sparkles, FolderOpen, 
  Tag, DollarSign, Image, FileText, Settings, X, PlusCircle, 
  MinusCircle, Users, History, UploadCloud, LogOut, Video, Loader2, ArrowRight
} from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';

export default function Admin() {
  const { 
    user, API_URL, formatPrice, getProductsList, createProduct, 
    updateProduct, deleteProduct, getAuditLogs, logAdminAction,
    authLoading, forceUpdateAdminPassword
  } = useCart();

  // Active Admin Panel Tab
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'users' | 'logs'

  // Product Catalog States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal Form States
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Product Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('beds');
  const [priceUsd, setPriceUsd] = useState('');
  const [priceEur, setPriceEur] = useState('');
  const [priceGbp, setPriceGbp] = useState('');
  const [originalPriceUsd, setOriginalPriceUsd] = useState('');
  const [originalPriceEur, setOriginalPriceEur] = useState('');
  const [originalPriceGbp, setOriginalPriceGbp] = useState('');
  
  // Media Files upload state
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]); // Array of strings (image/video urls)
  const [variants, setVariants] = useState([
    { size: 'Queen', price_modifier: 0, stock_qty: 10 }
  ]);

  // Force Password Reset States
  const [newPassVal, setNewPassVal] = useState('');
  const [confirmPassVal, setConfirmPassVal] = useState('');
  const [forceResetError, setForceResetError] = useState('');
  const [forceResetLoading, setForceResetLoading] = useState(false);

  // Reviews management states
  const [productReviews, setProductReviews] = useState([]);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Admin Management States (Super-Admin only)
  const [adminsList, setAdminsList] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminFormError, setAdminFormError] = useState('');
  const [adminFormLoading, setAdminFormLoading] = useState(false);

  // Audit Logs States (Super-Admin only)
  const [logsList, setLogsList] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  console.log('[DEBUG ADMIN] user:', user, 'authLoading:', authLoading);
  // Check super-admin status
  const isSuperAdmin = user && user.email === 'mateen@itdepartment.com';

  // Fetch products from database
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProductsList();
      setProducts(data);
    } catch (err) {
      setError('Could not retrieve products database. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch standard users/admins (SQLite)
  const fetchAdmins = async () => {
    if (!isSuperAdmin) return;
    setAdminsLoading(true);
    const token = localStorage.getItem('sleepora_admin_token');
    try {
      const res = await fetch(`${API_URL}/auth/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminsList(data);
      }
    } catch (err) {
      console.error('Failed to load admins list:', err);
    } finally {
      setAdminsLoading(false);
    }
  };

  // Fetch Audit logs from Firestore
  const fetchAuditLogs = async () => {
    if (!isSuperAdmin) return;
    setLogsLoading(true);
    try {
      const data = await getAuditLogs();
      setLogsList(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchProducts();
      if (isSuperAdmin) {
        fetchAdmins();
        fetchAuditLogs();
      }
    }
  }, [user, activeTab]);

  // Show loading spinner while loading user authentication state or parsing local session
  const storedAdmin = localStorage.getItem('sleepora_admin_user');
  if (authLoading || (!user && storedAdmin)) {
    return (
      <div className="min-h-screen bg-dreamBackground flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-dreamAccent" />
      </div>
    );
  }

  // Force secondary admin to update password on first login
  if (user && user.role === 'admin' && user.must_change_password === 1) {
    return (
      <div className="min-h-screen bg-dreamBackground flex items-center justify-center px-4 py-12">
        <ScrollReveal>
          <div className="max-w-md w-full bg-white border border-dreamBorder rounded-premiumLarge p-8 shadow-2xl space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-4 bg-dreamAccent/10 text-dreamAccent rounded-full">
                <Settings className="w-10 h-10 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <h2 className="text-2xl font-extrabold text-dreamNavy tracking-tight">Security Check</h2>
              <p className="text-sm text-dreamMuted">
                You must update your temporary password to secure your administrator profile.
              </p>
            </div>

            {forceResetError && (
              <div className="p-3 bg-red-950/10 border border-red-500/20 text-red-700 text-xs rounded-lg text-center font-medium">
                {forceResetError}
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (newPassVal.length < 6) {
                setForceResetError('Password must contain at least 6 characters.');
                return;
              }
              if (newPassVal !== confirmPassVal) {
                setForceResetError('Passwords do not match.');
                return;
              }
              setForceResetLoading(true);
              setForceResetError('');
              try {
                await forceUpdateAdminPassword(newPassVal);
              } catch (err) {
                setForceResetError(err.message || 'Failed to update password.');
              } finally {
                setForceResetLoading(false);
              }
            }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-dreamNavy uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={newPassVal}
                  onChange={(e) => setNewPassVal(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-11 bg-white border border-dreamBorder rounded-premium px-4 text-sm text-dreamNavy focus:border-dreamAccent focus:ring-1 focus:ring-dreamAccent transition-colors placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-dreamNavy uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassVal}
                  onChange={(e) => setConfirmPassVal(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-11 bg-white border border-dreamBorder rounded-premium px-4 text-sm text-dreamNavy focus:border-dreamAccent focus:ring-1 focus:ring-dreamAccent transition-colors placeholder:text-gray-400"
                />
              </div>

              <button
                type="submit"
                disabled={forceResetLoading}
                className="w-full h-11 bg-dreamAccent hover:bg-dreamAccent-dark disabled:bg-dreamAccent/50 text-white font-bold rounded-premium flex items-center justify-center text-xs transition-colors uppercase tracking-wider"
              >
                {forceResetLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </div>
        </ScrollReveal>
      </div>
    );
  }

  // Block anonymous access
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
        <ScrollReveal>
          <div className="bg-white border border-dreamBorder rounded-premiumLarge p-8 shadow-xl flex flex-col items-center space-y-5">
            <div className="p-4 bg-dreamRed/10 text-dreamRed rounded-full">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-extrabold font-poppins text-dreamNavy">Access Denied</h2>
            <p className="text-sm text-dreamMuted leading-relaxed">
              This terminal is locked. You must be authenticated as an Administrator to view this database portal.
            </p>
            <a 
              href="/login" 
              className="px-6 h-11 bg-dreamNavy hover:bg-dreamNavy/90 text-white text-xs font-bold rounded-premium flex items-center justify-center transition-colors"
            >
              Sign In with Admin Account
            </a>
          </div>
        </ScrollReveal>
      </div>
    );
  }

  // Clear Form parameters
  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('beds');
    setPriceUsd('');
    setPriceEur('');
    setPriceGbp('');
    setOriginalPriceUsd('');
    setOriginalPriceEur('');
    setOriginalPriceGbp('');
    setUploadFiles([]);
    setUploadedUrls([]);
    setVariants([{ size: 'Queen', price_modifier: 0, stock_qty: 10 }]);
    setProductReviews([]);
    setNewReviewAuthor('');
    setNewReviewTitle('');
    setNewReviewRating(5);
    setNewReviewComment('');
    setEditingProduct(null);
    setFormError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = async (prod) => {
    resetForm();
    setFormLoading(true);
    setEditingProduct(prod);
    setShowModal(true);
    
    try {
      setName(prod.name);
      setDescription(prod.description);
      setCategory(prod.category);
      setPriceUsd(prod.price_usd ? prod.price_usd.toString() : prod.base_price.toString());
      setPriceEur(prod.price_eur ? prod.price_eur.toString() : '');
      setPriceGbp(prod.price_gbp ? prod.price_gbp.toString() : '');
      setOriginalPriceUsd(prod.original_price_usd ? prod.original_price_usd.toString() : '');
      setOriginalPriceEur(prod.original_price_eur ? prod.original_price_eur.toString() : '');
      setOriginalPriceGbp(prod.original_price_gbp ? prod.original_price_gbp.toString() : '');
      setUploadedUrls(prod.image_urls || []);
      setVariants(prod.variants || [{ size: 'Queen', price_modifier: 0, stock_qty: 10 }]);
      setProductReviews(prod.reviews || []);
    } catch (err) {
      setFormError('Failed to retrieve product details.');
    } finally {
      setFormLoading(false);
    }
  };

  // Upload files to Multer Express Backend
  const performUploads = async () => {
    if (uploadFiles.length === 0) return uploadedUrls;

    const token = localStorage.getItem('sleepora_admin_token');
    const formData = new FormData();
    for (let file of uploadFiles) {
      formData.append('files', file);
    }

    const res = await fetch(`${API_URL}/products/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Media files upload failed');
    }

    const data = await res.json();
    return [...uploadedUrls, ...data.urls];
  };

  // Product Submit Handler (Firestore + logs)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    if (!name.trim() || !description.trim() || !category.trim() || !priceUsd) {
      setFormError('Please fill in all required fields.');
      setFormLoading(false);
      return;
    }

    try {
      // 1. Perform Multer backend uploads if files were chosen
      const finalUrls = await performUploads();
      if (finalUrls.length === 0) {
        throw new Error('Please upload at least one image or video.');
      }

      const payload = {
        name: name.trim(),
        description: description.trim(),
        category: category.toLowerCase(),
        base_price: parseFloat(priceUsd),
        discount_price: originalPriceUsd ? parseFloat(priceUsd) : null,
        image_urls: finalUrls,
        variants: variants,
        price_usd: parseFloat(priceUsd),
        price_eur: priceEur ? parseFloat(priceEur) : null,
        price_gbp: priceGbp ? parseFloat(priceGbp) : null,
        original_price_usd: originalPriceUsd ? parseFloat(originalPriceUsd) : null,
        original_price_eur: originalPriceEur ? parseFloat(originalPriceEur) : null,
        original_price_gbp: originalPriceGbp ? parseFloat(originalPriceGbp) : null
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        await logAdminAction('UPDATE_PRODUCT', `Updated product: ${name} (${editingProduct.id})`);
        setSuccessMsg('Product updated successfully.');
      } else {
        const docId = await createProduct(payload);
        await logAdminAction('CREATE_PRODUCT', `Created new product: ${name} (${docId})`);
        setSuccessMsg('Product pushed to database successfully.');
      }

      setShowModal(false);
      resetForm();
      fetchProducts();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Database write operation failed.');
    } finally {
      setFormLoading(false);
    }
  };

  // Product Delete Handler
  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) return;

    try {
      await deleteProduct(productId);
      await logAdminAction('DELETE_PRODUCT', `Deleted product: ${productName} (${productId})`);
      setSuccessMsg('Product deleted successfully.');
      fetchProducts();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Deletion failed.');
    }
  };

  // Create Standard Admin (Super-Admin only)
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAdminFormError('');
    setAdminFormLoading(true);

    if (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      setAdminFormError('Please fill in all parameters.');
      setAdminFormLoading(false);
      return;
    }

    const token = localStorage.getItem('sleepora_admin_token');
    try {
      const res = await fetch(`${API_URL}/auth/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: adminName.trim(),
          email: adminEmail.trim(),
          password: adminPassword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add administrator.');

      setSuccessMsg('Secondary Administrator added successfully.');
      setShowAddAdminModal(false);
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      fetchAdmins();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setAdminFormError(err.message);
    } finally {
      setAdminFormLoading(false);
    }
  };

  // Delete Admin (Super-Admin only)
  const handleDeleteAdmin = async (adminId, adminEmail, adminName) => {
    if (!window.confirm(`Are you sure you want to delete administrator "${adminName}"?`)) return;

    const token = localStorage.getItem('sleepora_admin_token');
    try {
      const res = await fetch(`${API_URL}/auth/users/${adminId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete administrator.');

      setSuccessMsg(`Administrator ${adminName} deleted successfully.`);
      fetchAdmins();
      fetchAuditLogs();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const addVariantRow = () => {
    setVariants([...variants, { size: 'Queen', price_modifier: 0, stock_qty: 10 }]);
  };

  const removeVariantRow = (idx) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const updateVariantRow = (idx, field, value) => {
    const updated = [...variants];
    if (field === 'size') {
      updated[idx].size = value;
    } else if (field === 'price_modifier') {
      updated[idx].price_modifier = parseFloat(value) || 0;
    } else if (field === 'stock_qty') {
      updated[idx].stock_qty = parseInt(value) || 0;
    }
    setVariants(updated);
  };

  // Add / Delete Custom Reviews in database
  const handleAddCustomReview = async (e) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewTitle.trim() || !newReviewComment.trim()) {
      alert('Please fill in all review details.');
      return;
    }

    setReviewLoading(true);
    try {
      const newReview = {
        user_name: newReviewAuthor.trim(),
        title: newReviewTitle.trim(),
        rating: parseInt(newReviewRating),
        comment: newReviewComment.trim(),
        verified: true,
        created_at: new Date().toISOString()
      };

      const updatedReviews = [newReview, ...productReviews];
      
      await updateProduct(editingProduct.id, { reviews: updatedReviews });
      await logAdminAction('ADD_REVIEW', `Added custom review to product "${name}" by "${newReviewAuthor.trim()}"`);

      setProductReviews(updatedReviews);
      setNewReviewAuthor('');
      setNewReviewTitle('');
      setNewReviewRating(5);
      setNewReviewComment('');
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to add custom review.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteReview = async (idx) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    setReviewLoading(true);
    try {
      const updatedReviews = productReviews.filter((_, i) => i !== idx);
      
      await updateProduct(editingProduct.id, { reviews: updatedReviews });
      await logAdminAction('DELETE_REVIEW', `Deleted review from product "${name}"`);

      setProductReviews(updatedReviews);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to delete review.');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dreamBackground text-dreamNavy flex flex-col lg:flex-row relative">
      
      {/* 1. Light Premium Sidebar */}
      <aside className="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-dreamBorder shrink-0 p-4 lg:p-6 flex flex-col justify-between relative z-20">
        <div className="space-y-6 lg:space-y-8">
          {/* Brand header */}
          <div className="flex items-center justify-between lg:block text-left">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-dreamAccent flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-dreamAccent animate-pulse" />
                NestSleepora Control Room
              </span>
              <h2 className="text-xl font-black font-poppins text-dreamNavy">Backoffice Portal</h2>
              <p className="text-[10px] text-dreamMuted hidden lg:block">{user.email}</p>
            </div>
            {/* Mobile Exit Button */}
            <div className="lg:hidden">
              <a
                href="/"
                className="h-9 px-3 border border-dreamBorder bg-white text-dreamNavy text-[10px] font-bold rounded-premium flex items-center justify-center gap-1.5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5 text-dreamAccent" />
                Exit
              </a>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-row overflow-x-auto whitespace-nowrap lg:flex-col gap-2 pb-2 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('products')}
              className={`h-10 lg:h-11 px-4 rounded-premium text-[11px] lg:text-xs font-bold flex items-center gap-2 lg:gap-3 transition-all shrink-0 ${
                activeTab === 'products' 
                  ? 'bg-dreamAccent text-white shadow-md' 
                  : 'text-dreamNavy hover:text-dreamAccent hover:bg-dreamBackground'
              }`}
            >
              <FolderOpen className="w-4 h-4 shrink-0" />
              Products Catalog
            </button>

            {isSuperAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`h-10 lg:h-11 px-4 rounded-premium text-[11px] lg:text-xs font-bold flex items-center gap-2 lg:gap-3 transition-all shrink-0 ${
                    activeTab === 'users' 
                      ? 'bg-dreamAccent text-white shadow-md' 
                      : 'text-dreamNavy hover:text-dreamAccent hover:bg-dreamBackground'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  Admin Management
                </button>

                <button
                  onClick={() => setActiveTab('logs')}
                  className={`h-10 lg:h-11 px-4 rounded-premium text-[11px] lg:text-xs font-bold flex items-center gap-2 lg:gap-3 transition-all shrink-0 ${
                    activeTab === 'logs' 
                      ? 'bg-dreamAccent text-white shadow-md' 
                      : 'text-dreamNavy hover:text-dreamAccent hover:bg-dreamBackground'
                  }`}
                >
                  <History className="w-4 h-4 shrink-0" />
                  Audit Action Logs
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Exit Storefront Button (Desktop only) */}
        <div className="hidden lg:block pt-6 border-t border-dreamBorder mt-8 lg:mt-0">
          <a
            href="/"
            className="w-full h-11 border border-dreamBorder bg-white hover:bg-dreamBackground text-dreamNavy text-xs font-bold rounded-premium flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4 text-dreamAccent" />
            Exit Storefront
          </a>
        </div>
      </aside>

      {/* 2. Main content viewpane */}
      <main className="flex-1 p-4 lg:p-10 lg:overflow-y-auto lg:max-h-screen relative z-10 scrollbar-none">
        
        {/* Success Alert */}
        {successMsg && (
          <div className="mb-6 p-4 bg-dreamGreen/15 border border-dreamGreen/30 text-dreamGreen text-xs font-bold rounded-premium flex items-center gap-2 animate-fade-in text-left">
            <Check className="w-4 h-4 shrink-0 animate-bounce" />
            {successMsg}
          </div>
        )}

        {/* Tab 1: Products Listing */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dreamBorder pb-6">
              <div className="text-left space-y-1">
                <h1 className="text-2xl lg:text-3xl font-extrabold font-poppins text-dreamNavy">Catalog Inventory</h1>
                <p className="text-xs text-dreamMuted">Secure database portal to upload media and manage sizes.</p>
              </div>
              <button
                onClick={handleOpenAdd}
                className="h-11 px-5 bg-dreamAccent hover:bg-dreamAccent-dark text-white text-xs font-bold rounded-premium flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Add New Product
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white border border-dreamBorder rounded-premiumLarge p-5 h-64 space-y-4">
                    <div className="bg-dreamBackground h-36 rounded-premium"></div>
                    <div className="h-5 bg-dreamBackground w-3/4 rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-6 text-center bg-dreamRed/10 text-dreamRed border border-dreamRed/20 rounded-premiumLarge text-sm font-semibold">
                ⚠️ {error}
              </div>
            ) : products.length === 0 ? (
              <div className="p-16 text-center bg-white border border-dreamBorder rounded-premiumLarge space-y-3">
                <p className="text-base font-bold font-poppins text-dreamNavy">No products in database.</p>
                <p className="text-xs text-dreamMuted">Click "Add New Product" to populate Firestore.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p) => {
                  const isVideo = p.image_urls && p.image_urls[0] && (p.image_urls[0].endsWith('.mp4') || p.image_urls[0].endsWith('.mov') || p.image_urls[0].endsWith('.webm'));
                  return (
                    <ScrollReveal key={p.id}>
                      <div className="bg-white border border-dreamBorder rounded-premiumLarge overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group">
                        
                        {/* Media Preview Box */}
                        <div className="aspect-[4/3] bg-dreamBackground overflow-hidden relative">
                          {isVideo ? (
                            <div className="w-full h-full flex items-center justify-center bg-dreamBackground">
                              <Video className="w-8 h-8 text-dreamAccent animate-pulse" />
                            </div>
                          ) : (
                            <img 
                              src={p.image_urls && p.image_urls[0]} 
                              alt={p.name} 
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                            />
                          )}
                          <span className="absolute top-3 right-3 px-2 py-0.5 bg-white/80 backdrop-blur-sm text-[8px] font-extrabold uppercase rounded border border-dreamBorder tracking-widest text-dreamAccent">
                            {p.category}
                          </span>
                        </div>

                        {/* Text details */}
                        <div className="p-5 flex-grow flex flex-col justify-between text-left space-y-4">
                          <div className="space-y-1">
                            <h3 className="text-base font-bold font-poppins text-dreamNavy line-clamp-1">{p.name}</h3>
                            <p className="text-xs text-dreamMuted line-clamp-2 leading-relaxed">{p.description}</p>
                          </div>

                          <div className="pt-3 border-t border-dreamBorder flex items-center justify-between">
                            <div>
                              {p.original_price_usd && p.original_price_usd > (p.price_usd || p.base_price) ? (
                                <div className="flex flex-col">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-extrabold text-dreamNavy">
                                      {formatPrice(p.price_usd || p.base_price, p)}
                                    </span>
                                    <span className="text-[10px] text-dreamMuted line-through font-medium">
                                      {formatPrice(p.original_price_usd, p, 0, true)}
                                    </span>
                                  </div>
                                  <span className="text-[8px] font-extrabold text-dreamRed uppercase mt-0.5">
                                    Sale: {Math.round(((parseFloat(p.original_price_usd) - parseFloat(p.price_usd || p.base_price)) / parseFloat(p.original_price_usd)) * 100)}% OFF
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm font-extrabold text-dreamNavy">
                                  {formatPrice(p.price_usd || p.base_price, p)}
                                </span>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="p-2 border border-dreamBorder hover:border-dreamNavy rounded-full text-dreamNavy hover:bg-dreamBackground transition-colors"
                                title="Edit Product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-2 border border-dreamBorder hover:border-dreamRed rounded-full text-dreamMuted hover:text-dreamRed hover:bg-dreamRed/5 transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Admin Hierarchy Management */}
        {activeTab === 'users' && isSuperAdmin && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-dreamBorder pb-6">
              <div className="text-left space-y-1">
                <h1 className="text-2xl lg:text-3xl font-extrabold font-poppins text-dreamNavy">Administrator Management</h1>
                <p className="text-xs text-dreamMuted">Super-Admin console to authorize secondary portal administrators.</p>
              </div>
              <button
                onClick={() => setShowAddAdminModal(true)}
                className="h-11 px-5 bg-dreamAccent hover:bg-dreamAccent-dark text-white text-xs font-bold rounded-premium flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Secondary Admin
              </button>
            </div>

            {adminsLoading ? (
              <div className="p-12 text-center animate-pulse flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-dreamAccent" />
              </div>
            ) : adminsList.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dreamBorder rounded-premiumLarge">
                <p className="text-sm text-dreamMuted">No secondary administrators configured.</p>
              </div>
            ) : (
              <div className="bg-white border border-dreamBorder rounded-premiumLarge overflow-hidden">
                <div className="overflow-x-auto scrollbar-none">
                  <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                    <thead>
                      <tr className="bg-dreamBackground border-b border-dreamBorder text-dreamMuted">
                        <th className="p-4 font-bold uppercase tracking-wider">Name</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Email Address</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Portal Role</th>
                        <th className="p-4 font-bold uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminsList.map((admin) => (
                        <tr key={admin.id} className="border-b border-dreamBorder/60 hover:bg-dreamBackground/40 transition-colors">
                          <td className="p-4 font-bold text-dreamNavy">{admin.name}</td>
                          <td className="p-4 text-dreamMuted font-mono">{admin.email}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border bg-dreamAccent/10 border-dreamAccent/25 text-dreamAccent">
                              {admin.role}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteAdmin(admin.id, admin.email, admin.name)}
                              className="p-1.5 border border-dreamBorder hover:border-dreamRed rounded text-dreamMuted hover:text-dreamRed hover:bg-dreamRed/5 transition-all"
                              title="Revoke Admin Access"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Action Audit Logs */}
        {activeTab === 'logs' && isSuperAdmin && (
          <div className="space-y-6">
            <div className="border-b border-dreamBorder pb-6">
              <div className="text-left space-y-1">
                <h1 className="text-2xl lg:text-3xl font-extrabold font-poppins text-dreamNavy">Action Audit Tracker</h1>
                <p className="text-xs text-dreamMuted">Cryptographic immutable log tracking standard administrator activities.</p>
              </div>
            </div>

            {logsLoading ? (
              <div className="p-12 text-center animate-pulse flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-dreamAccent" />
              </div>
            ) : logsList.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dreamBorder rounded-premiumLarge">
                <p className="text-sm text-dreamMuted">No admin activity logs logged in Firestore.</p>
              </div>
            ) : (
              <div className="bg-white border border-dreamBorder rounded-premiumLarge overflow-hidden">
                <div className="overflow-x-auto scrollbar-none">
                  <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                    <thead>
                      <tr className="bg-dreamBackground border-b border-dreamBorder text-dreamMuted">
                        <th className="p-4 font-bold uppercase tracking-wider">Timestamp</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Administrator</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Action Type</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Operation Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logsList.map((log) => (
                        <tr key={log.id} className="border-b border-dreamBorder/60 hover:bg-dreamBackground/40 transition-colors">
                          <td className="p-4 font-mono text-dreamMuted">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="p-4">
                            <div className="font-bold text-dreamNavy">{log.admin_name}</div>
                            <div className="text-[10px] text-dreamMuted font-mono">{log.admin_email}</div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-dreamBackground text-dreamNavy border border-dreamBorder">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-4 text-dreamMuted font-medium">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT PRODUCT                                */}
      {/* ======================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white border border-dreamBorder rounded-premiumLarge shadow-2xl overflow-hidden animate-fade-in relative max-h-[92vh] flex flex-col text-dreamNavy">
            
            {/* Header */}
            <div className="bg-dreamBackground p-5 flex justify-between items-center shrink-0 border-b border-dreamBorder">
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-dreamAccent">Inventory Database Operations</span>
                <h3 className="text-base font-bold font-poppins flex items-center gap-2 text-dreamNavy">
                  <Settings className="w-4 h-4 text-dreamAccent animate-spin-slow" />
                  {editingProduct ? `Edit Product (${editingProduct.id})` : 'Create New Product'}
                </h3>
              </div>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-dreamMuted hover:text-dreamNavy p-1 rounded-full hover:bg-dreamBackground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-left flex-1 scrollbar-none">
              {formError && (
                <div className="p-3.5 bg-dreamRed/15 border border-dreamRed/30 text-dreamRed text-xs font-semibold rounded-premium leading-relaxed">
                  ⚠️ {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-5">
                
                {/* 1. Name & Category */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-dreamNavy tracking-wider flex items-center gap-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Classic Walnut Bed Frame"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-11 px-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-white text-dreamNavy focus:ring-1 focus:ring-dreamAccent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-dreamNavy tracking-wider flex items-center gap-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-11 px-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-white text-dreamNavy cursor-pointer focus:ring-1 focus:ring-dreamAccent"
                    >
                      <option value="beds">Beds</option>
                      <option value="sofa">Sofa</option>
                      <option value="mattresses">Mattresses</option>
                      <option value="accessories">Accessories</option>
                    </select>
                  </div>
                </div>

                {/* 2. Manual Currencies overrides */}
                <div className="space-y-2 pt-2 border-t border-dreamBorder">
                  <h4 className="text-[10px] font-extrabold uppercase text-dreamAccent tracking-wider">Multi-Currency Price Configurations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* USD Prices */}
                    <div className="space-y-3 p-3 bg-dreamBackground rounded-premium border border-dreamBorder">
                      <span className="text-[10px] font-extrabold uppercase text-dreamNavy block border-b border-dreamBorder pb-1">USD ($)</span>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-dreamMuted uppercase font-bold">Previous Price (Original)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 799.00"
                          value={originalPriceUsd}
                          onChange={(e) => setOriginalPriceUsd(e.target.value)}
                          className="w-full h-9 px-3 border border-dreamBorder rounded text-xs outline-none focus:border-dreamAccent bg-white text-dreamNavy"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-dreamMuted uppercase font-bold">Current Price (Sale/Base)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          placeholder="e.g. 599.00"
                          value={priceUsd}
                          onChange={(e) => setPriceUsd(e.target.value)}
                          className="w-full h-9 px-3 border border-dreamBorder rounded text-xs outline-none focus:border-dreamAccent bg-white text-dreamNavy"
                        />
                      </div>
                    </div>

                    {/* EUR Prices */}
                    <div className="space-y-3 p-3 bg-dreamBackground rounded-premium border border-dreamBorder">
                      <span className="text-[10px] font-extrabold uppercase text-dreamNavy block border-b border-dreamBorder pb-1">EUR (€)</span>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-dreamMuted uppercase font-bold">Previous Price Override</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 749.00"
                          value={originalPriceEur}
                          onChange={(e) => setOriginalPriceEur(e.target.value)}
                          className="w-full h-9 px-3 border border-dreamBorder rounded text-xs outline-none focus:border-dreamAccent bg-white text-dreamNavy"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-dreamMuted uppercase font-bold">Current Price Override</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 549.00"
                          value={priceEur}
                          onChange={(e) => setPriceEur(e.target.value)}
                          className="w-full h-9 px-3 border border-dreamBorder rounded text-xs outline-none focus:border-dreamAccent bg-white text-dreamNavy"
                        />
                      </div>
                    </div>

                    {/* GBP Prices */}
                    <div className="space-y-3 p-3 bg-dreamBackground rounded-premium border border-dreamBorder">
                      <span className="text-[10px] font-extrabold uppercase text-dreamNavy block border-b border-dreamBorder pb-1">GBP (£)</span>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-dreamMuted uppercase font-bold">Previous Price Override</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 699.00"
                          value={originalPriceGbp}
                          onChange={(e) => setOriginalPriceGbp(e.target.value)}
                          className="w-full h-9 px-3 border border-dreamBorder rounded text-xs outline-none focus:border-dreamAccent bg-white text-dreamNavy"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-dreamMuted uppercase font-bold">Current Price Override</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 499.00"
                          value={priceGbp}
                          onChange={(e) => setPriceGbp(e.target.value)}
                          className="w-full h-9 px-3 border border-dreamBorder rounded text-xs outline-none focus:border-dreamAccent bg-white text-dreamNavy"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-dreamNavy tracking-wider">
                    Product Description
                  </label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Provide description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-4 border border-dreamBorder rounded-premium text-sm outline-none focus:border-dreamAccent bg-white text-dreamNavy focus:ring-1 focus:ring-dreamAccent"
                  ></textarea>
                </div>

                {/* 4. Dropzone Local Uploads */}
                <div className="space-y-1.5 pt-2 border-t border-dreamBorder">
                  <label className="text-[10px] font-extrabold uppercase text-dreamNavy tracking-wider flex items-center gap-1">
                    <UploadCloud className="w-4 h-4 text-dreamAccent animate-pulse" />
                    Upload Images &amp; Videos (Drag/Select local files)
                  </label>
                  <div className="border border-dashed border-dreamBorder hover:border-dreamAccent p-5 rounded-premium flex flex-col items-center justify-center bg-dreamBackground transition-all cursor-pointer relative">
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*,video/*"
                      onChange={(e) => setUploadFiles(Array.from(e.target.files))}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="w-8 h-8 text-dreamMuted mb-2" />
                    <span className="text-xs text-dreamNavy font-semibold">Select files to upload from local machine</span>
                    <span className="text-[10px] text-dreamMuted mt-1">Images (.jpg, .png, .webp) &amp; Videos (.mp4) supported. Max 50MB</span>
                  </div>

                  {/* Display lists of files pending upload */}
                  {uploadFiles.length > 0 && (
                    <div className="p-3 bg-dreamBackground border border-dreamBorder rounded text-[11px] space-y-1">
                      <div className="font-bold text-dreamAccent uppercase text-[9px]">Files to upload:</div>
                      {uploadFiles.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center text-dreamNavy font-mono">
                          <span>{file.name}</span>
                          <span className="text-dreamMuted">({Math.round(file.size / 1024)} KB)</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Display existing uploaded URLs */}
                  {uploadedUrls.length > 0 && (
                    <div className="p-3 bg-dreamBackground border border-dreamBorder rounded text-[11px] space-y-1">
                      <div className="font-bold text-dreamAccent uppercase text-[9px]">Currently Uploaded Media URLs:</div>
                      {uploadedUrls.map((url, idx) => (
                        <div key={idx} className="flex justify-between items-center text-dreamNavy font-mono text-[10px] border-b border-dreamBorder pb-1">
                          <span className="truncate max-w-sm">{url}</span>
                          <button 
                            type="button" 
                            onClick={() => setUploadedUrls(uploadedUrls.filter((_, i) => i !== idx))}
                            className="text-dreamRed hover:underline font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Variant Sizes */}
                <div className="space-y-3 pt-3 border-t border-dreamBorder">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-extrabold uppercase text-dreamNavy tracking-wider">Variants Configurations</h4>
                    <button
                      type="button"
                      onClick={addVariantRow}
                      className="text-[10px] text-dreamAccent hover:underline font-bold flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Add Variant Size
                    </button>
                  </div>

                  <div className="space-y-2">
                    {variants.map((v, index) => (
                      <div key={index} className="grid grid-cols-12 gap-3 items-center bg-dreamBackground p-2.5 rounded border border-dreamBorder">
                        <div className="col-span-4">
                          <input
                            type="text"
                            required
                            placeholder="Queen / King"
                            value={v.size}
                            onChange={(e) => updateVariantRow(index, 'size', e.target.value)}
                            className="w-full h-9 px-2.5 border border-dreamBorder rounded text-xs outline-none focus:border-dreamAccent bg-white text-dreamNavy font-semibold focus:ring-1 focus:ring-dreamAccent"
                          />
                        </div>
                        <div className="col-span-4 flex items-center gap-1">
                          <span className="text-[10px] text-dreamMuted font-bold">+$</span>
                          <input
                            type="number"
                            required
                            min="0"
                            placeholder="Modifier"
                            value={v.price_modifier}
                            onChange={(e) => updateVariantRow(index, 'price_modifier', e.target.value)}
                            className="w-full h-9 px-2 border border-dreamBorder rounded text-xs outline-none focus:border-dreamAccent bg-white text-dreamNavy focus:ring-1 focus:ring-dreamAccent"
                          />
                        </div>
                        <div className="col-span-3 flex items-center gap-1">
                          <span className="text-[10px] text-dreamMuted font-bold">Qty:</span>
                          <input
                            type="number"
                            required
                            min="0"
                            placeholder="Stock"
                            value={v.stock_qty}
                            onChange={(e) => updateVariantRow(index, 'stock_qty', e.target.value)}
                            className="w-full h-9 px-2 border border-dreamBorder rounded text-xs outline-none focus:border-dreamAccent bg-white text-dreamNavy focus:ring-1 focus:ring-dreamAccent"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            disabled={variants.length <= 1}
                            onClick={() => removeVariantRow(index)}
                            className="text-dreamMuted hover:text-dreamRed disabled:opacity-30 transition-colors"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. Product Reviews Manager (Only when editing an existing product) */}
                {editingProduct && (
                  <div className="space-y-4 pt-4 border-t border-dreamBorder">
                    <h4 className="text-[10px] font-extrabold uppercase text-dreamAccent tracking-wider flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-dreamAccent" />
                      Product Reviews Manager
                    </h4>

                    {/* Review List */}
                    <div className="max-h-40 overflow-y-auto space-y-2 border border-dreamBorder p-3 rounded bg-dreamBackground scrollbar-none">
                      {productReviews.length === 0 ? (
                        <p className="text-[10px] text-dreamMuted text-center py-2">No reviews registered for this product.</p>
                      ) : (
                        productReviews.map((rev, idx) => (
                          <div key={idx} className="flex justify-between items-start bg-white p-2.5 rounded border border-dreamBorder/40 text-left">
                            <div className="space-y-1 max-w-[80%]">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-dreamNavy">{rev.user_name}</span>
                                <span className="text-[9px] text-dreamMuted font-medium">{new Date(rev.created_at || Date.now()).toLocaleDateString()}</span>
                                <span className="text-dreamAccent font-bold text-[9px]">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                              </div>
                              <div className="text-[10px] text-dreamNavy font-bold">{rev.title}</div>
                              <p className="text-[10px] text-dreamMuted leading-relaxed font-medium">{rev.comment}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(idx)}
                              className="text-[9px] text-dreamRed hover:underline font-extrabold"
                            >
                              Delete
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Custom Review Form */}
                    <div className="bg-dreamBackground p-4 rounded border border-dreamBorder space-y-3">
                      <div className="text-[10px] font-bold uppercase text-dreamNavy">Add Custom/Seed Review</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] text-dreamMuted uppercase">Author Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. John Doe"
                            value={newReviewAuthor}
                            onChange={(e) => setNewReviewAuthor(e.target.value)}
                            className="w-full h-8 px-2 border border-dreamBorder rounded text-xs outline-none focus:border-dreamAccent bg-white text-dreamNavy focus:ring-1 focus:ring-dreamAccent"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[9px] text-dreamMuted uppercase">Review Title</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Extremely Comfortable Wood Frame!"
                            value={newReviewTitle}
                            onChange={(e) => setNewReviewTitle(e.target.value)}
                            className="w-full h-8 px-2 border border-dreamBorder rounded text-xs outline-none focus:border-dreamAccent bg-white text-dreamNavy focus:ring-1 focus:ring-dreamAccent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] text-dreamMuted uppercase">Rating Star (1-5)</label>
                          <select
                            value={newReviewRating}
                            onChange={(e) => setNewReviewRating(e.target.value)}
                            className="w-full h-8 px-2 border border-dreamBorder rounded text-xs outline-none focus:border-dreamAccent bg-white text-dreamNavy cursor-pointer focus:ring-1 focus:ring-dreamAccent"
                          >
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                          </select>
                        </div>
                        <div className="space-y-1 md:col-span-2 flex flex-col justify-end">
                          <button
                            type="button"
                            disabled={reviewLoading}
                            onClick={handleAddCustomReview}
                            className="h-8 bg-dreamAccent hover:bg-dreamAccent-dark disabled:bg-dreamAccent/50 text-[10px] font-bold text-white rounded transition-colors"
                          >
                            {reviewLoading ? 'Saving Review...' : 'Insert Custom Review'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-dreamMuted uppercase">Review Comments</label>
                        <textarea 
                          rows="2"
                          placeholder="Provide details about their orthopaedic sleep review..."
                          value={newReviewComment}
                          onChange={(e) => setNewReviewComment(e.target.value)}
                          className="w-full p-2 border border-dreamBorder rounded text-xs outline-none focus:border-dreamAccent bg-white text-dreamNavy focus:ring-1 focus:ring-dreamAccent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit buttons */}
                <div className="pt-4 border-t border-dreamBorder flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="h-11 px-5 border border-dreamBorder hover:bg-dreamBackground rounded-premium text-xs font-bold text-dreamNavy transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="h-11 px-6 bg-dreamAccent hover:bg-dreamAccent-dark text-white text-xs font-bold rounded-premium flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    {formLoading ? 'Saving inventory...' : editingProduct ? 'Save Changes' : 'Push to Firestore'}
                    {!formLoading && <Check className="w-4 h-4 text-white" />}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD ADMIN (SUPER-ADMIN ONLY)                      */}
      {/* ======================================================== */}
      {showAddAdminModal && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-dreamBorder rounded-premiumLarge shadow-2xl overflow-hidden animate-fade-in relative flex flex-col text-dreamNavy">
            
            <div className="bg-dreamBackground p-5 flex justify-between items-center border-b border-dreamBorder">
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-dreamAccent">Super-Admin Panel</span>
                <h3 className="text-base font-bold font-poppins flex items-center gap-2 text-dreamNavy">
                  <Users className="w-4 h-4 text-dreamAccent animate-pulse" />
                  Add Secondary Administrator
                </h3>
              </div>
              <button 
                onClick={() => setShowAddAdminModal(false)}
                className="text-dreamMuted hover:text-dreamNavy p-1 rounded-full hover:bg-dreamBackground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-left">
              {adminFormError && (
                <div className="mb-4 p-3 bg-dreamRed/15 border border-dreamRed/30 text-dreamRed text-xs font-semibold rounded-premium leading-relaxed">
                  ⚠️ {adminFormError}
                </div>
              )}

              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-dreamNavy uppercase">FullName</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ali Ahmed"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full h-10 px-4 border border-dreamBorder rounded-premium text-xs outline-none focus:border-dreamAccent bg-white text-dreamNavy font-medium focus:ring-1 focus:ring-dreamAccent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-dreamNavy uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ali@nestsleepora.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full h-10 px-4 border border-dreamBorder rounded-premium text-xs outline-none focus:border-dreamAccent bg-white text-dreamNavy font-medium focus:ring-1 focus:ring-dreamAccent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-dreamNavy uppercase">Temporary Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full h-10 px-4 border border-dreamBorder rounded-premium text-xs outline-none focus:border-dreamAccent bg-white text-dreamNavy font-medium focus:ring-1 focus:ring-dreamAccent"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddAdminModal(false)}
                    className="h-10 px-4 border border-dreamBorder hover:bg-dreamBackground rounded-premium text-xs font-bold text-dreamNavy transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adminFormLoading}
                    className="h-10 px-5 bg-dreamAccent hover:bg-dreamAccent-dark text-white text-xs font-bold rounded-premium flex items-center justify-center gap-1 shadow-md transition-colors"
                  >
                    {adminFormLoading ? 'Adding...' : 'Add Administrator'}
                    {!adminFormLoading && <ArrowRight className="w-3.5 h-3.5 text-white" />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
