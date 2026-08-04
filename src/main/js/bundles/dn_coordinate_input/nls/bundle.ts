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

const i18n = {
    root: {
        bundleName: "Coordinate Input",
        bundleDescription: "This bundle allows importing of lists of coordinates into a layer",
        windowTitle: "Coordinate Input",
        layerTitle: "Entered coordinates",
        tool: {
            title: "Coordinate Input",
            tooltip: "Import coordinates"
        },
        ui: {
            modes: {
                points: "Points",
                line: "Line",
                polygon: "Polygon"
            },
            coordinates: {
                label: "Coordinates",
                placeholder: "One coordinate pair per line, e.g.\n7.0982, 50.7374\n7.1123, 50.7401"
            },
            referenceSystem: {
                label: "Reference system",
                auto: "Auto"
            },
            zoomToExtent: "Zoom to extent",
            addGeometry: "Add",
            addedGeometries: "Added geometries",
            clearGeometries: "Clear"
        }
    },
    de: true
};

export type Messages = (typeof i18n)["root"];
export interface MessagesReference {
    get: () => Messages
}
export default i18n;
