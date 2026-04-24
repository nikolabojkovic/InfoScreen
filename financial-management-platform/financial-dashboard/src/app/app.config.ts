import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideState, provideStore } from '@ngrx/store';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { financeFeatureKey, financeReducer } from './store/finance/finance.reducer';
import { authInterceptor } from './services/auth.interceptor';
import { FinanceService } from './services/finance.service';
import { SettingsService } from './services/settings.service';
import { ApiErrorService } from './services/api-error.service';

const JWT_KEY = 'jwt_token';

function initializeData(
  financeService: FinanceService,
  settingsService: SettingsService,
  apiErrorService: ApiErrorService,
) {
  return async () => {
    const hasToken = !!localStorage.getItem(JWT_KEY);
    if (!hasToken) return;

    try {
      await settingsService.loadFromApi();
    } catch (err: any) {
      if (err?.status !== 401) apiErrorService.setUnavailable();
      return; // Don't attempt finance load if settings already failed
    }

    if (settingsService.dataSource() === 'remote') {
      try {
        await financeService.loadFromApi();
      } catch (err: any) {
        if (err?.status !== 401) apiErrorService.setUnavailable();
      }
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideStore(),
    provideState({ name: financeFeatureKey, reducer: financeReducer }),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeData,
      deps: [FinanceService, SettingsService, ApiErrorService],
      multi: true,
    },
  ],
};
