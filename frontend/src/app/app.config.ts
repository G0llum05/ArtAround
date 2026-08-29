import { ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
    import { provideHttpClient, withInterceptors } from '@angular/common/http';
    import { provideRouter, withViewTransitions } from '@angular/router';
    import { routes } from './app.routes';
    import { authInterceptor } from './interceptors/auth.interceptor';
    import { errorInterceptor } from './interceptors/api-error.interceptor';
    import { AuthService } from './services/auth.service';
    import { firstValueFrom } from 'rxjs';


//TODO() aggiungere nel caso auth interceptor
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([errorInterceptor, authInterceptor])),
    provideRouter(
      routes,
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition }) => {
          if (typeof document !== 'undefined' && document.hidden) {
            transition.skipTransition();
          }
          transition.ready.catch(() => {});
          transition.finished.catch(() => {});
          transition.updateCallbackDone?.catch(() => {});
        }
      })
    ),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return firstValueFrom(authService.refreshToken()).catch(() => null);
    }),
  ],
};
