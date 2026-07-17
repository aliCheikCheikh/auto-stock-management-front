import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, EmptyState],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.scss',
})
export class NotFoundPage {}
