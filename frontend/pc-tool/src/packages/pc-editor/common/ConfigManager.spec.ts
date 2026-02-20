import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';

function createEditorStub() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -1, 1, 1, 2], 3));
    geometry.setAttribute('intensity', new THREE.Float32BufferAttribute([10, 20], 1));
    geometry.computeBoundingBox();

    const points = { geometry };
    const editor: any = {
        state: {
            config: {
                pointIntensity: [0, 255] as [number, number],
                pointInfo: {
                    hasIntensity: false,
                    hasVelocity: false,
                    hasRGB: false,
                    intensityRange: new THREE.Vector2(),
                    min: new THREE.Vector3(),
                    max: new THREE.Vector3(),
                    count: 0,
                    vCount: 0,
                },
                heightRange: [-10000, 10000] as [number, number],
                pointHeight: [0, 10000] as [number, number],
                pointVelocity: [-Infinity, Infinity] as [number, number],
                edgeColor: ['#000dff', '#ff0000'],
                pointSize: 0.1,
            },
        },
        pc: {
            groupPoints: { children: [points] },
            ground: { plane: { constant: 0 } },
            setSharedPointOption: vi.fn(),
            setSharedPointUniforms: vi.fn(),
        },
    };
    return { editor };
}

describe('ConfigManager', () => {
    it('intensityRange 未指定でも intensity 属性があれば hasIntensity を維持する', async () => {
        vi.mock('../utils', () => ({
            getColorRangeByArray: vi.fn(),
            countVisiblePointN: vi.fn(),
        }));
        const { default: ConfigManager } = await import('./ConfigManager');
        const { editor } = createEditorStub();
        const manager = new ConfigManager(editor);

        manager.updatePointConfig(0);

        expect(editor.state.config.pointInfo.hasIntensity).toBe(true);
        expect(editor.state.config.pointInfo.intensityRange.x).toBe(10);
        expect(editor.state.config.pointInfo.intensityRange.y).toBe(20);
    });
});
