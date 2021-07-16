import { Injectable } from '@angular/core';
import { fromEvent } from 'rxjs';
import { tap } from 'rxjs/operators';
import { log } from '../classes/logger';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {

  constructor() { }

  connectionChange$() {
    const connection = (navigator as any).connection;
    let type = connection.effectiveType;
    return fromEvent(connection, 'change').pipe(
      tap(value => {
        log('NetworkService', `Connection type changed from ${type} to ${connection.effectiveType}`);
        log('NetworkService', `Effective bandwidth estimate ${connection.downlink}Mb/s`);
        type = connection.effectiveType;
      })
    );
  }
}
