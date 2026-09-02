import ProductCard from "./ProductCard.jsx";

const copy = {
  es: {
    eyebrow: "Iluminación interactiva",
    title: "Diseñá la luz antes de verla.",
    description:
      "Explorá materiales, color e intensidad en tiempo real.",
    cta: "Configurar ahora",
    collection: "Colección",
  },
  en: {
    eyebrow: "Interactive lighting",
    title: "Design the light before you see it.",
    description:
      "Explore materials, color and intensity in real time.",
    cta: "Configure now",
    collection: "Collection",
  },
};

export default function ProductGallery({
  products,
  onSelectProduct,
  locale = "es",
}) {
  const t = copy[locale] ?? copy.es;
  const featured = products[0];

  return (
    <main className="product-showcase">
      <section className="showcase-hero">
        <div className="showcase-topbar">
          <span className="showcase-brand">CORSTENO</span>
          <span className="showcase-eyebrow">{t.eyebrow}</span>
        </div>

        <div className="showcase-main">
          <div className="showcase-copy">
            <h1>{t.title}</h1>

            <p>{t.description}</p>

            {featured && (
              <button
                className="showcase-cta"
                type="button"
                onClick={() => onSelectProduct(featured)}
              >
                {t.cta}
                <span aria-hidden="true">↗</span>
              </button>
            )}
          </div>

          <div className="showcase-product" aria-hidden="true">
            <div className="showcase-glow" />
            <div className="showcase-lamp">
              <span className="showcase-lamp-shade" />
              <span className="showcase-lamp-stem" />
              <span className="showcase-lamp-base" />
            </div>

            {featured && (
              <div className="showcase-featured-name">
                <span>01</span>
                <strong>{featured.name}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="showcase-selector">
          <span className="showcase-selector-label">{t.collection}</span>

          <div className="showcase-selector-list">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                onSelect={() => onSelectProduct(product)}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}