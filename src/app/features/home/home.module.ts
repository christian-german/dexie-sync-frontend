import {SharedModule} from '../../shared/shared.module';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ScrollingModule} from '@angular/cdk/scrolling';

import {HomeRoutingModule} from './home-routing.module';
import {HomeComponent} from './components/home/home.component';
import {MatTableModule} from "@angular/material/table";
import {MatInputModule} from "@angular/material/input";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {DialogAddAuthorComponent} from "./components/dialog-add-author/dialog-add-author.component";
import {MatDialogModule} from "@angular/material/dialog";
import {BooksListComponent} from "./components/book-list/books-list.component";
import {DialogAddBookComponent} from "./components/dialog-add-book/dialog-add-book.component";
import {MatPaginatorModule} from "@angular/material/paginator";
import { HomeService } from './services/home.service';

@NgModule({
  declarations: [HomeComponent, BooksListComponent, DialogAddAuthorComponent, DialogAddBookComponent],
  imports: [
    CommonModule,
    HomeRoutingModule,
    SharedModule,
    ScrollingModule,
    MatInputModule,
    MatTableModule,
    MatCheckboxModule,
    MatDialogModule,
    MatPaginatorModule
  ],
  providers: [
    HomeService,
  ]
})
export class HomeModule {
}
