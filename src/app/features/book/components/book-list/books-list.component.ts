import {Component, Input, OnInit} from '@angular/core';
import {Observable} from "rxjs";
import { Book, BookStore } from '../../../../core/stores/book.store';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-list-books',
  templateUrl: './books-list.component.html',
  styleUrls: ['./books-list.component.scss']
})
export class BooksListComponent implements OnInit {

  @Input()
  authorId: string | undefined;

  books$: Observable<Book[]> | undefined;

  constructor(private readonly bookService: BookStore) {
  }

  ngOnInit(): void {
    this.books$ = this.getBooks(this.authorId!!).pipe(
    );
    // this.books$.subscribe((data) => console.info('New: ', data));
  }

  getBooks(authorId: string): Observable<Book[]> {
    console.info('GetBooks');
    return this.bookService.getBooksByAuthorId(authorId).pipe(
      tap(value => console.info(value)),
    );
  }

  addBook() {
    this.bookService.add(
      {
        title: "New book",
        authorId: this.authorId!!
      }
    ).subscribe();
  }
}
