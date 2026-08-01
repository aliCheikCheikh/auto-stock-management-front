import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { SalesApiService } from '../../data-access/sales-api.service';
import { SaleResponse } from '../../models/sales.model';
import { ProductsApiService } from '../../../products/data-access/products-api.service';
import { PageMeta } from '../../../../core/api/page.model';
import { Money } from '../../../../core/api/money.model';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { Spinner } from '../../../../shared/ui/spinner/spinner';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { DatePipe } from '@angular/common';
import { sumMoney } from '../../../../shared/utils/money-math';
import { authorLabel } from '../../../../shared/utils/author';
import { SettlementBadge } from '../../../../shared/ui/settlement-badge/settlement-badge';
import { AuthService } from '../../../../core/auth/auth.service';

// Produit absent du catalogue chargé : on nomme la situation plutôt que
// d'afficher son identifiant technique.
const UNKNOWN_PRODUCT = 'Produit hors catalogue';

interface SaleLineRow {
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly subtotal: Money;
}

interface SaleRow {
  readonly saleId: string;
  readonly date: string;
  readonly sellerName: string;
  // Solde restant renvoyé par le serveur : absent hors vente à crédit, zéro
  // quand elle est réglée. Aucun état dérivé n'est stocké à côté.
  readonly amountDue: Money | null;
  readonly total: Money;
  readonly lines: SaleLineRow[];
}

@Component({
  selector: 'app-sales-history-page',
  imports: [MoneyPipe, DatePipe, Spinner, Pagination, EmptyState, SettlementBadge],
  templateUrl: './sales-history-page.html',
  styleUrl: './sales-history-page.scss',
})
export class SalesHistoryPage implements OnInit {
  private static readonly PAGE_SIZE = 10;

  private readonly salesApi = inject(SalesApiService);
  private readonly productsApi = inject(ProductsApiService);
  private readonly authService = inject(AuthService);

  // Seul le propriétaire peut ouvrir une créance : pour un vendeur, la mention
  // reste informative.
  readonly isOwner = computed(() => this.authService.currentUser()?.role === 'OWNER');

  // Résolution des noms produits (le back ne renvoie que des ids).
  private productNames = new Map<string, string>();

  readonly state = signal<'loading' | 'success' | 'error'>('loading');
  readonly sales = signal<SaleRow[]>([]);

  // Total de la page, sommé en chaîne (BigDecimal) : aucune arithmétique
  // flottante sur des montants.
  readonly pageTotal = computed<Money>(() => sumMoney(this.sales().map((sale) => sale.total)));

  readonly page = signal<PageMeta>({ page: 0, size: SalesHistoryPage.PAGE_SIZE, totalElements: 0, totalPages: 0 });
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.productsApi.listProducts(false, 200).subscribe({
      next: (products) => {
        this.productNames = new Map(products.content.map((p) => [p.productId, p.name]));
        this.loadPage(0);
      },
      error: () => {
        // Si la liste des produits échoue, on continue quand même
        // pour afficher les ventes avec les ids de produits en fallback.
        this.productNames = new Map();
        this.loadPage(0);
      },
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
      sellerName: authorLabel(sale.sellerName),
      amountDue: sale.amountDue ?? null,
      total: sale.totalAmount,
      lines: sale.lines.map((line) => ({
        productName: this.productNames.get(line.productId) ?? UNKNOWN_PRODUCT,
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
