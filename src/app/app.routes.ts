import { Routes } from '@angular/router';
import { ProductsPage } from './features/products/pages/products-page/products-page';
import { NewStockReceiptPage } from './features/stock-receipts/pages/new-stock-receipt-page/new-stock-receipt-page';

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
        path: '',
        redirectTo: 'products',
        pathMatch: 'full'
    }
];
