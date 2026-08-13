import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import pg from 'pg';

let usePostgres = !!process.env.DATABASE_URL;
let pgPool = null;
let sqliteDb = null;
let postgresConnected = false;
let connectionCheckPromise = null;

const parseConnectionUrl = (urlStr) => {
  try {
    const prefix = 'postgresql://';
    if (!urlStr.startsWith(prefix)) return { connectionString: urlStr };

    const remaining = urlStr.slice(prefix.length);
    const lastAtIdx = remaining.lastIndexOf('@');
    if (lastAtIdx === -1) return { connectionString: urlStr };

    const creds = remaining.slice(0, lastAtIdx);
    const hostDb = remaining.slice(lastAtIdx + 1);

    const firstColIdx = creds.indexOf(':');
    let user = 'postgres';
    let password = '';
    if (firstColIdx !== -1) {
      user = creds.slice(0, firstColIdx);
      password = creds.slice(firstColIdx + 1);
    } else {
      user = creds;
    }

    if (password.startsWith('[') && password.endsWith(']')) {
      password = password.slice(1, -1);
    }

    const slashIdx = hostDb.indexOf('/');
    let hostPort = hostDb;
    let database = 'postgres';
    if (slashIdx !== -1) {
      hostPort = hostDb.slice(0, slashIdx);
      database = hostDb.slice(slashIdx + 1);
    }

    const colIdx = hostPort.indexOf(':');
    let host = hostPort;
    let port = 5432;
    if (colIdx !== -1) {
      host = hostPort.slice(0, colIdx);
      port = parseInt(hostPort.slice(colIdx + 1)) || 5432;
    }

    return {
      user,
      password,
      host,
      port,
      database,
      ssl: { rejectUnauthorized: false }
    };
  } catch (e) {
    console.error('Error parsing PostgreSQL URI:', e);
    return { connectionString: urlStr, ssl: { rejectUnauthorized: false } };
  }
};

import dns from 'dns';

const customLookup = (hostname, options, callback) => {
  dns.lookup(hostname, { all: true }, (err, addresses) => {
    if (err || !addresses || addresses.length === 0) {
      return callback(err, null, null);
    }
    const ipv4 = addresses.find(addr => addr.family === 4);
    const ipv6 = addresses.find(addr => addr.family === 6);
    const selected = ipv4 || ipv6 || addresses[0];
    callback(null, selected.address, selected.family);
  });
};

// Always initialize SQLite fallback database connection
const dbPath = path.join(process.cwd(), 'dreamnest.db');
sqliteDb = new (sqlite3.verbose().Database)(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err);
  } else {
    console.log('Connected to DreamNest SQLite database at:', dbPath);
    sqliteDb.run('PRAGMA foreign_keys = ON');
  }
});

// Setup PostgreSQL pool if configured
if (usePostgres) {
  console.log('Connecting to Supabase PostgreSQL database...');
  try {
    const config = parseConnectionUrl(process.env.DATABASE_URL);
    pgPool = new pg.Pool({
      ...config,
      lookup: customLookup,
      connectionTimeoutMillis: 5000 // 5 seconds connection timeout
    });
  } catch (err) {
    console.error('Error initializing PostgreSQL pool:', err);
    usePostgres = false;
  }
}

const checkConnection = async () => {
  if (!usePostgres || !pgPool) return false;
  try {
    await pgPool.query('SELECT 1');
    console.log('Successfully connected to Supabase PostgreSQL database.');
    postgresConnected = true;
    return true;
  } catch (err) {
    console.warn('Failed to connect to Supabase PostgreSQL database. Falling back to local SQLite database:', err.message || err);
    usePostgres = false;
    postgresConnected = false;
    return false;
  }
};

const ensureConnection = () => {
  if (!usePostgres) return Promise.resolve(false);
  if (postgresConnected) return Promise.resolve(true);
  if (!connectionCheckPromise) {
    connectionCheckPromise = checkConnection();
  }
  return connectionCheckPromise;
};


// Convert placeholder "?" to "$1, $2, etc." for PostgreSQL
const convertPlaceholder = (sql) => {
  if (!usePostgres) return sql;

  let index = 1;
  let translatedSql = sql.replace(/\?/g, () => `$${index++}`);

  // Convert SQLite schema definitions to PostgreSQL compliance
  translatedSql = translatedSql
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
    .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
    .replace(/BOOLEAN DEFAULT 0/gi, 'BOOLEAN DEFAULT false')
    .replace(/BOOLEAN NOT NULL DEFAULT 0/gi, 'BOOLEAN NOT NULL DEFAULT false')
    .replace(/PRAGMA foreign_keys = ON/gi, 'SELECT 1');

  // Convert SQLite-specific INSERT OR IGNORE
  translatedSql = translatedSql.replace(/INSERT OR IGNORE INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/gi, (match, table, columns, values) => {
    let conflictTarget = 'id';
    const tblLower = table.toLowerCase();
    if (tblLower === 'carts') {
      conflictTarget = 'user_id';
    } else if (tblLower === 'wishlists') {
      conflictTarget = 'user_id, product_id';
    } else if (tblLower === 'cart_items') {
      conflictTarget = 'cart_id, product_id, variant_id';
    }
    return `INSERT INTO ${table} (${columns}) VALUES (${values}) ON CONFLICT (${conflictTarget}) DO NOTHING`;
  });

  return translatedSql;
};

export const query = async (sql, params = []) => {
  await ensureConnection();
  if (usePostgres) {
    const pgSql = convertPlaceholder(sql);
    try {
      const res = await pgPool.query(pgSql, params);
      return res.rows;
    } catch (err) {
      console.error('PostgreSQL query error, falling back to SQLite:', err.message || err);
      return new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (sqliteErr, rows) => {
          if (sqliteErr) reject(sqliteErr);
          else resolve(rows);
        });
      });
    }
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

export const get = async (sql, params = []) => {
  await ensureConnection();
  if (usePostgres) {
    const pgSql = convertPlaceholder(sql);
    try {
      const res = await pgPool.query(pgSql, params);
      return res.rows[0] || null;
    } catch (err) {
      console.error('PostgreSQL get error, falling back to SQLite:', err.message || err);
      return new Promise((resolve, reject) => {
        sqliteDb.get(sql, params, (sqliteErr, row) => {
          if (sqliteErr) reject(sqliteErr);
          else resolve(row);
        });
      });
    }
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

export const run = async (sql, params = []) => {
  await ensureConnection();
  if (usePostgres) {
    let pgSql = convertPlaceholder(sql);
    const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT INTO');
    if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
      pgSql = `${pgSql} RETURNING id`;
    }

    try {
      const res = await pgPool.query(pgSql, params);
      const firstRow = res.rows[0];
      const insertedId = firstRow && firstRow.hasOwnProperty('id') ? firstRow.id : null;
      return { id: insertedId, changes: res.rowCount };
    } catch (err) {
      console.error('PostgreSQL run error, falling back to SQLite:', err.message || err);
      return new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, function (sqliteErr) {
          if (sqliteErr) reject(sqliteErr);
          else resolve({ id: this.lastID, changes: this.changes });
        });
      });
    }
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

export const initDb = async () => {
  // A helper to initialize schema on both database systems
  const executeSchema = async (sql, params = []) => {
    // 1. Run on SQLite (always) to keep the local fallback ready
    try {
      await new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (err) {
      // Ignore SQLite alter table duplicate errors
      if (!err.message.includes('duplicate column') && !err.message.includes('already exists')) {
        console.warn('SQLite schema setup warning:', err.message);
      }
    }

    // 2. Run on PostgreSQL if active and connected
    if (usePostgres && postgresConnected) {
      try {
        let pgSql = convertPlaceholder(sql);
        await pgPool.query(pgSql, params);
      } catch (err) {
        // Ignore Postgres alter table duplicate errors
        if (!err.message.includes('duplicate column') && !err.message.includes('already exists')) {
          console.warn('PostgreSQL schema setup warning:', err.message);
        }
      }
    }
  };

  // We await connection verification first before performing schema init
  await ensureConnection();

  // 1. Create users table
  await executeSchema(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      must_change_password INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migrate columns if SQLite or PostgreSQL does not have them (ignore duplicate column error)
  await executeSchema("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
  await executeSchema("ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0");

  // Create default admin user if not exists
  const adminEmail = 'mateen@itdepartment.com';
  // Delete old placeholder admin if any
  try {
    await new Promise((resolve, reject) => {
      sqliteDb.run('DELETE FROM users WHERE email = ?', ['admin@sleepora.com'], (err) => {
        if (err) reject(err); else resolve();
      });
    });
    if (usePostgres && postgresConnected) {
      await pgPool.query('DELETE FROM users WHERE email = $1', ['admin@sleepora.com']);
    }
  } catch (err) {}

  const adminPassHash = await bcrypt.hash('Mateen@55', 10);
  
  // Insert admin on SQLite
  try {
    await new Promise((resolve, reject) => {
      sqliteDb.run(
        `INSERT INTO users (email, password_hash, name, role) 
         VALUES (?, ?, ?, ?) 
         ON CONFLICT (email) DO NOTHING`,
        [adminEmail, adminPassHash, 'Mateen (Admin)', 'admin'],
        (err) => { if (err) reject(err); else resolve(); }
      );
    });
  } catch (err) {}

  // Insert admin on Postgres
  if (usePostgres && postgresConnected) {
    try {
      await pgPool.query(
        `INSERT INTO users (email, password_hash, name, role) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (email) DO NOTHING`,
        [adminEmail, adminPassHash, 'Mateen (Admin)', 'admin']
      );
    } catch (err) {}
  }

  // 2. Create products table
  await executeSchema(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      base_price REAL NOT NULL,
      discount_price REAL,
      image_urls TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migrate columns for products currency overrides (ignore duplicate column error)
  await executeSchema("ALTER TABLE products ADD COLUMN price_usd REAL");
  await executeSchema("ALTER TABLE products ADD COLUMN price_eur REAL");
  await executeSchema("ALTER TABLE products ADD COLUMN price_gbp REAL");
  await executeSchema("ALTER TABLE products ADD COLUMN original_price_usd REAL");
  await executeSchema("ALTER TABLE products ADD COLUMN original_price_eur REAL");
  await executeSchema("ALTER TABLE products ADD COLUMN original_price_gbp REAL");

  // 3. Create variants table
  await executeSchema(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      size TEXT NOT NULL,
      price_modifier REAL NOT NULL DEFAULT 0.0,
      stock_qty INTEGER NOT NULL DEFAULT 0
    )
  `);

  // 4. Create reviews table
  await executeSchema(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      user_initials TEXT NOT NULL,
      rating INTEGER NOT NULL,
      title TEXT NOT NULL,
      comment TEXT NOT NULL,
      verified BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 5. Create wishlists table
  await executeSchema(`
    CREATE TABLE IF NOT EXISTS wishlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      UNIQUE(user_id, product_id)
    )
  `);

  // 6. Create carts table
  await executeSchema(`
    CREATE TABLE IF NOT EXISTS carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      session_id TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 7. Create cart items table
  await executeSchema(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      variant_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      UNIQUE(cart_id, product_id, variant_id)
    )
  `);

  // 8. Create orders table
  await executeSchema(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      stripe_payment_id TEXT UNIQUE,
      shipping_name TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      shipping_city TEXT NOT NULL,
      shipping_zip TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 9. Create order items table
  await executeSchema(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      variant_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price_at_purchase REAL NOT NULL
    )
  `);

  // 10. Create audit logs table (if not exists on SQLite and PostgreSQL)
  await executeSchema(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_email TEXT NOT NULL,
      admin_name TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);

  // Helper function to seed databases if empty
  const seedDatabase = async (runner, getter, dbName) => {
    try {
      const prodCount = await getter('SELECT COUNT(*) as count FROM products');
      if (prodCount && parseInt(prodCount.count) === 0) {
        console.log(`[SEEDING] ${dbName} database is empty. Seeding default products from products.json...`);
        const jsonPath = path.join(process.cwd(), 'lib/products.json');
        if (!fs.existsSync(jsonPath)) {
          console.warn(`[SEEDING] products.json not found at ${jsonPath}. Skipping seed.`);
          return;
        }
        const seedProducts = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        for (const p of seedProducts) {
          const prodRes = await runner(
            'INSERT INTO products (name, description, category, base_price, discount_price, image_urls) VALUES (?, ?, ?, ?, ?, ?)',
            [p.name, p.description, p.category, p.base_price, p.discount_price, JSON.stringify(p.image_urls)]
          );
          const productId = prodRes.id;

          // Seed variants
          for (const v of p.variants) {
            await runner(
              'INSERT INTO product_variants (product_id, size, price_modifier, stock_qty) VALUES (?, ?, ?, ?)',
              [productId, v.size, v.price_modifier, v.stock_qty]
            );
          }

          // Seed reviews
          for (const r of p.reviews) {
            await runner(
              'INSERT INTO reviews (product_id, user_name, user_initials, rating, title, comment, verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [productId, r.user_name, r.user_initials, r.rating, r.title, r.comment, r.verified ? 1 : 0]
            );
          }
        }
        console.log(`[SEEDING] ${dbName} database seed completed successfully.`);
      }
    } catch (seedErr) {
      console.error(`[SEEDING] Error seeding ${dbName} database:`, seedErr);
    }
  };

  // Run seed on SQLite fallback database
  await seedDatabase(
    (sql, params) => new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    }),
    (sql, params) => new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    }),
    'SQLite'
  );

  // Run seed on PostgreSQL database (if connected)
  if (usePostgres && postgresConnected) {
    await seedDatabase(
      async (sql, params) => {
        let pgSql = convertPlaceholder(sql);
        const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT INTO');
        if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
          pgSql = `${pgSql} RETURNING id`;
        }
        const res = await pgPool.query(pgSql, params);
        const firstRow = res.rows[0];
        const insertedId = firstRow && firstRow.hasOwnProperty('id') ? firstRow.id : null;
        return { id: insertedId, changes: res.rowCount };
      },
      async (sql, params) => {
        const pgSql = convertPlaceholder(sql);
        const res = await pgPool.query(pgSql, params);
        return res.rows[0] || null;
      },
      'PostgreSQL'
    );
  }

  console.log('DreamNest database schemas verified and initialized.');
};

initDb().catch(err => console.error("Database initialization failed:", err));

export default usePostgres ? pgPool : sqliteDb;
