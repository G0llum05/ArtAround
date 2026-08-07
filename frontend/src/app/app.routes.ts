import { Routes } from '@angular/router';
import { GalleryPage } from './pages/gallery/gallery.component';
import { LoginComponent } from './pages/login/login.component';
import { PageNotFoundPage } from './pages/page-not-found/page-not-found.component';
import { TestMuseumComponent } from './pages/test-museum.component/test-museum.component';
import { TestUserComponent } from './pages/test-user.component/test-user.component';
import { TestVisitComponent } from './pages/test-visit.component/test-visit.component';
import { TestComponent } from './pages/test.component/test.component';
import { UploadDemoComponent } from './pages/upload-demo/upload-demo.component';

import { NavigatorComponent } from './pages/navigator.component/navigator.component';

import { TestArtistComponent } from './pages/test-artist.component/test-artist.component';
import { TestArtworkComponent } from './pages/test-artwork.component/test-artwork.component';

export const routes: Routes = [
  {path: '', component: GalleryPage},
  {path: 'login', component: LoginComponent},
  {path: 'loginTest', redirectTo: 'login', pathMatch: 'full'},
  {path: 'uploadDemo', component: UploadDemoComponent},
  {path: 'test', component: TestComponent},
  {path: 'userTest', component: TestUserComponent},
  {path: 'museumTest', component: TestMuseumComponent},
  {path: 'artistTest', component: TestArtistComponent},
  {path: 'artworkTest', component: TestArtworkComponent},
  {path: 'visitTest', component: TestVisitComponent},
  {path: 'navigator', component: NavigatorComponent},
  {path: 'navigatorTest', component: NavigatorComponent},
  {path: 'visite', component: TestVisitComponent},
  {path: '**', component: PageNotFoundPage} // Rotta di fallback
]

