import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import { findSimilar } from '../api';
import Loader from '../components/Loader';
import ResultCard from '../components/ResultCard';

export default function ProductDetail(){
  const { asin } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allProducts, setAllProducts] = useState([]);

  const [method, setMethod] = useState('pst');
  const [k, setK] = useState(5);
  const [simLoading, setSimLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(()=>{
    let mounted = true;
    setLoading(true);
    setResults([]);
    
    // ONLY CHANGE: Use local data instead of API
    fetch('/data/data.json')
      .then(res => res.json())
      .then(data => {
        if (!mounted) return;
        setAllProducts(data);
        const foundProduct = data.find(p => p.asin === asin);
        setProduct(foundProduct);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
      
    return ()=> mounted = false;
  }, [asin]);

  async function onFindSimilar(){
    setSimLoading(true);
    try{
      const res = await findSimilar({ mode: 'by_id', product_id: asin, method, k });
      
      // Convert ASINs to product objects
      const similarASINs = res.results || [];
      const similarProducts = similarASINs.map(similarAsin => {
        const fullProduct = allProducts.find(p => p.asin === similarAsin);
        if (!fullProduct) return null;
        
        return {
          asin: fullProduct.asin,
          title: fullProduct.title,
          description: fullProduct.description,
          price: fullProduct.price,
          imageURL: fullProduct.image_URL && fullProduct.image_URL.length > 0 
            ? fullProduct.image_URL[0] 
            : '/data/image.png',
          score: 0.000,
          is_ground_truth: false
        };
      }).filter(p => p !== null);
      
      setResults(similarProducts);
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

  // Use product images if available, otherwise use the placeholder
  const images =
    product.image_URL && product.image_URL.length > 0
      ? product.image_URL
      : ['/data/image.png'];

  const handlePrev = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Regex to validate price format: starts with $, followed by digits,
  // and optionally ends with a decimal and two digits.
  const isValidPrice = /^\$\d+(\.\d{2})?$/.test(product.price);
  const displayPrice = isValidPrice ? product.price : 'NA';

  // Only show carousel controls if there's more than one product image
  const showCarouselControls = product.image_URL && product.image_URL.length > 1;

  return (
    <div>
      <div className="flex gap-6 mb-6">
        <div className="relative overflow-hidden w-96 h-75 rounded shadow flex-shrink-0">
          <img 
            src={images[currentImageIndex]} 
            alt={product.title} 
            className="w-full h-full object-cover"
          />
          {showCarouselControls && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 p-1 rounded-full text-sm leading-none hover:bg-opacity-100"
                aria-label="Previous image"
              >
                ◀
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 p-1 rounded-full text-sm leading-none hover:bg-opacity-100"
                aria-label="Next image"
              >
                ▶
              </button>
            </>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{product.title}</h1>
          <div className="mt-2 text-sm text-gray-700">{product.description}</div>
          <div className="mt-4 text-lg font-semibold">Price: {displayPrice}</div>
          <div className="mt-3 text-sm text-gray-600">Brand: {product.brand || '—'}</div>
          {/* <div className="mt-1 text-sm text-gray-600">Sales Rank: {product.salesRank ? JSON.stringify(product.salesRank) : 'NA'}</div> */}
        </div>
      </div>
      
      <section className="mb-6 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-medium mb-2">Full details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold">Categories</h3>
            <div>{product.category && product.category.length > 0 ? product.category.join(' > ') : 'NA'}</div>

            <h3 className="mt-3 font-semibold">Tech Specs</h3>
            <div className="text-xs bg-gray-100 p-2 rounded">
              <div><strong>ASIN:</strong> {product.asin}</div>
              <div><strong>Brand:</strong> {product.brand || 'N/A'}</div>
              <div><strong>Price:</strong> {displayPrice}</div>
            </div>
          </div>
          <div>
            {/* Empty right column or add other content here */}
          </div>
        </div>
      </section>

      <section className="mb-6 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-medium mb-2">Find Similar Products</h2>
        <div className="flex items-center gap-3">
          <select value={method} onChange={e=>setMethod(e.target.value)} className="border rounded px-2 py-1">
            <option value="pst">Products with similar title (PST)</option>
            <option value="psd">Products with similar description (PSD)</option>
            <option value="pstd">Title + Description (PSTD)</option>
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
              {results.map(r => (
                <div key={r.asin} onClick={() => navigate(`/product/${r.asin}`)}>
                  <ResultCard product={r} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-medium mb-2">Related Items</h2>
        <div className="text-sm text-gray-700">
          <div><strong>Also bought: </strong> 
          {/* {product.also_buy && product.also_buy.length > 0 ? product.also_buy.join(', ') : 'NA'} */}
          {product.also_buy && product.also_buy.length > 0 ? (
                  product.also_buy.map((id, idx) => (
              <React.Fragment key={id}>
                <a
                  href={`/product/${id}`}
                  className="text-blue-600 hover:underline"
                  onClick={e => {
                    e.preventDefault();
                    navigate(`/product/${id}`);
                  }}
                >
                  {id}
                </a>
                {idx < product.also_buy.length - 1 ? ', ' : ''}
              </React.Fragment>
                  ))
                ) : (
                  'NA'
                )}
          </div>
          <div className="mt-1"><strong>Also viewed: </strong> 
          {/* {product.also_view && product.also_view.length > 0 ? product.also_view.join(', ') : 'NA'} */}
          {product.also_view && product.also_view.length > 0 ? (
                  product.also_view.map((id, idx) => (
              <React.Fragment key={id}>
                <a
                  href={`/product/${id}`}
                  className="text-blue-600 hover:underline"
                  onClick={e => {
                    e.preventDefault();
                    navigate(`/product/${id}`);
                  }}
                >
                  {id}
                </a>
                {idx < product.also_view.length - 1 ? ', ' : ''}
              </React.Fragment>
                  ))
                ) : (
                  'NA'
                )}
          </div>
          {/* <div className="mt-1"><strong>Similar:</strong> {product.similar_item ? product.similar_item.join(', ') : '—'}</div> */}
        </div>
      </section>

    </div>
  );
}