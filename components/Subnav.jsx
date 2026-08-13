'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Subnav() {
  const pathname = usePathname();
  if (pathname && pathname.startsWith('/admin')) {
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
          {links.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`pb-2.5 text-xs sm:text-sm font-bold tracking-wide uppercase transition-all border-b-2 font-sans ${
                  isActive
                    ? 'text-dreamAccent border-dreamAccent'
                    : 'text-dreamNavy border-transparent hover:text-dreamAccent hover:border-dreamAccent/40'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
