import { IEvent } from '../interfaces/IEvent';
import { SynchroState } from '../services/dexie.service';

export class StoreEvents implements IEvent {
  public static STORE_CACHE_DATA_ADDED = 'STORE_CACHE_DATA_ADDED';
  public static STORE_CACHE_DATA_REMOVE = 'STORE_CACHE_DATA_REMOVE';

  public static STORE_CACHE_OPERATION_ADDED = 'STORE_CACHE_OPERATION_ADDED';
  public static STORE_CACHE_OPERATION_REMOVE = 'STORE_CACHE_OPERATION_REMOVE';
  public static STORE_REGISTER = 'STORE_REGISTER';
}

export interface Event {
  payload?: any;
}

export interface DexieStateChangedEvent extends Event {
  payload: {
    state: SynchroState
  }
}

export interface StoreCacheDataAddedEvent<T> extends Event {
  tableName: string;
  payload: {
    addedItems: T[]
  }
}

export interface StoreCacheOperationAddedEvent<T> extends Event {
  tableName: string;
  payload: {
    operationKey: string;
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
  public static DEXIE_CURRENT_REVISION_CHANGE: string = 'DEXIE_CURRENT_REVISION_CHANGE';
  public static DEXIE_TABLE_CHANGE: string = 'DEXIE_TABLE_CHANGE';
  static STATE_CHANGED: 'DEXIE_STATE_CHANGED';
}
