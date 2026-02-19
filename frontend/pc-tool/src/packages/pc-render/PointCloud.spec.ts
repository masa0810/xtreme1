import { describe, expect, it } from 'vitest';
import PointCloud from './PointCloud';

describe('PointCloud', () => {
    it('設計上、注釈対象はLiDARに固定される', () => {
        const pc = new PointCloud();
        expect(pc.getActiveAnnotationLayer()).toBe('lidar');
    });
});
