import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export default function Subnav() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Beds', path: '/shop/beds' },
    { name: 'Sofas', path: '/shop/sofa' },
    { name: 'Mattresses', path: '/shop/mattresses' },
    { name: 'Accessories', path: '/shop/accessories' },
    { name: 'About Us', path: '/about' }
  ];

  return (
    <nav className="sticky top-20 z-30 bg-dreamSurface border-b border-dreamBorder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap pt-3 scrollbar-none">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              // Match exact for home page, and match start for shop categories
              end={link.path === '/' || link.path === '/about'}
              className={({ isActive }) =>
                `pb-2.5 text-xs sm:text-sm font-bold tracking-wide uppercase transition-all border-b-2 font-sans ${
                  isActive
                    ? 'text-dreamAccent border-dreamAccent'
                    : 'text-dreamNavy border-transparent hover:text-dreamAccent hover:border-dreamAccent/40'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
