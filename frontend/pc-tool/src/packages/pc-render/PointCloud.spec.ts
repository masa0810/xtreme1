import { describe, expect, it, vi } from 'vitest';
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

    it('点群表示モードを LiDAR / Radar / Both で切り替えできる', () => {
        vi.stubGlobal('requestAnimationFrame', ((cb: any) => setTimeout(() => cb(0), 0)) as any);
        const pc = new PointCloud();
        const lidarPoints = pc.getOrCreateLidarPoints();
        const radarPoints = pc.getOrCreateRadarPoints();

        pc.setPointLayerMode('lidar');
        expect(lidarPoints.visible).toBe(true);
        expect(radarPoints.visible).toBe(false);

        pc.setPointLayerMode('radar');
        expect(lidarPoints.visible).toBe(false);
        expect(radarPoints.visible).toBe(true);

        pc.setPointLayerMode('both');
        expect(lidarPoints.visible).toBe(true);
        expect(radarPoints.visible).toBe(true);

        vi.unstubAllGlobals();
    });

    it('LiDAR と Radar の色設定を独立して更新できる', () => {
        vi.stubGlobal('requestAnimationFrame', ((cb: any) => setTimeout(() => cb(0), 0)) as any);
        const pc = new PointCloud();
        pc.setPointUniforms({ colorMode: 0 });
        pc.setRadarUniforms({ colorMode: 1 });

        expect(pc.material.getUniforms('colorMode')).toBe(0);
        expect(pc.radarMaterial.getUniforms('colorMode')).toBe(1);
        vi.unstubAllGlobals();
    });

    it('Radar 属性を選択して自動正規化を切り替えできる', () => {
        vi.stubGlobal('requestAnimationFrame', ((cb: any) => setTimeout(() => cb(0), 0)) as any);
        const pc = new PointCloud();
        pc.setRadarPointCloudData({
            position: [0, 0, 0, 1, 1, 1],
            intensity: [10, 20],
            snr: [100, 200],
        });

        pc.setRadarColorAttr('snr');
        const normalized = pc
            .getOrCreateRadarPoints()
            .geometry.getAttribute('intensity') as THREE.BufferAttribute;
        expect(normalized.array[0]).toBe(0);
        expect(normalized.array[1]).toBe(255);

        pc.setRadarAutoNormalize(false);
        const raw = pc.getOrCreateRadarPoints().geometry.getAttribute('intensity') as THREE.BufferAttribute;
        expect(raw.array[0]).toBe(100);
        expect(raw.array[1]).toBe(200);
        vi.unstubAllGlobals();
    });

    it('選択属性が欠損しても Radar は利用可能な属性へフォールバックする', () => {
        vi.stubGlobal('requestAnimationFrame', ((cb: any) => setTimeout(() => cb(0), 0)) as any);
        const pc = new PointCloud();
        pc.setRadarColorAttr('snr');
        pc.setRadarPointCloudData({
            position: [0, 0, 0, 1, 1, 1],
            intensity: [3, 9],
        });
        const intensity = pc
            .getOrCreateRadarPoints()
            .geometry.getAttribute('intensity') as THREE.BufferAttribute;
        expect(pc.radarMaterial.option.hasIntensity).toBe(true);
        expect(intensity.array[0]).toBe(0);
        expect(intensity.array[1]).toBe(255);
        vi.unstubAllGlobals();
    });
});
