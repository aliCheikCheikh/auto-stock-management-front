import { Component, inject, OnInit, signal } from '@angular/core';
import { SalesApiService } from '../../data-access/sales-api.service';
import { SaleResponse } from '../../models/sales.model';
import { ProductsApiService } from '../../../products/data-access/products-api.service';
import { PageMeta } from '../../../../core/api/page.model';
import { Money } from '../../../../core/api/money.model';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { Spinner } from '../../../../shared/ui/spinner/spinner';

interface SaleLineRow {
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly subtotal: Money;
}

interface SaleRow {
  readonly saleId: string;
  readonly date: string;
  readonly total: Money;
  readonly lines: SaleLineRow[];
}

@Component({
  selector: 'app-sales-history-page',
  imports: [MoneyPipe, Spinner],
  templateUrl: './sales-history-page.html',
})
export class SalesHistoryPage implements OnInit {
  private static readonly PAGE_SIZE = 20;

  private readonly salesApi = inject(SalesApiService);
  private readonly productsApi = inject(ProductsApiService);

  // Résolution des noms produits (le back ne renvoie que des ids).
  private productNames = new Map<string, string>();

  readonly state = signal<'loading' | 'success' | 'error'>('loading');
  readonly sales = signal<SaleRow[]>([]);
  readonly page = signal<PageMeta>({ page: 0, size: SalesHistoryPage.PAGE_SIZE, totalElements: 0, totalPages: 0 });
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.productsApi.listProducts(false, 200).subscribe({
      next: (products) => {
        this.productNames = new Map(products.content.map((p) => [p.productId, p.name]));
        this.loadPage(0);
      },
      error: () => this.fail(),
    });
  }

  goToPage(index: number): void {
    if (index < 0 || index >= this.page().totalPages) {
      return;
    }
    this.loadPage(index);
  }

  private loadPage(index: number): void {
    this.state.set('loading');
    this.salesApi.listSales({ page: index, size: SalesHistoryPage.PAGE_SIZE }).subscribe({
      next: (result) => {
        this.sales.set(result.content.map((sale) => this.toRow(sale)));
        this.page.set(result.page);
        this.state.set('success');
      },
      error: () => this.fail(),
    });
  }

  private toRow(sale: SaleResponse): SaleRow {
    return {
      saleId: sale.saleId,
      date: sale.createdAt,
      total: sale.totalAmount,
      lines: sale.lines.map((line) => ({
        productName: this.productNames.get(line.productId) ?? line.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        subtotal: line.subtotal,
      })),
    };
  }

  private fail(): void {
    this.state.set('error');
    this.errorMessage.set("Impossible de charger l'historique des ventes.");
  }
}
