import { trackEvent } from "../analytics/events";

export default function CorstenoLink() {
  return (
    <a
      className="corsteno-link"
      href="https://corsteno.com/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visitar sitio principal de Corsteno"
      onClick={() =>
        trackEvent("corsteno_site_clicked", {
          placement: "global_fixed_link",
          destination: "https://corsteno.com/",
        })
      }
    >
      <span>CORSTENO</span>
      <span>Sitio principal</span>
      <span aria-hidden="true">↗</span>
    </a>
  );
}
