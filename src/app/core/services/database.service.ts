import { Injectable } from '@angular/core';
import { EventBusService } from './event-bus.service';
import { EmitEvent } from '../interfaces/Event';
import { DexieEvents } from '../classes/bus-events';
import { DexieService } from './dexie.service';
import { Transaction, TransactionMode } from 'dexie';
import { DatabaseChangeType, ICreateChange, IDatabaseChange, IDeleteChange } from 'dexie-observable/api';

const LOGGER_FROM = 'DatabaseService'

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {

  constructor(
    private readonly eventBusService: EventBusService,
    private readonly dexieService: DexieService) {

    this.dexieService.onChange().subscribe(masterChanges => {
        this.propagateChangesToStore(masterChanges);
        // this.dexieService.clearChanges();
      }
    )
  }

  getTableByName<T, O>(tableName: string) {
    return this.dexieService.table<T, O>(tableName);
  }

  createTransaction(mode: TransactionMode, tables: string[], scope: (mode: Transaction) => unknown) {
    return this.dexieService.transaction(mode, tables, scope);
  }

  private propagateChangesToStore(changes: IDatabaseChange[]) {
    const mappedArray = changes.reduce((accumulator: Record<string, Record<DatabaseChangeType, IDatabaseChange[]>>, item) => {
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
      console.info('Propagating: ', mappedArray[mappedArrayKey]);
    }
  }
}
