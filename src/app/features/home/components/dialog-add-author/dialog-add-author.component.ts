import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

export interface DialogData {
  firstname: string;
  lastname: string;
}

@Component({
  selector: 'dialog-add-author',
  templateUrl: 'dialog-add-author.html',
})
export class DialogAddAuthorComponent {

  constructor(
    public dialogRef: MatDialogRef<DialogAddAuthorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

}
