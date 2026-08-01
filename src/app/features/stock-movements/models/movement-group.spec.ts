import { groupByOperation, MovementRow } from './movement-group';
import { saleSettlementOf } from '../../../shared/utils/sale-settlement';

function row(overrides: Partial<MovementRow> = {}): MovementRow {
  return {
    movementId: 'mov-1',
    operationId: 'op-1',
    saleId: null,
    saleAmountDue: null,
    productId: 'product-1',
    date: '2026-07-29T09:00:00Z',
    typeKind: 'ENTRY',
    typeLabel: 'Réception',
    authorName: 'Ahmat',
    productName: 'Plaquette de frein',
    quantity: 4,
    locationLabel: 'Réserve',
    destinationLabel: null,
    ...overrides,
  };
}

describe('groupByOperation', () => {
  it('réunit les mouvements d’une même opération', () => {
    const groups = groupByOperation([
      row({ movementId: 'mov-1' }),
      row({ movementId: 'mov-2', productName: 'Filtre à huile' }),
      row({ movementId: 'mov-3', productName: 'Courroie' }),
    ]);

    expect(groups.length).toBe(1);
    expect(groups[0].operationId).toBe('op-1');
    expect(groups[0].lines.length).toBe(3);
    expect(groups[0].typeLabel).toBe('Réception');
    expect(groups[0].authorName).toBe('Ahmat');
  });

  it('réunit les affectations réserve et surface d’un même produit', () => {
    const [group] = groupByOperation([
      row({ movementId: 'mov-reserve', quantity: 12, locationLabel: 'Réserve' }),
      row({ movementId: 'mov-shop', quantity: 8, locationLabel: 'Surface de vente' }),
      row({
        movementId: 'mov-filter',
        productId: 'product-2',
        productName: 'Filtre à huile',
        quantity: 5,
      }),
    ]);

    expect(group.products.length).toBe(2);
    expect(group.products[0].totalQuantity).toBe(20);
    expect(group.products[0].allocations.map((allocation) => allocation.locationLabel)).toEqual([
      'Réserve',
      'Surface de vente',
    ]);
    expect(group.totalQuantity).toBe(25);
  });

  it('sépare deux opérations distinctes en conservant l’ordre du serveur', () => {
    const groups = groupByOperation([
      row({ movementId: 'mov-1', operationId: 'op-1' }),
      row({ movementId: 'mov-2', operationId: 'op-2', typeKind: 'EXIT', typeLabel: 'Vente' }),
      row({ movementId: 'mov-3', operationId: 'op-1' }),
    ]);

    expect(groups.map((group) => group.operationId)).toEqual(['op-1', 'op-2']);
    expect(groups[0].lines.length).toBe(2);
    expect(groups[1].typeLabel).toBe('Vente');
  });

  it('ne regroupe pas deux opérations qui partagent date et auteur', () => {
    const groups = groupByOperation([
      row({ movementId: 'mov-1', operationId: 'op-1' }),
      row({ movementId: 'mov-2', operationId: 'op-2' }),
    ]);

    expect(groups.length).toBe(2);
  });

  it('isole un mouvement sans operationId au lieu de le perdre', () => {
    const groups = groupByOperation([
      row({ movementId: 'mov-1', operationId: '' }),
      row({ movementId: 'mov-2', operationId: '' }),
    ]);

    expect(groups.map((group) => group.operationId)).toEqual(['mov-1', 'mov-2']);
  });
});

describe('saleSettlementOf', () => {
  it('ne qualifie pas une opération sans vente', () => {
    // Réception et transfert : le serveur n'envoie pas saleAmountDue.
    expect(saleSettlementOf(null)).toBeNull();
    expect(saleSettlementOf(undefined)).toBeNull();
  });

  it('lit une vente réglée quand le solde vaut zéro', () => {
    expect(saleSettlementOf({ amount: '0', currency: 'XAF' })).toEqual({ kind: 'paid' });
  });

  it('lit une vente à crédit et conserve le reste dû du serveur', () => {
    const amountDue = { amount: '30000', currency: 'XAF' };

    expect(saleSettlementOf(amountDue)).toEqual({ kind: 'credit', amountDue });
  });
});
