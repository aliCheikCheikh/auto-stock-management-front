export type LocationType = 'SHOP_FLOOR' | 'BACKSTOCK';

export interface SessionLocation {
  readonly type: LocationType;
  readonly locationId: string;
  readonly label: string;
}

/**
 * Contexte de session fourni par le serveur (GET /api/v1/context) :
 * le magasin courant et ses emplacements, avec leurs identifiants RÉELS.
 * Remplace les UUID qui étaient codés en dur côté front.
 */
export interface SessionContext {
  readonly shopId: string;
  readonly locations: readonly SessionLocation[];
}
