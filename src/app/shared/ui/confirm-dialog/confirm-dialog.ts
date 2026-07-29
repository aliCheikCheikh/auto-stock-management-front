import { Component, input, output } from "@angular/core";

/**
 * Dialogue de confirmation. L'habillage (voile, carte, titre, pied d'actions)
 * vient du gabarit `.dialog-*` du design system : ce composant n'ajoute aucun
 * style local.
 */
@Component({
    selector: 'app-confirm-dialog',
    templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
    readonly title = input.required<string>();
    readonly message = input.required<string>();
    readonly confirmLabel = input('Confirmer');
    readonly cancelLabel = input('Annuler');

    readonly confirmed = output<void>();
    readonly cancelled = output<void>();
}
