import {LayoutModule} from '@angular/cdk/layout';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatCardModule} from '@angular/material/card';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatGridListModule} from '@angular/material/grid-list';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SearchComponent} from './search/search.component';
import {FormsModule} from '@angular/forms';
import {MatCardPrimaryComponent} from './mat-card-primary/mat-card-primary.component';
import {PromptComponent} from "./prompt-component/prompt-component";
import {MatBottomSheetModule} from "@angular/material/bottom-sheet";

@NgModule({
  declarations: [SearchComponent, MatCardPrimaryComponent, PromptComponent],
  imports: [
    CommonModule,
    MatGridListModule,
    MatBottomSheetModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    LayoutModule,
    MatToolbarModule,
    FormsModule
  ],
  exports: [
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    LayoutModule,
    MatToolbarModule,
    SearchComponent,
    MatCardPrimaryComponent,
    FormsModule
  ]
})
export class SharedModule {
}
