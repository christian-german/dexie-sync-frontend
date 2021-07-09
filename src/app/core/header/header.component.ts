import { Router } from '@angular/router';
import { SearchComponent } from '../../shared/search/search.component';
import { Component, OnInit, ViewChild } from '@angular/core';
import { map } from 'rxjs/operators';
import { SearchService } from '../../shared/services/search.service';
import { AuthorService } from '../services/author.service';
import { BookService } from '../services/book.service';
import { EventBusService } from '../services/event-bus.service';
import { CurrentRevisionChangeEvent, DexieEvents } from '../classes/bus-events';

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

  currentRevision$ = this.eventBusService.on<CurrentRevisionChangeEvent>(DexieEvents.DEXIE_CURRENT_REVISION_CHANGE).pipe(
    map(event => event.payload.currentRevision),
  )

  constructor(
    private readonly authorService: AuthorService,
    private readonly bookService: BookService,
    private router: Router,
    private readonly searchService: SearchService,
    // TODO REMOVE
    private readonly eventBusService: EventBusService) {
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
