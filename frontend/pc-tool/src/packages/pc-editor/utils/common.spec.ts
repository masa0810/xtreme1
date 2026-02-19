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

    it('後方互換として LiDAR 単体時も既存呼び出しを壊さない', () => {
        const fileConfig = [{ dirName: 'pointcloud', url: '/lidar.pcd', name: 'lidar' }] as any;
        const result = createViewConfig(fileConfig, []);

        expect(result.pointsUrl).toBe('/lidar.pcd');
        expect(result.pointLayers.lidar?.url).toBe('/lidar.pcd');
    });

    it('camera_config が cameras 配列ラッパー形式でも画像設定を生成する', () => {
        const fileConfig = [
            { dirName: 'pointcloud', url: '/lidar.pcd', name: 'lidar' },
            { dirName: 'camera_image_0', url: '/cam0.png', name: '000100.png' },
        ] as any;
        const cameraInfo = {
            cameras: [
                {
                    cameraInternal: { fx: 1, fy: 1, cx: 2, cy: 3 },
                    cameraExternal: [
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        0, 0, 0, 1,
                    ],
                    width: 1225,
                    height: 820,
                    rowMajor: true,
                },
            ],
        } as any;

        const result = createViewConfig(fileConfig, cameraInfo);
        expect(result.config).toHaveLength(1);
        expect(result.config[0].imgUrl).toBe('/cam0.png');
    });

    it('camera_config が camera 配列ラッパー形式でも画像設定を生成する', () => {
        const fileConfig = [
            { dirName: 'pointcloud', url: '/lidar.pcd', name: 'lidar' },
            { dirName: 'camera_image_0', url: '/cam0.png', name: '000100.png' },
        ] as any;
        const cameraInfo = {
            camera: [
                {
                    cameraInternal: { fx: 1, fy: 1, cx: 2, cy: 3 },
                    cameraExternal: [
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        0, 0, 0, 1,
                    ],
                    width: 1225,
                    height: 820,
                    rowMajor: true,
                },
            ],
        } as any;

        const result = createViewConfig(fileConfig, cameraInfo);
        expect(result.config).toHaveLength(1);
        expect(result.config[0].imgUrl).toBe('/cam0.png');
    });

    it('camera_config の radars/radar を双方受理する', () => {
        const fileConfig = [{ dirName: 'pointcloud', url: '/lidar.pcd', name: 'lidar' }] as any;

        const withRadars = createViewConfig(fileConfig, {
            cameras: [],
            radars: [{ radar_external: [1, 0, 0, 0], rowMajor: true }],
        } as any);
        expect(withRadars.radarConfigs).toHaveLength(1);

        const withRadar = createViewConfig(fileConfig, {
            camera: [],
            radar: [{ radar_external: [1, 0, 0, 0], rowMajor: true }],
        } as any);
        expect(withRadar.radarConfigs).toHaveLength(1);
    });
});
