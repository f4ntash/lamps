import { useEffect, useRef } from 'react';
import {
  getProductParams,
  trackEvent,
} from '../analytics/events';
import ColorSelector from './ColorSelector.jsx';
import MaterialSelector from './MaterialSelector.jsx';
import ProductInfo from './ProductInfo.jsx';

export default function ProductControls({
  isLightOn,
  setIsLightOn,
  lightColor,
  setLightColor,
  intensity,
  setIntensity,
  lampMaterial,
  setLampMaterial,
  product,
}) {
  const intensityDebounceRef = useRef(null);
  const latestIntensityRef = useRef(intensity);
  const productParams = getProductParams(product);

  useEffect(() => {
    latestIntensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    return () => {
      if (intensityDebounceRef.current) {
        window.clearTimeout(intensityDebounceRef.current);
      }
    };
  }, []);

  function handleLightToggle() {
    const nextLightState = !isLightOn;

    setIsLightOn(nextLightState);
    trackEvent('light_toggled', {
      ...productParams,
      light_on: nextLightState,
    });
  }

  function handleLightColorChange(nextColor) {
    setLightColor(nextColor);

    if (nextColor === lightColor) return;

    trackEvent('light_color_changed', {
      ...productParams,
      light_color: nextColor,
    });
  }

  function trackIntensityChange(value) {
    trackEvent('light_intensity_changed', {
      ...productParams,
      intensity: value,
    });
  }

  function scheduleIntensityTrack(value) {
    latestIntensityRef.current = value;

    if (intensityDebounceRef.current) {
      window.clearTimeout(intensityDebounceRef.current);
    }

    intensityDebounceRef.current = window.setTimeout(() => {
      intensityDebounceRef.current = null;
      trackIntensityChange(latestIntensityRef.current);
    }, 650);
  }

  function flushIntensityTrack() {
    if (!intensityDebounceRef.current) return;

    window.clearTimeout(intensityDebounceRef.current);
    intensityDebounceRef.current = null;
    trackIntensityChange(latestIntensityRef.current);
  }

  function handleIntensityChange(event) {
    const nextIntensity = Number(event.target.value);

    setIntensity(nextIntensity);
    scheduleIntensityTrack(nextIntensity);
  }

  function handleIntensityKeyUp(event) {
    if (
      [
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
        'PageUp',
        'PageDown',
      ].includes(event.key)
    ) {
      flushIntensityTrack();
    }
  }

  function handleMaterialChange(nextMaterial) {
    setLampMaterial(nextMaterial);

    if (nextMaterial === lampMaterial) return;

    trackEvent('lamp_material_changed', {
      ...productParams,
      material: nextMaterial,
    });
  }

  return (
    <div className="product-controls" aria-label="Controles de iluminación">
                      <ProductInfo product={product} isLightOn={isLightOn} />
      <button
        className="power-button"
        type="button"
        aria-pressed={isLightOn}
        onClick={handleLightToggle}
      >
        {isLightOn ? 'Apagar luz' : 'Prender luz'}
      </button>

      <ColorSelector selectedColor={lightColor} onChange={handleLightColorChange} />

      <label className="slider-field" htmlFor="intensity-control">
        <span>
          Intensidad
        </span>          <strong>{intensity}%</strong>
        <input
          id="intensity-control"
          type="range"
          min="0"
          max="100"
          value={intensity}
          onChange={handleIntensityChange}
          onPointerUp={flushIntensityTrack}
          onTouchEnd={flushIntensityTrack}
          onKeyUp={handleIntensityKeyUp}
          onBlur={flushIntensityTrack}
          aria-valuetext={`${intensity} por ciento`}
        />
      </label>

      <hr className="controls-divider" aria-hidden="true" />

      <MaterialSelector selectedFinish={lampMaterial} onChange={handleMaterialChange} />
          
      
    </div>
  );
}
