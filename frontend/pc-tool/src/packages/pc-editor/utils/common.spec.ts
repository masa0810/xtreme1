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

    it('LiDAR と Radar を別レイヤーとして抽出する', () => {
        const fileConfig = [
            { dirName: 'pointcloud', url: '/lidar.pcd', name: 'lidar' },
            { dirName: 'radar_pointcloud', url: '/radar.pcd', name: 'radar' },
            { dirName: 'image0', url: '/cam0.jpg', name: 'cam0' },
        ] as any;
        const result = createViewConfig(fileConfig, []);
        expect(result.pointLayers.lidar?.url).toBe('/lidar.pcd');
        expect(result.pointLayers.radar?.url).toBe('/radar.pcd');
    });

    it('Radar が無い場合でも LiDAR を抽出する', () => {
        const fileConfig = [{ dirName: 'pointcloud', url: '/lidar-only.pcd', name: 'lidar' }] as any;
        const result = createViewConfig(fileConfig, []);

        expect(result.pointLayers.lidar?.url).toBe('/lidar-only.pcd');
        expect(result.pointLayers.radar?.url).toBeUndefined();
    });
});
