/**
 * GA4イベント発火の薄い安全ラッパ。
 * gtag未定義（GA_ID未設定・ローカル・読込前）でも安全にno-opする。
 * PIIは送らない方針：type/flavor/step/segment 等の集約・分類値のみを渡すこと。
 */

type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: 'event', name: string, params?: GtagParams) => void;
  }
}

export function trackEvent(name: string, params?: GtagParams): void {
  if (typeof window === 'undefined') return;
  try {
    window.gtag?.('event', name, params);
  } catch {
    /* 計測失敗はUXに影響させない */
  }
}
