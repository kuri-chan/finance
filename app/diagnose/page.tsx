import type { Metadata } from 'next';
import DiagnoseClient from '@/components/diagnose/DiagnoseClient';

export const metadata: Metadata = {
  title: '無料で診断（ログイン不要）',
  description:
    '年齢・年収・保険や税制の状況を入力するだけで、世帯の必要保障額・過剰保険チェック・ふるさと納税・iDeCo・NISAの活用余地を、効果額順に無料で試算します。',
  alternates: { canonical: '/diagnose' },
};

export default function DiagnosePage() {
  return <DiagnoseClient />;
}
