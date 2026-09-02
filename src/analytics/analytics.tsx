import { useEffect } from "react";
import {
  initializeAnalytics,
  trackPageView,
} from "./events";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    __corstenoAnalyticsInitialized?: boolean;
    __corstenoAnalyticsPageViewed?: boolean;
  }
}

const measurementId =
  import.meta.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

export default function Analytics() {
  useEffect(() => {
    initializeAnalytics(measurementId);
    trackPageView();
  }, []);

  return null;
}
