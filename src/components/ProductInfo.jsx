export default function ProductInfo({ product, isLightOn }) {
  return (
    <div className="product-info">
      <h4 id="product-title">{product.name}</h4>
      <p id="product-description" className="product-description">
        {product.description}
      </p>
    </div>
  );
}
