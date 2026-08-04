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

import { Messages } from "../bundle";

export default {
    bundleName: "Hallo Welt",
    bundleDescription: "Dieses Bundle erlaubt den Import einer Liste von Koordinaten in ein Layer.",
    windowTitle: "Koordinateneingabe",
    layerTitle: "Eingegebene Koordinaten",
    tool: {
        title: "Koordinateneingabe",
        tooltip: "Koordinaten importieren"
    },
    ui: {
        modes: {
            points: "Punkte",
            line: "Linie",
            polygon: "Polygon"
        },
        coordinates: {
            label: "Koordinaten",
            placeholder: "Ein Koordinatenpaar pro Zeile, z. B.\n7.0982, 50.7374\n7.1123, 50.7401"
        },
        referenceSystem: {
            label: "Referenzsystem",
            auto: "Automatisch"
        },
        zoomToExtent: "Auf Ausdehnung zoomen",
        addGeometry: "Hinzufügen",
        clearGeometries: "Leeren"
    }
} satisfies Messages;
