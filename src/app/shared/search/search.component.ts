import { environment } from 'src/environments/environment';
import { debounceTime, filter, map } from 'rxjs/operators';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {

  @ViewChild('searchInput', { static: true })
  searchInput!: ElementRef;

  @Input()
  placeholder = '';

  @Input()
  minChars = 3;

  @Input()
  disabled = true;

  @Output()
  searchUpdate = new EventEmitter<string>();


  constructor() {
  }

  ngOnInit(): void {
    // prevent negative input
    if (this.minChars < 1) {
      this.minChars = 1;
    }
    fromEvent<KeyboardEvent>(this.searchInput.nativeElement, 'keyup').pipe(
      map((e) => {
        return (e.target as HTMLInputElement).value;
      }),
      filter(res => {
        if (res.length > this.minChars - 1) {
          this.disabled = false;
        } else {
          this.disabled = true;
          if (res.length === 0) {
            this.clear();
          }
        }
        return !this.disabled;
      }),
      debounceTime(environment.DEBOUNCE_TIME)
    ).subscribe(text => {
      this.searchUpdate.emit(text);
    });
  }

  clear(): void {
    (this.searchInput.nativeElement as HTMLInputElement).value = '';
    this.searchUpdate.emit('');
    this.disabled = true;
  }

  search(): void {
    this.searchUpdate.emit((this.searchInput.nativeElement as HTMLInputElement).value);
  }
}
