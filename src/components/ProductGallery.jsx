import ProductCard from "./ProductCard.jsx";
import LampDeconstructed from "./LampDeconstructed.jsx";
const copy = {
  es: {
    topbarLabel: "Iluminación interactiva",
    eyebrow: "DEMO INTERACTIVA",
    title:
      "Si podemos gamificar una lámpara, imaginá tu catálogo.",
    description:
      "Arrastrá las piezas, armá el producto y descubrí qué se desbloquea al terminar.",
    cta: "Configurar ahora",
    collection: "Colección",
  },
  en: {
    topbarLabel: "Interactive lighting",
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
  onExploreRandomModel,
  locale = "es",
}) {
  const t = copy[locale] ?? copy.es;
 
  return (
    <main className="product-showcase">
      <section className="showcase-hero">
        <div className="showcase-topbar">
          <span className="showcase-brand">CORSTENO</span>
          <span className="showcase-eyebrow">
            {t.topbarLabel}
          </span>
        </div>

        <div className="showcase-main">
          <div className="showcase-copy">
            <span className="showcase-copy__eyebrow">
              {t.eyebrow}
            </span>

            <h1>{t.title}</h1>

            <p>{t.description}</p>

          </div>

          <div className="showcase-product">
            <div className="showcase-glow" />
            <div className="showcase-lamp">
          <LampDeconstructed
            onExploreRandomModel={onExploreRandomModel}
          />
            </div>
          </div>
        </div>

        <div className="showcase-selector" id="modelos-3d">
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
