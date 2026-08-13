import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-dreamNavy text-[#F1EEE8] pt-16 pb-8 border-t border-dreamBorder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* About */}
        <div className="space-y-4">
          <h3 className="text-xl font-extrabold tracking-tight font-poppins text-white flex items-center gap-2">
            <img src="/logo.png" alt="NestSleepora Logo" className="h-6 w-auto shrink-0 object-contain" />
            NestSleep<span className="text-dreamAccent">ora</span>
          </h3>
          <p className="text-sm text-dreamMuted leading-relaxed">
            Crafting the ultimate sleeping experiences since 2026. Premium beds, cooling mattresses, and organic sleeping accessories designed for your complete rest.
          </p>
          <div className="flex gap-4 pt-2">
            <a 
              href="https://www.facebook.com/@nestsleepora" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-full bg-dreamSurface/10 hover:bg-dreamAccent hover:text-white transition-colors"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a 
              href="https://www.instagram.com/@nestsleeora" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-full bg-dreamSurface/10 hover:bg-dreamAccent hover:text-white transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a 
              href="https://www.tiktok.com/@nestsleepora?is_from_webapp=1&sender_device=pc" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-full bg-dreamSurface/10 hover:bg-dreamAccent hover:text-white transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.73 4.05.73.65 1.63 1.05 2.58 1.25.04 1.34.02 2.68.03 4.02-.91-.07-1.81-.36-2.61-.83-.87-.52-1.58-1.29-2.06-2.18-.04 2.22-.02 4.44-.03 6.66-.08 1.9-.62 3.82-1.78 5.3-1.46 1.83-3.83 2.87-6.14 2.72-2.38-.07-4.66-1.39-5.74-3.52-1.29-2.48-.96-5.75 1.02-7.85 1.59-1.76 4.19-2.39 6.38-1.55.01 1.43-.02 2.86-.01 4.29-.98-.44-2.16-.27-2.98.44-.92.74-1.22 2.05-.73 3.12.39.95 1.41 1.57 2.44 1.54 1.15.01 2.22-.72 2.59-1.81.18-.55.22-1.14.21-1.72-.01-4.04-.01-8.08-.01-12.12z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Shop Quicklinks */}
        <div className="space-y-4">
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-white">Shop Categories</h4>
          <ul className="space-y-2 text-sm text-dreamMuted">
            <li><Link href="/shop?category=beds" className="hover:text-dreamAccent transition-colors">Premium Beds</Link></li>
            <li><Link href="/shop?category=sofa" className="hover:text-dreamAccent transition-colors">Luxury Sofas</Link></li>
            <li><Link href="/shop?category=mattresses" className="hover:text-dreamAccent transition-colors">Cloud Mattresses</Link></li>
            <li><Link href="/shop?category=accessories" className="hover:text-dreamAccent transition-colors">Sleep Accessories</Link></li>
            <li><Link href="/shop" className="hover:text-dreamAccent transition-colors">All Products</Link></li>
          </ul>
        </div>

        {/* Company Quicklinks */}
        <div className="space-y-4">
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-white">Support & Info</h4>
          <ul className="space-y-2 text-sm text-dreamMuted">
            <li><Link href="/about" className="hover:text-dreamAccent transition-colors">Our Story & Craft</Link></li>
            <li><a href="#" className="hover:text-dreamAccent transition-colors">Bespoke Craftsmanship</a></li>
            <li><a href="#" className="hover:text-dreamAccent transition-colors">Zero-Noise Guarantee</a></li>
            <li><a href="#" className="hover:text-dreamAccent transition-colors">Shipping & Returns</a></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-white">Get in Touch</h4>
          <ul className="space-y-3 text-sm text-dreamMuted">
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-dreamAccent shrink-0" />
              <span>support@nestsleepora.store</span>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-white/10 text-center text-xs text-dreamMuted">
        <p>&copy; {new Date().getFullYear()} NestSleepora Sleep Products Inc. All rights reserved. Created for premium comfort.</p>
      </div>
    </footer>
  );
}
