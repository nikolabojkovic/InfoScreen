import { Component, computed, effect, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { Navbar } from './components/navbar/navbar';
import { Sidebar } from './components/sidebar/sidebar';
import { ConfirmationModal } from './components/confirmation-modal/confirmation-modal';
import { SidebarService } from './services/sidebar.service';
import { AuthService } from './services/auth.service';
import { ApiErrorService } from './services/api-error.service';
import { ConfirmationService } from './services/confirmation.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgIf, Navbar, Sidebar, ConfirmationModal],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private router = inject(Router);
  private sidebarService = inject(SidebarService);
  private authService = inject(AuthService);
  private apiErrorService = inject(ApiErrorService);
  private confirmationService = inject(ConfirmationService);

  readonly hideNav = computed(() => {
    const url = this.router.url;
    return url === '/login' || url === '/register';
  });
  readonly hideSidebar = computed(() => this.hideNav() || !this.authService.isLoggedIn());
  readonly sidebarExpanded = this.sidebarService.isExpanded;

  constructor() {
    effect(() => {
      if (this.apiErrorService.unavailable()) {
        this.apiErrorService.clear();
        this.confirmationService.confirm({
          title: 'API Unavailable',
          message: 'The remote API is not available right now. You can switch to "Local" data source in App Settings to continue working offline.',
          confirmLabel: 'Open Settings',
          cancelLabel: 'Dismiss',
        }).then(goToSettings => {
          if (goToSettings) this.router.navigate(['/settings']);
        });
      }
    });
  }
}
