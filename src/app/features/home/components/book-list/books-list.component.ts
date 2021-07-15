import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Book, BookStore } from '../../../../core/stores/book.store';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddBookComponent } from '../dialog-add-book/dialog-add-book.component';

@Component({
  selector: 'app-list-books',
  templateUrl: './books-list.component.html',
  styleUrls: ['./books-list.component.scss']
})
export class BooksListComponent implements OnInit {

  @Input()
  authorId: string | undefined;
  books$: Observable<Book[]> | undefined;
  addedBookTitle: string = '';

  constructor(private readonly bookService: BookStore, public dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.books$ = this.getBooks(this.authorId!!);
  }

  getBooks(authorId: string): Observable<Book[]> {
    return this.bookService.getBooksByAuthorId(authorId);
  }

  addBook() {
    const dialogRef = this.dialog.open(DialogAddBookComponent, {
      width: '350px',
      data: {title: this.addedBookTitle}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.bookService.add(
          {
            title: result.title,
            authorId: this.authorId!!
          }
        ).subscribe();
      }
    });
  }
}
