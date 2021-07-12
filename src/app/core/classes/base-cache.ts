import { BehaviorSubject } from 'rxjs';

export class BaseCache<T> extends BehaviorSubject<Map<string, T>> {
  isSyncronizing$ = new BehaviorSubject(false);
}
