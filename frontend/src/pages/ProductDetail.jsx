import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProduct, findSimilar } from '../api';
import Loader from '../components/Loader';
import ResultCard from '../components/ResultCard';

export default function ProductDetail(){
  const { asin } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [method, setMethod] = useState('PST');
  const [k, setK] = useState(5);
  const [simLoading, setSimLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(()=>{
    let mounted = true;
    setLoading(true);
    getProduct(asin).then(p=>{
      if (!mounted) return;
      setProduct(p);
      setLoading(false);
    }).catch(err=>{
      console.error(err);
      setLoading(false);
    });
    return ()=> mounted = false;
  }, [asin]);

  async function onFindSimilar(){
    setSimLoading(true);
    try{
      const res = await findSimilar({ mode: 'by_id', product_id: asin, method, k });
      setResults(res.results || []);
      setMetrics(res.metrics || null);
    }catch(err){
      console.error(err);
      alert('Error finding similar products');
    }finally{
      setSimLoading(false);
    }
  }

  if (loading) return <Loader />;

  if (!product) return <div>Product not found</div>;

  return (
    <div>
      <div className="flex gap-6 mb-6">
        <img src={product.imageURL} alt={product.title} className="w-80 h-52 object-cover rounded shadow" />
        <div>
          <h1 className="text-2xl font-semibold">{product.title}</h1>
          <div className="mt-2 text-sm text-gray-700">{product.description}</div>
          <div className="mt-4 text-lg font-semibold">Price: ${product.price}</div>
          <div className="mt-3 text-sm text-gray-600">Brand: {product.brand}</div>
          <div className="mt-1 text-sm text-gray-600">Sales Rank: {product.salesRank ? JSON.stringify(product.salesRank) : '—'}</div>
        </div>
      </div>

      <section className="mb-6 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-medium mb-2">Full details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold">Features</h3>
            <ul className="list-disc ml-5">
              {product.feature && product.feature.map((f, idx)=>(<li key={idx}>{f}</li>))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Categories</h3>
            <div>{product.categories ? product.categories.join(' > ') : '—'}</div>

            <h3 className="mt-3 font-semibold">Tech Specs</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded">{JSON.stringify(product.tech1 || {}, null, 2)}</pre>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2">{JSON.stringify(product.tech2 || {}, null, 2)}</pre>
          </div>
        </div>
      </section>

      <section className="mb-6 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-medium mb-2">Find Similar Products</h2>
        <div className="flex items-center gap-3">
          <select value={method} onChange={e=>setMethod(e.target.value)} className="border rounded px-2 py-1">
            <option value="PST">Products with similar title (PST)</option>
            <option value="PSD">Products with similar description (PSD)</option>
            <option value="PSTD">Title + Description (PSTD)</option>
          </select>

          <select value={k} onChange={e=>setK(Number(e.target.value))} className="border rounded px-2 py-1">
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
          </select>

          <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={onFindSimilar} disabled={simLoading}>
            {simLoading ? 'Finding...' : 'Find'}
          </button>

          {metrics && <div className="ml-4 text-sm">Precision@k: <strong>{metrics.precision_at_k}</strong></div>}
        </div>

        <div className="mt-4">
          {simLoading ? <Loader /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map(r => <ResultCard key={r.asin} product={r} />)}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-medium mb-2">Related / Similar (dataset fields)</h2>
        <div className="text-sm text-gray-700">
          <div><strong>Also bought:</strong> {(product.related?.also_bought || []).join(', ') || '—'}</div>
          <div className="mt-1"><strong>Also viewed:</strong> {(product.related?.also_viewed || []).join(', ') || '—'}</div>
          <div className="mt-1"><strong>Similar:</strong> {(product.similar || []).join(', ') || '—'}</div>
        </div>
      </section>
    </div>
  );
}
