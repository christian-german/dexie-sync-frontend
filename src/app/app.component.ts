import {Router} from '@angular/router';
import {Component, HostListener} from '@angular/core';
import {DatabaseService} from "./core/services/database.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private readonly datastoreService: DatabaseService, private readonly router: Router) {
    // this.datastoreService.doSearch.subscribe((text: string) => {
    //   this.router.navigate(['/home'], {state: {searchTerm: text}});
    // });
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'F1') {
      console.log('F1 key press');
      event.stopPropagation();
      event.preventDefault();
    }

    if (event.key === 'F9') {
      // this.datastoreService.doSearch.emit('');
    }
  }

}
