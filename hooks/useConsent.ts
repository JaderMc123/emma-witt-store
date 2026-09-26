"use client";

import { useCallback, useEffect, useState } from "react";

export type Consent = { necessary: true; analytics: boolean; marketing: boolean; date: string; version: 1 };

const KEY = "ewc-consent";
export const OPEN_CONSENT_EVENT = "ewc:open-consent";

export function readConsent(): Consent | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
}

export function useConsent() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setConsent(readConsent());
    setLoaded(true);
  }, []);

  const save = useCallback((c: { analytics: boolean; marketing: boolean }) => {
    const value: Consent = { necessary: true, analytics: c.analytics, marketing: c.marketing, date: new Date().toISOString(), version: 1 };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(value));
    } catch {
      /* ignore */
    }
    setConsent(value);
    window.dispatchEvent(new CustomEvent("ewc:consent-changed", { detail: value }));
  }, []);

  return { consent, loaded, save };
}

export function openConsentPreferences() {
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}
