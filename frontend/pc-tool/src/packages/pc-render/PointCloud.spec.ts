import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import PointCloud from './PointCloud';

describe('PointCloud', () => {
    it('設計上、注釈対象はLiDARに固定される', () => {
        const pc = new PointCloud();
        expect(pc.getActiveAnnotationLayer()).toBe('lidar');
    });

    it('LiDAR の表示設定を Radar にも同期できる', () => {
        const pc = new PointCloud();
        const pointHeight = new THREE.Vector2(-1, 2);
        pc.setSharedPointUniforms({ colorMode: 0, pointHeight });

        expect(pc.material.getUniforms('colorMode')).toBe(0);
        expect(pc.radarMaterial.getUniforms('colorMode')).toBe(0);
        expect((pc.radarMaterial.getUniforms('pointHeight') as THREE.Vector2).x).toBe(-1);
        expect((pc.radarMaterial.getUniforms('pointHeight') as THREE.Vector2).y).toBe(2);
    });

    it('LiDAR の強度有効化オプションを Radar にも同期できる', () => {
        const pc = new PointCloud();
        pc.setSharedPointOption({ hasIntensity: true, hasRGB: false, hasVelocity: false });

        expect(pc.material.option.hasIntensity).toBe(true);
        expect(pc.radarMaterial.option.hasIntensity).toBe(true);
    });
});
