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
  return (
    <div className="product-controls" aria-label="Controles de iluminación">
                      <ProductInfo product={product} isLightOn={isLightOn} />
      <button
        className="power-button"
        type="button"
        aria-pressed={isLightOn}
        onClick={() => setIsLightOn((current) => !current)}
      >
        {isLightOn ? 'Apagar luz' : 'Prender luz'}
      </button>

      <ColorSelector selectedColor={lightColor} onChange={setLightColor} />

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
          onChange={(event) => setIntensity(Number(event.target.value))}
          aria-valuetext={`${intensity} por ciento`}
        />
      </label>

      <hr className="controls-divider" aria-hidden="true" />

      <MaterialSelector selectedFinish={lampMaterial} onChange={setLampMaterial} />
          
      
    </div>
  );
}