import { describe, expect, it } from 'vitest';
import { formatInputNumberValue } from './numberFormat';

describe('formatInputNumberValue', () => {
    it('文字列入力でも例外を出さず表示値を返す', () => {
        expect(formatInputNumberValue('24.2')).toBe('24.2');
    });

    it('小数点2桁以上は1桁へ丸める', () => {
        expect(formatInputNumberValue('24.236082077026367')).toBe('24.2');
    });

    it('undefined は空文字として扱う', () => {
        expect(formatInputNumberValue(undefined)).toBe('');
    });
});
