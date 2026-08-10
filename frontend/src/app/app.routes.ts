import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { PageNotFound } from './pages/page-not-found/page-not-found';
import { Visit } from './pages/visit/visit';
import { Contacts } from './pages/contacts/contacts';
import { Login } from './pages/login/login';
import {VisitPreview} from './pages/visit-preview/visit-preview';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'visit',
    component: Visit
  },
  {
    path: 'visit/:id',
    component: VisitPreview,
  },
  {
    path: 'contacts',
    component: Contacts,
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: '**',
    component: PageNotFound
  }
];
