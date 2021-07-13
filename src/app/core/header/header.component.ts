import { Router } from '@angular/router';
import { SearchComponent } from '../../shared/search/search.component';
import { Component, OnInit, ViewChild } from '@angular/core';
import { map } from 'rxjs/operators';
import { SearchService } from '../../shared/services/search.service';
import { AuthorStore } from '../stores/author.store';
import { BookStore } from '../stores/book.store';
import { EventBusService } from '../services/event-bus.service';
import { DexieEvents, DexieStateChangedEvent } from '../classes/bus-events';

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

  currentRevision$ = this.eventBusService.on<DexieStateChangedEvent>(DexieEvents.STATE_CHANGED).pipe(
    map(event => event.payload.state),
  )

  constructor(
    private readonly authorService: AuthorStore,
    private readonly bookService: BookStore,
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
