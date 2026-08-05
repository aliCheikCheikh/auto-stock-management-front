import { authGuard, ownerGuard } from './core/auth/auth.guard';
import { routes } from './app.routes';

describe('routes', () => {
  it('réserve le tableau de bord au propriétaire authentifié', () => {
    const dashboardRoute = routes.find((route) => route.path === 'dashboard');

    expect(dashboardRoute).toBeDefined();
    expect(dashboardRoute?.canActivate).toEqual([authGuard, ownerGuard]);
  });

  it('ouvre le tableau de bord depuis la racine', () => {
    const rootRoute = routes.find((route) => route.path === '');

    expect(rootRoute?.redirectTo).toBe('dashboard');
  });

  it('réserve la gestion des familles aux utilisateurs authentifiés propriétaires', () => {
    const categoriesRoute = routes.find((route) => route.path === 'admin/categories');

    expect(categoriesRoute).toBeDefined();
    expect(categoriesRoute?.canActivate).toEqual([authGuard, ownerGuard]);
  });

  it('réserve la gestion des utilisateurs au propriétaire', () => {
    const usersRoute = routes.find((route) => route.path === 'admin/users');

    expect(usersRoute).toBeDefined();
    expect(usersRoute?.canActivate).toEqual([ownerGuard]);
  });
});
