import { IFrame, IFileConfig } from '../type';
import { IImgViewConfig, IUserData } from 'pc-editor';
import DataManager from '../common/DataManager';
import * as THREE from 'three';

export function isMatrixColumnMajor(elements: number[]) {
    let rightZero = elements[3] === 0 && elements[7] === 0 && elements[11] === 0;
    let bottomHasOne = !!elements[12] || !!elements[13] || !!elements[14];
    return rightZero && bottomHasOne;
}

export function translateCameraConfig(info: any) {
    let cameraExternal = info?.cameraExternal || info?.camera_external;
    let cameraInternal = info?.cameraInternal || info?.camera_internal;

    if (!info || !cameraExternal || cameraExternal.length !== 16) return null;

    // to rowMajor
    if (info.rowMajor === false || isMatrixColumnMajor(cameraExternal)) {
        let matrix = new THREE.Matrix4();
        matrix.elements = cameraExternal;
        matrix.transpose();
        cameraExternal = matrix.elements;
    }

    return { cameraExternal, cameraInternal };
}

function normalizeRadarExternal(info: any): number[] | null {
    const radarExternal = info?.radarExternal || info?.radar_external;
    if (!Array.isArray(radarExternal) || radarExternal.length !== 16) {
        return null;
    }

    const normalized = radarExternal.map((value: unknown) => Number(value));
    if (normalized.some((value) => !isFinite(value))) {
        return null;
    }

    if (info?.rowMajor === false || isMatrixColumnMajor(normalized)) {
        const matrix = new THREE.Matrix4();
        matrix.elements = normalized;
        matrix.transpose();
        return [...matrix.elements];
    }

    return normalized;
}

export function getRadarTransformMatrix(radarConfigs?: any[]): THREE.Matrix4 | null {
    if (!Array.isArray(radarConfigs) || radarConfigs.length === 0) {
        return null;
    }

    for (const radarConfig of radarConfigs) {
        const rowMajorMatrix = normalizeRadarExternal(radarConfig);
        if (!rowMajorMatrix) {
            continue;
        }

        return new THREE.Matrix4().set(
            rowMajorMatrix[0],
            rowMajorMatrix[1],
            rowMajorMatrix[2],
            rowMajorMatrix[3],
            rowMajorMatrix[4],
            rowMajorMatrix[5],
            rowMajorMatrix[6],
            rowMajorMatrix[7],
            rowMajorMatrix[8],
            rowMajorMatrix[9],
            rowMajorMatrix[10],
            rowMajorMatrix[11],
            rowMajorMatrix[12],
            rowMajorMatrix[13],
            rowMajorMatrix[14],
            rowMajorMatrix[15],
        );
    }

    return null;
}

export function transformPointCloudPosition(pointsData: any, matrix: THREE.Matrix4) {
    const position = pointsData?.position;
    if (!Array.isArray(position) || position.length < 3 || position.length % 3 !== 0) {
        return pointsData;
    }

    const vector = new THREE.Vector3();
    const transformedPosition = new Array<number>(position.length);

    for (let i = 0; i < position.length; i += 3) {
        vector.set(Number(position[i]), Number(position[i + 1]), Number(position[i + 2]));
        vector.applyMatrix4(matrix);

        transformedPosition[i] = vector.x;
        transformedPosition[i + 1] = vector.y;
        transformedPosition[i + 2] = vector.z;
    }

    return {
        ...pointsData,
        position: transformedPosition,
    };
}

export function clamRange(v: number, min: number, max: number) {
    return Math.max(Math.min(max, v), min);
}

export function createViewConfig(fileConfig: IFileConfig[], cameraInfo: any[]) {
    let viewConfig = [] as IImgViewConfig[];
    let pointsUrl = '';
    const regLidar = new RegExp(/point(_?)cloud/i);
    const regRadar = new RegExp(/radar(_?)point(_?)cloud/i);
    const regImage = new RegExp(/image/i);
    const pointLayers = {
        lidar: undefined as undefined | { url: string; name: string },
        radar: undefined as undefined | { url: string; name: string },
    };
    fileConfig.forEach((e) => {
        if (regRadar.test(e.dirName)) {
            pointLayers.radar = { url: e.url, name: e.name };
        } else if (regLidar.test(e.dirName)) {
            pointsUrl = e.url;
            pointLayers.lidar = { url: e.url, name: e.name };
        } else if (regImage.test(e.dirName)) {
            const index = +(e.dirName.match(/[0-9]{1,5}$/) as any)[0];
            viewConfig[index] = {
                cameraInternal: { fx: 0, fy: 0, cx: 0, cy: 0 },
                cameraExternal: [],
                imgSize: [0, 0],
                imgUrl: e.url,
                name: e.name,
                imgObject: null as any,
            };
        }
    });
    viewConfig = viewConfig.filter((e) => !!e);
    const cameraInfoList = normalizeCameraInfoList(cameraInfo);
    const radarConfigs = normalizeRadarInfoList(cameraInfo);
    viewConfig.forEach((config, index) => {
        let info = cameraInfoList[index];

        let translateInfo = translateCameraConfig(info);
        if (!translateInfo) return;

        config.cameraExternal = translateInfo.cameraExternal;
        config.cameraInternal = translateInfo.cameraInternal;
        config.imgSize = [info.width, info.height];
        // config.rowMajor = info.rowMajor;
    });

    // filter
    viewConfig = viewConfig.filter((e) => e.cameraExternal.length === 16 && e.cameraInternal);
    pointsUrl = pointLayers.lidar?.url || pointsUrl;

    return { pointsUrl, config: viewConfig, pointLayers, radarConfigs };
}

function normalizeCameraInfoList(cameraInfo: any): any[] {
    if (Array.isArray(cameraInfo)) {
        return cameraInfo;
    }
    if (Array.isArray(cameraInfo?.cameras)) {
        return cameraInfo.cameras;
    }
    if (Array.isArray(cameraInfo?.camera)) {
        return cameraInfo.camera;
    }
    return [];
}

function normalizeRadarInfoList(cameraInfo: any): any[] {
    if (Array.isArray(cameraInfo?.radars)) {
        return cameraInfo.radars;
    }
    if (Array.isArray(cameraInfo?.radar)) {
        return cameraInfo.radar;
    }
    return [];
}

export function rand(start: number, end: number) {
    return (Math.random() * (end - start) + start) | 0;
}

export function empty(value: any) {
    return value === null || value === undefined || value === '';
}

export function queryStr(data: Record<string, any> = {}) {
    let queryArr = [] as string[];
    Object.keys(data).forEach((name) => {
        let value = data[name];
        if (Array.isArray(value)) {
            queryArr.push(`${name}=${value.join(',')}`);
        } else {
            queryArr.push(`${name}=${value}`);
        }
    });

    return queryArr.join('&');
}

export function getTrackObject(dataInfos: IFrame[], dataManager: DataManager) {
    let trackObjects = {} as Record<string, { id: string; name: string }[]>;
    let idMap = {} as Record<string, boolean>;

    let maxNum = 0;
    dataInfos.forEach((data) => {
        let objects = dataManager.getFrameObject(data.id) || [];
        objects.forEach((object) => {
            let userData = object.userData as IUserData;
            let trackName = userData.trackName;
            let trackId = userData.trackId;
            if (!trackName || !trackId) return;

            let trackNumber = parseInt(trackName);
            if (isNaN(trackNumber)) return;

            let id = `${trackName}####${trackId}`;
            if (idMap[id]) return;

            maxNum = Math.max(maxNum, trackNumber);
            if (!trackObjects[trackNumber]) {
                trackObjects[trackNumber] = [];
            }

            trackObjects[trackNumber].push({ id: trackId, name: trackName });
            idMap[id] = true;
        });
    });

    let list = [] as { id: string; name: string }[];

    [...Array(maxNum + 1)].forEach((e, index) => {
        let objects = trackObjects[index];
        if (objects) {
            list.push(...objects);
        }
    });

    return list;
}

export function formatNumDot(str: string | number, precision: number = 2): string {
    str = '' + str;
    let regex = /(?!^)(?=(\d{3})+(\.|$))/g;
    str.replace(regex, ',');

    if (precision) {
        return (+str).toFixed(precision);
    } else {
        return str;
    }
}

export function formatNumStr(str: string | number, precision: number = 2): string {
    str = '' + str;
    if (precision) {
        return (+str).toFixed(precision);
    } else {
        return str;
    }
}

export function pickAttrs(obj: any, attrs: string[]) {
    let newObj = {};
    attrs.forEach((attr) => {
        newObj[attr] = obj[attr];
    });
    return newObj;
}
