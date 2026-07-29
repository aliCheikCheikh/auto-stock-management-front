import { authGuard, ownerGuard } from './core/auth/auth.guard';
import { routes } from './app.routes';

describe('routes', () => {
  it('réserve la gestion des familles aux utilisateurs authentifiés propriétaires', () => {
    const categoriesRoute = routes.find((route) => route.path === 'admin/categories');

    expect(categoriesRoute).toBeDefined();
    expect(categoriesRoute?.canActivate).toEqual([authGuard, ownerGuard]);
  });
});
