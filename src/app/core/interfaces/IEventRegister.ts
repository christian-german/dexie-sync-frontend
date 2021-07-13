import { BehaviorSubject, Subject } from 'rxjs';
import { IEvent } from './IEvent';

export interface IEventRegister {
  event: IEvent;
  subject: Subject<any> | BehaviorSubject<unknown>;
}
