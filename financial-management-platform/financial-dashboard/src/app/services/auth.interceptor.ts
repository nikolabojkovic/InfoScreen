import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

const JWT_KEY = 'jwt_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem(JWT_KEY);
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req).pipe(
    catchError(err => {
      if (err.status === 401) {
        localStorage.removeItem(JWT_KEY);
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
