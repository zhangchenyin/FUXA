
import { Injectable, Output, EventEmitter, Inject, Optional } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ProjectData, ProjectDataCmdType } from '../_models/project';
import { Hmi, View, LayoutSettings } from '../_models/hmi';
import { Chart } from '../_models/chart';
import { Alarm } from '../_models/alarm';
import { Text } from '../_models/text';
import { Device, DeviceType, DeviceNetProperty } from '../_models/device';
import { EndPointApi } from '../_helpers/endpointapi';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { ResourceStorageService } from './rcgi/resource-storage.service';
import { ResDemoService } from './rcgi/resdemo.service';
import { ResClientService } from './rcgi/resclient.service';
import { ResWebApiService } from './rcgi/reswebapi.service';
import { AppService } from './app.service';
import { Utils } from '../_helpers/utils';

import * as FileSaver from 'file-saver';

@Injectable()
export class ProjectService {

    @Output() onSaveCurrent: EventEmitter<boolean> = new EventEmitter();
    @Output() onLoadHmi: EventEmitter<boolean> = new EventEmitter();

    private projectData = new ProjectData();            // Project data
    public AppId = '';

    public serverSettings: ServerSettings;
    private storage: ResourceStorageService;

    private projectOld: string = '';
    private ready = false;

    constructor(private resewbApiService: ResWebApiService,
        private resDemoService: ResDemoService,
        private resClientService: ResClientService,
        private appService: AppService,
        private translateService: TranslateService,        
        private toastr: ToastrService) {

        this.storage = resewbApiService;
        if (appService.isDemoApp) {
            this.storage = resDemoService;
        } else if (appService.isClientApp) {
            this.storage = resClientService;
        }
        console.log("mode:", environment.type);
        this.storage.getAppId = () => { return this.getAppId(); }
        this.storage.onRefreshProject = (): boolean => { return this.onRefreshProject() };
        this.storage.checkServer().subscribe(result => {
            if (result) {
                this.serverSettings = result;
                this.load();
            }
        }, error => {
            console.error('project.service err: ' + error);
            this.load();
            this.notifyServerError();
        });
    }

    getAppId() {
        return this.AppId;
    }

    init(bridge?: any) {
        this.storage.init(bridge);            
        if (this.appService.isClientApp) {
        }
        this.reload();
    }

    onRefreshProject(): boolean {
        console.log('FUXA onRefreshProject: ', this.AppId);
        this.storage.getStorageProject().subscribe(prj => {
            if (prj) {
                this.projectData = prj;
                // copy to check before save
                this.projectOld = JSON.parse(JSON.stringify(this.projectData));
                this.ready = true;
                this.notifyToLoadHmi();
            } else {
                let msg = '';
                this.translateService.get('msg.get-project-void').subscribe((txt: string) => { msg = txt });
                console.warn(msg);
                // this.notifySaveError(msg);
            }
        }, err => {
            console.error('FUXA onRefreshProject error', err);
        });
        return true;
    }

    //#region Load and Save
    /**
     * Load Project from Server if enable.
     * From Local Storage, from 'assets' if demo or create a local project
     */
    private load() {
        this.storage.getStorageProject().subscribe(prj => {
            if (!prj && this.appService.isDemoApp) {
                console.log('create demo');
                this.setNewProject();
            } else if (this.appService.isClientApp) {
                console.log('FUXA load project: ', prj);
                if (!prj && (this.storage as ResClientService).isReady) {
                    this.setNewProject();
                } else {
                    this.projectData = prj;
                }
                this.ready = true;
                this.notifyToLoadHmi();
            } else {
                this.projectData = prj;
                // copy to check before save
                this.projectOld = JSON.parse(JSON.stringify(this.projectData));
                this.ready = true;
                this.notifyToLoadHmi();
            }
        }, err => {
            console.error('FUXA load error', err);
        });
    }

    /**
     * Save Project
     */
    private save(): boolean {
        // check project change don't work some svg object change the order and this to check isn't easy...boooo
        this.storage.setServerProject(this.projectData).subscribe(result => {
            this.load();
            this.toastr.success('Project save successful!');
        }, err => {
            console.error('FUXA save error', err);
            var msg = '';
            this.translateService.get('msg.project-save-error').subscribe((txt: string) => { msg = txt });
            this.toastr.error(msg, '', {
                timeOut: 3000,
                closeButton: true,
                disableTimeOut: true
            });
        });
        return true;
    }

    saveAs() {
        let filename = 'MyProject.fuxap';
        let date = new Date();
        let content = JSON.stringify(this.convertToSave(this.getProject()));
        let blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        FileSaver.saveAs(blob, filename);
    }

    reload() {
        this.load();
    }

    /**
     * Remove Tag value to save without value
     * Value was added by HmiService from socketIo event
     * @param prj
     */
    private convertToSave(prj: ProjectData) {
        let result = JSON.parse(JSON.stringify(prj));
        for (let devid in result.devices) {
            for (let tagid in result.devices[devid].tags) {
                delete result.devices[devid].tags[tagid].value;
            }
        }
        return result;
    }
    //#endregion

    //#region Device to Save
    /**
     * Add or update Device to Project.
     * Save to Server
     * @param device
     * @param old
     */
    setDevice(device: Device, old: Device, security?: any) {
        if (this.projectData.devices) {
            this.projectData.devices[device.name] = device;
            this.storage.setDeviceSecurity(device.name, security).subscribe(() => {
                this.storage.setServerProjectData(ProjectDataCmdType.SetDevice, device, this.projectData).subscribe(result => {
                    if (old && old.name && old.name !== device.name && old.id === device.id) {
                        this.removeDevice(old);
                    }
                }, err => {
                    console.log(err);
                    this.notifySaveError(err);
                });                
            }, err => {
                console.log(err);
                this.notifySaveError(err);
            });
        }
    }

    setDeviceTags(device: Device) {
        this.projectData.devices[device.name] = device;
        this.storage.setServerProjectData(ProjectDataCmdType.SetDevice, device, this.projectData).subscribe(result => {
        }, err => {
            console.log(err);
            this.notifySaveError(err);
        });                
    }

    /**
     * Remove Device from Project.
     * Save to Server
     * @param device
     */
    removeDevice(device: Device) {
        delete this.projectData.devices[device.name];
        this.storage.setServerProjectData(ProjectDataCmdType.DelDevice, device, this.projectData).subscribe(result => {
        }, err => {
            console.log(err);
            this.notifySaveError(err);
        });
        this.storage.setDeviceSecurity(device.name, '').subscribe(() => {
        }, err => {
            console.log(err);
            this.notifySaveError(err);
        });
    }

    getDeviceSecurity(name: string): Observable<any> {
        return this.storage.getDeviceSecurity(name);
    }
    //#endregion

    //#region View to Save
    /**
     * Add or update View to Project.
     * Save to Server
     * @param view
     */
    setView(view: View) {
        let v = null;
        for (let i = 0; i < this.projectData.hmi.views.length; i++) {
            if (this.projectData.hmi.views[i].id === view.id) {
                v = this.projectData.hmi.views[i];
            }
        }
        if (v) {
            v = view;
        } else {
            this.projectData.hmi.views.push(view);
        }
        this.storage.setServerProjectData(ProjectDataCmdType.SetView, view, this.projectData).subscribe(result => {
        }, err => {
            console.log(err);
            this.notifySaveError(err);
        });
    }

    /**
     * Remove the View from Project
     * Delete from Server
     * @param view
     */
    removeView(view: View) {
        for (let i = 0; i < this.projectData.hmi.views.length; i++) {
            if (this.projectData.hmi.views[i].id === view.id) {
                this.projectData.hmi.views.splice(i, 1);
                break;
            }
        }
        this.storage.setServerProjectData(ProjectDataCmdType.DelView, view, this.projectData).subscribe(result => {
        }, err => {
            console.log(err);
            this.notifySaveError(err);
        });
    }
    //#endregion

    //#region Hmi, Layout resource json struct

    /**
     * get hmi resource
     */
    getHmi() {
        return (this.ready && this.projectData) ? this.projectData.hmi : null;
    }

    setLayout(layout: LayoutSettings) {
        this.projectData.hmi.layout = layout;
        this.storage.setServerProjectData(ProjectDataCmdType.HmiLayout, layout, this.projectData).subscribe(result => {
        }, err => {
            console.log(err);
            this.notifySaveError(err);
        });
    }
    //#endregion

    //#region Charts resource
    /**
     * get charts resource
     */
    getCharts() {
        return (this.projectData) ? (this.projectData.charts) ? this.projectData.charts : [] : null;
    }

    getChart(id: string) {
        for (let i = 0; i < this.projectData.charts.length; i++) {
            if (this.projectData.charts[i].id === id) {
                return this.projectData.charts[i];
            }
        }
    }

    /**
     * save the charts to project
     * @param charts
     */
    setCharts(charts: Chart[]) {
        this.projectData.charts = charts;
        this.storage.setServerProjectData(ProjectDataCmdType.Charts, charts, this.projectData).subscribe(result => {
        }, err => {
            console.log(err);
            this.notifySaveError(err);
        });
    }
    //#endregion

    //#region Alarms resource    
    /**
     * get alarms resource
     */
    getAlarms() {
        return (this.projectData) ? (this.projectData.alarms) ? this.projectData.alarms : [] : null;
    }

    /**
     * save the alarm to project
     * @param text
     */
    setAlarm(alarm: Alarm, old: Alarm) {
        return new Observable((observer) => {
            if (!this.projectData.alarms) {
                this.projectData.alarms = [];
            }
            let exist = this.projectData.alarms.find(tx => tx.name === alarm.name);
            if (exist) {
                exist.property = alarm.property;
                exist.highhigh = alarm.highhigh;
                exist.high = alarm.high;
                exist.low = alarm.low;
                exist.info = alarm.info;
                exist.value = alarm.value;
            } else {
                this.projectData.alarms.push(alarm);
            }
            this.storage.setServerProjectData(ProjectDataCmdType.SetAlarm, alarm, this.projectData).subscribe(result => {
                if (old && old.name && old.name !== alarm.name) {
                    this.removeAlarm(old).subscribe(result => {
                        observer.next();
                    });
                } else {
                    observer.next();
                }
            }, err => {
                console.log(err);
                this.notifySaveError(err);
                observer.error(err);
            });
        });
    }

    /**
     * remove the text from project
     * @param text 
     */
    removeAlarm(alarm: Alarm) {
        return new Observable((observer) => {
            if (this.projectData.alarms) {
                for (let i = 0; i < this.projectData.alarms.length; i++) {
                    if (this.projectData.alarms[i].name === alarm.name) {
                        this.projectData.alarms.splice(i, 1);
                        break;
                    }
                }
            }
            this.storage.setServerProjectData(ProjectDataCmdType.DelAlarm, alarm, this.projectData).subscribe(result => {
                observer.next();
            }, err => {
                console.log(err);
                this.notifySaveError(err);
                observer.error(err);
            });
        });
    }

    getAlarmsValues(): Observable<any> {
        return this.storage.getAlarmsValues();
    }
    
    setAlarmAck(name: string): Observable<any> {
        return this.storage.setAlarmAck(name);
    }
    //#endregion

    //#region Texts resource
    /**
     * get texts resource
     */
    getTexts() {
        return (this.projectData) ? (this.projectData.texts) ? this.projectData.texts : [] : null;
    }

    /**
     * save the text to project
     * @param text
     */
    setText(text: Text, old: Text) {
        if (!this.projectData.texts) {
            this.projectData.texts = [];
        }
        let exist = this.projectData.texts.find(tx => tx.name === text.name);
        if (exist) {
            exist.group = text.group;
            exist.value = text.value;
        } else {
            this.projectData.texts.push(text);
        }
        this.storage.setServerProjectData(ProjectDataCmdType.SetText, text, this.projectData).subscribe(result => {
            if (old && old.name && old.name !== text.name) {
                this.removeText(old);
            }
        }, err => {
            console.log(err);
            this.notifySaveError(err);
        });                
    }

    /**
     * remove the text from project
     * @param text 
     */
    removeText(text: Text) {
        if (this.projectData.texts) {
            for (let i = 0; i < this.projectData.texts.length; i++) {
                if (this.projectData.texts[i].name === text.name) {
                    this.projectData.texts.splice(i, 1);
                    break;
                }
            }
        }
        this.storage.setServerProjectData(ProjectDataCmdType.DelText, text, this.projectData).subscribe(result => {
        }, err => {
            console.log(err);
            this.notifySaveError(err);
        });           
    }
    //#endregion

    //#region Notify

    private notifyToLoadHmi() {
        this.onLoadHmi.emit(true);
    }

    private notifySaveError(err: any) {
        console.error('FUXA notifySaveError error', err);
        let msg = null;
        this.translateService.get('msg.project-save-error').subscribe((txt: string) => { msg = txt });
        if (err.status === 401) {
            this.translateService.get('msg.project-save-unauthorized').subscribe((txt: string) => { msg = txt });
        }
        if (msg) {
            this.toastr.error(msg, '', {
                timeOut: 3000,
                closeButton: true,
                disableTimeOut: true
            });
        }
    }

    private notifyServerError() {
        console.error('FUXA notifyServerError error');
        let msg = null;
        this.translateService.get('msg.server-connection-error').subscribe((txt: string) => { msg = txt });
        if (msg) {
            this.toastr.error(msg, '', {
                timeOut: 3000,
                closeButton: true,
                disableTimeOut: true
            });
        }
    }
    //#endregion

    /**
     * Set Project data and save resource to backend
     * Used from open and upload JSON Project file
     * @param prj project data to save
     */
    setProject(prj: ProjectData, notify?: boolean) {

        this.projectData = prj;
        this.save();
    }

    setNewProject() {
        this.projectData = new ProjectData();
        let server = new Device();
        server.name = 'FUXA';
        server.id = '0';
        server.type = DeviceType.FuxaServer;
        server.property = new DeviceNetProperty();
        this.projectData.server = server;
        if (this.appService.isClientApp) {
            let clientDevice = new Device();
            clientDevice.type = DeviceType.inmation;
            clientDevice.id = Utils.getGUID();
            clientDevice.name = 'inmation';
            clientDevice.enabled = true;
            clientDevice.property = new DeviceNetProperty();
            clientDevice.tags = {};
            this.setDevice(clientDevice, null, null);
        }
        this.save();
    }

    getProject() {
        return this.projectData;
    }

    checkServer() {
        return this.storage.checkServer();
    }

    getServer(): Device {
        return (this.projectData) ? this.projectData.server : null;
    }

    getDevices(): any {
        return (this.projectData) ? this.projectData.devices : {};
    }

    getDeviceFromId(id: string): any {
        let result;
        Object.keys(this.projectData.devices).forEach(k => {
            if (this.projectData.devices[k].id === id) {
                result = this.projectData.devices[k];
            }
        });
        return result;
    }

    getDeviceFromSource(source: string): any {
        return this.projectData.devices[source];
    }

    setDevices(devices: any, nosave?: boolean): boolean {
        this.projectData.devices = devices;
        if (nosave) {
            return true;
        }
        return this.save();
    }

    addDevice(d: Device): boolean {
        let dev = this.projectData.devices[d.name];
        if (dev) {
            this.projectData.devices[d.name];
            return this.save();
        }
        return false;
    }

    /**
     * Send Save Project to to editor component
     * @param saveas 
     */
    saveProject(saveas?: boolean) {
        this.onSaveCurrent.emit(saveas);
    }

    isSecurityEnabled() {
        if (environment.serverEnabled) {
            if (this.serverSettings && !this.serverSettings.secureEnabled) {
                return false;
            }
            return true;
        } else {
            return false;
        }

    }

    private _deepEquals(x, y) {
        if (JSON.stringify(x) === JSON.stringify(y)) {
            return true; // if both x and y are null or undefined and exactly the same

        } else {
            try {
                for (const p in x) {
                    if (!x.hasOwnProperty(p)) {
                        continue; // other properties were tested using x.constructor === y.constructor
                    }
                    if (!y.hasOwnProperty(p)) {
                        return false; // allows to compare x[ p ] and y[ p ] when set to undefined
                    }
                    if (p === 'svgcontent') {
                        // the xml have to be transform in json
                        const parser = new DOMParser();  // initialize dom parser
                        const aDOM = parser.parseFromString(x[p], "text/xml")
                        const bDOM = parser.parseFromString(y[p], "text/xml")
                        let a = this._xml2json(aDOM);
                        let b = this._xml2json(bDOM);
                        return this._deepEquals(a, b);
                    }
                    if (x[p] === y[p]) {
                        continue; // if they have the same strict value or identity then they are equal
                    }
                    if (!this._deepEquals(x[p], y[p])) {
                        return false;
                    }
                }
                for (const p in y) {
                    if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) {
                        return false;
                    }
                }
            } catch (ex) {
                console.log(ex);
                return false;
            }
            return true;
        }
    }

    /**
     * This function coverts a DOM Tree into JavaScript Object. 
     * @param srcDOM: DOM Tree to be converted. 
     */
    private _xml2json(xml) {
        // Create the return object
        var obj = {};

        if (xml.nodeType == 1) { // element
            // do attributes
            if (xml.attributes.length > 0) {
                obj["@attributes"] = {};
                for (var j = 0; j < xml.attributes.length; j++) {
                    var attribute = xml.attributes.item(j);
                    obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                }
            }
        } else if (xml.nodeType == 3) { // text
            obj = xml.nodeValue;
        }

        // do children
        if (xml.hasChildNodes()) {
            for (var i = 0; i < xml.childNodes.length; i++) {
                var item = xml.childNodes.item(i);
                var nodeName = item.nodeName;
                if (typeof (obj[nodeName]) == "undefined") {
                    obj[nodeName] = this._xml2json(item);
                } else {
                    if (typeof (obj[nodeName].push) == "undefined") {
                        var old = obj[nodeName];
                        obj[nodeName] = [];
                        obj[nodeName].push(old);
                    }
                    obj[nodeName].push(this._xml2json(item));
                }
            }
        }
        return obj;
    }
}

export class ServerSettings {
    version: string;
    secureEnabled: boolean;
}