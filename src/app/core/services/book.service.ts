import {Injectable} from '@angular/core';
import Dexie from 'dexie';
import {from, Observable} from "rxjs";
import { pluck, tap } from 'rxjs/operators';
import { Store } from '../classes/store';
import { DatabaseService } from './database.service';
import { EventBusService } from './event-bus.service';

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
