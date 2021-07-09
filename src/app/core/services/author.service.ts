import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { from } from 'rxjs';
import { Book, BookService } from './book.service';
import { mergeMap, switchMap, tap } from 'rxjs/operators';
import { EventBusService } from './event-bus.service';
import { Store } from '../classes/store';
import { DatabaseService } from './database.service';

export interface Author {
  id: string;
  firstname: string;
  lastname: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthorService extends Store<Author> {
  constructor(protected readonly databaseService: DatabaseService,
              protected readonly eventBusService: EventBusService,
              protected readonly bookService: BookService) {
    super(databaseService, eventBusService,'authors');
  }

  delete(id: string) {
    // Remove associated books.
    return from(this.databaseService.transaction('rw', this.bookService.getTable(), this.table, () => {
      this.bookService.getTable().where('authorId').equals(id).each(book => {
        this.bookService.getTable().delete(book.id!).then();
      });
    })).pipe(
      switchMap(value => super.delete(id))
    );
  }

  getId(item: Author): string {
    return item.id;
  }
}
