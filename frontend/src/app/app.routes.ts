import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.Home)
  },
  {
    path: 'groups',
    loadComponent: () => import('./pages/groups/groups').then(m => m.Groups)
  },
  {
    path: 'groups/room/:code',
    loadComponent: () => import('./pages/groups/group-room/group-room').then(m => m.GroupRoom)
  },
  {
    path: 'groups/room',
    loadComponent: () => import('./pages/groups/group-room/group-room').then(m => m.GroupRoom)
  },
  {
    path: 'marketplace',
    children: [
      {
        path: '**',
        loadComponent: () => import('./pages/marketplace/marketplace').then(m => m.Marketplace)
      },
    ],
  },
  {
    path: 'contacts',
    loadComponent: () => import('./pages/contacts/contacts').then(m => m.Contacts)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login)
  },
  {
    path: 'navigator',
    loadComponent: () => import('./pages/navigator/navigator').then(m => m.Navigator)
  },
  {
    path: '**',
    loadComponent: () => import('./pages/page-not-found/page-not-found').then(m => m.PageNotFound)
  }
];
