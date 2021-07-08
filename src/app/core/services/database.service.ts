import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import syncable from 'dexie-syncable';
import { HttpClient } from '@angular/common/http';
import { IDatabaseChange } from 'dexie-observable/api';
import { EventBusService } from './event-bus.service';
import { EmitEvent } from '../interfaces/Event';
import observable from 'dexie-observable';
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
    this.eventBusService.on<IDatabaseChange[]>(DexieEvents.DEXIE_END_SYNC).subscribe((changes: IDatabaseChange[]) => {
      changes.forEach(change => {
        this.eventBusService.emit(new EmitEvent(DexieEvents.DEXIE_TABLE_CHANGE, change));
      })
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
        console.log(`send resquest on: ${url}`);
        console.log(`data sent: ${JSON.stringify(changes)}`);

        const POLL_INTERVAL = 10000;

        const request = {
          clientIdentity: context.clientIdentity || null,
          baseRevision: baseRevision + 1,
          partial: partial,
          changes: changes,
          syncedRevision: syncedRevision
        };
        console.info(changes);
        // TODO Propagate the changes to all corresponding angular's store
        http.post<any>(url, request).subscribe(
          res => {
            console.log(`received data: ${JSON.stringify(res)}`);

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
                    onSuccess({again: POLL_INTERVAL});
                    eventBusService.emit(new EmitEvent(DexieEvents.DEXIE_END_SYNC, res.changes));
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
                eventBusService.emit(new EmitEvent(DexieEvents.DEXIE_END_SYNC, res.changes));
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
    this.syncable.connect('ajax_protocol', 'http://localhost:8080/sync')
      .catch(err => {
        console.error(`Failed to connect: ${err.stack || err}`);
      });
  }
}
