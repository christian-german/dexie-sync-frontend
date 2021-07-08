import { Router } from '@angular/router';
import { SearchComponent } from '../../shared/search/search.component';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthorService } from '../../features/book/services/author.service';
import { map } from 'rxjs/operators';
import { SearchService } from '../../shared/services/search.service';
import { BookService } from '../../features/book/services/book.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  @ViewChild(SearchComponent) appSearch!: SearchComponent;
  // disabled = this.datastoreService.isSearching;

  nbAuthors$ = this.authorService.getAll().pipe(
    map(authors => authors.length),
  );

  nbBooks$ = this.bookService.getAll().pipe(
    map(books => books.length),
  )

  constructor(
    private readonly authorService: AuthorService,
    private readonly bookService: BookService,
    private router: Router,
    private readonly searchService: SearchService) {
  }

  ngOnInit(): void {
    // this.datastoreService.nbResults.subscribe((num: number) => this.nbResults = num);
  }

  doSearch(text: string): void {
    this.searchService.query.next(text);
  }

  goHome(): void {
    if (this.appSearch) {
      this.appSearch.clear();
    }
    this.router.navigate(['/home']);
  }

}
