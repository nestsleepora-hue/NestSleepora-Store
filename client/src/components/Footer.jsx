import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-dreamNavy text-[#F1EEE8] pt-16 pb-8 border-t border-dreamBorder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* About */}
        <div className="space-y-4">
          <h3 className="text-xl font-extrabold tracking-tight font-poppins text-white">
            NestSleep<span className="text-dreamAccent">ora</span>
          </h3>
          <p className="text-sm text-dreamMuted leading-relaxed">
            Crafting the ultimate sleeping experiences since 2026. Premium beds, cooling mattresses, and organic sleeping accessories designed for your complete rest.
          </p>
          <div className="flex gap-4 pt-2">
            <a href="#" className="p-2 rounded-full bg-dreamSurface/10 hover:bg-dreamAccent hover:text-white transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 rounded-full bg-dreamSurface/10 hover:bg-dreamAccent hover:text-white transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 rounded-full bg-dreamSurface/10 hover:bg-dreamAccent hover:text-white transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Shop Quicklinks */}
        <div className="space-y-4">
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-white">Shop Categories</h4>
          <ul className="space-y-2 text-sm text-dreamMuted">
            <li><Link to="/shop/beds" className="hover:text-dreamAccent transition-colors">Premium Beds</Link></li>
            <li><Link to="/shop/sofa" className="hover:text-dreamAccent transition-colors">Luxury Sofas</Link></li>
            <li><Link to="/shop/mattresses" className="hover:text-dreamAccent transition-colors">Cloud Mattresses</Link></li>
            <li><Link to="/shop/accessories" className="hover:text-dreamAccent transition-colors">Sleep Accessories</Link></li>
            <li><Link to="/shop" className="hover:text-dreamAccent transition-colors">All Products</Link></li>
          </ul>
        </div>

        {/* Company Quicklinks */}
        <div className="space-y-4">
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-white">Support & Info</h4>
          <ul className="space-y-2 text-sm text-dreamMuted">
            <li><Link to="/about" className="hover:text-dreamAccent transition-colors">Our Story & Craft</Link></li>
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
