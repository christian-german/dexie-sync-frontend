import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreCollectionService } from '../services/store-collection.service';
import { AlterationsService } from '../services/alterations.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatSnackBarModule,
  ],
  providers: [
    StoreCollectionService,
    AlterationsService,
  ]
})
export class StoreModule {
  constructor(
    private readonly storeCollectionService: StoreCollectionService,
    private readonly alterationsService: AlterationsService,
  ) {

  }

}
