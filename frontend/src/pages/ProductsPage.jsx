import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

export default function ProductsPage(){
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getProducts({ page, per_page: perPage }).then(data=>{
      if (!mounted) return;
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setLoading(false);
    }).catch(err=>{
      console.error(err);
      setLoading(false);
    });
    return ()=> mounted = false;
  }, [page, perPage]);

  const pages = Math.ceil(total / perPage);

  function onSelect(product){
    navigate(`/product/${product.asin}`);
  }

  const filtered = q.trim() ? products.filter(p => p.title.toLowerCase().includes(q.toLowerCase()) || p.asin.toLowerCase().includes(q.toLowerCase())) : products;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Product Gallery</h1>
        <div className="flex gap-2 items-center">
          <input
            className="border rounded px-3 py-2"
            placeholder="Search current page by title or asin..."
            value={q}
            onChange={(e)=>setQ(e.target.value)}
          />
          <div className="text-sm text-gray-600">Page {page} / {pages || 1}</div>
        </div>
      </div>

      {loading ? <Loader /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => <div key={p.asin} onClick={()=>onSelect(p)}><ProductCard product={p} /></div>)}
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              className="px-4 py-2 rounded border"
              disabled={page <= 1}
              onClick={()=>setPage(p => Math.max(1, p - 1))}
            >Previous</button>

            <div className="text-sm text-gray-600">Showing {(page-1)*perPage + 1} - {Math.min(page*perPage, total)} of {total}</div>

            <button
              className="px-4 py-2 rounded border"
              disabled={page >= pages}
              onClick={()=>setPage(p => Math.min(pages, p + 1))}
            >Next</button>
          </div>
        </>
      )}

    </div>
  );
}
