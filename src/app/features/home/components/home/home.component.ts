import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { Author } from '../../../../core/stores/author.store';
import { MatPaginator } from '@angular/material/paginator';
import { HomeService } from '../../services/home.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {

  authors$!: Observable<Author[]>;
  cardsCols$: Observable<number> = this.homeService.getCardsCols$();
  expandedAuthor!: Author | null;
  selection = new SelectionModel<Author>(true, []);
  datasource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  @ViewChild('viewport') viewport: CdkVirtualScrollViewport | undefined;

  constructor(
    private readonly homeService: HomeService,
  ) {
  }

  ngOnInit(): void {
    this.homeService.authors.subscribe((authors) => {
      this.datasource = new MatTableDataSource<any>(authors);
      this.datasource.paginator = this.paginator;
      this.datasource.filterPredicate = this.homeService.createFilterPredicate();
    })
    this.homeService.getQuery$().subscribe(searchTerm => {
      this.datasource.filter = searchTerm.trim().toLowerCase();
    })
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.datasource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.datasource.data);
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  deleteSelected() {
    this.selection.selected.forEach(
      author => {
        this.homeService.deleteAuthor(author.id!).subscribe();
      }
    );
  }

  openAddAuthorDialog() {
    this.homeService.openAddAuthorDialog().pipe(first()).subscribe()
  }
}
