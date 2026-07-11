import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/library',
    pathMatch: 'full',
  },
  {
    path: 'library',
    loadComponent: () =>
      import('./pages/library/library.page').then((m) => m.LibraryPage),
  },
  {
    path: 'editor',
    loadComponent: () =>
      import('./pages/editor/editor.page').then((m) => m.EditorPage),
  },
  {
    path: 'editor/:id',
    loadComponent: () =>
      import('./pages/editor/editor.page').then((m) => m.EditorPage),
  },
  {
    path: 'present/:id',
    loadComponent: () =>
      import('./pages/presentation/presentation.page').then(
        (m) => m.PresentationPage
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.page').then((m) => m.SettingsPage),
  },
  {
    path: 'transpose',
    loadComponent: () =>
      import('./pages/transpose/transpose.page').then((m) => m.TransposePage),
  },
];
