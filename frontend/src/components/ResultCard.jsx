import React from 'react';

export default function ResultCard({ product }){
  return (
    <div className="bg-white rounded shadow p-3 flex flex-col h-full">
      <img src={product.imageURL} alt={product.title} className="w-full h-28 object-cover rounded mb-2" />
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">{product.title}</h4>
        <div className="text-xs px-2 py-0.5 rounded text-white" style={{ background: product.is_ground_truth ? '#16a34a' : '#6b7280' }}>
          {product.is_ground_truth ? 'GT' : 'Result'}
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-1 line-clamp-3">{product.description}</p>
      <div className="mt-auto flex items-center justify-between text-sm pt-2">
        <div>Score: <strong>{Number(product.score ?? 0).toFixed(3)}</strong></div>
        <div className="text-xs text-gray-500">{product.asin}</div>
      </div>
    </div>
  );
}
