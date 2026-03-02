import {Routes} from '@angular/router';
import {LandingComponent} from './pages/landing/landing';
import {GalleryComponent} from './pages/gallery/gallery';
import {PageNotFoundComponent} from './pages/page-not-found/page-not-found';

export const routes: Routes = [
  {path: '', component: LandingComponent},
  {path: 'galleria', component: GalleryComponent},
  {path: '**', component: PageNotFoundComponent} // Questa è una rotta di fallback, che reindirizza a '' (Gallery) se l'utente inserisce una rotta non valida
]

