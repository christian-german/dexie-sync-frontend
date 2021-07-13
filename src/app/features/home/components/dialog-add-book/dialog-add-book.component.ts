import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DialogData {
  title: string;
}

@Component({
  selector: 'dialog-add-book',
  templateUrl: 'dialog-add-book.html',
})
export class DialogAddBookComponent {

  constructor(
    public dialogRef: MatDialogRef<DialogAddBookComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

}
