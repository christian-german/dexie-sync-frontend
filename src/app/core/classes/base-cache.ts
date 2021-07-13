import { BehaviorSubject } from 'rxjs';

export class BaseCache<T> extends BehaviorSubject<Map<string, T>> {
  isSyncronizing$ = new BehaviorSubject(false);
  isLocked$ = new BehaviorSubject(false);

  constructor(isLocked = false) {
    super(new Map<string, T>());
    this.isLocked$.next(isLocked);
  }
}
