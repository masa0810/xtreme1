import { describe, expect, it } from 'vitest';
import { getHeightRangeByGroundAndMax } from './position';

describe('getHeightRangeByGroundAndMax', () => {
    it('ground と max を返すため、最小値ではなく地面値を下限に使う', () => {
        const position = [
            0, 0, -1.3,
            1, 0, -1.2,
            2, 0, -1.2,
            3, 0, 24.2,
        ];

        expect(getHeightRangeByGroundAndMax(position)).toEqual([-1.2, 24.2]);
    });

    it('入力不正時は fallback を返す', () => {
        expect(getHeightRangeByGroundAndMax([], [-2, 10])).toEqual([-2, 10]);
    });
});
