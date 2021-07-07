import {Router} from '@angular/router';
import {SearchComponent} from '../../shared/search/search.component';
import {Component, OnInit, ViewChild} from '@angular/core';
import {DatabaseService} from "../services/database.service";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  @ViewChild(SearchComponent) appSearch!: SearchComponent;
  // disabled = this.datastoreService.isSearching;

  nbResults = 0;

  constructor(private datastoreService: DatabaseService, private router: Router) {
  }

  ngOnInit(): void {
    // this.datastoreService.nbResults.subscribe((num: number) => this.nbResults = num);
  }

  doSearch(text: string): void {
    // this.datastoreService.doSearch.emit(text);
  }

  goHome(): void {
    if (this.appSearch) {
      this.appSearch.clear();
    }
    this.router.navigate(['/home']);
  }

}
