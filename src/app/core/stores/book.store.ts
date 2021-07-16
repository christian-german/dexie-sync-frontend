import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseStore } from '../classes/baseStore';
import { DatabaseService } from '../services/database.service';
import { EventBusService } from '../services/event-bus.service';

export interface Book {
  id: string;
  title: string;
  authorId: string;
}

@Injectable({
  providedIn: 'root',
})
export class BookStore extends BaseStore<Book> {

  constructor(protected readonly databaseService: DatabaseService,
              protected readonly eventBusService: EventBusService) {
    super(databaseService, eventBusService, 'books');
  }

  getCache(): Map<string, Book> {
    return this.cacheData$.getValue();
  }

  getBooksByAuthorId(authorId: string): Observable<Book[]> {
    return this.getByKey('authorId', authorId);
  }

  selectedId(item: Book): string {
    return item.id;
  }
}
