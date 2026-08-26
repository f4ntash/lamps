const DEFAULT_COLOR = '#ffd083';
const WARM_PRESET = '#ffd083';
const COOL_PRESET = '#cfe8ff';

function normalizeHex(hex) {
  if (typeof hex !== 'string') return DEFAULT_COLOR;
  const value = hex.trim();
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : DEFAULT_COLOR;
}

export default function ColorSelector({ selectedColor, onChange }) {
  const currentHex = normalizeHex(selectedColor);

  const handleHexInput = (event) => {
    const value = event.target.value;
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      onChange(value);
    }
  };

  return (
    <fieldset className="color-selector">
      <legend>Color de luz</legend>

      <div className="color-picker-row">
        <span
          className="color-swatch color-swatch-lg"
          style={{ '--swatch-color': currentHex }}
          aria-hidden="true"
        />
        <input
          type="color"
          className="color-native-input"
          value={currentHex}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Seleccionar color de luz"
        />
        <input
          type="text"
          className="color-hex-input"
          value={currentHex}
          onChange={handleHexInput}
          maxLength={7}
          spellCheck={false}
          aria-label="Código hexadecimal del color de luz"
        />
      </div>

      <div className="color-presets">
        <button
          type="button"
          className={currentHex.toLowerCase() === WARM_PRESET ? 'preset-button preset-button-selected' : 'preset-button'}
          onClick={() => onChange(WARM_PRESET)}
        >
          <span className="color-swatch" style={{ '--swatch-color': WARM_PRESET }} aria-hidden="true" />
          Luz cálida
        </button>
        <button
          type="button"
          className={currentHex.toLowerCase() === COOL_PRESET ? 'preset-button preset-button-selected' : 'preset-button'}
          onClick={() => onChange(COOL_PRESET)}
        >
          <span className="color-swatch" style={{ '--swatch-color': COOL_PRESET }} aria-hidden="true" />
          Luz fría
        </button>
      </div>
    </fieldset>
  );
}