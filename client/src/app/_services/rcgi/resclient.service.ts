
import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ProjectData, ProjectDataCmdType } from '../../_models/project';
import { ResourceStorageService } from './resource-storage.service';
import { Utils } from '../../_helpers/utils';

@Injectable()
export class ResClientService implements ResourceStorageService {

    bridge: any = null;     
    id: string = null;
    get isReady() { return (this.bridge) ? true : false; } 

    public onRefreshProject: () => boolean;

    constructor(private http: HttpClient) {
    }

    init(bridge?: any): boolean {
        this.id = this.getAppId();
        if (!this.bindBridge(bridge)) {
            return false;
        }
        return true;
    }

    private bindBridge(bridge?: any): boolean {
        console.log('bindBridge: ', (bridge) ? true : false);
        if (!bridge) return false;
        this.bridge = bridge;
        if (this.bridge) {
            this.bridge.onRefreshProject = this.onRefreshProject;
            return true;
        }
        return false;
    }

    getDemoProject(): Observable<any> {
        return this.http.get<any>('./assets/project.demo.fuxap', {});
    }

    getStorageProject(): Observable<any> {
        return new Observable((observer) => {
            console.log('getStorageProject in');
            if (this.bridge) {
                let prj = this.bridge.loadProject();
                console.log('getStorageProject ', prj);
                observer.next(prj);
            } else {
                let prj = localStorage.getItem(this.getAppId());
                if (prj) {
                    observer.next(JSON.parse(prj));
                } else {
                    observer.next();
                }
            }
        });
    }

    setServerProject(prj: ProjectData) {
        return new Observable((observer) => {
            if (this.bridge) {
                if (this.bridge.saveProject(prj)) {
                    observer.next(); 
                } else {
                    observer.error();
                }
            } else {
                localStorage.setItem(this.getAppId(), JSON.stringify(prj));
                observer.next();
            }
        });
    }

    setServerProjectData(cmd: ProjectDataCmdType, data: any, prj: ProjectData) {
        return new Observable((observer) => {
            if (this.bridge) {
                if (this.bridge.saveProject(prj)) {
                    observer.next(); 
                } else {
                    observer.error();
                }
            } else {
                localStorage.setItem(this.getAppId(), JSON.stringify(prj));
                observer.next();
            }
        });
    }
    
    getDeviceSecurity(name: string): Observable<any> {
        return new Observable((observer) => {
            observer.error('Not supported!');
        });
    }

    setDeviceSecurity(name: string, value: string): Observable<any> {
        return new Observable((observer) => {
            observer.next('Not supported!');
        });
    }

    getAlarmsValues(): Observable<any> {
        return new Observable((observer) => {
            observer.error('Not supported!');
        });
    }
    
    setAlarmAck(name: string): Observable<any> {
        return new Observable((observer) => {
            observer.error('Not supported!');
        });
    }

    checkServer(): Observable<any> {
        return new Observable((observer) => {
            observer.next();
        });
    }

    getAppId() {
        return ResourceStorageService.prjresource;
    }
}