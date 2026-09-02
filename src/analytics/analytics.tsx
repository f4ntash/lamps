import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = import.meta.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

function isLocalHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

export default function Analytics() {
  useEffect(() => {
    if (!measurementId) return;
    if (isLocalHostname(window.location.hostname)) return;

    // Evita cargar GA más de una vez
    if (window.gtag) return;

    const script = document.createElement("script");

    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;

    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];

    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args);
    };

    window.gtag("js", new Date());

    window.gtag("config", measurementId, {
      send_page_view: true,
    });

    return () => {
      // No removemos GA al desmontar porque es global
    };
  }, []);

  return null;
}