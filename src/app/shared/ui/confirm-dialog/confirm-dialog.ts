import { AsyncPipe } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { RouterLink } from "@angular/router";


@Component({
    selector: 'app-confirm-dialog',
    templateUrl: './confirm-dialog.html',
    styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
    readonly title = input.required<string>();
    readonly message = input.required<string>();
    readonly confirmLabel = input('Confirmer');
    readonly cancelLabel = input('Annuler');

    readonly confirmed = output<void>();
    readonly cancelled = output<void>();



}