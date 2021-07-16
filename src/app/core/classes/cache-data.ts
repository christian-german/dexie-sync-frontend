import { Observable, Subject } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { BaseCache } from './base-cache';
import { logError } from './logger';

export class CacheData<T> extends BaseCache<T> {

  refresh$ = new Subject();
  onRefresh$ = this.refresh$.pipe(
    filter(_ => !this.isLocked$.getValue()),
    tap(_ => this.isSyncronizing$.next(true)),
    switchMap(_ => this.refresher$),
    map(values => this.toMap(values)),
    tap(values => this.next(values)),
    tap(_ => this.isSyncronizing$.next(false)),
  )

  /**
   * Envoyer l'observable permettant d'obtenir la donnée fraiche à mettre dans le replaySubject
   * @param refresher$ une observable (ex: http.get(xxxx), dexie.query(xxx))
   * @param getId
   * @param initialState
   */
  constructor(
    protected readonly isLocked = false,
    protected readonly refresher$: Observable<T[]>,
    protected readonly getId: (item: T) => string,
  ) {
    super(isLocked);
    this.onRefresh$.subscribe();
    this.refresh();
  }

  toMapArray() {
    return this.pipe(
      map(data => {
        const array: T[] = [];
        for (let [first, second] of data.entries()) {
          array.push(second);
        }
        return array;
      })
    )
  }


  refresh() {
    this.refresh$.next();
  }

  toMap(values: T[],) {
    const newMap = new Map<string, T>();
    values.forEach((value) => {
      newMap.set(this.getId(value), value);
    })
    return newMap;
  }

  add(items: T[]) {
    const nextState = this.getValue();
    items.forEach(item => {
      if (nextState.get((item as any).id)) {
        logError('CacheData', `Item already in cache: ${(item as any).id}`);
      }
      return nextState.set(this.getId(item), item);
    });
    this.next(nextState);
  }

  remove(ids: string[]) {
    const nextState = this.getValue();
    ids.forEach(id => nextState.delete(id));
    this.next(nextState);
  }
}
