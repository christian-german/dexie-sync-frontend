import { Injectable } from '@angular/core';
import { from } from 'rxjs';
import { BookStore } from './book.store';
import { switchMap } from 'rxjs/operators';
import { EventBusService } from '../services/event-bus.service';
import { BaseStore } from '../classes/baseStore';
import { DatabaseService } from '../services/database.service';

export interface Author {
  id: string;
  firstname: string;
  lastname: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthorStore extends BaseStore<Author> {
  constructor(protected readonly databaseService: DatabaseService,
              protected readonly eventBusService: EventBusService,
              protected readonly bookStore: BookStore) {
    super(databaseService, eventBusService, 'authors');
  }

  delete(id: string) {
    // Remove associated books.
    return from(this.databaseService.transaction('rw', this.bookStore.getTable(), this.table, () => {
      this.bookStore.getTable().where('authorId').equals(id).each(book => {
        this.bookStore.getTable().delete(book.id!).then();
      });
    })).pipe(
      switchMap(value => super.delete(id))
    );
  }

  getId(item: Author): string {
    return item.id;
  }
}
