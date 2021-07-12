import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import syncable from 'dexie-syncable';
import { HttpClient } from '@angular/common/http';
import { DatabaseChangeType, ICreateChange, IDatabaseChange, IDeleteChange } from 'dexie-observable/api';
import { EventBusService } from './event-bus.service';
import { EmitEvent } from '../interfaces/Event';
import observable from 'dexie-observable';
import { CurrentRevisionChangeEvent, DexieEvents } from '../classes/bus-events';
import { environment } from '../../../environments/environment';
import { from } from 'rxjs';

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

@Injectable({
  providedIn: 'root',
})
export class DatabaseService extends Dexie {

  constructor(private http: HttpClient,
              private readonly eventBusService: EventBusService) {
    super('LibraryDb', {addons: [observable, syncable]});
    this.listenToSyncChanges();
    this.initDexieDatabase();
    this.initDexieSyncro(http, eventBusService);
    this.connectDexieSyncro();

    // TODO Peut être plus utile (à retirer)
    this.syncable.on('statusChanged', function (newStatus, url) {
      console.log('Sync Status changed: ' + Dexie.Syncable.StatusTexts[newStatus]);
    });
  }

  /**
   * Cette méthode écoute l'event DEXIE_END_SYNC pour ensuite propager les changes dans EventBusService
   * aux stores correspondant (ie: BookService recevra un appel à sa méthode applyTableChange(change))
   * @private
   */
  private listenToSyncChanges() {
    this.eventBusService.on<ServerResponse>(DexieEvents.DEXIE_END_SYNC).subscribe((serverResponse: ServerResponse) => {
      // Propage la nouvelle version de currentRevision
      this.eventBusService.emit(new EmitEvent<CurrentRevisionChangeEvent>(DexieEvents.DEXIE_CURRENT_REVISION_CHANGE,
        {payload: {currentRevision: serverResponse.currentRevision}}))
      // Propage aux stores associés les changements à appliquer
      const mappedArray = serverResponse.changes.reduce((accumulator: Record<string, Record<DatabaseChangeType, IDatabaseChange[]>>, item) => {
        if (!accumulator[item.table]) {
          accumulator[item.table] = {
            [DatabaseChangeType.Create]: [],
            [DatabaseChangeType.Delete]: [],
            [DatabaseChangeType.Update]: [],
          };
        }
        switch (item.type) {
          case DatabaseChangeType.Update:
          case DatabaseChangeType.Delete:
            accumulator[item.table][item.type].push((item as IDeleteChange).key);
            break;
          case DatabaseChangeType.Create:
            accumulator[item.table][item.type].push((item as ICreateChange).obj);
            break;
        }
        return accumulator;
      }, {})
      for (let mappedArrayKey in mappedArray) {
        this.eventBusService.emit(new EmitEvent(DexieEvents.DEXIE_TABLE_CHANGE, {
          tableName: mappedArrayKey,
          payload: mappedArray[mappedArrayKey]
        }));
      }
    })
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

      sync: function (context, url, options, baseRevision, syncedRevision, changes, partial, applyRemoteChanges, onChangesAccepted, onSuccess, onError) {

        // `Hello, my name is ${fullName}.
        console.log(`send resquest on: ${url} with base revision: ${baseRevision}, syncedRevision: ${syncedRevision}, partial: ${partial}`);
        console.log(`changes sent: ${JSON.stringify(changes)}`);

        const POLL_INTERVAL = 10000;

        const request = {
          clientIdentity: context.clientIdentity || null,
          baseRevision: baseRevision || 0,
          partial: partial,
          changes: changes,
          syncedRevision: syncedRevision
        };

        // TODO Propagate the changes to all corresponding angular's store
        http.post<any>(url, request).subscribe(
          res => {
            console.log(`received request with currentRevision: ${res.currentRevision}, clientIdentity: ${res.clientIdentity}, partial: ${res.partial}, success: ${res.success}`);
            console.log(`received changes: ${JSON.stringify(res.changes)}`);

            if (!res.success) {
              // Infinity: Stop la synchro.
              onError(res.errorMessage, Infinity);
            } else {
              if ('clientIdentity' in res) {
                context.clientIdentity = res.clientIdentity;
                // Make sure we save the clientIdentity sent by the server before we try to resync.
                // If saving fails we wouldn't be able to do a partial synchronization
                context.save()
                  .then(() => {
                    // Since we got success, we also know that server accepted our changes:
                    onChangesAccepted();
                    // Convert the response format to the Dexie.Syncable.Remote.SyncProtocolAPI specification:
                    applyRemoteChanges(res.changes, res.currentRevision, res.partial, res.needsResync);
                    // Immediatly send another request if the client received a partial change.
                    if (res.partial) {
                      onSuccess({again: 0});
                    } else {
                      onSuccess({again: POLL_INTERVAL});
                    }
                    eventBusService.emit(new EmitEvent(DexieEvents.DEXIE_END_SYNC, res));
                  })
                  .catch((e) => {
                    // We didn't manage to save the clientIdentity stop synchronization
                    onError(e, Infinity);
                  });
              } else {
                // Since we got success, we also know that server accepted our changes:
                onChangesAccepted();
                // Convert the response format to the Dexie.Syncable.Remote.SyncProtocolAPI specification:
                applyRemoteChanges(res.changes, res.currentRevision, res.partial, res.needsResync);
                onSuccess({again: POLL_INTERVAL});
                eventBusService.emit(new EmitEvent(DexieEvents.DEXIE_END_SYNC, res));
              }
            }
          },
          error => {
            console.log('error');
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
}
