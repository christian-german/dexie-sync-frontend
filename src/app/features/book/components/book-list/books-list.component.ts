import {Component, Input, OnInit} from '@angular/core';
import {Book, BookService} from "../../services/book.service";
import {Observable} from "rxjs";

@Component({
  selector: 'app-list-books',
  templateUrl: './books-list.component.html',
  styleUrls: ['./books-list.component.scss']
})
export class BooksListComponent implements OnInit {

  @Input()
  authorId: string | undefined;

  books$: Observable<Book[]> | undefined;

  constructor(private readonly bookService: BookService) {
  }

  ngOnInit(): void {
    this.books$ = this.getBooks(this.authorId!!);
    // this.books$.subscribe((data) => console.info('New: ', data));
  }

  getBooks(authorId: string): Observable<Book[]> {
    return this.bookService.getBooksByAuthorId(authorId);
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
