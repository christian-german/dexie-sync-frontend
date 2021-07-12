import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EventBusService } from './event-bus.service';
import { StoreCacheDataAddedEvent, StoreEvents } from '../classes/bus-events';
import { StoreCollectionService } from './store-collection.service';

@Injectable({
  providedIn: 'root'
})
export class AlterationsService {

  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly eventBusService: EventBusService,
  ) {
    this.notifyAnyCacheChange();
  }

  private notifyAnyCacheChange() {
    this.eventBusService.on<StoreCacheDataAddedEvent<any>>(StoreEvents.STORE_CACHE_DATA_ADDED).subscribe(store => {
      this.snackBar.open(`Cache altered for: ${store.tableName}`, '', {duration: 1500})
    })
  }
}
