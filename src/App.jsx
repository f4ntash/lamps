import React from "react";
import { useState } from 'react';
import ProductModal from './components/ProductModal.jsx';
import ProductGallery from './components/ProductGallery.jsx';
import hongoModel from './designs/Lamps/lamp0.glb?url';
import lamp1Model from './designs/Lamps/Lamp1.glb?url';
import lamp2Model from './designs/Lamps/lamp2.glb?url';
import lamp3Model from './designs/Lamps/lamp3.glb?url';
import lamp4Model from './designs/Lamps/lamp4.glb?url';

const PRODUCTS = [
  {
    id: 'lamp0',
    name: 'Conde',
    description: 'Lámpara de pie con diseño ancestral.',
    model: hongoModel
  },
  {
    id: 'lamp1',
    name: 'Aeris Pie',
    description: 'Lámpara de pie con LED 8W. Tamaño: 120 cm x 30 cm x 30 cm.',
    model: lamp1Model
  },
  {
    id: 'lamp2',
    name: 'Velador Fëavan',
    description: 'Una luz que se modula, creando atmósferas para cada instante.',
    model: lamp2Model
  },
  {
    id: 'lamp3',
    name: 'Aurigny',
    description: 'Lampara de techo, iluminación moderna, resultados infalibles.',
    model: lamp3Model,
    rotation: 180,
    rotationAxis: 'x',
    modelBottomY: 2.5
  },
  {
    id: 'lamp4',
    name: 'Velador Wood',
    description: 'Lampara para dormitorio, materiales robustos y diseño clasico',
    model: lamp4Model
  }
];

export default function App() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLightOn, setIsLightOn] = useState(false);
  const [lightColor, setLightColor] = useState('#ffd083');
  const [intensity, setIntensity] = useState(100);
  const [lampMaterial, setLampMaterial] = useState('original');

  const handleSelectProduct = (product) => {
    setIsLightOn(false);
    setLightColor('#ffd083');
    setIntensity(0);
    setLampMaterial('original');
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
          lampMaterial={lampMaterial}
          setLampMaterial={setLampMaterial}
        />
      ) : (
        <ProductGallery products={PRODUCTS} onSelectProduct={handleSelectProduct} />
      )}
    </main>
  );
}