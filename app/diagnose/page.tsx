import type { Metadata } from 'next';
import DiagnoseClient from '@/components/diagnose/DiagnoseClient';

export const metadata: Metadata = {
  title: '二人のお金診断（無料・ログイン不要）',
  description:
    '年齢・年収・保険加入状況を入力するだけで、世帯の必要保障額と過剰保険チェック、効果額順の打ち手を無料で試算します。',
  alternates: { canonical: '/diagnose' },
};

export default function DiagnosePage() {
  return <DiagnoseClient />;
}
