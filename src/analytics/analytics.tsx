import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const measurementId =
  import.meta.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

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

    window.dataLayer = window.dataLayer || [];

    window.gtag = (...args: unknown[]) => {
      window.dataLayer.push(args);
    };

    const existingScript = document.querySelector(
      `script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`,
    );

    if (!existingScript) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);
    }

    window.gtag("js", new Date());

    window.gtag("config", measurementId, {
      send_page_view: true,
      page_path: window.location.pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, []);

  return null;
}