import {Injectable} from '@angular/core';
import Dexie from 'dexie';
import {DatabaseService} from "../../../core/services/database.service";
import {from, Observable} from "rxjs";
import { Store } from '../../../core/classes/store';
import { pluck, tap } from 'rxjs/operators';
import { EventBusService } from '../../../core/services/event-bus.service';

export interface Book {
  id: string;
  title: string;
  authorId: string;
}

@Injectable({
  providedIn: 'root',
})
export class BookService extends Store<Book> {

  constructor(protected readonly databaseService: DatabaseService,
              protected readonly eventBusService: EventBusService) {
    super(databaseService, eventBusService,'books');
  }

  getBooksByAuthorId(authorId: string): Observable<Book[]> {
    return this.getByKey('authorId', authorId);
  }

  getId(item: Book): string {
    return item.id;
  }
}
