import React from 'react';
import { Award, Leaf, Shield, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';
import useSEO from '../hooks/useSEO';

export default function About() {
  useSEO({
    title: "About Our Craft & Orthopedic Science | NestSleepora",
    description: "Learn about NestSleepora's dedication to sleep health. Discover our premium solid timber bed frames, Oeko-Tex cooling mattresses, and zero-noise alignment technology.",
    schema: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "mainEntity": {
        "@type": "Organization",
        "name": "NestSleepora",
        "url": window.location.origin,
        "description": "NestSleepora designs premium orthopedic bed frames and cooling mattresses for ultimate night-time posture recovery."
      }
    }
  });

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="bg-dreamBlush py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 max-w-3xl">
          <span className="text-xs font-extrabold uppercase tracking-widest text-dreamAccent">Our Story &amp; Craft</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-poppins text-dreamNavy">
            Redefining sleep, one detail at a time.
          </h1>
          <p className="text-sm sm:text-base text-dreamNavy/70 leading-relaxed font-medium">
            Founded in 2026, NestSleepora was born from a simple realization: the modern world has forgotten the art of resting. We build orthopedic support products from organic, certified materials designed to last a lifetime.
          </p>
        </div>
      </section>

      {/* Brand values / pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-poppins text-dreamNavy">Our Core Values</h2>
          <p className="text-sm text-dreamMuted">We pledge to deliver transparency, comfort, and sustainability in every product.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              icon: <Leaf className="w-6 h-6 text-dreamGreen" />,
              title: 'Eco-Conscious Materials',
              desc: 'Organic sateen cotton, Oeko-Tex latex, and American Oak. No synthetic adhesives, zero harmful chemical off-gassing.'
            },
            {
              icon: <Award className="w-6 h-6 text-dreamAccent" />,
              title: 'Master Craftsmanship',
              desc: 'Our frames are precision-engineered using classic mortise and tenon wood joinery for squeak-free structural solidity.'
            },
            {
              icon: <Shield className="w-6 h-6 text-dreamNavy" />,
              title: 'Zero-Noise Guarantee',
              desc: 'Our bed frames utilize premium interlocking joinery that completely eliminates friction, ensuring a silent and squeak-free sleep.'
            },
            {
              icon: <HeartHandshake className="w-6 h-6 text-dreamGold" />,
              title: 'Customer First Support',
              desc: 'No robots, no scripts. Our sleep specialists are available 24/7 to help configure your perfect bedroom sanctuary.'
            }
          ].map((v, i) => (
            <div key={i} className="bg-white border border-dreamBorder rounded-premiumLarge p-6 shadow-sm space-y-4 hover:-translate-y-1 transition-transform">
              <div className="p-3 bg-dreamBackground rounded-premium inline-block">
                {v.icon}
              </div>
              <h3 className="text-base font-bold font-poppins text-dreamNavy">{v.title}</h3>
              <p className="text-xs text-dreamMuted leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story detail block with split layout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-left">
          <span className="text-xs font-extrabold uppercase tracking-widest text-dreamAccent">Material Transparency</span>
          <h2 className="text-3xl font-extrabold font-poppins text-dreamNavy leading-tight">
            Designed for structural support and absolute breathability.
          </h2>
          <p className="text-sm text-dreamNavy/70 leading-relaxed">
            Most mattresses are made of synthetic foam adhesives that trap heat and release VOCs. NestSleepora products are designed using open-cell, natural rubber latex and eucalyptus fibers. This design creates organic airways that naturally drop your core temperature by 2 degrees for deep sleep.
          </p>
          <div className="pt-2">
            <Link 
              to="/shop" 
              className="h-11 px-6 bg-dreamAccent hover:bg-dreamAccent-dark text-white text-sm font-bold rounded-premium inline-flex items-center justify-center transition-transform hover:-translate-y-0.5"
            >
              Explore Products
            </Link>
          </div>
        </div>
        <div>
          <img 
            src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800" 
            alt="NestSleepora Materials" 
            className="rounded-premiumLarge shadow-lg w-full object-cover max-h-[380px] border border-dreamBorder"
          />
        </div>
      </section>

    </div>
  );
}
