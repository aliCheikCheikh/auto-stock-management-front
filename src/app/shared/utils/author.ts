export const UNKNOWN_AUTHOR_LABEL = 'Auteur non identifié';

/**
 * Nom d'auteur prêt à afficher. Le serveur renvoie `null` quand le compte a été
 * absent : on montre un repli factuel plutôt que d'affirmer, sans preuve, que
 * le compte a été supprimé. Le cas se produit notamment avec des mouvements
 * historiques créés avant la conservation du nom d'auteur.
 */
export function authorLabel(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim();
  return trimmed.length > 0 ? trimmed : UNKNOWN_AUTHOR_LABEL;
}
