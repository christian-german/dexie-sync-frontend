import { Injectable } from '@angular/core';
import { Author, AuthorStore } from '../../../core/stores/author.store';
import { Book, BookStore } from '../../../core/stores/book.store';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { SearchService } from '../../../shared/services/search.service';
import { map, mergeMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { DialogAddAuthorComponent } from '../components/dialog-add-author/dialog-add-author.component';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  constructor(
    private readonly authorService: AuthorStore,
    private readonly bookService: BookStore,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly dialog: MatDialog,
    private readonly searchService: SearchService,
    private readonly authorStore: AuthorStore,
    private readonly bookStore: BookStore,
  ) { }

  get authors(): Observable<Author[]> {
    return this.authorStore.getAll();
  }

  get books(): Observable<Book[]> {
    return this.bookStore.getAll();
  }

  addAuthor() {
    this.authorStore.add(
      {
        firstname: 'Author1-firstname',
        lastname: 'Author1-lastname'
      }
    );
  }

  getCardsCols$(): Observable<1 | 2 | 4> {
    return this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.Tablet]).pipe(
      map(({matches}) => {
        if (matches && this.breakpointObserver.isMatched(Breakpoints.Handset)) {
          return 1;
        }

        if (matches && this.breakpointObserver.isMatched(Breakpoints.Tablet)) {
          return 2;
        }
        return 4;
      })
    );
  }

  getQuery$(): Observable<string> {
    return this.searchService.query.asObservable();
  }

  openAddAuthorDialog(firstname?: string, lastname?: string) {
    const dialogRef = this.dialog.open(DialogAddAuthorComponent, {
      width: '350px',
      data: {firstname, lastname}
    });
    return dialogRef.afterClosed().pipe(
      mergeMap((result: any) => {
        if (result) {
          return this.authorStore.add(
            {
              firstname: result.firstname,
              lastname: result.lastname
            }
          )
        }
        return of(result);
      })
    );
  }

  createFilterPredicate() {
    return (author: Author, search: string) => {
      search = search.toLowerCase();
      let returning = false;
      if (author.lastname.toLowerCase().includes(search)) {
        return true;
      }
      if (author.firstname.toLowerCase().includes(search)) {
        return true;
      }
      const booksCache = this.bookStore.getCache();
      for (let [id, book] of booksCache.entries()) {
        if (book.title.toLowerCase().includes(search) && book.authorId === author.id) {
          returning = true;
          break;
        }
      }
      return returning;
    };
  }

  deleteAuthor(id: string) {
    return this.authorStore.delete(id);
  }
}
