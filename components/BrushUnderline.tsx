import type { ReactNode } from 'react';

/**
 * キーワードを“筆で引いた抜きのあるアンダーライン”で強調（左→右に一気に引く）。
 * ヒーローと同じトーンをサイト全体で使い回すための共通部品。
 * 装飾のみ（aria-hidden）。文字色は継承（必要なら className で指定）。
 */
export function BrushUnderline({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`relative inline-block whitespace-nowrap ${className ?? ''}`}>
      {children}
      <svg
        aria-hidden
        viewBox="0 0 240 34"
        preserveAspectRatio="none"
        className="animate-swipe pointer-events-none absolute -bottom-[0.08em] left-0 h-[0.32em] w-full"
      >
        <path
          d="M4,20 C66,9 158,7 233,3 C238,3 238,9 233,11 C160,17 68,21 12,30 C6,31 2,25 4,20 Z"
          fill="#34d399"
        />
      </svg>
    </span>
  );
}
