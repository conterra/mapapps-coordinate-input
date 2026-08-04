<!--

    Copyright (C) 2025 con terra GmbH (info@conterra.de)

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

            http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

-->
<template>
    <div class="dn-coordinate-input">
        <div class="dn-coordinate-input__modes">
            <v-btn-toggle
                v-model="mode"
                mandatory
            >
                <v-btn
                    v-for="option in modeOptions"
                    :key="option.value"
                    :value="option.value"
                    :title="option.title"
                    flat
                >
                    <v-icon left>
                        {{ option.icon }}
                    </v-icon>
                    {{ option.title }}
                </v-btn>
            </v-btn-toggle>
        </div>

        <div class="dn-coordinate-input__coordinates">
            <v-textarea
                v-model="coordinates"
                :label="i18n.ui.coordinates.label"
                :placeholder="i18n.ui.coordinates.placeholder"
                rows="6"
                outline
                no-resize
                hide-details
            />
        </div>

        <div class="dn-coordinate-input__reference-system">
            <v-select
                v-model="referenceSystem"
                :items="referenceSystemItems"
                :label="i18n.ui.referenceSystem.label"
                hide-details
            />
        </div>

        <div class="dn-coordinate-input__actions">
            <v-btn
                :disabled="!hasAddedGeometries"
                class="dn-coordinate-input__clear"
                color="primary"
                outline
                @click="$emit('clear-geometries')"
            >
                <v-icon left>
                    icon-trashcan
                </v-icon>
                {{ i18n.ui.clearGeometries }}
            </v-btn>
            <v-btn
                :disabled="!hasGeometry"
                color="primary"
                outline
                @click="$emit('zoom-to-extent')"
            >
                <v-icon left>
                    icon-zoom-in-extent
                </v-icon>
                {{ i18n.ui.zoomToExtent }}
            </v-btn>
            <v-btn
                :disabled="!hasGeometry"
                color="primary"
                @click="$emit('add-geometry')"
            >
                <v-icon left>
                    icon-plus
                </v-icon>
                {{ i18n.ui.addGeometry }}
            </v-btn>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "apprt-vue/Vue";
    import type { PropType } from "vue";
    import Bindable from "apprt-vue/mixins/Bindable";
    import { AUTO_REFERENCE_SYSTEM, type CoordinateInputMode, type ReferenceSystem } from "./CoordinateInputModel";
    import type { Messages } from "./nls/bundle";

    interface ModeOption {
        value: CoordinateInputMode;
        title: string;
        icon: string;
    }

    interface SelectItem {
        text: string;
        value: string;
    }

    export default Vue.extend({
        name: "coordinate-input-widget",
        mixins: [Bindable],
        props: {
            i18n: {
                type: Object as PropType<Messages>,
                required: true
            }
        },
        data() {
            return {
                coordinates: "",
                mode: "points" as CoordinateInputMode,
                referenceSystem: AUTO_REFERENCE_SYSTEM,
                referenceSystems: [] as ReferenceSystem[],
                hasGeometry: false,
                hasAddedGeometries: false
            };
        },
        computed: {
            modeOptions(): ModeOption[] {
                const modes = this.i18n.ui.modes;
                return [
                    { value: "points", title: modes.points, icon: "icon-draw-point" },
                    { value: "line", title: modes.line, icon: "icon-polyline" },
                    { value: "polygon", title: modes.polygon, icon: "icon-polygon" }
                ];
            },
            referenceSystemItems(): SelectItem[] {
                const autoTitle = this.i18n.ui.referenceSystem.auto;
                return this.referenceSystems.map(({ id, title }) => {
                    const text = id === AUTO_REFERENCE_SYSTEM ? autoTitle : (title ?? id);
                    return { text, value: id };
                });
            }
        }
    });
</script>
