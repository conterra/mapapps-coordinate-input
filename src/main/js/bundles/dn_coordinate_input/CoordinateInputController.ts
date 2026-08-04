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

import { createObservers, type Observers } from "apprt-core/Observers";
import type { InjectedReference } from "apprt-core/InjectedReference";
import type { CoordinateInputModel } from "./CoordinateInputModel";

/**
 * Model properties fed by the widget's input controls. `referenceSystems` is
 * left out on purpose: it is configuration, not user input.
 */
const INPUT_PROPERTIES = ["coordinates", "mode", "referenceSystem"] as const;

/**
 * Reacts to the coordinate input made in the widget.
 */
export default class CoordinateInputController {

    declare private coordinateInputModel: InjectedReference<CoordinateInputModel>;

    private readonly observers: Observers = createObservers();

    activate(): void {
        const model = this.coordinateInputModel!;
        this.observers.add(
            ...INPUT_PROPERTIES.map((property) => model.watch(property, () => this.onInputChanged()))
        );
    }

    deactivate(): void {
        this.observers.destroy();
    }

    /**
     * Called whenever one of the widget's inputs changed. The current state is
     * available via `this.coordinateInputModel`.
     */
    private onInputChanged(): void {
        // TODO: handle the changed input.
        console.info("value changes");
        console.info(this.coordinateInputModel);
    }

}
