import React, { useEffect, useRef } from "react";
import ProductControls from "./ProductControls.jsx";
import ProductViewer from "./ProductViewer.jsx";

export default function ProductModal({
  product,
  isOpen,
  onClose,
  isLightOn,
  setIsLightOn,
  lightColor,
  setLightColor,
  intensity,
  setIntensity,
  lampMaterial,
  setLampMaterial,
}) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    closeButtonRef.current?.focus();
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <section
      className="product-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-title"
      aria-describedby="product-description"
    >
      <div className="product-modal__topbar">
        <div className="product-modal__brand">
          <span>CORSTENO</span>
          <span>Configurador interactivo</span>
        </div>

        <button
          ref={closeButtonRef}
          className="close-button"
          type="button"
          onClick={onClose}
          aria-label="Cerrar configurador"
        >
          <span>Cerrar</span>
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="product-modal__viewer">
        <ProductViewer
          isLightOn={isLightOn}
          lightColor={lightColor}
          intensity={intensity}
          materialFinish={lampMaterial}
          modelUrl={product.model}
          rotation={product.rotation ?? 0}
          rotationAxis={product.rotationAxis ?? "y"}
          modelBottomY={product.modelBottomY ?? 0}
        />

        <aside className="product-modal__controls">
          <ProductControls
            product={product}
            isLightOn={isLightOn}
            setIsLightOn={setIsLightOn}
            lightColor={lightColor}
            setLightColor={setLightColor}
            intensity={intensity}
            setIntensity={setIntensity}
            lampMaterial={lampMaterial}
            setLampMaterial={setLampMaterial}
          />
        </aside>

        <div className="product-modal__hint">
          Arrastrá para explorar
        </div>
      </div>
    </section>
  );
}