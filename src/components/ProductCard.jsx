export default function ProductCard({ product, onSelect }) {
  return (
    <button className="product-card" type="button" onClick={onSelect}>
      <span className="card-preview" aria-hidden="true">
        <span className="card-lamp-shape" />
      </span>
      <span className="card-copy">
        <strong>{product.name}</strong>
        <span>{product.description}</span>
      </span>
      <span className="card-action">Ver producto</span>
    </button>
  );
}
