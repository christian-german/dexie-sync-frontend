import { DatabaseService } from '../services/database.service';
import { Table } from 'dexie';
import { BehaviorSubject, from, merge } from 'rxjs';
import { filter, map, pluck, tap } from 'rxjs/operators';
import { EventBusService } from '../services/event-bus.service';
import { DexieEvents, StoreCacheAddedEvent, StoreEvents, StoreRegisterEvent } from './bus-events';
import { DatabaseChangeType, IDatabaseChange } from 'dexie-observable/api';
import { EmitEvent } from '../interfaces/Event';
import { StoreIdentity } from '../interfaces/store-identity';


export abstract class Store<T> {

  protected readonly table: Table<T, string> = this.databaseService.table(this.tableName);
  protected readonly cache$ = new BehaviorSubject<Map<string, T>>(new Map());

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
      tap(value => this.addToCache([item])),
    );
  }

  delete(id: string) {
    return from(this.table.delete(id)).pipe(
      tap(value => this.removeFromCache([id]))
    )
  }

  addToCache(items: any[]) {
    const currentCache = this.cache$.getValue();
    items.forEach((item) => currentCache.set(item.id, item));
    this.cache$.next(currentCache);
    this.eventBusService.emit<StoreCacheAddedEvent<T>>(new EmitEvent(StoreEvents.STORE_CACHE_ADDED, {tableName: this.tableName, payload: {addedItems: items}}));
  }

  get(id: string, refresh = false) {
    return this.cache$.pipe(
      pluck(id),
    );
  };

  mapToArray(data: Map<string, any>) {
    const array = [];
    for (let [first, second] of data.entries()) {
      array.push(second);
    }
    return array;
  }

  getAll() {
    return merge(
      this.cache$.pipe(
        map(cache => this.mapToArray(cache))
      ),
      from(this.table.toArray()).pipe(
        tap(value => this.addToCache(value)),
      )
    )
  }

  getByKey(key: string, keyValue: string) {
    return merge(
      this.cache$.pipe(
        map(cache => this.mapToArray(cache).filter(item => item[key] === keyValue))
      ),
      from(this.table.where(key).equals(keyValue).toArray()).pipe(
        tap(value => this.addToCache(value)),
      )
    )
  }

  removeFromCache(ids: any[]) {
    const currentCache = this.cache$.getValue();
    ids.forEach(id => currentCache.delete(id));
    this.cache$.next(currentCache);
  }

  applyTableChange(changes: Record<DatabaseChangeType, IDatabaseChange[]>) {
    if (changes[DatabaseChangeType.Create].length > 0) {
      this.addToCache(changes[DatabaseChangeType.Create]);
    }
    if (changes[DatabaseChangeType.Delete].length > 0) {
      this.removeFromCache(changes[DatabaseChangeType.Delete])
    }
    if (changes[DatabaseChangeType.Update].length > 0) {

    }
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
}
