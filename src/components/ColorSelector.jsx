const COLORS = [
  { id: 'warm', label: 'Luz cálida', value: '#ffd083', rgb: '255, 208, 131', three: 0xffd083 },
  { id: 'neutral', label: 'Luz neutra', value: '#f4f1e8', rgb: '244, 241, 232', three: 0xf4f1e8 },
];

export { COLORS };

export default function ColorSelector({ selectedColor, onChange }) {
  return (
    <fieldset className="color-selector">
      <legend>Color de luz</legend>
      <div className="color-options" role="radiogroup" aria-label="Color de luz">
        {COLORS.map((color) => (
          <button
            key={color.id}
            className={selectedColor === color.id ? 'color-option color-option-selected' : 'color-option'}
            type="button"
            role="radio"
            aria-checked={selectedColor === color.id}
            onClick={() => onChange(color.id)}
          >
            <span className="color-swatch" style={{ '--swatch-color': color.value }} aria-hidden="true" />
            <span>{color.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
