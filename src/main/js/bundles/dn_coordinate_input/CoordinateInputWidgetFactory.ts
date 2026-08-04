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

import Vue from "apprt-vue/Vue";
import VueDijit from "apprt-vue/VueDijit";
import Binding from "apprt-binding/Binding";
import type { InjectedReference } from "apprt-core/InjectedReference";
import type { I18N } from "apprt/api";
import CoordinateInputWidget from "./CoordinateInputWidget.ts.vue";
import type CoordinateInputController from "./CoordinateInputController";
import type { CoordinateInputModel } from "./CoordinateInputModel";
import type { Messages } from "./nls/bundle";

export default class CoordinateInputWidgetFactory {

    declare private coordinateInputModel: InjectedReference<CoordinateInputModel>;
    declare private coordinateInputController: InjectedReference<CoordinateInputController>;
    declare private _i18n: InjectedReference<I18N<Messages>>;

    createInstance(): any {
        const controller = this.coordinateInputController!;
        const vm: any = new Vue(CoordinateInputWidget as any);
        vm.i18n = this._i18n!.get();

        const binding = Binding
            .for(this.coordinateInputModel as any, vm)
            .syncAll("coordinates", "mode", "referenceSystem")
            .syncAllToRight("referenceSystems", "hasGeometry", "addedGeometryCount")
            .enable()
            .syncToRightNow();

        vm.$on("zoom-to-extent", () => controller.zoomToExtent());
        vm.$on("add-geometry", () => controller.addGeometry());
        vm.$on("clear-geometries", () => controller.clearGeometries());

        const widget = VueDijit(vm);
        widget.own(binding);
        return widget;
    }

}
