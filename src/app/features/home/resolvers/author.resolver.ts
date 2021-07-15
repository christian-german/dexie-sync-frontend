import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { Author, AuthorService } from '../services/author.service';

@Injectable({providedIn: 'root'})
export class AuthorResolver implements Resolve<Author | null> {
  constructor(private authorService: AuthorService) {
  }

  resolve(route: ActivatedRouteSnapshot): Author | Observable<Author | null> | Promise<Author | null> | null {
    if (route && route.params.id as string) {
      // @ts-ignore
      return this.authorService.get(route.params.id);
    } else {
      return null;
    }
  }
}
