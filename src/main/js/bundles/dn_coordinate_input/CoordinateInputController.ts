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

import Color from "@arcgis/core/Color";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import Polyline from "@arcgis/core/geometry/Polyline";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import { loggerForName } from "apprt-core/Logger";
import { createObservers, type Observers } from "apprt-core/Observers";
import type { InjectedReference } from "apprt-core/InjectedReference";
import type { I18N } from "apprt/api";
import type Tool from "ct/tools/Tool";
import type { MapWidgetModel } from "map-widget/api";
import {
    AUTO_REFERENCE_SYSTEM,
    type CoordinateInputMode,
    type CoordinateInputModel,
    type ReferenceSystem
} from "./CoordinateInputModel";
import type { Messages } from "./nls/bundle";

/**
 * Model properties fed by the widget's input controls. `referenceSystems` is
 * left out on purpose: it is configuration, not user input.
 */
const INPUT_PROPERTIES = ["coordinates", "mode", "referenceSystem"] as const;

const SKETCH_LAYER_ID = "dn_coordinate_input_sketch";
const PERSISTENT_LAYER_ID = "dn_coordinate_input_geometries";

const LOG = loggerForName("dn_coordinate_input/CoordinateInputController");

/**
 * Colours to fall back to if the configured ones cannot be read. They are the
 * same values the model defaults to.
 */
const DEFAULT_SKETCH_COLOR = "#5c5c5c";
const DEFAULT_ADDED_COLOR = "#005ce6";

/** The symbols a layer is drawn with, one for each mode's geometry. */
type ModeSymbols = Record<CoordinateInputMode, any>;

/** Splits a line into its parts, accepting `7.1, 50.7` as well as `7.1 50.7`. */
const SEPARATORS = /[\s,;]+/;

/** A coordinate read from one input line, ordered as x/y. */
type Coordinate = [number, number];

/** Value ranges a coordinate has to fall into to count as one of `id`. */
interface DetectionRule {
    id: string;
    x: [number, number];
    y: [number, number];
}

/**
 * Ranges by which the `auto` entry recognizes a reference system, most
 * distinctive first. Only the systems listed here take part in the detection.
 */
const DETECTION_RULES: DetectionRule[] = [
    // Degrees are unmistakable: they are far below the values of every projected
    // system in this list.
    { id: "4326", x: [-180, 180], y: [-90, 90] },
    // The usable range of a UTM zone, plus the northings ETRS89 covers. Web
    // Mercator values of the same place can fall into this range as well, but
    // hand-written meters are far more often UTM, so the zones go first.
    { id: "25832", x: [100_000, 900_000], y: [3_500_000, 9_400_000] },
    { id: "25833", x: [100_000, 900_000], y: [3_500_000, 9_400_000] },
    // Web Mercator takes everything else inside its world extent.
    { id: "3857", x: [-20_037_508, 20_037_508], y: [-20_048_967, 20_048_967] }
];

/**
 * Turns the entered coordinates into graphics on a sketch layer kept in sync
 * with every edit, and moves them over to a second layer once they are added.
 */
export default class CoordinateInputController {

    declare private coordinateInputModel: InjectedReference<CoordinateInputModel>;
    declare private mapWidgetModel: InjectedReference<MapWidgetModel>;
    declare private coordinateInputTool: InjectedReference<Tool>;
    declare private _i18n: InjectedReference<I18N<Messages>>;

    private readonly observers: Observers = createObservers();

    /** Holds the geometry of the current input, replaced on every edit. */
    private sketchLayer: GraphicsLayer | undefined;

    /**
     * Symbols of the two layers, built from the configured colours on
     * activation. The colours are configuration, so they are read once instead
     * of being watched.
     */
    private sketchSymbols!: ModeSymbols;

    private addedSymbols!: ModeSymbols;

    /**
     * Holds the geometries that have been added. Only "persistent" in contrast
     * to the sketch layer: nothing is stored, so it is gone on reload.
     */
    private persistentLayer: GraphicsLayer | undefined;

    activate(): void {
        const model = this.coordinateInputModel!;
        this.sketchSymbols = this.createSymbols(this.readColor(model.sketchColor, DEFAULT_SKETCH_COLOR));
        this.addedSymbols = this.createSymbols(this.readColor(model.addedColor, DEFAULT_ADDED_COLOR));

        this.observers.add(
            ...INPUT_PROPERTIES.map((property) => model.watch(property, () => this.onInputChanged())),
            // The tool's active state follows the widget's window, so this fires
            // when the window is closed as well as when it is reopened.
            this.coordinateInputTool!.watch("active", (_name, _oldValue, active) => {
                if (!active) {
                    this.onWidgetClosed();
                }
            })
        );

        this.persistentLayer = new GraphicsLayer({
            id: PERSISTENT_LAYER_ID,
            title: this._i18n!.get().layerTitle
        });
        this.sketchLayer = new GraphicsLayer({
            id: SKETCH_LAYER_ID,
            // The sketch is a preview of the current input, not something to
            // switch on and off, so it stays out of the table of contents.
            listMode: "hide"
        });
        // The sketch goes on top, so the live input stays visible over what has
        // already been added.
        this.mapWidgetModel!.map.addMany([this.persistentLayer, this.sketchLayer]);

        this.onAddedGeometriesChanged();
        this.onInputChanged();
    }

    deactivate(): void {
        this.observers.destroy();

        const layers = [this.persistentLayer, this.sketchLayer].filter(Boolean) as GraphicsLayer[];
        this.mapWidgetModel!.map.removeMany(layers);
        this.persistentLayer = undefined;
        this.sketchLayer = undefined;
    }

    /**
     * Hands the geometry of the current input over to the persistent layer and
     * clears the input, ready for the next geometry. Does nothing while the
     * input holds no geometry.
     */
    addGeometry(): void {
        const model = this.coordinateInputModel!;
        const sketched = this.sketchLayer!.graphics.toArray();
        if (sketched.length === 0) {
            return;
        }

        // Removing them from the sketch layer first, as a graphic can only be on
        // one layer at a time.
        this.sketchLayer!.graphics.removeAll();
        for (const graphic of sketched) {
            graphic.symbol = this.addedSymbols[model.mode];
        }
        this.persistentLayer!.graphics.addMany(sketched);
        this.onAddedGeometriesChanged();

        // Only the coordinates are cleared: mode and reference system are
        // settings, and keeping them saves reselecting them for the next entry.
        model.coordinates = "";
    }

    /**
     * Drops everything that has been added. The layer itself stays on the map,
     * it just goes back to being empty and unlisted.
     */
    clearGeometries(): void {
        this.persistentLayer!.graphics.removeAll();
        this.onAddedGeometriesChanged();
    }

    /**
     * Clear sketch layer when widget is closed by clearing coordinate input.
     */
    private onWidgetClosed(): void {
        this.coordinateInputModel!.coordinates = "";
    }

    /**
     * Called whenever the content of the persistent layer changed.
     *
     * The layer is listed in the table of contents only while it holds
     * something, so an empty layer does not sit there with nothing to show.
     */
    private onAddedGeometriesChanged(): void {
        const layer = this.persistentLayer!;
        const count = layer.graphics.length;

        layer.listMode = count > 0 ? "show" : "hide";
        this.coordinateInputModel!.addedGeometryCount = count;
    }

    /**
     * Moves the view onto the geometry of the current input. Does nothing while
     * there is nothing to zoom to.
     */
    zoomToExtent(): void {
        const graphics = this.sketchLayer?.graphics;
        const view = this.mapWidgetModel!.view;
        if (!view || !graphics || graphics.length === 0) {
            return;
        }

        // Handing over the graphics instead of an extent lets goTo keep the
        // current scale for a single point, which spans no extent to zoom to.
        view.goTo(graphics.toArray()).catch((error: Error) => {
            // goTo rejects once its animation is interrupted, e.g. by the user
            // panning the map while it runs. That is not worth reporting.
            if (error.name !== "AbortError") {
                LOG.error("Failed to zoom to the entered coordinates", error);
            }
        });
    }

    /**
     * Called whenever one of the widget's inputs changed. Replaces the layer's
     * content with whatever can be read from the current input.
     */
    private onInputChanged(): void {
        const model = this.coordinateInputModel!;
        const { coordinates, mode, referenceSystem, referenceSystems } = model;

        const parsedCoordinates = this.parseCoordinates(coordinates);
        const spatialReference = this.resolveSpatialReference(referenceSystem, parsedCoordinates, referenceSystems);
        const graphics = spatialReference
            ? this.createGraphics(mode, parsedCoordinates, spatialReference)
            : [];

        const layer = this.sketchLayer!;
        layer.graphics.removeAll();
        layer.graphics.addMany(graphics);

        model.hasGeometry = graphics.length > 0;
    }

    /**
     * Reads a configured colour, accepting everything CSS does: `"#5c5c5c"`,
     * `"rgb(92, 92, 92)"` or a colour name.
     *
     * A value that cannot be read falls back to `fallbackColor` and is reported,
     * because a typo in the configuration would otherwise leave the geometries
     * drawn in whatever colour the fallback of the graphics layer happens to be.
     */
    private readColor(color: string, fallbackColor: string): Color {
        const parsed = Color.fromString(color);
        if (!parsed) {
            LOG.warn("Cannot read the configured colour '{}', falling back to '{}'.", color, fallbackColor);
            return new Color(fallbackColor);
        }
        return parsed;
    }

    /**
     * A symbol for each mode's geometry, drawn in the given colour.
     *
     * The opacities belong to the symbols rather than to the colour: they keep a
     * polygon's fill light enough to read the map through it, and its outline as
     * present as a line. A configured colour is therefore taken by its rgb
     * values only, and any alpha it carries is ignored.
     */
    private createSymbols(color: Color): ModeSymbols {
        const { r, g, b } = color;
        return {
            points: {
                type: "simple-marker",
                style: "circle",
                size: 8,
                color: [r, g, b, 0.75],
                outline: { color: [255, 255, 255], width: 1.25 }
            },
            line: {
                type: "simple-line",
                color: [r, g, b, 0.9],
                width: 2
            },
            polygon: {
                type: "simple-fill",
                color: [r, g, b, 0.25],
                outline: { color: [r, g, b, 0.9], width: 2 }
            }
        };
    }

    /**
     * Reads one coordinate per line, e.g. `7.0982, 50.7374`, text after the
     * coordinates is ignored.
     *
     * Lines that hold no coordinate are skipped rather than aborting the whole
     * input, and counted so that the widget can point them out. Blank lines are
     * not counted.
     */
    private parseCoordinates(text: string): Coordinate[] {
        const coordinates: Coordinate[] = [];
        let skippedLineCount = 0;
        for (const line of text.split("\n")) {
            const coordinate = this.parseCoordinate(line);
            if (coordinate) {
                coordinates.push(coordinate);
            } else if (line.trim() !== "") {
                skippedLineCount++;
            }
        }

        this.coordinateInputModel!.skippedLineCount = skippedLineCount;
        return coordinates;
    }

    private parseCoordinate(line: string): Coordinate | undefined {
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

    /**
     * Resolves the selected reference system into the spatial reference the
     * entered coordinates are read in, detecting it from their values if `auto`
     * is selected. Nothing is returned if no reference system could be settled
     * on.
     */
    private resolveSpatialReference(referenceSystem: string, coordinates: Coordinate[],
        referenceSystems: ReferenceSystem[]): SpatialReference | undefined {
        let id: string | undefined;
        if (referenceSystem === AUTO_REFERENCE_SYSTEM){
            id = this.detectReferenceSystem(coordinates, referenceSystems);
        } else {
            this.coordinateInputModel!.unknownReferenceSystem = false;
            id = referenceSystem;
        }

        const wkid = Number(id);
        if (!id || !Number.isFinite(wkid)) {
            return undefined;
        }

        return new SpatialReference({ wkid });
    }

    /**
     * Guesses which of the configured reference systems the coordinates are
     * given in, for the `auto` entry of the selection.
     *
     * The rules are tried in order, and the first one wins whose reference
     * system is configured and whose ranges hold every single coordinate.
     * Nothing is returned if no rule fits, so unrecognized input draws nothing
     * instead of drawing somewhere far off.
     *
     * The heuristic can only separate reference systems by their value ranges,
     * so it cannot tell apart systems that share one - the two UTM zones look
     * the same to it, and the one listed first in the rules is picked.
     *
     * Errors are indicated to the model for an error message on the widget.
     */
    private detectReferenceSystem(coordinates: Coordinate[],
        referenceSystems: ReferenceSystem[]): string | undefined {
        const model = this.coordinateInputModel!;
        if (coordinates.length === 0) {
            model.unknownReferenceSystem = false;
            return undefined;
        }

        const configured = new Set(referenceSystems.map(({ id }) => id));
        const rule = DETECTION_RULES.find(({ id, x, y }) => configured.has(id)
            && coordinates.every(([cx, cy]) => cx >= x[0] && cx <= x[1] && cy >= y[0] && cy <= y[1]));

        model.unknownReferenceSystem = !rule;
        return rule?.id;
    }

    /**
     * Builds the graphics for the selected mode. They are drawn as a sketch,
     * because that is where they go: only {@link addGeometry} moves them over to
     * the persistent layer, and re-symbolizes them on the way.
     *
     * Nothing is returned as long as the input does not hold enough coordinates
     * for the geometry.
     */
    private createGraphics(mode: CoordinateInputMode, coordinates: Coordinate[],
        spatialReference: SpatialReference): Graphic[] {
        switch (mode) {
            case "points":
                return this.createPointGraphics(coordinates, spatialReference);
            case "line":
                return this.createLineGraphics(coordinates, spatialReference);
            case "polygon":
                return this.createPolygonGraphics(coordinates, spatialReference);
        }
    }

    /** Turns each coordinate into a point graphic. */
    private createPointGraphics(coordinates: Coordinate[], spatialReference: SpatialReference): Graphic[] {
        return coordinates.map(([x, y]) => new Graphic({
            geometry: new Point({ x, y, spatialReference }),
            symbol: this.sketchSymbols.points
        }));
    }

    /** Connects the coordinates into a single line, which needs at least two of them. */
    private createLineGraphics(coordinates: Coordinate[], spatialReference: SpatialReference): Graphic[] {
        if (coordinates.length < 2) {
            return [];
        }

        const geometry = new Polyline({ paths: [coordinates], spatialReference });
        return [new Graphic({ geometry, symbol: this.sketchSymbols.line })];
    }

    /** Spans a single ring over the coordinates, which needs at least three of them. */
    private createPolygonGraphics(coordinates: Coordinate[], spatialReference: SpatialReference): Graphic[] {
        if (coordinates.length < 3) {
            return [];
        }

        const ring = this.closeRing(coordinates);
        const geometry = new Polygon({ rings: [ring], spatialReference });
        // A counter-clockwise ring counts as a hole and would stay unfilled.
        if (!geometry.isClockwise(ring)) {
            geometry.rings = [[...ring].reverse()];
        }

        return [new Graphic({ geometry, symbol: this.sketchSymbols.polygon })];
    }

    /** Repeats the first coordinate at the end, as a polygon ring has to be closed. */
    private closeRing(coordinates: Coordinate[]): Coordinate[] {
        const first = coordinates[0];
        const last = coordinates[coordinates.length - 1];
        if (first[0] === last[0] && first[1] === last[1]) {
            return coordinates;
        }
        return [...coordinates, first];
    }

}
