import { Injectable, Output, EventEmitter } from '@angular/core';

import { SettingsService } from './settings.service';

@Injectable()
export class AppService {

    @Output() onShowModeChanged: EventEmitter<string> = new EventEmitter();

    private showMode: string;

    constructor(private settingsService: SettingsService) {
    }

    setShowMode(mode: string): string {
        if (mode === 'editor' && this.settingsService.isEditModeLocked()) {
            this.settingsService.notifyEditorLocked();
            return this.showMode;
        } else {
            this.showMode = mode;
            this.onShowModeChanged.emit(this.showMode);
            return this.showMode;
        }
    }

    lockEditMode() {
        this.settingsService.lockEditMode();
    }

    unlockEditMode() {
        this.settingsService.unlockEditMode();
    }
}