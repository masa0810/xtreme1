import { describe, expect, it } from 'vitest';
import { createViewConfig } from './common';

describe('createViewConfig', () => {
    it('LiDAR がない場合に points を解決できない', () => {
        const { pointsUrl } = createViewConfig(
            [{ dirName: 'image0', url: '/a.jpg', name: 'a' } as any],
            [],
        );

        expect(pointsUrl).toBe('');
    });
});
