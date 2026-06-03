import { Routes } from '@angular/router';
import { ProductsPage } from './features/products/pages/products-page/products-page';
import { NewStockReceiptPage } from './features/stock-receipts/pages/new-stock-receipt-page/new-stock-receipt-page';
import { NewSalePage } from './features/sales/pages/new-sale-page/new-sale-page';
import { ProductDetailPage } from './features/products/pages/product-detail-page/product-detail-page';
import { NewStockTransfersPage } from './features/stock-transfers/pages/new-stock-transfers-page/new-stock-transfers-page';

export const routes: Routes = [
    {
        path: 'products',
        component: ProductsPage
    },

    {
        path: 'stock-receipts/new',
        component: NewStockReceiptPage

    },

    {
        path: 'sales/new',
        component: NewSalePage
    },

    {
        path: 'products/:productId',
        component: ProductDetailPage

    },

    {
        path: 'stock-transfers/new',
        component: NewStockTransfersPage
    },

    {
        path: '',
        redirectTo: 'products',
        pathMatch: 'full'
    }
];
