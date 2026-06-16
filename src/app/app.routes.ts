import { Routes } from '@angular/router';
import { ProductsPage } from './features/products/pages/products-page/products-page';
import { NewStockReceiptPage } from './features/stock-receipts/pages/new-stock-receipt-page/new-stock-receipt-page';
import { NewSalePage } from './features/sales/pages/new-sale-page/new-sale-page';
import { ProductDetailPage } from './features/products/pages/product-detail-page/product-detail-page';
import { NewStockTransfersPage } from './features/stock-transfers/pages/new-stock-transfers-page/new-stock-transfers-page';
import { LoginPage } from './features/auth/pages/login-page/login-page';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
    {
        path: 'products',
        component: ProductsPage,
        canActivate: [authGuard]
    },

    {
        path: 'stock-receipts/new',
        component: NewStockReceiptPage,
        canActivate: [authGuard]

    },

    {
        path: 'sales/new',
        component: NewSalePage,
        canActivate: [authGuard]
    },

    {
        path: 'products/:productId',
        component: ProductDetailPage,
        canActivate: [authGuard]

    },

    {
        path: 'stock-transfers/new',
        component: NewStockTransfersPage,
        canActivate: [authGuard]
    },

    {
        path: 'login',
        component: LoginPage
    },

    {
        path: '',
        redirectTo: 'products',
        pathMatch: 'full',
    }
];
