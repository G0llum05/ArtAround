import {Routes} from '@angular/router';
import {GalleryPage} from './pages/gallery/gallery.component';
import {PageNotFoundPage} from './pages/page-not-found/page-not-found.component';
import {TestComponent} from './pages/test.component/test.component';
import {TestLoginComponent} from './pages/test-login.component/test-login.component';
import {TestUserComponent} from './pages/test-user.component/test-user.component';
import {TestMuseumComponent} from './pages/test-museum.component/test-museum.component';
import {TestVisitComponent} from './pages/test-visit.component/test-visit.component';
import {UploadDemoComponent} from './pages/upload-demo/upload-demo.component';

export const routes: Routes = [
  {path: '', component: GalleryPage},
  {path: 'uploadDemo', component: UploadDemoComponent},
  {path: 'test', component: TestComponent},
  {path: 'loginTest', component: TestLoginComponent},
  {path: 'userTest', component: TestUserComponent},
  {path: 'museumTest', component: TestMuseumComponent},
  {path: 'visitTest', component: TestVisitComponent},
  {path: '**', component: PageNotFoundPage} // Questa è una rotta di fallback
]

