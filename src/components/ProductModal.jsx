import React from "react";
import { useEffect, useRef } from 'react';
import ProductInfo from './ProductInfo.jsx';
import ProductControls from './ProductControls.jsx';
import ProductViewer from './ProductViewer.jsx';

export default function ProductModal({
  product,
  isOpen,
  onClose,
  isLightOn,
  setIsLightOn,
  lightColor,
  setLightColor,
  intensity,
  setIntensity
}) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    closeButtonRef.current?.focus();
    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <section
      className="product-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-title"
      aria-describedby="product-description"
    >
      <button
        ref={closeButtonRef}
        className="close-button"
        type="button"
        onClick={onClose}
        aria-label="Cerrar configurador"
      >
        <span aria-hidden="true">X</span>
      </button>

      <aside className="product-sidebar">
        <ProductInfo product={product} isLightOn={isLightOn} />
        <ProductControls
          isLightOn={isLightOn}
          setIsLightOn={setIsLightOn}
          lightColor={lightColor}
          setLightColor={setLightColor}
          intensity={intensity}
          setIntensity={setIntensity}
        />
      </aside>

      <ProductViewer
        isLightOn={isLightOn}
        lightColor={lightColor}
        intensity={intensity}
        modelUrl={product.model}
      />
    </section>
  );
}
