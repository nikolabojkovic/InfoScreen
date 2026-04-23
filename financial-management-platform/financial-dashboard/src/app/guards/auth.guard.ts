import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  if (!auth.isLoggedIn()) {
    const router = inject(Router);
    router.navigate(['/login']);
    return false;
  }
  return true;
};
