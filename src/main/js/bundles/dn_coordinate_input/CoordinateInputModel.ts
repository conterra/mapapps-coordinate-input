///
/// Copyright (C) 2025 con terra GmbH (info@conterra.de)
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///         http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import { declare } from "apprt-core/Mutable";

/** Geometry the entered coordinates are interpreted as. */
export type CoordinateInputMode = "points" | "line" | "polygon";

/** Marks automatic detection of the reference system from the input. */
export const AUTO_REFERENCE_SYSTEM = "auto";

/** A selectable entry of the reference system list. */
export interface ReferenceSystem {
    /** Well-known id of the spatial reference, or {@link AUTO_REFERENCE_SYSTEM}. */
    id: string;
    /** Label shown in the selection. Falls back to the id if not set. */
    title?: string;
}

export type CoordinateInputModel = InstanceType<typeof CoordinateInputModel>;

/**
 * Holds the state of the three coordinate input controls: the raw multi-line
 * coordinate text, the geometry mode, and the selected reference system.
 */
export const CoordinateInputModel = declare({
    /** Raw, multi-line coordinate text as typed by the user. */
    coordinates: {
        value: "",
        required: true as const
    },

    /** Selected geometry mode. */
    mode: {
        value: "points" as CoordinateInputMode,
        required: true as const
    },

    /** Id of the selected reference system, `"auto"` detects it from the input. */
    referenceSystem: {
        value: AUTO_REFERENCE_SYSTEM,
        required: true as const
    },

    /** Reference systems offered in the selection. Configurable via app.json. */
    referenceSystems: {
        required: true as const,
        value: [
            { id: AUTO_REFERENCE_SYSTEM },
            { id: "4326", title: "WGS 84 (EPSG:4326)" },
            { id: "3857", title: "WGS 84 / Pseudo-Mercator (EPSG:3857)" },
            { id: "25832", title: "ETRS89 / UTM zone 32N (EPSG:25832)" },
            { id: "25833", title: "ETRS89 / UTM zone 33N (EPSG:25833)" }
        ] as ReferenceSystem[]
    },

    /**
     * Whether the current input yields any geometry. Written by the controller.
     */
    hasGeometry: {
        value: false,
        required: true as const
    },

    /** Resets all three inputs to their initial state. */
    reset(): void {
        this.coordinates = "";
        this.mode = "points";
        this.referenceSystem = AUTO_REFERENCE_SYSTEM;
    }
});
