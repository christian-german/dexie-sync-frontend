import { BaseCache } from './base-cache';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

export interface CacheOperation<T> {
  lastRefresh: Date;
  timeAfterConsideredExpired: number;
  refresher$: () => Observable<T>
  id: string;
}

export class CacheOperations<T> extends BaseCache<T[]> {
  refresh$ = new Subject();
  idsTimeTable = new Map<string, CacheOperation<T[]>>();

  constructor(
    protected readonly initialState?: Map<string, T[]>
  ) {
    super(initialState ? initialState : new Map<string, T[]>());
  }

  refresh(id: string, refresher$: () => Observable<T[]>, timeAfterConsideredExpired = 10000) {
    return refresher$().pipe(
      tap(_ => this.idsTimeTable.set(id, {
        timeAfterConsideredExpired: timeAfterConsideredExpired,
        lastRefresh: new Date(),
        refresher$: refresher$,
        id,
      })),
      tap(value => this.set(value, id)),
    )
  }

  set(items: T[], key: string) {
    const nextState = this.getValue();
    nextState.set(key, items);
    this.next(nextState);
  }

  remove(ids: string[]) {
    const nextState = this.getValue();
    ids.forEach(id => nextState.delete(id));
    this.next(nextState);
  }

  get(id: string, refresher$: () => Observable<T[]>, timeAfterConsideredExpired = 10000) {
    return this.pipe(
      map(state => state.get(id)),
      switchMap(item => {
        if (item && !this.isExpiredResponse(id)) {
          return of(item);
        } else {
          return this.refresh(id, refresher$, timeAfterConsideredExpired);
        }
      })
    )
  }

  refreshAll() {
    const obs$: Observable<T[]>[] = [];
    this.isSyncronizing$.next(true);
    this.idsTimeTable.forEach(item => obs$.push(this.refresh(item.id, item.refresher$, item.timeAfterConsideredExpired)));
    console.info(`Doing heavy refresh on ${obs$.length} observers`);
    return forkJoin(obs$).pipe(
      tap(_ => this.isSyncronizing$.next(false)),
    );
  }

  private isExpiredResponse(id: string) {
    const element = this.idsTimeTable.get(id);
    if (!element) {
      return true;
    }
    return new Date().getTime() - element.lastRefresh.getTime() > element.timeAfterConsideredExpired;
  }
}
