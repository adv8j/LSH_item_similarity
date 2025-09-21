import React from 'react';
import { Link } from 'react-router-dom';

export default function Header(){
  return (
    <header className="bg-white shadow">
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold">LSH Item Similarity</Link>
        <nav className="text-sm">
          <Link to="/" className="mr-4">Products</Link>
          {/* <a href="#" className="text-gray-500">Docs</a> */}
        </nav>
      </div>
    </header>
  );
}
