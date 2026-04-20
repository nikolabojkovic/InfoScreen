import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideState, provideStore } from '@ngrx/store';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { financeFeatureKey, financeReducer } from './store/finance/finance.reducer';
import { authInterceptor } from './services/auth.interceptor';
import { FinanceService } from './services/finance.service';
import { SettingsService } from './services/settings.service';

function initializeData(financeService: FinanceService, settingsService: SettingsService) {
  return async () => {
    if (settingsService.dataSource() === 'remote') {
      try {
        await financeService.loadFromApi();
      } catch {
        // API unavailable or not authenticated — localStorage state is retained
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
      deps: [FinanceService, SettingsService],
      multi: true,
    },
  ],
};
