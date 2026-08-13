const { initDb, run, query } = require('./db');
const bcrypt = require('bcryptjs');

const products = [
  // BEDS
  {
    name: 'Modern Velvet Platform Bed',
    description: 'Elevate your bedroom with the DreamNest Modern Velvet Platform Bed. Featuring a soft, velvet-upholstered headboard, solid wood slats, and sleek steel legs, it offers both luxury and sturdy support. No box spring required.',
    category: 'beds',
    base_price: 599.0,
    discount_price: 499.0,
    image_urls: JSON.stringify([
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&q=80&w=800'
    ]),
    variants: [
      { size: 'Twin', price_modifier: 0.0, stock_qty: 15 },
      { size: 'Full', price_modifier: 100.0, stock_qty: 12 },
      { size: 'Queen', price_modifier: 200.0, stock_qty: 20 },
      { size: 'King', price_modifier: 300.0, stock_qty: 8 }
    ],
    reviews: [
      { user_name: 'Sarah M.', user_initials: 'SM', rating: 5, title: 'Absolutely stunning!', comment: 'The velvet feels incredibly premium and soft. Assembly took under an hour and it is extremely sturdy. No squeaking at all!', verified: true },
      { user_name: 'David L.', user_initials: 'DL', rating: 4, title: 'Very nice frame', comment: 'Beautiful bed, headboard height is perfect. Lowered by one star because shipping took an extra day, but product itself is 5/5.', verified: true },
      { user_name: 'Jessica T.', user_initials: 'JT', rating: 5, title: 'Exceeded expectations', comment: 'I was hesitant to buy a bed online, but this is amazing. The color is deep and rich, and the support slats are heavy duty.', verified: true },
      { user_name: 'Michael K.', user_initials: 'MK', rating: 5, title: 'Perfect platform bed', comment: 'Clean lines, great construction. It sits nicely off the floor for some under-bed storage too.', verified: false }
    ]
  },
  {
    name: 'Classic Oak Bed Frame',
    description: 'Crafted from sustainable premium grade American White Oak, this bed frame offers timeless elegance. Featuring mortise and tenon joinery, it represents the pinnacle of craftsmanship and organic design.',
    category: 'beds',
    base_price: 799.0,
    discount_price: null,
    image_urls: JSON.stringify([
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800'
    ]),
    variants: [
      { size: 'Twin', price_modifier: 0.0, stock_qty: 8 },
      { size: 'Full', price_modifier: 120.0, stock_qty: 6 },
      { size: 'Queen', price_modifier: 250.0, stock_qty: 15 },
      { size: 'King', price_modifier: 400.0, stock_qty: 10 }
    ],
    reviews: [
      { user_name: 'Robert H.', user_initials: 'RH', rating: 5, title: 'Heirloom Quality', comment: 'This is solid wood, very heavy and gorgeous grain. Will last a lifetime. Worth every penny!', verified: true },
      { user_name: 'Linda G.', user_initials: 'LG', rating: 5, title: 'Simply Elegant', comment: 'Love the minimalist oak look. Smells amazing too. Support system is great for our heavy latex mattress.', verified: true },
      { user_name: 'Brian P.', user_initials: 'BP', rating: 4, title: 'Sturdy oak frame', comment: 'Assembly takes two people due to the weight of the oak boards, but the joints fit perfectly. Super solid.', verified: true }
    ]
  },
  {
    name: 'Japanese Futon Platform Bed',
    description: 'Designed for minimalist living, the Japanese Futon Platform Bed sits low to the ground. Crafted with beautiful natural ash veneer, it promotes open space flow and air circulation for your mattress.',
    category: 'beds',
    base_price: 499.0,
    discount_price: 399.0,
    image_urls: JSON.stringify([
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=800'
    ]),
    variants: [
      { size: 'Twin', price_modifier: 0.0, stock_qty: 10 },
      { size: 'Full', price_modifier: 80.0, stock_qty: 14 },
      { size: 'Queen', price_modifier: 150.0, stock_qty: 25 },
      { size: 'King', price_modifier: 250.0, stock_qty: 9 }
    ],
    reviews: [
      { user_name: 'Kenji S.', user_initials: 'KS', rating: 5, title: 'Perfect Low Profile', comment: 'Fits our futon mattress perfectly. Low height creates so much visual space in our bedroom.', verified: true },
      { user_name: 'Emily W.', user_initials: 'EW', rating: 4, title: 'Love the low look', comment: 'Easy to build. Excellent finish. Just be prepared that it sits very low to the floor, which we wanted but is good to note.', verified: true },
      { user_name: 'Alan T.', user_initials: 'AT', rating: 5, title: 'Minimalist dream', comment: 'Extremely clean look, fits standard US Queen mattresses too. Slats are perfectly spaced.', verified: false }
    ]
  },
  {
    name: 'Elegant Tufted Upholstered Bed',
    description: 'Make a statement with this premium upholstered wingback bed. Fully wrapped in a durable grey linen-blend fabric with classic hand-tufted button detailing on the headboard.',
    category: 'beds',
    base_price: 699.0,
    discount_price: null,
    image_urls: JSON.stringify([
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800'
    ]),
    variants: [
      { size: 'Twin', price_modifier: 0.0, stock_qty: 5 },
      { size: 'Full', price_modifier: 120.0, stock_qty: 8 },
      { size: 'Queen', price_modifier: 220.0, stock_qty: 12 },
      { size: 'King', price_modifier: 350.0, stock_qty: 7 }
    ],
    reviews: [
      { user_name: 'Melissa F.', user_initials: 'MF', rating: 5, title: 'Royal feel', comment: 'The tufting is done beautifully. Feels like sleeping in a luxury hotel. Highly recommend!', verified: true },
      { user_name: 'Gregory K.', user_initials: 'GK', rating: 5, title: 'Sturdy and beautiful', comment: 'Awesome build quality. The wings look very upscale. Upholstery fabric is heavy and high quality.', verified: true },
      { user_name: 'Anna D.', user_initials: 'AD', rating: 4, title: 'Beautiful bed but heavy', comment: 'Looks exactly like the picture. Very heavy packages, so have someone help you bring it inside, but it went together smoothly.', verified: false }
    ]
  },

  // MATTRESSES
  {
    name: 'DreamNest Hybrid Cloud Mattress',
    description: 'Experience weightless sleep with the DreamNest Hybrid Cloud. Combining individually wrapped pocket coils for contouring support and motion isolation, with cooling gel-infused memory foam for pressure relief.',
    category: 'mattresses',
    base_price: 899.0,
    discount_price: 749.0,
    image_urls: JSON.stringify([
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1505693395321-883724634266?auto=format&fit=crop&q=80&w=800'
    ]),
    variants: [
      { size: 'Twin', price_modifier: 0.0, stock_qty: 25 },
      { size: 'Full', price_modifier: 150.0, stock_qty: 18 },
      { size: 'Queen', price_modifier: 250.0, stock_qty: 40 },
      { size: 'King', price_modifier: 400.0, stock_qty: 15 }
    ],
    reviews: [
      { user_name: 'James O.', user_initials: 'JO', rating: 5, title: 'Best sleep in years', comment: 'My back pain is completely gone. Perfect balance of soft cloud top and supportive coil core. Zero motion transfer!', verified: true },
      { user_name: 'Elena R.', user_initials: 'ER', rating: 5, title: 'Amazing cooling hybrid', comment: 'I sleep hot, but this gel foam actually works. I wake up dry and cool. Love the edge support too.', verified: true },
      { user_name: 'Mark S.', user_initials: 'MS', rating: 4, title: 'Great but firm at first', comment: 'Took about a week to break in. It felt a bit firmer than expected initially, but now it is perfect.', verified: true },
      { user_name: 'Catherine V.', user_initials: 'CV', rating: 5, title: 'Worth every dollar', comment: 'Unboxing was a breeze. Rebounds fully in 3 hours. Best hybrid mattress available online!', verified: false }
    ]
  },
  {
    name: 'Therapeutic Memory Foam Mattress',
    description: '10 inches of premium density contouring foam designed to align your spine. Infused with natural green tea extract to maintain freshness, and charcoal to neutralize moisture and odor.',
    category: 'mattresses',
    base_price: 599.0,
    discount_price: null,
    image_urls: JSON.stringify([
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1505693395321-883724634266?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=800'
    ]),
    variants: [
      { size: 'Twin', price_modifier: 0.0, stock_qty: 30 },
      { size: 'Full', price_modifier: 100.0, stock_qty: 24 },
      { size: 'Queen', price_modifier: 200.0, stock_qty: 35 },
      { size: 'King', price_modifier: 300.0, stock_qty: 14 }
    ],
    reviews: [
      { user_name: 'Patricia B.', user_initials: 'PB', rating: 5, title: 'No more hip pressure!', comment: 'Hugs the body beautifully. Perfect for side sleepers who need hip and shoulder cushioning.', verified: true },
      { user_name: 'Daniel F.', user_initials: 'DF', rating: 4, title: 'Very comfortable foam', comment: 'Very supportive. Does not sleep hot, though it is slightly softer than my old spring mattress. Highly recommended.', verified: true },
      { user_name: 'Sophia K.', user_initials: 'SK', rating: 5, title: 'Incredible value', comment: 'No chemical smell when opened. Green tea infusion keeps it smelling fresh. Highly happy with it!', verified: false }
    ]
  },
  {
    name: 'Organic Latex Eco Mattress',
    description: 'Made for the eco-conscious sleeper. Concocted with 100% GOLS-certified organic natural latex, GOTS-certified organic cotton covers, and raw organic New Zealand wool for chemical-free fire protection.',
    category: 'mattresses',
    base_price: 1299.0,
    discount_price: 1099.0,
    image_urls: JSON.stringify([
      'https://images.unsplash.com/photo-1505693395321-883724634266?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800'
    ]),
    variants: [
      { size: 'Twin', price_modifier: 0.0, stock_qty: 10 },
      { size: 'Full', price_modifier: 200.0, stock_qty: 8 },
      { size: 'Queen', price_modifier: 350.0, stock_qty: 15 },
      { size: 'King', price_modifier: 500.0, stock_qty: 6 }
    ],
    reviews: [
      { user_name: 'Elizabeth D.', user_initials: 'ED', rating: 5, title: 'Clean and buoyant', comment: 'No toxic VOC off-gassing! It has a wonderful bouncy feel unlike memory foam, but isolates motion nicely. Worth the extra cost.', verified: true },
      { user_name: 'Henry C.', user_initials: 'HC', rating: 5, title: 'Allergy relief!', comment: 'Dust-mite resistant and organic. My morning allergies have completely stopped. Best investment for health.', verified: true },
      { user_name: 'Nora G.', user_initials: 'NG', rating: 4, title: 'Heavy but luxurious', comment: 'Extremely heavy to lift, but sleeping on it is divine. Medium firm support that keeps you on top rather than sinking.', verified: false }
    ]
  },
  {
    name: 'Ultra-Cool Gel-Infused Mattress',
    description: 'Designed specifically to lower your core sleeping temperature. Features a proprietary graphite-infused open-cell foam layout, layered over cooling micro-coils to dissipate heat faster.',
    category: 'mattresses',
    base_price: 999.0,
    discount_price: null,
    image_urls: JSON.stringify([
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=800'
    ]),
    variants: [
      { size: 'Twin', price_modifier: 0.0, stock_qty: 12 },
      { size: 'Full', price_modifier: 120.0, stock_qty: 10 },
      { size: 'Queen', price_modifier: 220.0, stock_qty: 18 },
      { size: 'King', price_modifier: 380.0, stock_qty: 11 }
    ],
    reviews: [
      { user_name: 'Steven A.', user_initials: 'SA', rating: 5, title: 'Finally, no hot flashes!', comment: 'I wake up dry and comfortable. The cooling cover is cold to the touch. Amazing tech.', verified: true },
      { user_name: 'Megan E.', user_initials: 'ME', rating: 5, title: 'Superb support', comment: 'The micro-coils make a huge difference in support. Feels soft on first touch but does not collapse.', verified: true },
      { user_name: 'Kevin J.', user_initials: 'KJ', rating: 4, title: 'Very cool sleep', comment: 'Does exactly what it promises—sleeps very cool. I prefer it over memory foam because I do not feel stuck.', verified: false }
    ]
  },

  // ACCESSORIES
  {
    name: 'Luxury Down Alternative Pillows',
    description: 'Sleep like you are on a cloud. Our pillows feature hypoallergenic premium down-alternative fibers inside a 100% long-staple sateen cotton shell. Available in standard or king size.',
    category: 'accessories',
    base_price: 79.0,
    discount_price: 59.0,
    image_urls: JSON.stringify([
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1629949009765-40fc34c95d67?auto=format&fit=crop&q=80&w=800'
    ]),
    variants: [
      { size: 'Standard (2-Pack)', price_modifier: 0.0, stock_qty: 50 },
      { size: 'King (2-Pack)', price_modifier: 20.0, stock_qty: 40 }
    ],
    reviews: [
      { user_name: 'Rebecca C.', user_initials: 'RC', rating: 5, title: 'Perfect loft', comment: 'Not too soft, not too firm. Fluffs back up immediately. My neck pain has vanished.', verified: true },
      { user_name: 'Tyler G.', user_initials: 'TG', rating: 4, title: 'Great pillows', comment: 'Very comfortable sateen shell. Sleeps quite cool. A little fuller than expected but molds nicely.', verified: true },
      { user_name: 'Ashley D.', user_initials: 'AD', rating: 5, title: 'Awesome luxury feel', comment: 'Feels like hotel down pillows but without any feathers poking out. Excellent buy.', verified: true }
    ]
  },
  {
    name: 'Eucalyptus Cooling Sheets Set',
    description: 'Made from 100% Tencel Lyocell sourced from renewable eucalyptus trees. These sheets are naturally silky soft, highly breathable, moisture-wicking, and hypoallergenic.',
    category: 'accessories',
    base_price: 149.0,
    discount_price: 129.0,
    image_urls: JSON.stringify([
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=800'
    ]),
    variants: [
      { size: 'Twin', price_modifier: 0.0, stock_qty: 35 },
      { size: 'Full', price_modifier: 20.0, stock_qty: 30 },
      { size: 'Queen', price_modifier: 40.0, stock_qty: 45 },
      { size: 'King', price_modifier: 60.0, stock_qty: 25 }
    ],
    reviews: [
      { user_name: 'Isabella L.', user_initials: 'IL', rating: 5, title: 'Like sleeping on silk!', comment: 'They drape beautifully and are incredibly cool. Highly recommend to hot sleepers.', verified: true },
      { user_name: 'Samuel M.', user_initials: 'SM', rating: 5, title: 'Fabulous sheets', comment: 'Deep pockets fit our thick hybrid mattress and topper with ease. Stays put on the corners.', verified: true },
      { user_name: 'Grace W.', user_initials: 'GW', rating: 4, title: 'Super soft', comment: 'Amazing feel. They wrinkle a bit easily if not taken out of the dryer immediately, but comfort is top notch.', verified: false }
    ]
  },
  {
    name: 'Weighted Deep Sleep Blanket',
    description: 'Promote deep relaxation and reduce anxiety. Made with 100% breathable cotton and filled with premium micro-glass beads distributed evenly for deep pressure touch stimulation.',
    category: 'accessories',
    base_price: 119.0,
    discount_price: null,
    image_urls: JSON.stringify([
      'https://images.unsplash.com/photo-1629949009765-40fc34c95d67?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800'
    ]),
    variants: [
      { size: '12 lbs (Twin)', price_modifier: 0.0, stock_qty: 20 },
      { size: '15 lbs (Full/Queen)', price_modifier: 20.0, stock_qty: 22 },
      { size: '20 lbs (King)', price_modifier: 40.0, stock_qty: 15 }
    ],
    reviews: [
      { user_name: 'Jonathan D.', user_initials: 'JD', rating: 5, title: 'Instant relaxation', comment: 'Weight distribution is perfect. I fall asleep much faster and toss/turn way less.', verified: true },
      { user_name: 'Rachel B.', user_initials: 'RB', rating: 5, title: 'Best blanket ever', comment: 'High quality outer cover, washable, and does not hold onto heat like cheap polyester ones.', verified: true },
      { user_name: 'Christopher L.', user_initials: 'CL', rating: 4, title: 'Very nice but heavy to fold', comment: 'Sleeps great, keeps me grounded. Folding a heavy blanket is a bit of a workout, but the results are great.', verified: false }
    ]
  },
  {
    name: 'Smart Adjustable Bed Frame Base',
    description: 'Customize your sleeping position. Includes wireless remote with preset zero-gravity, anti-snore, and flat positions, plus dual USB ports and under-bed LED lighting.',
    category: 'accessories',
    base_price: 899.0,
    discount_price: 699.0,
    image_urls: JSON.stringify([
      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=800'
    ]),
    variants: [
      { size: 'Twin XL', price_modifier: 0.0, stock_qty: 8 },
      { size: 'Queen', price_modifier: 200.0, stock_qty: 15 },
      { size: 'Split King', price_modifier: 500.0, stock_qty: 6 }
    ],
    reviews: [
      { user_name: 'William S.', user_initials: 'WS', rating: 5, title: 'Snoring stopped!', comment: 'Using the anti-snore angle raised my wife\'s head just enough. We both sleep through the night now! Underbed light is so convenient.', verified: true },
      { user_name: 'Victoria R.', user_initials: 'VR', rating: 5, title: 'Zero gravity is amazing', comment: 'Relieves all lower back pressure. Motors are dead silent. USB charging ports on both sides are super useful.', verified: true },
      { user_name: 'Luke M.', user_initials: 'LM', rating: 4, title: 'Excellent base', comment: 'Very heavy base, needs two strong people to flip it. But works like a charm and setup was literally just screwing the legs on.', verified: true }
    ]
  }
];

const seed = async () => {
  try {
    console.log('Starting seed process...');
    await initDb();

    // Clean existing data
    console.log('Clearing old database records...');
    await run('DELETE FROM order_items');
    await run('DELETE FROM orders');
    await run('DELETE FROM cart_items');
    await run('DELETE FROM carts');
    await run('DELETE FROM wishlists');
    await run('DELETE FROM reviews');
    await run('DELETE FROM product_variants');
    await run('DELETE FROM products');
    await run('DELETE FROM users');

    // Create a default user and admin
    const passwordHash = await bcrypt.hash('dreamnest123', 10);
    await run(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      ['user@dreamnest.com', passwordHash, 'Jane Doe', 'user']
    );
    console.log('Seed: Default test user created (user@dreamnest.com / dreamnest123)');

    const adminPasswordHash = await bcrypt.hash('Mateen@55', 10);
    await run(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      ['mateen@itdepartment.com', adminPasswordHash, 'Mateen (Admin)', 'admin']
    );
    console.log('Seed: Default admin user created (mateen@itdepartment.com / Mateen@55)');

    // Seed products
    for (const p of products) {
      const prodRes = await run(
        'INSERT INTO products (name, description, category, base_price, discount_price, image_urls) VALUES (?, ?, ?, ?, ?, ?)',
        [p.name, p.description, p.category, p.base_price, p.discount_price, p.image_urls]
      );
      const productId = prodRes.id;

      // Seed variants
      for (const v of p.variants) {
        await run(
          'INSERT INTO product_variants (product_id, size, price_modifier, stock_qty) VALUES (?, ?, ?, ?)',
          [productId, v.size, v.price_modifier, v.stock_qty]
        );
      }

      // Seed reviews
      for (const r of p.reviews) {
        await run(
          'INSERT INTO reviews (product_id, user_name, user_initials, rating, title, comment, verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [productId, r.user_name, r.user_initials, r.rating, r.title, r.comment, r.verified ? 1 : 0]
        );
      }
    }

    console.log('Seed: Successfully seeded 12 products with variants and reviews.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seed();
