import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EventBusService } from './event-bus.service';
import Dexie from 'dexie';
import { log, logError } from '../classes/logger';
import { environment } from '../../../environments/environment';
import observable from 'dexie-observable';
import syncable from 'dexie-syncable';
import { BehaviorSubject, combineLatest, from, of, Subject } from 'rxjs';
import { IDatabaseChange } from 'dexie-observable/api';
import { catchError, filter, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { EmitEvent } from '../interfaces/Event';
import { DexieEvents } from '../classes/bus-events';

export interface ServerResponse {
  success: boolean;
  errorMessage: string;
  changes: IDatabaseChange[];
  currentRevision: any;
  /**
   * Flag telling that server doesn't have given syncedRevision or of other reason wants client to resync. ATTENTION: this flag is currently ignored by Dexie.Syncable
   */
  needsResync: boolean;
  /**
   * The server sent only a part of the changes it has for us. On next resync it will send more based on the clientIdentity
   */
  partial: boolean;
  /**
   * unique value representing the client identity. Only provided if we did not supply a valid clientIdentity in the request
   */
  clientIdentity: string;
}

export enum SynchroState {
  ERROR = -1,
  OFFLINE,
  CONNECTING,
  ONLINE,
  SYNCING,
  ERROR_WILL_RETRY,
  SYNCING_PARTIALLY,
}

const LOGGER_FROM = 'DexieService'

interface DexieState {
  synchroState: SynchroState;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class DexieService extends Dexie {

  private readonly isSynchronizing$ = new BehaviorSubject(false);
  private readonly isLocked$ = new BehaviorSubject(false);
  private readonly isSyncingPartially$ = new BehaviorSubject(false);
  private readonly changes$ = new BehaviorSubject<IDatabaseChange[][]>([]);
  private readonly temp_changes$ = new Subject<IDatabaseChange[]>();

  // DEBUG
  private count = 0;

  constructor(private http: HttpClient,
              private readonly eventBusService: EventBusService) {
    super('LibraryDb', {addons: [observable, syncable]});
    this.initDexieDatabase();
    this.initDexieSyncro(http, eventBusService);
    this.connectDexieSyncro();
    this.syncable.on('statusChanged', (status, url) => this.onStateChange(status));
  }

  whenReadyToPropagate() {
    return combineLatest([this.changes$, this.isSynchronizing$, this.isSyncingPartially$, this.isLocked$]).pipe(
      filter(([change$, isSynchronizing$, isSyncingPartially$, isLocked$]) => change$.length > 0 && isSynchronizing$ === false && isSyncingPartially$ === false && isLocked$ === false),
      map(([changes, , ,]) => changes),
    )
  }

  addChange(changes: IDatabaseChange[]) {
    if (!changes || changes.length === 0) {
      return;
    }
    this.temp_changes$.next(changes);
  }

  onChange() {
    return this.temp_changes$.asObservable();
    // return this.changes$.pipe(
    //   filter(changes => changes.length > 0)
    // );
  }

  clearChanges() {
    this.changes$.next([]);
  }

  /**
   * Cette méthode permet d'étendre le protocole de syncro de Dexie
   * afin d'utiliser HttpClient
   * afin de propager à l'application à travers EventBusService les différents états de Dexie Syncro
   * afin d'appliquer des règles sur la représentation des changes (ordre, contraintes, etc...)
   * @param http
   * @param eventBusService
   * @private
   */
  private initDexieSyncro(http: HttpClient, eventBusService: EventBusService) {
    Dexie.Syncable.registerSyncProtocol('ajax_protocol', {

      sync: (context, url, options, baseRevision, syncedRevision, changes, partial, applyRemoteChanges, onChangesAccepted, onSuccess, onError) => {

        log(LOGGER_FROM, `Sending request to /sync: ${url} with base revision: ${baseRevision}, syncedRevision: ${syncedRevision}, partial: ${partial}`)

        const POLL_INTERVAL = 10000;

        const request = {
          clientIdentity: context.clientIdentity || null,
          baseRevision: baseRevision + 100,
          partial: partial,
          changes: changes,
          syncedRevision: syncedRevision
        };
        // TODO Propagate the changes to all corresponding angular's store
        http.post<any>(url, request).pipe(
          switchMap(res => {
            log(LOGGER_FROM, `Response to /sync from Server: ${res.currentRevision}, clientIdentity: ${res.clientIdentity}, partial: ${res.partial}, success: ${res.success}, changes: ${res.changes.length}`)
            if (!res.success) {
              // Infinity: Stop la synchro.
              onError(res.errorMessage, Infinity);
              logError(LOGGER_FROM, 'Error');
              return of(res.errorMessage);
            } else {
              if ('clientIdentity' in res) {
                context.clientIdentity = res.clientIdentity;
                // Make sure we save the clientIdentity sent by the server before we try to resync.
                // If saving fails we wouldn't be able to do a partial synchronization
                return from(context.save()).pipe(
                  mergeMap(x => {
                    // Since we got success, we also know that server accepted our changes:
                    onChangesAccepted();
                    // Convert the response format to the Dexie.Syncable.Remote.SyncProtocolAPI specification:
                    return from(applyRemoteChanges(res.changes, res.currentRevision, res.partial, res.needsResync)).pipe(
                      tap(_ => {
                        this.addChange(res.changes);
                        if (res.partial) {
                          onSuccess({again: 0});
                          this.onStateChange(SynchroState.SYNCING_PARTIALLY);
                        } else {
                          if (this.isSyncingPartially$.getValue()) {
                            this.isSyncingPartially$.next(false);
                          }
                          onSuccess({again: POLL_INTERVAL});
                        }
                      })
                    );
                    // Immediatly send another request if the client received a partial change.
                  }),
                  catchError(error => {
                    // We didn't manage to save the clientIdentity stop synchronization
                    onError(error, Infinity);
                    logError(LOGGER_FROM, 'Error');
                    return of(error);
                  })
                );

              } else {
                console.info('x1');
                // Since we got success, we also know that server accepted our changes:
                onChangesAccepted();
                // Convert the response format to the Dexie.Syncable.Remote.SyncProtocolAPI specification:
                return from(applyRemoteChanges(res.changes, res.currentRevision, res.partial, res.needsResync)).pipe(
                  tap(_ => {
                    this.addChange(res.changes);
                    onSuccess({again: POLL_INTERVAL});
                  })
                );
              }
            }
          })
        ).subscribe(
          res => {
          },
          error => {
            console.log('error');
            logError(LOGGER_FROM, 'Error');
            onError(error, POLL_INTERVAL);
          }
        )
      },
    });
  }

  /**
   * Cette méthode crée ou démarre la base de donnée dans IndexedDB interfacé par Dexie
   * @private
   */
  private initDexieDatabase() {
    this.version(1).stores({
      books: '$$id, title, authorId',
      authors: '$$id, firstname, lastname'
    });
    this.on('ready', () => {
      log(LOGGER_FROM, 'Dexie is ready !');
    })
    this.on('blocked', (event) => {
      log(LOGGER_FROM, 'Dexie is blocked !');
    })
    this.on('populate', (trans) => {
      log(LOGGER_FROM, 'Dexie is ready !');
    })
  }

  /**
   * Cette méthode se connecte à l'endpoint de syncro en utilisant le protocol custom au préalable construit
   * @private
   */
  private connectDexieSyncro() {
    this.syncable.connect('ajax_protocol', environment.serverUrl)
      .catch(err => {
        console.error(`Failed to connect: ${err.stack || err}`);
      });
  }

  private onStateChange(state: SynchroState) {
    this.eventBusService.emit(new EmitEvent(DexieEvents.STATE_CHANGED, {
      payload: {
        state,
      }
    }))
    switch (state) {
      /**
       * ERROR:
       * An irrepairable error occurred and the sync provider is dead.
       */
      case -1:
        logError(LOGGER_FROM, 'Breaking error in the syncro system.')
        break;
      /**
       * OFFLINE:
       * The sync provider hasnt yet become online, or it has been disconnected
       */
      case 0:
        log(LOGGER_FROM, 'You are considered offline for syncro system.')
        break;
      /**
       * CONNECTING:
       * Trying to connect to server
       */
      case 1:
        // TODO Implement pattern: Dexie <=> StoreDataConsumer
        log(LOGGER_FROM, 'Trying to connect to server.')
        this.isSynchronizing$.next(true);
        localStorage.setItem(`LAST_DEXIE_START_SYNC`, new Date().toISOString());
        break;
      /**
       * ONLINE:
       * Connected to server and currently in sync with server
       */
      case 2:
        // TODO Implement propagation Dexie is Stable
        log(LOGGER_FROM, 'Connected to server and currently in sync with server.')
        this.isSynchronizing$.next(false);
        localStorage.setItem(`LAST_DEXIE_END_SYNC`, new Date().toISOString());
        break;
      /**
       * SYNCING:
       * Syncing with server. For poll pattern, this is every poll call. For react pattern,
       * this is when local changes are being sent to server.
       */
      case 3:
        // TODO Implement propagation des locks lors de la syncro
        log(LOGGER_FROM, 'Start synchronizing with server.')
        this.isSynchronizing$.next(true);
        break;
      /**
       * ERROR_WILL_RETRY:
       * An error occured such as net down but the sync provider will retry to connect.
       */
      case 4:
        logError(LOGGER_FROM, 'A syncro system\'s error occured, retrying...');
        break;
      /**
       * SYNCING_PARTIALLY:
       * Received changes from server but more is coming (partial mode).
       */
      case 5:
        log(LOGGER_FROM, 'Received changes from server but more is coming (partial mode).');
        if (!this.isSyncingPartially$.getValue()) {
          this.isSyncingPartially$.next(true);
        }
        break;
    }
  }
}
