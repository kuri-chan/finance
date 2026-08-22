import type { Metadata } from 'next';
import CoupleClient from '@/components/couple/CoupleClient';

export const metadata: Metadata = {
  title: '結婚したら お金の設計 無料診断',
  description:
    '結婚・同棲したら最初にやる、二人のお金の設計図。30秒5問で、二人の“どうぶつタイプ”と口座・保険・貯金の方針が一枚のカードに。ログイン不要・無料、売り込みなし（情報提供・シミュレーション）。',
  alternates: { canonical: '/couple' },
  openGraph: {
    title: '結婚したら お金の設計 無料診断｜手取りラボ',
    description: '30秒5問で、二人の“どうぶつタイプ”とお金の方針が一枚の設計図に。ログイン不要・無料。',
    images: [{ url: '/api/og?v=couple&rev=1', width: 1200, height: 630 }],
  },
};

export default function CouplePage() {
  return <CoupleClient />;
}
