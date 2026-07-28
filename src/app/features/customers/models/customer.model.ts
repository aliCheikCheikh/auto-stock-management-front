/**
 * Modèle de nommage tchadien : une personne est désignée par son **nom propre**
 * (`givenName`) suivi du **nom de son père** (`fatherName`). Ce n'est pas un
 * couple prénom / nom de famille — les libellés d'interface disent « Nom » et
 * « Nom du père ».
 */
export interface CustomerResponse {
  readonly customerId: string;
  readonly givenName: string;
  readonly fatherName: string | null;
  readonly phoneNumber: string;
  readonly email: string | null;
}

export interface CreateCustomerRequest {
  readonly givenName: string;
  readonly fatherName?: string;
  readonly phoneNumber: string;
  readonly email?: string;
}

// Libellé d'affichage : « Ahmat Youssouf » (nom + nom du père si connu).
export function customerDisplayName(
  givenName: string,
  fatherName: string | null | undefined
): string {
  return [givenName, fatherName].filter(Boolean).join(' ').trim();
}

// Lien téléphonique : le backend renvoie une forme canonique (+235…), mais on
// retire tout de même les séparateurs pour un href tel: toujours valide.
export function telHref(phoneNumber: string): string {
  return `tel:${phoneNumber.replace(/[^\d+]/g, '')}`;
}
