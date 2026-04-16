import { Injectable, signal } from '@angular/core';

export interface ConfirmationRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ConfirmationState extends ConfirmationRequest {
  open: boolean;
  resolve: ((value: boolean) => void) | null;
}

const defaultState: ConfirmationState = {
  open: false,
  title: '',
  message: '',
  confirmLabel: 'OK',
  cancelLabel: 'Cancel',
  resolve: null,
};

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private readonly stateSignal = signal<ConfirmationState>(defaultState);

  readonly state = this.stateSignal.asReadonly();

  confirm(request: ConfirmationRequest): Promise<boolean> {
    const current = this.stateSignal();

    if (current.open && current.resolve) {
      current.resolve(false);
    }

    return new Promise<boolean>((resolve) => {
      this.stateSignal.set({
        open: true,
        title: request.title,
        message: request.message,
        confirmLabel: request.confirmLabel ?? 'OK',
        cancelLabel: request.cancelLabel ?? 'Cancel',
        resolve,
      });
    });
  }

  accept(): void {
    const current = this.stateSignal();
    current.resolve?.(true);
    this.close();
  }

  cancel(): void {
    const current = this.stateSignal();
    current.resolve?.(false);
    this.close();
  }

  private close(): void {
    this.stateSignal.set(defaultState);
  }
}