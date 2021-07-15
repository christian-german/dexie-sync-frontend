import { OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

export class PresentationalComponent implements OnDestroy {
  destroy$ = new Subject();

  ngOnDestroy() {
    this.destroy$.next();
  }
}
