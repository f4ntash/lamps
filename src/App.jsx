import React from "react";
import { useState } from 'react';
import ProductModal from './components/ProductModal.jsx';
import ProductGallery from './components/ProductGallery.jsx';
import hongoModel from './designs/Lamps/hongo.glb?url';
import lamp1Model from './designs/Lamps/Lamp1.glb?url';
import lamp2Model from './designs/Lamps/lamp2.glb?url';
import lamp3Model from './designs/Lamps/lamp3.glb?url';
import lamp4Model from './designs/Lamps/lamp4.glb?url';

const PRODUCTS = [
  {
    id: 'hongo',
    name: 'Lámpara Hongo',
    description: 'Lámpara decorativa de mesa',
    model: hongoModel
  },
  {
    id: 'lamp1',
    name: 'Aeris Pie',
    description: 'Lámpara de pie LED 8W',
    model: lamp1Model
  },
  {
    id: 'lamp2',
    name: 'Lámpara 2',
    description: 'Modelo de iluminación',
    model: lamp2Model
  },
  {
    id: 'lamp3',
    name: 'Lámpara 3',
    description: 'Modelo de iluminación',
    model: lamp3Model
  },
  {
    id: 'lamp4',
    name: 'Lámpara 4',
    description: 'Modelo de iluminación',
    model: lamp4Model
  }
];

export default function App() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLightOn, setIsLightOn] = useState(false);
  const [lightColor, setLightColor] = useState('warm');
  const [intensity, setIntensity] = useState(100);

  const handleSelectProduct = (product) => {
    setIsLightOn(false);
    setLightColor('warm');
    setIntensity(100);
    setSelectedProduct(product);
  };

  return (
    <main className="app-shell">
      {selectedProduct ? (
        <ProductModal
          product={selectedProduct}
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          isLightOn={isLightOn}
          setIsLightOn={setIsLightOn}
          lightColor={lightColor}
          setLightColor={setLightColor}
          intensity={intensity}
          setIntensity={setIntensity}
        />
      ) : (
        <ProductGallery products={PRODUCTS} onSelectProduct={handleSelectProduct} />
      )}
    </main>
  );
}
