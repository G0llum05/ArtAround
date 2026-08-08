import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { PageNotFound } from './pages/page-not-found/page-not-found';
import { Visit } from './pages/visit/visit';
import { Contacts } from './pages/contacts/contacts';

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
    path: 'contacts',
    component: Contacts,
  },
  {
    path: '**',
    component: PageNotFound
  }
];
