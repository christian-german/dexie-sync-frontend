import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { map } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddAuthorComponent } from '../dialog-add-author/dialog-add-author.component';
import { SearchService } from '../../../../shared/services/search.service';
import { Author, AuthorService } from '../../../../core/services/author.service';
import { BookService } from '../../../../core/services/book.service';
import { MatPaginator } from '@angular/material/paginator';

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
})
export class HomeComponent implements OnInit {

  authors$!: Observable<Author[]>;
  cardsCols$: Observable<number>;
  expandedAuthor!: Author | null;
  selection = new SelectionModel<Author>(true, []);
  datasource = new MatTableDataSource<any>();
  addedAuthorFirstname: string = '';
  addedAuthorLastname: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  @ViewChild('viewport') viewport: CdkVirtualScrollViewport | undefined;

  constructor(private authorService: AuthorService,
              private bookService: BookService,
              private readonly breakpointObserver: BreakpointObserver,
              public dialog: MatDialog,
              public searchService: SearchService) {
    this.cardsCols$ = this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.Tablet]).pipe(
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

    const connection = (navigator as any).connection;
    let type = connection.effectiveType;
    const updateConnectionStatus = () => {
      console.log(`Connection type changed from ${type} to ${connection.effectiveType}`);
      console.log(`Effective bandwidth estimate ${connection.downlink}Mb/s`);
      type = connection.effectiveType;
    }
    connection.addEventListener('change', updateConnectionStatus);
  }

  ngOnInit(): void {
    this.authorService.getAll().subscribe(value => {
      this.datasource = new MatTableDataSource<any>(value);
      this.datasource.paginator = this.paginator;
    })
    this.searchService.query.subscribe(searchTerm => {
      const filterValue = searchTerm;
      console.info(searchTerm)
      this.datasource.filter = filterValue.trim().toLowerCase();
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

  addAuthor() {
    this.authorService.add(
      {
        firstname: 'Author1-firstname',
        lastname: 'Author1-lastname'
      }
    );
  }

  deleteSelected() {
    this.selection.selected.forEach(
      author => {
        console.log(`Deleting author: ${JSON.stringify(author)}`);
        this.authorService.delete(author.id!).subscribe();
      }
    );
  }

  openAddAuthorDialog() {
    const dialogRef = this.dialog.open(DialogAddAuthorComponent, {
      width: '350px',
      data: {firstname: this.addedAuthorFirstname, lastname: this.addedAuthorLastname}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(result);
        this.authorService.add(
          {
            firstname: result.firstname,
            lastname: result.lastname
          }
        ).subscribe();
      }
    });
  }
}
