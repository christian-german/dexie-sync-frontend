import { DatabaseService } from '../services/database.service';
import { Table } from 'dexie';
import { from, Observable } from 'rxjs';
import { filter, pluck, tap } from 'rxjs/operators';
import { EventBusService } from '../services/event-bus.service';
import {
  DexieEvents,
  StoreCacheDataAddedEvent,
  StoreCacheOperationAddedEvent,
  StoreEvents,
  StoreRegisterEvent
} from './bus-events';
import { DatabaseChangeType, IDatabaseChange } from 'dexie-observable/api';
import { EmitEvent } from '../interfaces/Event';
import { CacheData } from './cache-data';
import { CacheOperations } from './cache-operations';
import { log } from './logger';

const LOGGER_FROM = 'BaseStore';

export abstract class BaseStore<T> {

  protected readonly table: Table<T, string> = this.databaseService.getTableByName<T, string>(this.tableName);
  protected readonly cacheData$: CacheData<T> = new CacheData<T>(!this.isAlreadySynced(), from(this.table.toArray()), this.selectedId);
  protected readonly cacheOperations$: CacheOperations<T> = new CacheOperations<T>(!this.isAlreadySynced());


  protected constructor(
    protected readonly databaseService: DatabaseService,
    protected readonly eventBusService: EventBusService,
    private readonly tableName: string,
  ) {
    this.registerStore();
    this.listenToDexieEvents();
  }


  abstract selectedId(item: T): string;

  getTable(): Table<T, string> {
    log(LOGGER_FROM + this.tableName, 'getTable()')
    return this.table;
  }

  add(item: Partial<T>) {
    log(LOGGER_FROM + this.tableName, `adding one item to ${this.tableName} table.`)
    return from(this.table.add(item as T)).pipe(
      tap(value => {
        log(LOGGER_FROM + this.tableName, `adding one item to ${this.tableName} cache.`)
        this.addToCache('data', [item]);
      }),
    );
  }

  delete(id: string) {
    log(LOGGER_FROM + this.tableName, `removing one item from ${this.tableName} table.`)
    return from(this.table.delete(id)).pipe(
      tap(value => {
        log(LOGGER_FROM + this.tableName, `removing one item from ${this.tableName} cache.`)
        this.removeFromCache([id]);
      })
    )
  }

  addToCache(cacheType: 'data' | 'operations', items: any[], key?: string) {
    switch (cacheType) {
      case 'data':
        log(LOGGER_FROM + this.tableName, `adding ${items.length} to ${this.tableName}'s data cache.`)
        this.cacheData$.add(items);
        this.cacheOperations$.refreshAll().subscribe();
        this.eventBusService.emit<StoreCacheDataAddedEvent<T>>(new EmitEvent(StoreEvents.STORE_CACHE_DATA_ADDED, {
          tableName: this.tableName,
          payload: {addedItems: items}
        }));
        break;
      case 'operations':
        if (key) {
          log(LOGGER_FROM + this.tableName, `adding ${items.length} to ${this.tableName}'s operations cache with idOperation: ${key}.`)
          this.cacheOperations$.set(items, key)
          this.eventBusService.emit<StoreCacheOperationAddedEvent<T>>(new EmitEvent(StoreEvents.STORE_CACHE_OPERATION_ADDED, {
            tableName: this.tableName,
            payload: {addedItems: items, operationKey: key}
          }));
        }
        break;
    }
  }

  get(id: string, refresh = false) {
    log(LOGGER_FROM + this.tableName, `getting one item from ${this.tableName}'s data cache.`)
    return this.cacheData$.pipe(
      pluck(id),
    );
  };

  getAll() {
    log(LOGGER_FROM + this.tableName, `getting all data from ${this.tableName}'s data cache.`)
    return this.cacheData$.toMapArray()
  }

  /**

   𝐮𝐧𝐢𝐯𝐞𝐫𝐬 DATA

   */

  getByKey(key: string, keyValue: string): Observable<T[]> {
    const id = `getByKey-${key}-${keyValue}`;
    log(LOGGER_FROM + this.tableName, `getting all data from ${this.tableName}'s data operations cache with id: ${id}.`)
    return this.cacheOperations$.get(id, () => from(this.table.where(key).equals(keyValue).toArray()));
  }

  /**

   𝐮𝐧𝐢𝐯𝐞𝐫𝐬 OPERATORS

   */

  removeFromCache(ids: any[]) {
    log(LOGGER_FROM + this.tableName, `removing ${ids.length} items from ${this.tableName}'s data cache.`)
    this.cacheData$.remove(ids);
  }

  applyTableChange(changes: Record<DatabaseChangeType, IDatabaseChange[]>) {
    log(LOGGER_FROM + this.tableName, `applyingTableChange for ${this.tableName} with ${changes[DatabaseChangeType.Create].length} creation, ${changes[DatabaseChangeType.Delete].length} deletions, ${changes[DatabaseChangeType.Update].length} updates.`)
    if (changes[DatabaseChangeType.Create].length > 0) {
      this.addToCache('data', changes[DatabaseChangeType.Create]);
    }
    if (changes[DatabaseChangeType.Delete].length > 0) {
      this.removeFromCache(changes[DatabaseChangeType.Delete])
    }
    if (changes[DatabaseChangeType.Update].length > 0) {

    }
  }

  private registerStore() {
    log(LOGGER_FROM + this.tableName, `Sending StoreRegisterEvent for ${this.tableName}`);
    this.eventBusService.emit(new EmitEvent<StoreRegisterEvent>(StoreEvents.STORE_REGISTER, {
      tableName: this.tableName,
    }))
  }

  private listenToDexieEvents() {
    // ListenToTableChange
    log(LOGGER_FROM + this.tableName, `Watching for DexieTableChange on ${this.tableName}.`);
    this.eventBusService.on<any>(DexieEvents.DEXIE_TABLE_CHANGE).pipe(
      filter(event => event.tableName === this.tableName),
    ).subscribe((event) => this.applyTableChange(event.payload))
  }

  private isAlreadySynced() {
    const lastDexieEnd = localStorage.getItem('LAST_DEXIE_END_SYNC');
    if (!lastDexieEnd) {
      return false;
    } else {
      return true;
    }
  }
}
