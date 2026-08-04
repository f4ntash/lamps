import ProductCard from './ProductCard.jsx';

export default function ProductGallery({ products, onSelectProduct }) {
  return (
    <section className="product-gallery" aria-labelledby="gallery-title">
      <header className="gallery-header">
        <h1 id="gallery-title">Seleccioná una lámpara</h1>
        <p>Elegí un modelo para abrir el configurador interactivo.</p>
      </header>

      <div className="gallery-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onSelect={() => onSelectProduct(product)}
          />
        ))}
      </div>
    </section>
  );
}
