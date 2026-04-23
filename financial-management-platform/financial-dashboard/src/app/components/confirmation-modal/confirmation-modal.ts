import { Component, inject } from '@angular/core';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  templateUrl: './confirmation-modal.html',
  styleUrl: './confirmation-modal.scss',
})
export class ConfirmationModal {
  readonly confirmation = inject(ConfirmationService);
}