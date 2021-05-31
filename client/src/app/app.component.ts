import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, Input, ElementRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from "rxjs";

import { ProjectService } from './_services/project.service';
import { SettingsService } from './_services/settings.service';
import { ResWebApiService } from './_services/rcgi/reswebapi.service';
import { ResDemoService } from './_services/rcgi/resdemo.service';
import { ResClientService } from './_services/rcgi/resclient.service';
import { AppService } from './_services/app.service';

import { HomeComponent } from './home/home.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    providers: [
        ProjectService,
        ResClientService,
        ResWebApiService,
        ResDemoService,
        AppService
    ]
})

export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
    title = 'app';
    showdev = false;

    @Input() id: string;
    @ViewChild('fabmenu') fabmenu: any;
    @ViewChild('home') home: HomeComponent;
    private subscriptionLoad: Subscription;
    showMode = 'home';

    constructor(private elementRef: ElementRef,
        public projectService: ProjectService,
        private settingsService: SettingsService,
        private appService: AppService) {

        this.projectService.AppId = this.elementRef.nativeElement.getAttribute('id');
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.appService.setShowMode(this.showMode);
        this.projectService.AppId = this.id;
        console.log(this.projectService.AppId);
        try {
            this.settingsService.init();
            let hmi = this.projectService.getHmi();
            if (hmi) {
                this.checkSettings();
            }
            this.subscriptionLoad = this.projectService.onLoadHmi.subscribe(load => {
                this.checkSettings();
            }, error => {
                console.log('Error loadHMI');
            });
            this.projectService.reload();
        }
        catch (err) {
            console.log(err);
        }
    }

    ngOnDestroy() {
        try {
            if (this.subscriptionLoad) {
                this.subscriptionLoad.unsubscribe();
            }
        } catch (e) {
        }
    }

    checkSettings() {
        let hmi = this.projectService.getHmi();
        if (hmi && hmi.layout && hmi.layout.showdev === false) {
            this.showdev = false;
        } else {
            this.showdev = true;
        }
    }

    isHidden() {
        let list = ['', 'lab', 'home'];
        return (list.indexOf(this.showMode) > -1);
    }

    getClass() {
        if (this.showMode.startsWith('view')) {
            return 'work-void';
        }
        return (this.isHidden()) ? 'work-home' : 'work-editor';
    }

    showDevNavigation() {
        if (this.showMode.startsWith('view')) {
            return false;
        }
        return this.showdev;
    }

    onGoTo(goto) {
        this.fabmenu.toggle();
        this.showMode = goto;
        this.appService.setShowMode(this.showMode);
    }
}