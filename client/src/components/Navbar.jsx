import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, LogOut, Globe, MapPin, Settings } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { cartCount, wishlist, user, logout, currency, changeCurrency, supportedCurrencies, detectCurrency } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  // Search states
  const [searchCategory, setSearchCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // User dropdown menu state
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    let url = '/shop';
    const params = [];
    if (searchCategory) params.push(`category=${searchCategory}`);
    if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    navigate(url);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-dreamSurface border-b border-dreamBorder">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-1.5 sm:gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 shrink-0">
            <span className="text-lg sm:text-2xl font-extrabold tracking-tight font-poppins text-dreamNavy">
              NestSleep<span className="text-dreamAccent">ora</span>
            </span>
          </Link>

          {/* Search Bar - Pill style */}
          {!isAdminPage && (
            <form 
              onSubmit={handleSearchSubmit} 
              className="hidden md:flex items-center flex-1 max-w-xl h-11 border border-dreamBorder rounded-full overflow-hidden hover:border-dreamMuted transition-colors bg-[#FFFDFB]"
            >
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="h-full px-4 text-sm font-medium text-dreamNavy bg-transparent outline-none border-r border-dreamBorder cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="beds">Beds</option>
                <option value="sofa">Sofa</option>
                <option value="mattresses">Mattresses</option>
                <option value="accessories">Accessories</option>
              </select>
              <input
                type="text"
                placeholder="Search beds, sofas, mattresses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow px-4 text-sm bg-transparent outline-none text-dreamNavy placeholder-dreamMuted"
              />
              <button 
                type="submit" 
                className="h-full px-5 text-dreamMuted hover:text-dreamAccent flex items-center justify-center border-l border-dreamBorder bg-[#FFFDFB]"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Icons Grid */}
          <div className="flex items-center gap-1 sm:gap-4 shrink-0">
            
            {/* Search Icon Trigger for Mobile */}
            {!isAdminPage && (
              <button 
                onClick={() => navigate('/shop')} 
                className="p-1.5 sm:p-2.5 text-dreamNavy hover:text-dreamAccent md:hidden rounded-full hover:bg-dreamBlush"
              >
                <Search className="w-4.5 sm:w-5 h-4.5 sm:h-5" />
              </button>
            )}

            {/* Account Icon / Dropdown */}
            <div className="relative">
              {user ? (
                <>
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-1.5 p-1.5 sm:p-2.5 rounded-full hover:bg-dreamBlush text-dreamNavy hover:text-dreamAccent transition-all border border-transparent"
                  >
                    <User className="w-4.5 sm:w-5 h-4.5 sm:h-5" />
                    <span className="hidden lg:inline text-xs font-semibold max-w-[80px] truncate">
                      {user.displayName || user.email.split('@')[0]}
                    </span>
                  </button>

                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-dreamBorder rounded-premium shadow-lg py-2 z-50 animate-scale-up">
                      <div className="px-4 py-2 border-b border-dreamBorder text-xs text-dreamMuted">
                        Signed in as <strong className="text-dreamNavy block truncate">{user.email}</strong>
                      </div>
                      {user.role === 'admin' && (
                        <>
                          <Link
                            to="/admin"
                            onClick={() => setShowUserDropdown(false)}
                            className="w-full text-left px-4 py-2 text-sm text-dreamAccent hover:bg-dreamBlush flex items-center gap-2 font-bold"
                          >
                            <Settings className="w-4 h-4 text-dreamAccent" />
                            Admin Panel
                          </Link>
                          <Link
                            to="/"
                            onClick={() => setShowUserDropdown(false)}
                            className="w-full text-left px-4 py-2 text-sm text-dreamNavy hover:bg-dreamBlush flex items-center gap-2 font-bold"
                          >
                            <ShoppingBag className="w-4 h-4 text-dreamNavy" />
                            Store
                          </Link>
                        </>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setShowUserDropdown(false)}
                        className="w-full text-left px-4 py-2 text-sm text-dreamNavy hover:bg-dreamBlush flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-dreamRed hover:bg-dreamBlush flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="p-1.5 sm:p-2.5 rounded-full hover:bg-dreamBlush text-dreamNavy hover:text-dreamAccent flex items-center gap-1"
                >
                  <User className="w-4.5 sm:w-5 h-4.5 sm:h-5" />
                  <span className="hidden sm:inline text-xs font-bold text-dreamNavy">Sign In</span>
                </Link>
              )}
            </div>

            {/* Currency Selector Dropdown */}
            {!isAdminPage && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowCurrencyDropdown(!showCurrencyDropdown);
                    setShowUserDropdown(false);
                  }}
                  className="flex items-center gap-1 p-1 sm:p-2 rounded-full hover:bg-dreamBlush text-dreamNavy hover:text-dreamAccent transition-all border border-dreamBorder/40 bg-white/40 backdrop-blur-sm shadow-sm"
                >
                  <Globe className="w-4 sm:w-4.5 h-4 sm:h-4.5 text-dreamMuted" />
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider">{currency}</span>
                </button>

                {showCurrencyDropdown && (
                   <div className="absolute right-0 mt-2 w-40 bg-white/95 backdrop-blur-md border border-dreamBorder rounded-premium shadow-lg py-1.5 z-50 animate-scale-up grid grid-cols-1 max-h-60 overflow-y-auto scrollbar-none">
                     {supportedCurrencies.map((code) => (
                       <button
                         key={code}
                         onClick={() => {
                           changeCurrency(code);
                           setShowCurrencyDropdown(false);
                         }}
                         className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-dreamBlush transition-colors flex items-center justify-between ${
                           currency === code ? 'text-dreamAccent bg-dreamBlush/30' : 'text-dreamNavy'
                         }`}
                       >
                         <span>{code}</span>
                         {currency === code && <span className="w-1.5 h-1.5 bg-dreamAccent rounded-full"></span>}
                       </button>
                     ))}
                     
                     <div className="h-[1px] bg-dreamBorder my-1"></div>
                     
                     <button
                       onClick={() => {
                         detectCurrency(true);
                         setShowCurrencyDropdown(false);
                       }}
                       className={`w-full text-left px-3 py-1.5 text-[10px] font-bold hover:bg-dreamBlush transition-colors flex items-center gap-1.5 ${
                         !supportedCurrencies.includes(currency) ? 'text-dreamAccent bg-dreamBlush/30' : 'text-dreamNavy'
                       }`}
                     >
                       <MapPin className="w-3.5 h-3.5 shrink-0 text-dreamAccent" />
                       <span>Regional Currency</span>
                     </button>
                   </div>
                 )}
              </div>
            )}

            {/* Wishlist Icon */}
            {!isAdminPage && (
              <Link 
                to="/wishlist" 
                className="p-1.5 sm:p-2.5 rounded-full hover:bg-dreamBlush text-dreamNavy hover:text-dreamAccent relative"
              >
                <Heart className="w-4.5 sm:w-5 h-4.5 sm:h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-dreamAccent text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>
            )}

            {/* Cart Icon */}
            {!isAdminPage && (
              <Link 
                to="/cart" 
                className="p-1.5 sm:p-2.5 rounded-full hover:bg-dreamBlush text-dreamNavy hover:text-dreamAccent relative"
              >
                <ShoppingBag className="w-4.5 sm:w-5 h-4.5 sm:h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-0.5 bg-dreamGreen text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
