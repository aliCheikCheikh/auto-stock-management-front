import { guardFromDecision } from './guard-helpers';

// Routes métier : il faut être authentifié ET ne pas avoir de mot de passe temporaire.
export const authGuard = guardFromDecision((user, router) => {
  if (user === null) {
    return router.createUrlTree(['/login']);
  }
  if (user.passwordTemporary) {
    return router.createUrlTree(['/change-password']);
  }
  return true;
});

// Écran de changement forcé : réservé aux comptes authentifiés dont le mot de passe
// est encore temporaire. Sinon on renvoie vers l'application.
export const forcePasswordChangeGuard = guardFromDecision((user, router) => {
  if (user === null) {
    return router.createUrlTree(['/login']);
  }
  if (!user.passwordTemporary) {
    return router.createUrlTree(['/products']);
  }
  return true;
});

// Espace admin : réservé à l'OWNER (authentifié, mot de passe déjà défini).
export const ownerGuard = guardFromDecision((user, router) => {
  if (user === null) {
    return router.createUrlTree(['/login']);
  }
  if (user.passwordTemporary) {
    return router.createUrlTree(['/change-password']);
  }
  if (user.role !== 'OWNER') {
    return router.createUrlTree(['/products']);
  }
  return true;
});
