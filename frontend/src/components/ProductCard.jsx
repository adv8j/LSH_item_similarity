import React, { useState } from 'react';

export default function ProductCard({ product }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Use product images if available, otherwise use the placeholder
  const images =
    product.image_URL && product.image_URL.length > 0
      ? product.image_URL
      : ['/data/image.png'];

  const handlePrev = (e) => {
    // Prevent card click event when changing images
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleNext = (e) => {
    // Prevent card click event when changing images
    e.stopPropagation();
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
    <div className="bg-white rounded shadow p-3 flex flex-col h-full cursor-pointer hover:shadow-md">
      <div className="relative overflow-hidden w-full h-100 mb-2">
        <img
          src={images[currentImageIndex]}
          alt={product.title}
          className="w-80 h-80 object-cover rounded transform transition-transform duration-300 hover:scale-110 w-full h-full object-cover"
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

      <h3 className="font-medium text-sm">{product.title}</h3>
      <p className="text-xs text-gray-600 mt-1 line-clamp-3">{product.description}</p>

      <div className="mt-auto flex items-center justify-between pt-3">
        <div className="text-sm font-semibold">{displayPrice}</div>
        <div className="text-xs text-gray-500">{product.asin}</div>
      </div>
    </div>
  );
}