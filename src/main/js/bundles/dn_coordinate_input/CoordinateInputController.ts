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

import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Point from "@arcgis/core/geometry/Point";
import { createObservers, type Observers } from "apprt-core/Observers";
import type { InjectedReference } from "apprt-core/InjectedReference";
import type { MapWidgetModel } from "map-widget/api";
import { AUTO_REFERENCE_SYSTEM, type CoordinateInputModel } from "./CoordinateInputModel";

/**
 * Model properties fed by the widget's input controls. `referenceSystems` is
 * left out on purpose: it is configuration, not user input.
 */
const INPUT_PROPERTIES = ["coordinates", "mode", "referenceSystem"] as const;

const LAYER_ID = "dn_coordinate_input";

/** Symbol of the entered points. */
const POINT_SYMBOL = {
    type: "simple-marker",
    style: "circle",
    size: 8,
    color: [0, 92, 230, 0.75],
    outline: { color: [255, 255, 255], width: 1.25 }
};

/** Splits a line into its parts, accepting `7.1, 50.7` as well as `7.1 50.7`. */
const SEPARATORS = /[\s,;]+/;

/** A coordinate read from one input line, ordered as x/y. */
type Coordinate = [number, number];

/**
 * Turns the entered coordinates into graphics on an own layer, and keeps that
 * layer in sync with every edit.
 */
export default class CoordinateInputController {

    declare private coordinateInputModel: InjectedReference<CoordinateInputModel>;
    declare private mapWidgetModel: InjectedReference<MapWidgetModel>;

    private readonly observers: Observers = createObservers();
    private layer: GraphicsLayer | undefined;

    activate(): void {
        const model = this.coordinateInputModel!;
        this.observers.add(
            ...INPUT_PROPERTIES.map((property) => model.watch(property, () => this.onInputChanged()))
        );

        this.layer = new GraphicsLayer({
            id: LAYER_ID,
            listMode: "hide"
        });
        this.mapWidgetModel!.map.add(this.layer);

        this.onInputChanged();
    }

    deactivate(): void {
        this.observers.destroy();
        if (this.layer) {
            this.mapWidgetModel!.map.remove(this.layer);
            this.layer = undefined;
        }
    }

    /**
     * Called whenever one of the widget's inputs changed. Replaces the layer's
     * content with whatever can be read from the current input.
     */
    private onInputChanged(): void {
        const { coordinates, mode, referenceSystem } = this.coordinateInputModel!;

        // TODO: support the line and polygon modes, and detect the reference
        // system of the input when "auto" is selected.
        const supported = mode === "points" && referenceSystem !== AUTO_REFERENCE_SYSTEM;
        const parsedCoordinates = parseCoordinates(coordinates);
        const graphics = supported
            ? createPointGraphics(parsedCoordinates, referenceSystem)
            : [];

        const layer = this.layer!;
        layer.graphics.removeAll();
        layer.graphics.addMany(graphics);
    }

}

/**
 * Reads one coordinate per line, e.g. `7.0982, 50.7374`, text after the
 * coordinates is ignored.
 *
 * Lines that do not hold two numbers are skipped rather than reported: the text
 * is parsed on every keystroke, so an incomplete line is the normal case while
 * typing, not an error.
 */
function parseCoordinates(text: string): Coordinate[] {
    const coordinates: Coordinate[] = [];
    for (const line of text.split("\n")) {
        const coordinate = parseCoordinate(line);
        if (coordinate) {
            coordinates.push(coordinate);
        }
    }
    return coordinates;
}

function parseCoordinate(line: string): Coordinate | undefined {
    const parts = line.split(SEPARATORS);
    if (parts.length < 2 || parts[0] === "" || parts[1] === "") {
        return undefined;
    }

    const x = Number(parts[0]);
    const y = Number(parts[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return undefined;
    }

    return [x, y];
}

/** Turns each coordinate into a point graphic. */
function createPointGraphics(coordinates: Coordinate[], referenceSystem: string): Graphic[] {
    const wkid = Number(referenceSystem);
    if (!Number.isFinite(wkid)) {
        return [];
    }

    return coordinates.map(([x, y]) => new Graphic({
        geometry: new Point({ x, y, spatialReference: { wkid } }),
        symbol: POINT_SYMBOL as any
    }));
}
