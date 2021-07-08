import { Injectable } from '@angular/core';
import { EventBusService } from './event-bus.service';
import { BehaviorSubject } from 'rxjs';
import { StoreIdentity } from '../interfaces/store-identity';
import { StoreCacheAddEvent, StoreEvents } from '../classes/bus-events';

@Injectable({
  providedIn: 'root'
})
export class StoreCollectionService {

  private readonly stores = new BehaviorSubject<StoreIdentity[]>([])

  constructor(
    private readonly eventBusService: EventBusService,
  ) {
    this.listenToRegisterStore();
  }

  private listenToRegisterStore() {
    this.eventBusService.on<StoreCacheAddEvent>(StoreEvents.STORE_REGISTER).subscribe((store: StoreIdentity) => {
      this.stores.next([...this.stores.getValue(), store])
      console.info(this.stores.getValue());
    })
  }
}
