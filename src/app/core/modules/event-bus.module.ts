import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventBusService } from '../services/event-bus.service';



@NgModule({
  imports: [CommonModule],
  providers: [EventBusService]
})
export class EventBusModule { }
