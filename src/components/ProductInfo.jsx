export default function ProductInfo({ product, isLightOn }) {
  return (
    <div className="product-description">
      <h4 id="product-title" >{product.name}</h4>
      <p id="product-description" >
        {product.description}
      </p>
    </div>
  );
}