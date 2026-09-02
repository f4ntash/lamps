export default function ProductCard({ product, index, onSelect }) {
  return (
    <button
      className="showcase-product-tab"
      type="button"
      onClick={onSelect}
      aria-label={`Abrir ${product.name}`}
    >
      <span>{String(index + 1).padStart(2, "0")}</span>
      <strong>{product.name}</strong>
      <span aria-hidden="true">↗</span>
    </button>
  );
}