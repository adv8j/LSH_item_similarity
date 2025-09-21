import axios from 'axios';

/**
 * Mock vs real backend toggle.
 * Set USE_MOCK = false and BASE_URL to your backend to call a real API.
 */
const USE_MOCK = false;
const BASE_URL = 'http://127.0.0.1:5000'; // e.g. "http://localhost:5000"

/**
 * Helpers to generate deterministic mock data from asin/index.
 */
// function mockAsin(i){
//   // simple deterministic asin like A0000001
//   return `A${String(i).padStart(7, '0')}`;
// }
// function mockProductFromIndex(i){
//   const asin = mockAsin(i);
//   const title = `Mock Appliance ${i} — Model ${asin}`;
//   const description = `This is a mock description for ${title}. It contains several sentences to emulate a real product description for UI testing.`;
//   const features = [
//     `Feature 1 for ${asin}`,
//     `Feature 2 for ${asin}`,
//     `Feature 3 for ${asin}`
//   ];
//   return {
//     asin,
//     title,
//     description,
//     feature: features,
//     price: (20 + (i % 200)).toFixed(2),
//     imageURL: `https://picsum.photos/seed/${asin}/400/260`,
//     imageURL_high: `https://picsum.photos/seed/${asin}/800/520`,
//     related: {
//       also_bought: [mockAsin(i+1), mockAsin(i+2)],
//       also_viewed: [mockAsin(i+3), mockAsin(i+4)]
//     },
//     salesRank: { Overall: 1000 + i },
//     brand: `Brand ${(i % 10) + 1}`,
//     categories: ["Appliances", "Kitchen", `Category-${i%5}`],
//     tech1: { weight: `${2 + (i%5)} kg` },
//     tech2: { voltage: `${110 + (i%10)} V` },
//     similar: [mockAsin(i+5), mockAsin(i+6)]
//   };
// }

/**
 * GET /api/products?page=&per_page=
 * Returns: { products: [...], total: 30000, page, per_page }
 */
export async function getProducts({ page = 1, per_page = 50 } = {}){
  // if (USE_MOCK){
  //   const TOTAL = 30000;
  //   const start = (page - 1) * per_page + 1;
  //   const end = Math.min(start + per_page - 1, TOTAL);
  //   const products = [];
  //   for (let i = start; i <= end; i++){
  //     const p = mockProductFromIndex(i);
  //     // product card only needs essential fields
  //     products.push({
  //       asin: p.asin,
  //       title: p.title,
  //       description: p.description.substring(0, 150),
  //       price: p.price,
  //       imageURL: p.imageURL
  //     });
  //   }
  //   // simulate small latency
  //   await new Promise(r => setTimeout(r, 200));
  //   return { products, total: TOTAL, page, per_page };
  // }

  const res = await axios.get(`${BASE_URL}/api/products`, { params: { page, per_page } });
  return res.data;
}

/**
 * GET /api/product/:asin
 * Returns full product object
 */
export async function getProduct(asin){
  // if (USE_MOCK){
  //   // derive an index from asin if possible, else random
  //   let idx = 1;
  //   const match = asin && asin.match(/^A0*([1-9]\d*)$/);
  //   if (match) idx = Number(match[1]);
  //   // if asin not matching pattern, fallback to hashed index
  //   if (!match){
  //     idx = (asin ? asin.split('').reduce((s,c)=>s + c.charCodeAt(0),0) : 1) % 30000;
  //     if (idx <= 0) idx = 1;
  //   }
  //   await new Promise(r => setTimeout(r, 150));
  //   return mockProductFromIndex(idx);
  // }

  const res = await axios.get(`${BASE_URL}/api/product/${asin}`);
  return res.data;
}

/**
 * POST /api/similar
 * Accepts:
 *   { mode: "by_id", product_id, method, k }
 * or
 *   { mode: "by_product", product: {...}, method, k }
 *
 * Response:
 *  { query_id, query_product, method, k, results: [product objects], metrics: {...} }
 */
export async function findSimilar({ mode='by_id', product_id, product, method='pst', k=5 } = {}){
  // if (USE_MOCK){
  //   // create k mock results (avoid returning the same asin as query if by_id)
  //   const results = [];
  //   let baseIndex = 500; // arbitrary base to vary seeds
  //   if (mode === 'by_id' && product_id){
  //     // pick an index derived from product_id if possible
  //     const m = product_id.match(/^A0*([1-9]\d*)$/);
  //     if (m) baseIndex = Number(m[1]) + 100;
  //     else baseIndex = (product_id.split('').reduce((s,c)=>s + c.charCodeAt(0),0) % 20000) + 100;
  //   } else if (mode === 'by_product' && product && product.asin) {
  //     const m = product.asin.match(/^A0*([1-9]\d*)$/);
  //     baseIndex = m ? Number(m[1]) + 200 : baseIndex + (product.title?.length || 0);
  //   }

  //   for (let i = 0; i < k; i++){
  //     const idx = ((baseIndex + i) % 30000) + 1;
  //     const p = mockProductFromIndex(idx);
  //     results.push({
  //       asin: p.asin,
  //       title: p.title,
  //       description: p.description,
  //       price: p.price,
  //       imageURL: p.imageURL,
  //       score: Number((0.9 - i * (0.9 / k) + Math.random()*0.05).toFixed(3)), // descending-ish
  //       is_ground_truth: Math.random() > 0.6
  //     });
  //   }
  //   await new Promise(r => setTimeout(r, 250));
  //   const query_product = mode === 'by_id' ? { asin: product_id } : (product || { asin: 'temp' });
  //   const precision = (results.filter(r=>r.is_ground_truth).length / k).toFixed(2);
  //   return { query_id: `mock-${Date.now()}`, query_product, method, k, results, metrics: { precision_at_k: precision } };
  // }

  const payload = { mode, product_id, product, method, k };
  const res = await axios.post(`${BASE_URL}/api/similar`, payload);
  return res.data;
}
