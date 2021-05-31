
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ProjectData, ProjectDataCmdType } from '../../_models/project';
import { ResourceStorageService } from './resource-storage.service';
import { Utils } from '../../_helpers/utils';

@Injectable()
export class ResClientService implements ResourceStorageService {

    constructor(private http: HttpClient) {
    }

    getDemoProject(): Observable<any> {
        return this.http.get<any>('./assets/project.demo.fuxap', {});
    }

    getStorageProject(): Observable<any> {
        return new Observable((observer) => {
            let prj = localStorage.getItem(this.getProjectName());
            if (prj) {
                observer.next(JSON.parse(prj));
            } else {
                observer.next();
            }
        });
    }

    setServerProject(prj: ProjectData) {
        return new Observable((observer) => {
            localStorage.setItem(this.getProjectName(), JSON.stringify(prj));
            observer.next();
        });
    }

    setServerProjectData(cmd: ProjectDataCmdType, data: any, prj: ProjectData) {
        return new Observable((observer) => {
            // localStorage.setItem(this.prjpart, JSON.stringify(data));
            localStorage.setItem(this.getProjectName(), JSON.stringify(prj));
            observer.next();
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

    getProjectName() {
        return ResourceStorageService.prjresource;
    }
}