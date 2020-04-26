import { Injectable } from '@angular/core';

import { GaugeSettings, Variable, GaugeStatus } from '../../../_models/hmi';
import { GaugeDialogType } from '../../gauge-property/gauge-property.component';
import { Utils } from '../../../_helpers/utils';

declare var SVG: any;

@Injectable()
export class TableComponent {

    static TypeId = 'table';
    static TypeTag = 'svg-ext-' + TableComponent.TypeId;      // used to identify shapes type, binded with the library svgeditor
    static LabelTag = 'Table';

    static getSignals(pro: any) {
        let res: string[] = [];
        return res;
    }

    static getDialogType(): GaugeDialogType {
        return GaugeDialogType.Table;
    }

    static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus) {
    }
}