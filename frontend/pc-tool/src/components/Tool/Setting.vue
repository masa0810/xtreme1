<template>
    <div class="setting">
        <div class="title1 border-bottom">{{ $$('setting_display') }}</div>
        <div class="wrap">
            <!-- image -->
            <div class="title2">
                <span style="vertical-align: middle; margin-right: 10px">{{
                    $$('setting_imgview')
                }}</span>
                <!-- <div class="divider"></div> -->
            </div>
            <div class="wrap">
                <div style="padding: 6px 0px">
                    <a-checkbox
                        v-if="state.config.projectPoint4"
                        v-model:checked="state.config.renderRect"
                        >{{ $$('setting_rect') }}</a-checkbox
                    >
                    <a-checkbox
                        v-if="state.config.projectPoint8"
                        v-model:checked="state.config.renderBox"
                        >{{ $$('setting_box') }}</a-checkbox
                    >

                    <a-checkbox
                        v-if="state.config.projectMap3d"
                        v-model:checked="state.config.renderProjectBox"
                        >{{ $$('setting_projectbox') }}</a-checkbox
                    >
                    <a-checkbox v-model:checked="state.config.renderProjectPoint">{{
                        $$('setting_projectpoint')
                    }}</a-checkbox>
                </div>
            </div>
            <!-- pointCloud background color-->
            <div class="title2">
                <span style="vertical-align: middle; margin-right: 10px">{{
                    $$('setting_backgroundColor')
                }}</span>
                <!-- <div class="divider"></div> -->
            </div>
            <div class="wrap">
                <a-tooltip trigger="click" placement="topLeft">
                    <template #title>
                        <color-picker
                            :isWidget="true"
                            pickerType="chrome"
                            useType="pure"
                            :disableAlpha="true"
                            :disableHistory="true"
                            v-model:pureColor="iState.backgroudColor"
                            @pureColorChange="updateBackgroundColor"
                        />
                    </template>
                    <div
                        style="
                            height: 16px;
                            display: inline-block;
                            width: 16px;
                            border: 1px solid white;
                        "
                        :style="{ background: iState.backgroudColor }"
                    ></div>
                </a-tooltip>
                <a-button type="dashed" class="reset" size="small" @click="onResetBg">{{
                    $$('setting_pointreset')
                }}</a-button>
            </div>
            <!-- show point -->
            <div class="title2">
                <span style="vertical-align: middle; margin-right: 10px">{{
                    $$('setting_pointview')
                }}</span>
                <!-- <div class="divider"></div> -->
            </div>
            <div class="wrap">
                <div class="title3"
                    >{{ $$('setting_pointsize')
                    }}<a-button type="dashed" class="reset" size="small" @click="onResetSize">{{
                        $$('setting_pointreset')
                    }}</a-button>
                </div>
                <a-slider
                    style="width: 100%; margin: 0px; margin-top: 5px"
                    v-model:value="config.pointSize"
                    :tip-formatter="formatter"
                    :min="1"
                    :max="10"
                    :step="0.1"
                    @change="() => update('pointSize')"
                />
                <div class="title3"
                    >{{ $$('setting_brightness')
                    }}<a-button
                        type="dashed"
                        class="reset"
                        size="small"
                        @click="onResetBrightness"
                        >{{ $$('setting_pointreset') }}</a-button
                    >
                </div>
                <a-slider
                    style="width: 100%; margin: 0px; margin-top: 5px"
                    v-model:value="config.brightness"
                    :tip-formatter="formatter"
                    :min="0.1"
                    :max="2"
                    :step="0.1"
                    @change="() => update('brightness')"
                />
                <div class="title3"
                    >{{ $$('setting_point_layer_mode') }}
                    <br />
                    <a-radio-group
                        v-model:value="config.pointLayerMode"
                        size="small"
                        style="font-size: 12px; margin-top: 5px"
                    >
                        <a-radio-button style="width: 62px; text-align: center" value="lidar">
                            LiDAR
                        </a-radio-button>
                        <a-radio-button style="width: 62px; text-align: center" value="radar">
                            Radar
                        </a-radio-button>
                        <a-radio-button style="width: 62px; text-align: center" value="both">
                            {{ $$('setting_point_layer_both') }}
                        </a-radio-button>
                    </a-radio-group>
                </div>
            </div>
            <div class="title2">
                <span style="vertical-align: middle; margin-right: 10px">{{
                    $$('setting_lidar_section')
                }}</span>
            </div>
            <div class="wrap">
                <div class="title3"
                    >{{ $$('setting_lidar_opacity') }}
                    <a-button
                        type="dashed"
                        class="reset"
                        size="small"
                        @click="onResetLidarOpacity"
                        >{{ $$('setting_pointreset') }}</a-button
                    >
                </div>
                <a-slider
                    style="margin-top: 5px"
                    v-model:value="config.lidarOpacity"
                    :tip-formatter="formatter"
                    :min="0"
                    :max="1"
                    :step="0.05"
                    @change="() => update('lidarOpacity')"
                />
            </div>
            <div class="wrap">
                <div class="title3"
                    >{{ $$('setting_pointcolor') }}
                    <br />
                    <a-radio-group
                        v-model:value="config.pointColorMode"
                        size="small"
                        style="font-size: 12px; margin-top: 5px"
                    >
                        <a-radio-button
                            style="width: 80px; text-align: center"
                            :value="ColorModeEnum.PURE"
                        >
                            {{ $$('setting_colorsingle') }}
                        </a-radio-button>
                        <a-radio-button
                            style="width: 80px; text-align: center"
                            :value="ColorModeEnum.HEIGHT"
                        >
                            {{ $$('setting_colorheight') }}
                        </a-radio-button>

                        <a-radio-button
                            v-if="config.pointInfo.hasRGB"
                            style="width: 100px; text-align: center"
                            :value="ColorModeEnum.RGB"
                        >
                            {{ 'RGB' }}
                        </a-radio-button>
                    </a-radio-group>
                </div>
            </div>
            <ColorSlider />
            <div class="wrap" v-if="config.pointInfo.hasIntensity">
                <div class="title3"
                    >{{ $$('setting_colorintensity') }}
                    <a-switch
                        size="small"
                        style="margin-top: 5px; float: right"
                        v-model:checked="state.config.openIntensity"
                    />
                </div>
                <div class="title3" style="padding-top: 10px"
                    >{{ $$('setting_auto_normalize') }}
                    <a-switch
                        size="small"
                        style="margin-top: 5px; float: right"
                        v-model:checked="config.pointAutoNormalize"
                        :disabled="!config.pointInfo.hasIntensity"
                    />
                </div>
                <div class="title3" style="padding-top: 10px">
                    <a-input-number
                        v-model:value="config.pointIntensity[0]"
                        size="small"
                        :min="0"
                        :max="255"
                        style="width: 80px"
                    ></a-input-number>
                    <a-input-number
                        v-model:value="config.pointIntensity[1]"
                        size="small"
                        :min="0"
                        :max="255"
                        style="width: 80px"
                    ></a-input-number>
                    <a-button
                        :title="$$('setting_pointreset')"
                        size="small"
                        style="border: none"
                        @click="onResetIntensity"
                    >
                        <template #icon>
                            <RetweetOutlined />
                        </template>
                    </a-button>
                </div>
                <div style="margin-top: 5px; width: 100%" class="title3">
                    <a-slider
                        range
                        v-model:value="config.pointIntensity"
                        :min="0"
                        :max="255"
                        :step="0.1"
                    />
                </div>
            </div>
            <div class="section-divider"></div>
            <div class="title2">
                <span style="vertical-align: middle; margin-right: 10px">{{
                    $$('setting_radar_section')
                }}</span>
            </div>
            <div class="wrap">
                <div class="title3"
                    >{{ $$('setting_radar_opacity') }}
                    <a-button
                        type="dashed"
                        class="reset"
                        size="small"
                        @click="onResetRadarOpacity"
                        >{{ $$('setting_pointreset') }}</a-button
                    >
                </div>
                <a-slider
                    style="margin-top: 5px"
                    v-model:value="config.radarOpacity"
                    :tip-formatter="formatter"
                    :min="0"
                    :max="1"
                    :step="0.05"
                    @change="() => update('radarOpacity')"
                />
                <div class="title3"
                    >{{ $$('setting_radar_color_mode') }}
                    <br />
                    <a-radio-group
                        v-model:value="config.radarColorMode"
                        size="small"
                        style="font-size: 12px; margin-top: 5px"
                    >
                        <a-radio-button
                            style="width: 80px; text-align: center"
                            :value="ColorModeEnum.PURE"
                        >
                            {{ $$('setting_colorsingle') }}
                        </a-radio-button>
                        <a-radio-button
                            style="width: 80px; text-align: center"
                            :value="ColorModeEnum.HEIGHT"
                        >
                            {{ $$('setting_colorheight') }}
                        </a-radio-button>
                    </a-radio-group>
                </div>
                <div
                    v-if="config.radarColorMode === ColorModeEnum.HEIGHT"
                    class="title3 radar-height-title"
                    style="padding: 6px 0 0 14px"
                    >{{ $$('setting_colorheight') }}
                    <a-button
                        :title="$$('setting_pointreset')"
                        size="small"
                        style="border: none; float: right"
                        @click="onResetRadarHeight"
                    >
                        <template #icon>
                            <RetweetOutlined />
                        </template>
                    </a-button>
                    <a-input-number
                        v-model:value="config.radarPointHeight[1]"
                        size="small"
                        :step="0.1"
                        :formatter="formatter"
                        @change="() => updateRadarHeight(false)"
                        @blur="onBlurRadarHeight"
                        :min="config.radarPointHeight[0] || radarHeightRange[0]"
                        :max="radarHeightRange[1]"
                        style="float: right; width: 60px"
                    ></a-input-number>
                    <a-input-number
                        v-model:value="config.radarPointHeight[0]"
                        size="small"
                        :step="0.1"
                        :formatter="formatter"
                        @change="() => updateRadarHeight(false)"
                        @blur="onBlurRadarHeight"
                        :min="radarHeightRange[0]"
                        :max="config.radarPointHeight[1] || radarHeightRange[1]"
                        style="float: right; width: 60px"
                    ></a-input-number>
                </div>
                <div
                    class="color-item-container radar-color-item"
                    v-show="config.radarColorMode === ColorModeEnum.HEIGHT"
                >
                    <a-tooltip trigger="click" placement="topLeft">
                        <template #title>
                            <color-picker
                                :isWidget="true"
                                pickerType="chrome"
                                useType="pure"
                                :disableAlpha="true"
                                :disableHistory="true"
                                v-model:pureColor="config.radarEdgeColor[0]"
                                @pureColorChange="() => update('radarEdgeColor')"
                            />
                        </template>
                        <div class="color-span" :style="{ background: config.radarEdgeColor[0] }"></div>
                    </a-tooltip>
                    <div :style="{ background: radarColorCodeBg }" class="color-slider">
                        <a-slider
                            style="margin: 0; width: 100%"
                            :value="_radarPointHeight"
                            range
                            :min="radarHeightRange[0]"
                            :max="radarHeightRange[1]"
                            :step="0.1"
                            @change="onChangeRadarHeight"
                            @afterChange="() => updateRadarHeight(true)"
                        />
                    </div>
                    <a-tooltip trigger="click" placement="topLeft">
                        <template #title>
                            <color-picker
                                :isWidget="true"
                                pickerType="chrome"
                                useType="pure"
                                :disableAlpha="true"
                                :disableHistory="true"
                                v-model:pureColor="config.radarEdgeColor[1]"
                                @pureColorChange="() => update('radarEdgeColor')"
                            />
                        </template>
                        <div class="color-span" :style="{ background: config.radarEdgeColor[1] }"></div>
                    </a-tooltip>
                </div>
                <div class="color-item-container radar-color-item" v-show="config.radarColorMode === ColorModeEnum.PURE">
                    <a-tooltip trigger="click" placement="topLeft">
                        <template #title>
                            <color-picker
                                :isWidget="true"
                                pickerType="chrome"
                                useType="pure"
                                :disableAlpha="true"
                                :disableHistory="true"
                                v-model:pureColor="config.radarSingleColor"
                                @pureColorChange="() => update('radarSingleColor')"
                            />
                        </template>
                        <div class="color-span" :style="{ background: config.radarSingleColor }"></div>
                    </a-tooltip>
                </div>
                <div class="title3" style="margin-top: 10px; margin-bottom: 4px; height: 24px">
                    <a-button type="dashed" class="reset" size="small" @click="onResetRadarColor">{{
                        $$('setting_colorreset')
                    }}</a-button>
                </div>
                <div class="title3" style="padding-top: 10px"
                    >{{ $$('setting_colorintensity') }}
                    <a-switch
                        size="small"
                        style="margin-top: 5px; float: right"
                        v-model:checked="config.radarOpenIntensity"
                        :disabled="!config.radarHasIntensity && !config.radarHasSnr"
                    />
                </div>
                <div class="title3" style="padding-top: 10px"
                    >{{ $$('setting_radar_auto_normalize') }}
                    <a-switch
                        size="small"
                        style="margin-top: 5px; float: right"
                        v-model:checked="config.radarAutoNormalize"
                        :disabled="!config.radarHasIntensity && !config.radarHasSnr"
                    />
                </div>
            </div>
            <div class="title2" v-if="!_config.noUtility">
                <span style="vertical-align: middle; margin-right: 10px">{{ $$('utility') }}</span>
                <!-- <div class="divider"></div> -->
            </div>
            <div class="wrap" v-if="!_config.noUtility">
                <div class="title3"
                    >{{ $$('measure') }}
                    <a-switch
                        v-model:checked="iState.measureOpen"
                        @change="onMeasureSwitch"
                        size="small"
                        style="float: right; margin-top: 5px"
                    />
                </div>
                <div v-for="item in iState.measureConfig" :key="item.id" class="title3">
                    {{ $$('measure_radius') }}
                    <a-button
                        size="small"
                        @click="() => delMeasure(item.id)"
                        style="float: right; border: none"
                    >
                        <template #icon>
                            <DeleteOutlined />
                        </template>
                    </a-button>
                    <a-input-number
                        style="width: 100px; float: right"
                        size="small"
                        :min="0"
                        :max="999"
                        @change="() => updateMeasure(item.id)"
                        v-model:value="item.radius"
                    />
                </div>
                <div class="title3">
                    <a-button size="small" style="width: 100%" @click="addMeasure">
                        <template #icon>
                            <PlusOutlined />
                        </template>
                        {{ $$('measure_add') }}
                    </a-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { watch, onMounted, reactive, computed } from 'vue';
    import * as THREE from 'three';
    import { DeleteOutlined, PlusOutlined } from '@ant-design/icons-vue';
    // import { getColorRange } from '../../utils';
    import * as _ from 'lodash';
    import { useInjectState, useInjectEditor } from '../../state';
    // import useRenderConfig from '../hook/useRenderConfig';
    import { RetweetOutlined } from '@ant-design/icons-vue';
    import { Image2DRenderView, utils as renderUtils } from 'pc-render';
    // import useLang from '../../hook/useLang';
    import * as locale from './lang';
    import { IConfig } from './useTool';
    import ColorSlider from './colorSlider.vue';
    import { ColorModeEnum, utils } from 'pc-editor';
    import { formatInputNumberValue } from './numberFormat';
    let editor = useInjectEditor();
    let $$ = editor.bindLocale(locale);
    let pc = editor.pc;
    let state = useInjectState();
    let config = state.config;
    const props = defineProps<{
        config?: IConfig;
    }>();
    const _config = computed(() => {
        return Object.assign({} as IConfig, props.config || {});
    });
    let countId = 0;
    interface IMeasure {
        id: number;
        radius: number;
    }

    // ***************Props and Emits***************
    const emit = defineEmits(['close']);

    // *********************************************
    const formatter = (value: number | string | undefined) => {
        return formatInputNumberValue(value);
    };
    const iState = reactive({
        colorCodeBg: 'transparent',
        focusOne: false,
        measureOpen: false,
        measureConfig: [] as IMeasure[],
        backgroudColor: '#000',
    });
    const radarHeightRange = computed<[number, number]>(() => {
        const fallback: [number, number] = [config.pointInfo.min.z || -10, config.pointInfo.max.z || 10];
        const position = editor.radarPointsData?.position;
        return utils.getHeightRangeByGroundAndMax(position || [], fallback);
    });
    const radarColorCodeBg = computed(() => {
        const colors = renderUtils.getThemeColor(config.radarEdgeColor);
        const [min, max] = config.radarPointHeight;
        const [totalMin, totalMax] = radarHeightRange.value;
        const mapLinear = (value: number) => {
            const height = THREE.MathUtils.mapLinear(value, 0, colors.length - 1, min, max);
            return THREE.MathUtils.mapLinear(height, totalMin, totalMax, 0, 100);
        };
        const color = [`${config.radarEdgeColor[0]} 0%`, `${config.radarEdgeColor[0]} ${mapLinear(0)}%`];
        colors.forEach((item, index) => {
            color.push(`${item} ${mapLinear(index)}%`);
        });
        color.push(
            `${config.radarEdgeColor[1]} ${mapLinear(colors.length - 1)}%`,
            `${config.radarEdgeColor[1]} 100%`,
        );
        return `linear-gradient(90deg, ${color.join(',')})`;
    });
    const _radarPointHeight = computed<[number, number]>(() => {
        const [min, max] = radarHeightRange.value;
        return config.radarPointHeight.map((value) => {
            return THREE.MathUtils.clamp(value, min, max);
        }) as [number, number];
    });
    onMounted(() => {
        onMeasureSwitch();
    });
    function onMeasureSwitch() {
        if (props.config?.noUtility) return;
        editor.pc.groupTrack.visible = iState.measureOpen;
        editor.pc.render();
    }
    function addMeasure() {
        if (props.config?.noUtility) return;
        const measureLine = {
            id: countId++,
            radius: 50,
        };
        iState.measureConfig.push(measureLine);
        editor.viewManager.addTrackCircle(measureLine.radius, {
            id: measureLine.id,
        });
    }
    function delMeasure(id: number) {
        if (props.config?.noUtility) return;
        iState.measureConfig = iState.measureConfig.filter((item: IMeasure) => item.id !== id);
        editor.viewManager.delTrackCircle(id);
    }
    function onResetBg() {
        iState.backgroudColor = '#000';
        updateBackgroundColor();
    }
    const updateMeasure = _.debounce((id: number) => {
        const item = iState.measureConfig.find((item: IMeasure) => item.id === id);
        if (item && isFinite(item.radius)) {
            editor.viewManager.updateTrackCircle(id, item.radius);
        }
    }, 200);
    const updateBackgroundColor = _.throttle(() => {
        editor.viewManager.updateBackgroundColor(iState.backgroudColor || '#000');
    }, 100);

    let update = _.throttle((type: string) => {
        let options = {} as any;
        switch (type) {
            case 'pointSize':
                options.pointSize = config.pointSize * 10;
                break;
            case 'colorType':
                options.colorMode = config.pointColorMode || 0;
                break;
            case 'intensity':
                options.openIntensity = config.openIntensity ? 1.0 : -1.0;
                break;
            case 'pointAutoNormalize':
                editor.setPointAutoNormalize(config.pointAutoNormalize);
                return;
            case 'brightness':
                options.brightness = config.brightness;
                break;
            case 'lidarOpacity':
                pc.setPointOpacity(config.lidarOpacity);
                return;
            case 'pointLayerMode':
                pc.setPointLayerMode(config.pointLayerMode);
                return;
            case 'radarOpacity':
                pc.setRadarOpacity(config.radarOpacity);
                return;
            case 'radarColorMode':
                pc.setRadarUniforms({ colorMode: config.radarColorMode });
                return;
            case 'radarOpenIntensity':
                pc.setRadarOpenIntensity(config.radarOpenIntensity);
                return;
            case 'radarAutoNormalize':
                pc.setRadarAutoNormalize(config.radarAutoNormalize);
                return;
            case 'radarPointHeight':
                pc.setRadarUniforms({
                    pointHeight: new THREE.Vector2().fromArray(config.radarPointHeight),
                });
                return;
            case 'radarEdgeColor':
                pc.setRadarUniforms({ edgeColor: config.radarEdgeColor });
                return;
            case 'radarSingleColor':
                pc.setRadarUniforms({ singleColor: config.radarSingleColor });
                return;
            case 'intensityRange':
                options.intensityRange = new THREE.Vector2(
                    config.pointIntensity[0],
                    config.pointIntensity[1],
                );
                break;
        }

        if (type === 'colorType' || type === 'intensity' || type === 'intensityRange') {
            pc.setPointUniforms(options);
            return;
        }

        pc.setSharedPointUniforms(options);
        pc.render();
        // console.log('update config', type, options);
    }, 200);

    function onResetSize() {
        config.pointSize = 0.1;
        update('pointSize');
    }

    function onResetIntensity() {
        config.pointIntensity = [0, 255];
    }
    function onResetRadarHeight() {
        config.radarPointHeight = [...radarHeightRange.value] as [number, number];
        updateRadarHeight(true);
    }
    function onChangeRadarHeight(value: [number, number]) {
        config.radarPointHeight = value;
        updateRadarHeight();
    }
    function onBlurRadarHeight() {
        const [rangeMin, rangeMax] = radarHeightRange.value;
        const pointHeight = config.radarPointHeight;
        if (isNaN(pointHeight[0]) || utils.empty(pointHeight[0])) {
            pointHeight[0] = rangeMin;
        }
        if (isNaN(pointHeight[1]) || utils.empty(pointHeight[1])) {
            pointHeight[1] = rangeMax;
        }
        updateRadarHeight();
    }
    function updateRadarHeight(force = false) {
        if (config.radarPointHeight.find((value) => isNaN(value) || utils.empty(value))) {
            return;
        }
        if (force) {
            update('radarPointHeight');
            update('radarEdgeColor');
            return;
        }
        update('radarPointHeight');
        update('radarEdgeColor');
    }
    function onResetRadarColor() {
        if (config.radarColorMode === ColorModeEnum.PURE) {
            config.radarSingleColor = '#87abff';
            update('radarSingleColor');
            return;
        }
        config.radarEdgeColor = ['#000dff', '#ff0000'];
        update('radarEdgeColor');
    }
    function onResetBrightness() {
        config.brightness = 1;
        update('brightness');
    }
    function onResetLidarOpacity() {
        config.lidarOpacity = 1;
        update('lidarOpacity');
    }
    function onResetRadarOpacity() {
        config.radarOpacity = 1;
        update('radarOpacity');
    }
    watch(
        () => config.pointColorMode,
        () => {
            update('colorType');
        },
    );

    watch(
        () => [config.pointIntensity[0], config.pointIntensity[1]],
        () => {
            update('intensityRange');
        },
    );

    watch(
        () => config.openIntensity,
        () => {
            update('intensity');
        },
    );

    watch(
        () => config.pointAutoNormalize,
        () => {
            update('pointAutoNormalize');
        },
    );

    watch(
        () => config.pointLayerMode,
        () => {
            update('pointLayerMode');
        },
    );

    watch(
        () => config.radarColorMode,
        () => {
            update('radarColorMode');
        },
    );

    watch(
        () => config.radarOpenIntensity,
        () => {
            update('radarOpenIntensity');
        },
    );

    watch(
        () => config.radarAutoNormalize,
        () => {
            update('radarAutoNormalize');
        },
    );

    watch(
        () => radarHeightRange.value,
        (range) => {
            const [rangeMin, rangeMax] = range;
            const [min, max] = config.radarPointHeight;
            if (!isFinite(min) || !isFinite(max)) {
                config.radarPointHeight = [...range] as [number, number];
                updateRadarHeight(true);
                return;
            }
            const nextMin = THREE.MathUtils.clamp(min, rangeMin, rangeMax);
            const nextMax = THREE.MathUtils.clamp(max, rangeMin, rangeMax);
            if (nextMin > nextMax) {
                config.radarPointHeight = [...range] as [number, number];
                updateRadarHeight(true);
                return;
            }
            if (nextMin !== min || nextMax !== max) {
                config.radarPointHeight = [nextMin, nextMax];
                updateRadarHeight(true);
            }
        },
        { immediate: true },
    );

    watch(
        () => [
            config.renderBox,
            config.renderRect,
            config.renderProjectBox,
            config.renderProjectPoint,
        ],
        () => {
            pc.renderViews.forEach((view) => {
                if (view instanceof Image2DRenderView) {
                    view.renderBox = config.renderProjectBox && state.config.projectMap3d;
                    view.renderRect = config.renderRect && state.config.projectPoint4;
                    view.renderBox2D = config.renderBox && state.config.projectPoint8;
                    if (view.name === state.config.singleViewPrefix) {
                        view.renderPoints = config.renderProjectPoint;
                    }
                }
            });
            pc.render();
        },
    );

    // function

    function onClose() {
        emit('close');
    }
</script>

<style lang="less">
    .setting {
        max-height: calc(100vh - 140px);
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 4px;
        box-sizing: border-box;

        .section-divider {
            height: 1px;
            margin: 10px 0;
            background: rgba(255, 255, 255, 0.15);
        }
        .radar-height-title,
        .radar-color-item {
            margin-left: -14px;
        }
        .reset {
            border: 1px solid #6d7278;
            color: #6d7278;
            float: right;
            font-size: 12px;
        }
    }
</style>
