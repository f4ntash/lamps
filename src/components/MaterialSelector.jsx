const FINISHES = [
  { id: 'original', label: 'Original', swatchClass: 'swatch-original' },
  { id: 'metal', label: 'Metalizado', swatchClass: 'swatch-metal' },
  { id: 'white', label: 'Blanco', swatchClass: 'swatch-white' },
  { id: 'black', label: 'Negro', swatchClass: 'swatch-black' },
];

function normalizeFinish(finish) {
  return FINISHES.some((option) => option.id === finish) ? finish : 'original';
}

export default function MaterialSelector({ selectedFinish, onChange }) {
  const currentFinish = normalizeFinish(selectedFinish);

  return (
    <fieldset className="material-selector">
      <legend>Aspecto de la lámpara</legend>

      <div className="material-options">
        {FINISHES.map((finish) => (
          <button
            key={finish.id}
            type="button"
            className={
              finish.id === currentFinish
                ? 'material-option material-option-selected'
                : 'material-option'
            }
            aria-pressed={finish.id === currentFinish}
            onClick={() => onChange(finish.id)}
          >
            <span className={`material-swatch ${finish.swatchClass}`} aria-hidden="true" />
            {finish.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}