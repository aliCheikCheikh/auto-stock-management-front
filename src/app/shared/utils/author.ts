export const DELETED_USER_LABEL = 'Utilisateur supprimé';

/**
 * Nom d'auteur prêt à afficher. Le serveur renvoie `null` quand le compte a été
 * supprimé : on montre un repli neutre plutôt qu'un vide, un « null » ou —
 * pire — l'identifiant technique.
 */
export function authorLabel(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim();
  return trimmed.length > 0 ? trimmed : DELETED_USER_LABEL;
}
