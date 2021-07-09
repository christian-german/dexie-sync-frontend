import {Injectable} from '@angular/core';
import Dexie from 'dexie';
import {from, Observable} from "rxjs";
import {DatabaseService} from "./database.service";

export interface Book {
  id?: string;
  title: string;
  authorId: string;
}

@Injectable({
  providedIn: 'root',
})
export class BookService {
  table: Dexie.Table<Book, string>;

  constructor(private databaseService: DatabaseService) {
    this.table = this.databaseService.table('books');
  }

  get(id: string) {
    return this.table.get(id);
  }

  getAll() {
    return this.table.toArray();
  }

  add(data: Book) {
    return this.table.add(data);
  }

  update(id: string, data: Book) {
    return from(this.table.update(id, data));
  }

  remove(id: string) {
    return this.table.delete(id);
  }

  getBooksByAuthorId(authorId: string): Observable<Book[]> {
    return from(this.table.where('authorId').anyOf(authorId).toArray());
  }
}
