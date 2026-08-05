import { Routes } from '@angular/router';
import { ProductsPage } from './features/products/pages/products-page/products-page';
import {
    NewStockReceiptPage,
    pendingStockReceiptImportGuard,
} from './features/stock-receipts/pages/new-stock-receipt-page/new-stock-receipt-page';
import { NewSalePage } from './features/sales/pages/new-sale-page/new-sale-page';
import { SalesHistoryPage } from './features/sales/pages/sales-history-page/sales-history-page';
import { StockMovementsHistoryPage } from './features/stock-movements/pages/stock-movements-history-page/stock-movements-history-page';
import { ProductDetailPage } from './features/products/pages/product-detail-page/product-detail-page';
import { NewStockTransfersPage } from './features/stock-transfers/pages/new-stock-transfers-page/new-stock-transfers-page';
import { LoginPage } from './features/auth/pages/login-page/login-page';
import { ChangePasswordPage } from './features/auth/pages/change-password-page/change-password-page';
import { UsersAdminPage } from './features/users/pages/users-admin-page/users-admin-page';
import { authGuard, forcePasswordChangeGuard, ownerGuard } from './core/auth/auth.guard';
import { ProductEditPage } from './features/products/pages/product-edit-page/product-edit-page';
import { NotFoundPage } from './features/errors/not-found-page/not-found-page';
import { DebtsPage } from './features/debts/pages/debts-page/debts-page';
import { DebtDetailPage } from './features/debts/pages/debt-detail-page/debt-detail-page';
import { CustomerDebtsPage } from './features/customers/pages/customer-debts-page/customer-debts-page';
import { CategoriesPage } from './features/categories/pages/categories-page/categories-page';

export const routes: Routes = [
    {
        path: 'products',
        component: ProductsPage,
        canActivate: [authGuard]
    },

    {
        path: 'stock-receipts/new',
        component: NewStockReceiptPage,
        canActivate: [authGuard],
        canDeactivate: [pendingStockReceiptImportGuard]

    },

    {
        path: 'sales/new',
        component: NewSalePage,
        canActivate: [authGuard]
    },

    {
        path: 'sales',
        component: SalesHistoryPage,
        canActivate: [authGuard]
    },

    {
        path: 'stock-movements',
        component: StockMovementsHistoryPage,
        canActivate: [authGuard]
    },

    {
        path: 'products/:productId',
        component: ProductDetailPage,
        canActivate: [authGuard]

    },

    {
        path: 'products/:productId/edit',
        component: ProductEditPage,
        canActivate: [authGuard]
    },

    {
        path: 'stock-transfers/new',
        component: NewStockTransfersPage,
        canActivate: [authGuard]
    },

    {
        path: 'debts',
        component: DebtsPage,
        canActivate: [authGuard, ownerGuard]
    },

    {
        path: 'clients/:customerId/creances',
        component: CustomerDebtsPage,
        canActivate: [authGuard, ownerGuard]
    },

    {
        path: 'creances/:saleId',
        component: DebtDetailPage,
        canActivate: [authGuard, ownerGuard]
    },

    {
        path: 'login',
        component: LoginPage
    },

    {
        path: 'change-password',
        component: ChangePasswordPage,
        canActivate: [forcePasswordChangeGuard]
    },

    {
        path: 'admin/users',
        component: UsersAdminPage,
        canActivate: [ownerGuard]
    },

    {
        path: 'admin/categories',
        component: CategoriesPage,
        canActivate: [authGuard, ownerGuard]
    },

    {
        path: '',
        redirectTo: 'products',
        pathMatch: 'full',
    },

    {
        path: '**',
        component: NotFoundPage,
    }
];
