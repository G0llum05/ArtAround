import {Routes} from '@angular/router';
import {GalleryPage} from './pages/gallery/gallery';
import {PageNotFoundPage} from './pages/page-not-found/page-not-found';
import {TestComponent} from './pages/test.component/test.component';

export const routes: Routes = [
  {path: '', component: GalleryPage},
  {path: 'test', component: TestComponent}, //rotta di test, da eliminare
  {path: '**', component: PageNotFoundPage} // Questa è una rotta di fallback, che reindirizza a '' (Gallery) se l'utente inserisce una rotta non valida
]

