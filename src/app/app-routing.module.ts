import {BookListModule} from './features/book/book-list.module';
import {HomeModule} from './features/home/home.module';
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [{
  path: 'home',
  loadChildren: () => HomeModule
}, {
  path: 'book',
  loadChildren: () => BookListModule
}, {
  path: '**',
  redirectTo: 'home'
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
  constructor() {
  }
}
