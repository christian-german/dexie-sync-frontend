import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { Book, BookService } from '../services/book.service';

@Injectable({providedIn: 'root'})
export class BookResolver implements Resolve<Book | null> {
  constructor(private bookService: BookService) {
  }

  resolve(route: ActivatedRouteSnapshot): Book | Observable<Book | null> | Promise<Book | null> | null {
    if (route && route.params.id as string) {
      // @ts-ignore
      return this.bookService.get(route.params.id);
    } else {
      return null;
    }
  }
}
