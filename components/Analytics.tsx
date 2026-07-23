'use client';

import Script from 'next/script';

/**
 * GA4 計装。NEXT_PUBLIC_GA_ID が設定されている場合のみ有効化する。
 * 未設定（ローカル等）では何も読み込まず、トラッキングも行わない。
 */
export function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`}
      </Script>
    </>
  );
}
