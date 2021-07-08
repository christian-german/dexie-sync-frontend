import { IEvent } from '../interfaces/IEvent';
import { StoreIdentity } from '../interfaces/store-identity';

export class StoreEvents implements IEvent {
  public static STORE_CACHE_ADD = 'STORE_CACHE_ADD';
  public static STORE_CACHE_REMOVE = 'STORE_CACHE_REMOVE';
  public static STORE_REGISTER = 'STORE_REGISTER';
}

export interface Event {
  payload: any;
}

export interface StoreCacheAddEvent extends Event {
  tableName: string;
}

export class DexieEvents implements IEvent {
  public static DEXIE_START_SYNC: string = "DEXIE_START_SYNC";
  public static DEXIE_END_SYNC: string = "DEXIE_END_SYNC";
  public static DEXIE_TABLE_CHANGE: string = "DEXIE_TABLE_CHANGE";
}
