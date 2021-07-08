import { DatabaseService } from '../services/database.service';
import { Table } from 'dexie';
import { BehaviorSubject, from, merge } from 'rxjs';
import { map, pluck, tap } from 'rxjs/operators';
import { EventBusService } from '../services/event-bus.service';
import { DexieEvents, StoreCacheAddEvent, StoreEvents } from './bus-events';
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
    this.eventBusService.emit<StoreCacheAddEvent>(new EmitEvent(StoreEvents.STORE_CACHE_ADD, {tableName: this.tableName, payload: items}));
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

  applyTableChange(change: IDatabaseChange) {
    switch (change.type) {
      case DatabaseChangeType.Create:
        this.addToCache([change.obj]);
        break;
      case DatabaseChangeType.Delete:
        this.removeFromCache([change.key])
        break;
      case DatabaseChangeType.Update:
    }
  }

  private listenToTableChange() {
    this.eventBusService.on<IDatabaseChange>(DexieEvents.DEXIE_TABLE_CHANGE).subscribe((change: IDatabaseChange) => this.applyTableChange(change))
  }

  private registerStore() {
    this.eventBusService.emit(new EmitEvent(StoreEvents.STORE_REGISTER, {
      tableName: this.tableName,
    }))
  }
}
