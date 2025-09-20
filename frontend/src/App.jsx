import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import ProductsPage from './pages/ProductsPage';
import ProductDetail from './pages/ProductDetail';
import Header from './components/Header';

export default function App(){
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<ProductsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:asin" element={<ProductDetail />} />
          <Route path="*" element={
            <div>
              <p>Page not found.</p>
              <Link to="/" className="text-blue-600">Go home</Link>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}
