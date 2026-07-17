import { Component, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { StockMovementsApiService } from '../../data-access/stock-movements-api.service';
import { MovementType, StockMovementResponse } from '../../models/stock-movement.model';
import { ProductsApiService } from '../../../products/data-access/products-api.service';
import { SessionContextService } from '../../../../core/session/session-context.service';
import { PageMeta } from '../../../../core/api/page.model';
import { Spinner } from '../../../../shared/ui/spinner/spinner';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { DatePipe } from '@angular/common';

interface MovementRow {
  readonly movementId: string;
  readonly date: string;
  readonly typeKind: MovementType;
  readonly typeLabel: string;
  readonly productName: string;
  readonly quantity: number;
  readonly locationLabel: string;
  readonly destinationLabel: string | null;
}

@Component({
  selector: 'app-stock-movements-history-page',
  imports: [DatePipe, Spinner, Pagination, EmptyState],
  templateUrl: './stock-movements-history-page.html',
  styleUrl: './stock-movements-history-page.scss',
})
export class StockMovementsHistoryPage implements OnInit {
  private static readonly PAGE_SIZE = 20;
  private static readonly TYPE_LABELS: Record<MovementType, string> = {
    ENTRY: 'Réception',
    EXIT: 'Vente',
    TRANSFER: 'Transfert',
  };

  private readonly movementsApi = inject(StockMovementsApiService);
  private readonly productsApi = inject(ProductsApiService);
  private readonly sessionContext = inject(SessionContextService);

  private productNames = new Map<string, string>();

  readonly state = signal<'loading' | 'success' | 'error'>('loading');
  readonly movements = signal<MovementRow[]>([]);
  readonly page = signal<PageMeta>({ page: 0, size: StockMovementsHistoryPage.PAGE_SIZE, totalElements: 0, totalPages: 0 });
  readonly errorMessage = signal('');

  ngOnInit(): void {
    // Contexte (libellés d'emplacement) + catalogue (noms produits) avant de charger.
    forkJoin({
      context: this.sessionContext.ensureLoaded(),
      products: this.productsApi.listProducts(false, 200),
    }).subscribe({
      next: ({ products }) => {
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
    this.movementsApi.listStockMovements({ page: index, size: StockMovementsHistoryPage.PAGE_SIZE }).subscribe({
      next: (result) => {
        this.movements.set(result.content.map((movement) => this.toRow(movement)));
        this.page.set(result.page);
        this.state.set('success');
      },
      error: () => this.fail(),
    });
  }

  private toRow(movement: StockMovementResponse): MovementRow {
    return {
      movementId: movement.movementId,
      date: movement.executedAt,
      typeKind: movement.type,
      typeLabel: StockMovementsHistoryPage.TYPE_LABELS[movement.type] ?? movement.type,
      productName: this.productNames.get(movement.productId) ?? movement.productId,
      quantity: movement.quantity,
      locationLabel: this.locationLabel(movement.locationId),
      destinationLabel: movement.destinationLocationId ? this.locationLabel(movement.destinationLocationId) : null,
    };
  }

  private locationLabel(locationId: string): string {
    return this.sessionContext.context()?.locations.find((l) => l.locationId === locationId)?.label ?? locationId;
  }

  private fail(): void {
    this.state.set('error');
    this.errorMessage.set("Impossible de charger l'historique des mouvements.");
  }
}
