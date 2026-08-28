import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { PageNotFound } from './pages/page-not-found/page-not-found';
import { Visit } from './pages/visit/visit';
import { Contacts } from './pages/contacts/contacts';
import { Login } from './pages/login/login';
import { Navigator } from './pages/navigator/navigator';
import { Marketplace } from './pages/marketplace/marketplace';
import { Groups } from './pages/groups/groups';
import { GroupRoom } from './pages/groups/group-room/group-room';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'groups',
    component: Groups
  },
  {
    path: 'groups/room/:code',
    component: GroupRoom
  },
  {
    path: 'groups/room',
    component: GroupRoom
  },
  {
    path: 'marketplace',
    children: [
      {
        path: '**',
        component: Marketplace
      },
    ],
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
    path: 'navigator',
    component: Navigator
  },
  {
    path: '**',
    component: PageNotFound
  }
];
