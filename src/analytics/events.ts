type AnalyticsParams = Record<
  string,
  string | number | boolean | null | undefined
>;

const EXPERIENCE = "lighting_demo";
const LOCAL_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
]);

const configuredMeasurementId =
  import.meta.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

let activeMeasurementId = configuredMeasurementId;

function isBrowser() {
  return typeof window !== "undefined";
}

function isLocalHostname(hostname: string) {
  return LOCAL_HOSTNAMES.has(hostname);
}

function isDebugMode() {
  if (!isBrowser()) return false;

  return new URLSearchParams(window.location.search).get(
    "analytics_debug"
  ) === "true";
}

function getCommonParams() {
  if (!isBrowser()) {
    return {
      experience: EXPERIENCE,
    };
  }

  return {
    experience: EXPERIENCE,
    page_path: window.location.pathname,
    hostname: window.location.hostname,
  };
}

function cleanParams(params: AnalyticsParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
    })
  );
}

export function canUseAnalytics() {
  if (!isBrowser()) return false;
  if (!activeMeasurementId) return false;
  if (isLocalHostname(window.location.hostname)) return false;
  if (typeof window.gtag !== "function") return false;

  return true;
}

export function initializeAnalytics(measurementId?: string) {
  if (!isBrowser()) return;

  activeMeasurementId =
    measurementId?.trim() || activeMeasurementId;

  if (!activeMeasurementId) return;
  if (isLocalHostname(window.location.hostname)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    ((...args: unknown[]) => {
      window.dataLayer.push(args);
    });

  const existingScript = document.querySelector(
    `script[src*="googletagmanager.com/gtag/js?id=${activeMeasurementId}"]`
  );

  if (!existingScript) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${activeMeasurementId}`;
    document.head.appendChild(script);
  }

  if (window.__corstenoAnalyticsInitialized) return;

  window.__corstenoAnalyticsInitialized = true;
  window.gtag("js", new Date());
}

function ensureAnalyticsReady() {
  if (!isBrowser()) return;
  if (!activeMeasurementId) return;
  if (isLocalHostname(window.location.hostname)) return;
  if (typeof window.gtag === "function") return;

  initializeAnalytics(activeMeasurementId);
}

export function trackPageView() {
  ensureAnalyticsReady();

  if (!canUseAnalytics()) return;
  if (window.__corstenoAnalyticsPageViewed) return;

  window.__corstenoAnalyticsPageViewed = true;

  window.gtag("config", activeMeasurementId, {
    send_page_view: true,
    page_path: window.location.pathname,
    page_location: window.location.href,
    page_title: document.title,
    ...(isDebugMode() ? { debug_mode: true } : {}),
  });
}

export function trackEvent(
  name: string,
  params: AnalyticsParams = {}
) {
  const payload = cleanParams({
    ...getCommonParams(),
    ...params,
    ...(isDebugMode() ? { debug_mode: true } : {}),
  });

  if (isDebugMode()) {
    console.debug("[analytics]", name, payload);
  }

  ensureAnalyticsReady();

  if (!canUseAnalytics()) return;

  window.gtag("event", name, payload);
}

export function getProductParams(product?: {
  id?: string;
  name?: string;
}) {
  return {
    product_id: product?.id,
    product_name: product?.name,
  };
}

export function trackProductOpened(product?: {
  id?: string;
  name?: string;
}) {
  trackEvent("product_opened", getProductParams(product));
}

export function trackProductClosed(product?: {
  id?: string;
  name?: string;
}) {
  trackEvent("product_closed", getProductParams(product));
}

export function trackPostGameCtaClicked(params: {
  cta_id: string;
  cta_label: string;
  destination: string;
  destination_type: string;
}) {
  trackEvent("post_game_cta_clicked", params);
}
