import { bootstrapApplication, createApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

import { createCustomElement } from '@angular/elements';
import { Injector } from '@angular/core';
import { ToolbarComponent } from './app/components/toolbar/toolbar';

const registerCustomElements = (injector: Injector) => {
  // Componente Angular convertito in Web Component
  const toolbarElement = createCustomElement(ToolbarComponent, { injector });

  if (!customElements.get('art-toolbar')) {
    customElements.define('art-toolbar', toolbarElement);
  }
};

const appRootElement = document.querySelector('app-root');

if (appRootElement) {
  // Angular
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
} else {
  // Vanilla JS
  createApplication(appConfig)
    .then((appRef) => {
      // Web Component <art-toolbar>
      registerCustomElements(appRef.injector);
    })
    .catch((err) => console.error(err));
}
