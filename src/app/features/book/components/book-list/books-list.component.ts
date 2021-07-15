import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Book, BookStore } from '../../../../core/stores/book.store';

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
    this.books$ = this.getBooks(this.authorId!!);
  }

  getBooks(authorId: string): Observable<Book[]> {
    return this.bookService.getBooksByAuthorId(authorId);
  }

  addBook() {
    this.bookService.add(
      {
        title: 'New book',
        authorId: this.authorId!!
      }
    ).subscribe();
  }
}
