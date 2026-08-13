import React from 'react';
import './globals.css';
import { CartProvider } from '../context/CartContext';
import Navbar from '../components/Navbar';
import Subnav from '../components/Subnav';
import Footer from '../components/Footer';

export const metadata = {
  title: 'NestSleepora - Premium Beds, Cooling Mattresses & Accessories',
  description: 'Crafting the ultimate sleeping experiences since 2026. Premium beds, cooling mattresses, and organic sleeping accessories designed for your complete rest.',
  metadataBase: new URL('http://localhost:3000'),
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-dreamBackground antialiased">
        <CartProvider>
          <div className="flex flex-col min-h-screen bg-dreamBackground">
            {/* Main Navigation Row */}
            <Navbar />
            
            {/* Category Underlined Subnav Row */}
            <Subnav />

            {/* Page content wrapper with responsive spacing */}
            <main className="flex-grow">
              {children}
            </main>

            {/* Persistent Footer */}
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
