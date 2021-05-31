import { Injectable, Output, EventEmitter } from '@angular/core';


@Injectable()
export class AppService {

    @Output() onShowModeChanged: EventEmitter<string> = new EventEmitter();

    private showMode: string;
    constructor() {
    }

    setShowMode(mode: string) {
        this.showMode = mode;
        this.onShowModeChanged.emit(this.showMode);
    }
}