import {Injectable} from "@angular/core";
import Dexie from "dexie";
import observable from 'dexie-observable';
import syncable from 'dexie-syncable';
import {HttpClient} from "@angular/common/http";
import {IDatabaseChange} from "dexie-observable/api";

@Injectable({
  providedIn: 'root',
})
export class DatabaseService extends Dexie {

  constructor(private http: HttpClient) {
    super('LibraryDb', {addons: [observable, syncable]});
    this.version(1).stores({
      books: '$$id, title, authorId',
      authors: '$$id, firstname, lastname'
    });

    Dexie.Syncable.registerSyncProtocol("ajax_protocol", {

      sync: function (context, url, options, baseRevision, syncedRevision, changes, partial, applyRemoteChanges, onChangesAccepted, onSuccess, onError) {

        // `Hello, my name is ${fullName}.
        console.log(`send resquest on: ${url}`);
        console.log(`data sent: ${JSON.stringify(changes)}`);

        const POLL_INTERVAL = 10000;

        const request = {
          clientIdentity: context.clientIdentity || null,
          baseRevision: baseRevision,
          partial: partial,
          changes: changes,
          syncedRevision: syncedRevision
        };

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
              }
            }
          },
          error => {
            console.log("error");
            onError(error, POLL_INTERVAL);
          }
        )
      }
    });

    this.syncable.connect("ajax_protocol", "http://localhost:8080/sync")
      .catch(err => {
        console.error(`Failed to connect: ${err.stack || err}`);
      });

    this.syncable.on('statusChanged', function (newStatus, url) {
      console.log("Sync Status changed: " + Dexie.Syncable.StatusTexts[newStatus]);
    });
  }
}

export interface ServerResponse {
  success: boolean;
  errorMessage: string;
  changes: IDatabaseChange[];
  currentRevision: any;
  needsResync: boolean;
  partial: boolean;
  clientIdentity: string;

  //    success: true / false,
  //    errorMessage: "",
  //    changes: changes,
  //    currentRevision: revisionOfLastChange,
  //    needsResync: false, // Flag telling that server doesn't have given syncedRevision or of other reason wants client to resync. ATTENTION: this flag is currently ignored by Dexie.Syncable
  //    partial: true / false, // The server sent only a part of the changes it has for us. On next resync it will send more based on the clientIdentity
  //    [clientIdentity: unique value representing the client identity. Only provided if we did not supply a valid clientIdentity in the request.]
}
