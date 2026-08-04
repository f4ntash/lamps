import ColorSelector from './ColorSelector.jsx';

export default function ProductControls({
  isLightOn,
  setIsLightOn,
  lightColor,
  setLightColor,
  intensity,
  setIntensity
}) {
  return (
    <div className="product-controls" aria-label="Controles de iluminación">
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
          <strong>{intensity}%</strong>
        </span>
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
    </div>
  );
}
