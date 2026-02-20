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

    it('Radar Visible の有無に依存せずレイヤーモードのみで可視性を制御する', () => {
        vi.stubGlobal('requestAnimationFrame', ((cb: any) => setTimeout(() => cb(0), 0)) as any);
        const pc = new PointCloud();
        const lidarPoints = pc.getOrCreateLidarPoints();
        const radarPoints = pc.getOrCreateRadarPoints();
        expect('setRadarVisible' in (pc as any)).toBe(false);
        pc.setPointLayerMode('lidar');
        expect(lidarPoints.visible).toBe(true);
        expect(radarPoints.visible).toBe(false);

        pc.setPointLayerMode('radar');
        expect(lidarPoints.visible).toBe(false);
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

    it('LiDAR と Radar の opacity を独立して更新できる', () => {
        vi.stubGlobal('requestAnimationFrame', ((cb: any) => setTimeout(() => cb(0), 0)) as any);
        const pc = new PointCloud();
        pc.setPointOpacity(0.2);
        pc.setRadarOpacity(0.7);

        expect(pc.material.getUniforms('globalOpacity')).toBe(0.2);
        expect(pc.radarMaterial.getUniforms('globalOpacity')).toBe(0.7);
        vi.unstubAllGlobals();
    });

    it('Radar の自動正規化を切り替えできる', () => {
        vi.stubGlobal('requestAnimationFrame', ((cb: any) => setTimeout(() => cb(0), 0)) as any);
        const pc = new PointCloud();
        pc.setRadarPointCloudData({
            position: [0, 0, 0, 1, 1, 1],
            intensity: [100, 200],
        });

        let raw = pc.getOrCreateRadarPoints().geometry.getAttribute('intensity') as THREE.BufferAttribute;
        expect(raw.array[0]).toBe(100);
        expect(raw.array[1]).toBe(200);

        pc.setRadarAutoNormalize(true);
        const normalized = pc
            .getOrCreateRadarPoints()
            .geometry.getAttribute('intensity') as THREE.BufferAttribute;
        expect(normalized.array[0]).toBe(0);
        expect(normalized.array[1]).toBe(255);

        pc.setRadarAutoNormalize(false);
        raw = pc.getOrCreateRadarPoints().geometry.getAttribute('intensity') as THREE.BufferAttribute;
        expect(raw.array[0]).toBe(100);
        expect(raw.array[1]).toBe(200);
        vi.unstubAllGlobals();
    });

    it('Radar は intensity 欠損時に snr を利用できる', () => {
        vi.stubGlobal('requestAnimationFrame', ((cb: any) => setTimeout(() => cb(0), 0)) as any);
        const pc = new PointCloud();
        pc.setRadarPointCloudData({
            position: [0, 0, 0, 1, 1, 1],
            snr: [3, 9],
        });
        let intensity = pc
            .getOrCreateRadarPoints()
            .geometry.getAttribute('intensity') as THREE.BufferAttribute;
        expect(pc.radarMaterial.option.hasIntensity).toBe(true);
        expect(intensity.array[0]).toBe(3);
        expect(intensity.array[1]).toBe(9);
        pc.setRadarAutoNormalize(true);
        intensity = pc.getOrCreateRadarPoints().geometry.getAttribute('intensity') as THREE.BufferAttribute;
        expect(intensity.array[0]).toBe(0);
        expect(intensity.array[1]).toBe(255);
        vi.unstubAllGlobals();
    });

    it('LiDAR の自動正規化を切り替えできる', () => {
        vi.stubGlobal('requestAnimationFrame', ((cb: any) => setTimeout(() => cb(0), 0)) as any);
        const pc = new PointCloud();
        pc.setPointCloudData({
            position: [0, 0, 0, 1, 1, 1],
            intensity: [10, 20],
        });
        let intensity = pc
            .getOrCreateLidarPoints()
            .geometry.getAttribute('intensity') as THREE.BufferAttribute;
        expect(intensity.array[0]).toBe(10);
        expect(intensity.array[1]).toBe(20);

        pc.setPointAutoNormalize(true);
        intensity = pc.getOrCreateLidarPoints().geometry.getAttribute('intensity') as THREE.BufferAttribute;
        expect(intensity.array[0]).toBe(0);
        expect(intensity.array[1]).toBe(255);
        vi.unstubAllGlobals();
    });
});
