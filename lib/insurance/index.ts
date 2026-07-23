/**
 * 保険エンジンの公開API。
 * すべて純粋関数。情報提供・シミュレーション用途であり、募集・助言・税務相談ではない。
 */
export { calcRequiredCoverage } from './requiredCoverage';
export { checkOverInsurance } from './overInsurance';
export { summarize } from './summarize';
export { DISCLAIMER, SOURCES } from './disclaimer';
export { DEFAULT_ASSUMPTIONS, resolveAssumptions } from './constants';
export type * from './types';
