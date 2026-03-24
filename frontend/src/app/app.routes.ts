import {Routes} from '@angular/router';
import {GalleryPage} from './pages/gallery/gallery';
import {PageNotFoundPage} from './pages/page-not-found/page-not-found';
import {TestComponent} from './pages/test.component/test.component';
import {TestLoginComponent} from './pages/test-login.component/test-login.component';
import {TestUserComponent} from './pages/test-user.component/test-user.component';
import {TestMuseumComponent} from './pages/test-museum.component/test-museum.component';
import {TestVisitComponent} from './pages/test-visit.component/test-visit.component';
import {TestOperaComponent} from './pages/test-opera.component/test-opera.component';

export const routes: Routes = [
  {path: '', component: GalleryPage},
  {path: 'test', component: TestComponent},
  {path: 'loginTest', component: TestLoginComponent},
  {path: 'userTest', component: TestUserComponent},
  {path: 'museumTest', component: TestMuseumComponent},
  {path: 'visitTest', component: TestVisitComponent},
  {path: 'operaTest', component: TestOperaComponent},
  {path: '**', component: PageNotFoundPage} // Questa è una rotta di fallback, che reindirizza a '' (Gallery) se l'utente inserisce una rotta non valida
]

