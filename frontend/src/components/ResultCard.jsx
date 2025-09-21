import React from 'react';

export default function ResultCard({ product }){
  return (
    <div className="bg-white rounded shadow p-3 flex flex-col h-full cursor-pointer hover:shadow-md">
      <img src={product.imageURL} alt={product.title} className="w-full h-28 object-cover rounded mb-2" />
      <h4 className="font-medium text-sm">{product.title}</h4>
      <p className="text-xs text-gray-600 mt-1 line-clamp-3">{product.description}</p>
      <div className="mt-auto text-xs text-gray-500 pt-2">{product.asin}</div>
    </div>
  );
}
