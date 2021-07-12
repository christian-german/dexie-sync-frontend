import { DatabaseService } from '../services/database.service';
import { Table } from 'dexie';
import { from, Observable, of } from 'rxjs';
import { filter, first, pluck, tap } from 'rxjs/operators';
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

const REFRESH_INTERVAL = 10000;
const CACHE_SIZE = 1;

export abstract class BaseStore<T> {

  protected readonly table: Table<T, string> = this.databaseService.table(this.tableName);
  protected readonly cacheData$: CacheData<T> = new CacheData<T>(from(this.table.toArray()), this.getId);
  protected readonly cacheOperations$: CacheOperations<T> = new CacheOperations<T>();


  protected constructor(
    protected readonly databaseService: DatabaseService,
    protected readonly eventBusService: EventBusService,
    private readonly tableName: string,
  ) {
    this.registerStore();
    this.listenToTableChange();
  }


  abstract getId(item: T): string;

  getTable(): Table<T, string> {
    return this.table;
  }

  add(item: Partial<T>) {
    return from(this.table.add(item as T)).pipe(
      tap(value => this.addToCache('data', [item])),
    );
  }

  delete(id: string) {
    return from(this.table.delete(id)).pipe(
      tap(value => this.removeFromCache([id]))
    )
  }

  addToCache(cacheType: 'data' | 'operations', items: any[], key?: string) {
    switch (cacheType) {
      case 'data':
        this.cacheData$.add(items);
        this.cacheOperations$.refreshAll().subscribe();
        this.eventBusService.emit<StoreCacheDataAddedEvent<T>>(new EmitEvent(StoreEvents.STORE_CACHE_DATA_ADDED, {
          tableName: this.tableName,
          payload: {addedItems: items}
        }));
        break;
      case 'operations':
        if (key) {
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
    return this.cacheData$.pipe(
      pluck(id),
    );
  };

  getAll() {
    return this.cacheData$.toMapArray()
  }

  /**

   𝐮𝐧𝐢𝐯𝐞𝐫𝐬 DATA

   */

  getByKey(key: string, keyValue: string): Observable<T[]> {
    return this.cacheOperations$.get(`getByKey-${key}-${keyValue}`, () => from(this.table.where(key).equals(keyValue).toArray()));
  }

  /**

   𝐮𝐧𝐢𝐯𝐞𝐫𝐬 OPERATORS

   */

  removeFromCache(ids: any[]) {
    this.cacheData$.remove(ids);
  }

  applyTableChange(changes: Record<DatabaseChangeType, IDatabaseChange[]>) {
    this.cacheData$.isSyncronizing$.pipe(
      tap(value => console.info('sync: ', value)),
      filter(value => value === false),
      tap(() => {
        if (changes[DatabaseChangeType.Create].length > 0) {
          this.addToCache('data', changes[DatabaseChangeType.Create]);
          console.info(this.cacheData$.getValue());
        }
        if (changes[DatabaseChangeType.Delete].length > 0) {
          this.removeFromCache(changes[DatabaseChangeType.Delete])
        }
        if (changes[DatabaseChangeType.Update].length > 0) {

        }
      })
    ).subscribe()
  }

  private listenToTableChange() {
    this.eventBusService.on<any>(DexieEvents.DEXIE_TABLE_CHANGE).pipe(
      tap(event => console.info(`From: ${this.tableName}Service Received: ${event.tableName}`)),
      filter(event => event.tableName === this.tableName),
    ).subscribe((event) => this.applyTableChange(event.payload))
  }

  private registerStore() {
    this.eventBusService.emit(new EmitEvent<StoreRegisterEvent>(StoreEvents.STORE_REGISTER, {
      tableName: this.tableName,
    }))
  }

  private getAllCacheOperations() {
    return of([]);
  }
}
