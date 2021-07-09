import { IEvent } from '../interfaces/IEvent';

export class StoreEvents implements IEvent {
  public static STORE_CACHE_ADDED = 'STORE_CACHE_ADD';
  public static STORE_CACHE_REMOVE = 'STORE_CACHE_REMOVE';
  public static STORE_REGISTER = 'STORE_REGISTER';
}

export interface Event {
  payload?: any;
}

export interface StoreCacheAddedEvent<T> extends Event {
  tableName: string;
  payload: {
    addedItems: T[]
  }
}

export interface StoreRegisterEvent extends Event {
  tableName: string;
}

export interface CurrentRevisionChangeEvent extends Event {
  payload: {
    currentRevision: number;
  }
}

export class DexieEvents implements IEvent {
  public static DEXIE_START_SYNC: string = 'DEXIE_START_SYNC';
  public static DEXIE_CURRENT_REVISION_CHANGE: string = 'DEXIE_CURRENT_REVISION_CHANGE';
  public static DEXIE_END_SYNC: string = 'DEXIE_END_SYNC';
  public static DEXIE_TABLE_CHANGE: string = 'DEXIE_TABLE_CHANGE';
}
