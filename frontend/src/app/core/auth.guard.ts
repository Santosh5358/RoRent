import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const ownerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  if (auth.mustChangePassword()) {
    router.navigate(['/change-password']);
    return false;
  }
  if (auth.isOwner()) {
    return true;
  }
  router.navigateByUrl(auth.homePath());
  return false;
};

export const tenantGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  if (auth.mustChangePassword()) {
    router.navigate(['/change-password']);
    return false;
  }
  if (auth.isTenant()) {
    return true;
  }
  router.navigateByUrl(auth.homePath());
  return false;
};
