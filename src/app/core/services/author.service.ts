import {Injectable} from '@angular/core';
import Dexie from 'dexie';
import {from} from "rxjs";
import {Book} from "./book.service";
import {DatabaseService} from "./database.service";

export interface Author {
  id?: string;
  firstname: string;
  lastname: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthorService {
  authorTable: Dexie.Table<Author, string>;
  bookTable: Dexie.Table<Book, string>;

  constructor(private databaseService: DatabaseService) {
    this.authorTable = this.databaseService.table('authors');
    this.bookTable = this.databaseService.table('books');
  }

  get(id: string) {
    return this.authorTable.get(id);
  }

  getAll() {
    return from(this.authorTable.toArray()).pipe();
  }

  add(data: Author) {
    return this.authorTable.add(data);
  }

  update(id: string, data: Author) {
    return from(this.authorTable.update(id, data)).pipe();
  }

  delete(id: string) {
    this.databaseService.transaction('rw', this.bookTable, this.authorTable, () => {
      // Remove associated books.
      this.bookTable.where('authorId').equals(id).each(book => {
        this.bookTable.delete(book.id!).then();
      }).then(() => {
        this.authorTable.delete(id).then();
      });
    });
  }
}
