import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideState, provideStore } from '@ngrx/store';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { financeFeatureKey, financeReducer } from './store/finance/finance.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideStore(),
    provideState({ name: financeFeatureKey, reducer: financeReducer }),
  ],
};
