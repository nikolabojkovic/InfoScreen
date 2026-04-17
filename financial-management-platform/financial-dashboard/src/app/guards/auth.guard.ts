import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const loggedIn = localStorage.getItem('loggedIn') === 'true';
  if (!loggedIn) {
    const router = inject(Router);
    router.navigate(['/login']);
    return false;
  }
  return true;
};
