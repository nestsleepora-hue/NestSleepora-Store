import { products } from '../lib/seedData.js';
import fs from 'fs';
import path from 'path';

// Convert image_urls strings back to arrays if they are strings
const parsedProducts = products.map(p => {
  let urls = p.image_urls;
  if (typeof urls === 'string') {
    try {
      urls = JSON.parse(urls);
    } catch (e) {
      urls = [urls];
    }
  }
  return {
    ...p,
    image_urls: urls
  };
});

fs.writeFileSync(
  path.join(process.cwd(), 'lib/products.json'),
  JSON.stringify(parsedProducts, null, 2),
  'utf-8'
);
console.log('Successfully generated lib/products.json');
