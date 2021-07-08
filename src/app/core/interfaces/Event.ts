import {IEvent} from "./IEvent";

export class EmitEvent<T> {
  constructor(public name: IEvent, public value?: T) {
  }
}
export enum EmitRecord {
  First = 1,
  Last = 2,
  All = 3
}
