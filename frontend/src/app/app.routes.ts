import {Routes} from '@angular/router';
import {GalleryPage} from './pages/gallery/gallery';
import {PageNotFoundPage} from './pages/page-not-found/page-not-found';

export const routes: Routes = [
  {path: '', component: GalleryPage},
  {path: '**', component: PageNotFoundPage} // Questa è una rotta di fallback, che reindirizza a '' (Gallery) se l'utente inserisce una rotta non valida
]

