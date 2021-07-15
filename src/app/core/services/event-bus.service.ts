import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { IEventRegister } from '../interfaces/IEventRegister';
import { IEvent } from '../interfaces/IEvent';
import { EmitEvent, EmitRecord } from '../interfaces/Event';

@Injectable()
export class EventBusService {

  private eventRegister: IEventRegister[];
  private eventLastEmitted: any = {};

  constructor() {
    this.eventRegister = [];
  }

  //#region Public
  /**
   * register event with or without default value.
   * @param event should be IEvent type.
   * @param defaultValue is option if data passed BehaviorSubject type has been considered else Subject type.
   */
  registerEvent(event: IEvent, defaultValue?: unknown) {
    if (this.checkEventRegister(event)) {
      throw `${event} event already registered`;
    }

    this.eventRegister.push({event: event, subject: defaultValue ? new BehaviorSubject(defaultValue) : new Subject()});
  }

  /**
   * unregister the event.
   * @param event should be IEvent type.
   */
  unregisterEvent(event: IEvent): boolean {
    let $index = this.getRegisteredEventIndex(event);
    if ($index > 0) {
      this.eventRegister.splice($index - 1, 1);
      return true;
    }
    return false;
  }

  /**
   * Binding function to subscribe the published event.
   * If event has not registered, it will register the same with default Subject type
   * @param event should be IEvent type.
   * @param emittedValue by the event based on selected enum.
   */
  on<T>(event: IEvent, emittedValue?: EmitRecord): Observable<T> {
    let $subject = this.checkEventRegister(event);
    if (!$subject) {
      $subject = {event: event, subject: new Subject()};
      this.eventRegister.push($subject);
    }
    if (this.eventLastEmitted[event as string] && emittedValue) {
      let response;
      const eventName = event as string;
      switch (emittedValue) {
        case EmitRecord.First:
          response = this.eventLastEmitted[eventName][0];
          break;
        case EmitRecord.Last:
          response = this.eventLastEmitted[eventName][this.eventLastEmitted[eventName].length - 1];
          break;
        case EmitRecord.All:
          response = this.eventLastEmitted[eventName];
          break;
      }
      setTimeout((data: any) => {
        // @ts-ignore
        $subject.subject.next(data);
      }, 0, response);
    }
    return $subject.subject.asObservable();
  }

  /**
   * Publish event using this function.
   * If event has not registered it will register it with default BehaviorSubject type
   * @param event should be EmitEvent type.
   */
  emit<T>(event: EmitEvent<T>) {
    let $subject = this.checkEventRegister(event.name);
    if (!$subject) {
      $subject = {event: event.name, subject: new Subject()};
      this.eventRegister.push($subject);
    }
    $subject.subject.next(event.value);
    this.eventLastEmitted[event.name as string] = this.eventLastEmitted[event.name as string] || [];
    this.eventLastEmitted[event.name as string].push(event.value);
  }

  //#endregion

  //#region Private
  private checkEventRegister(event: IEvent) {
    return this.eventRegister.find((item: IEventRegister) => {
      return event === item.event;
    });
  }

  private getRegisteredEventIndex(event: IEvent): number {
    let index = 0;
    this.eventRegister.find((item: IEventRegister) => {
      index++;
      return event === item.event;
    });
    return index;
  }

  //#endregion
}

