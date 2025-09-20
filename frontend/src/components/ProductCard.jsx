import React from 'react';

export default function ProductCard({ product }){
  return (
    <div className="bg-white rounded shadow p-3 flex flex-col h-full cursor-pointer hover:shadow-md">
      <img src={product.imageURL} alt={product.title} className="w-full h-40 object-cover rounded mb-2" />
      <h3 className="font-medium text-sm">{product.title}</h3>
      <p className="text-xs text-gray-600 mt-1 line-clamp-3">{product.description}</p>
      <div className="mt-auto flex items-center justify-between pt-3">
        <div className="text-sm font-semibold">${product.price ?? '—'}</div>
        <div className="text-xs text-gray-500">{product.asin}</div>
      </div>
    </div>
  );
}
