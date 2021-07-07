import {SharedModule} from '../../shared/shared.module';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ScrollingModule} from '@angular/cdk/scrolling';

import {HomeRoutingModule} from './home-routing.module';
import {HomeComponent} from './components/home/home.component';
import {BooksListComponent} from "../book/components/book-list/books-list.component";
import {MatTableModule} from "@angular/material/table";
import {MatInputModule} from "@angular/material/input";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {DialogAddAuthorComponent} from "./components/dialog-add-author/dialog-add-author.component";
import {MatDialogModule} from "@angular/material/dialog";

@NgModule({
  declarations: [HomeComponent, BooksListComponent, DialogAddAuthorComponent],
  imports: [
    CommonModule,
    HomeRoutingModule,
    SharedModule,
    ScrollingModule,
    MatInputModule,
    MatTableModule,
    MatCheckboxModule,
    MatDialogModule
  ]
})
export class HomeModule {
}
