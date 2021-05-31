import { forwardRef } from "@angular/core";
import { Injectable } from "@angular/core";
import { Observable } from 'rxjs';

import { ResWebApiService } from './reswebapi.service';
import { ProjectData, ProjectDataCmdType } from '../../_models/project';

@Injectable()
export abstract class ResourceStorageService {
    public abstract getDemoProject(): Observable<any>;
    
    public abstract getStorageProject(): Observable<any>;

    public abstract setServerProject(prj: ProjectData);

    public abstract setServerProjectData(cmd: ProjectDataCmdType, data: any, prj: ProjectData);
    
    public abstract getDeviceSecurity(name: string): Observable<any>;

    public abstract setDeviceSecurity(name: string, value: string): Observable<any>;

    public abstract getAlarmsValues(): Observable<any>;
    
    public abstract setAlarmAck(name: string): Observable<any>;

    public abstract checkServer(): Observable<any>;

    public AppId: string = '';

	// public abstract get<T>( key: string ) : Promise<T | null>;
	// public abstract remove( key: string ) : void;
	// public abstract set( key: string, value: any ) : void;
}