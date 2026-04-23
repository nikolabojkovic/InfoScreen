
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';
import { FinanceService } from '../../services/finance.service';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  readonly error = signal('');
  readonly loading = signal(false);

  constructor(
    private router: Router,
    private auth: AuthService,
    private settingsService: SettingsService,
    private financeService: FinanceService,
    private confirmationService: ConfirmationService,
  ) {}

  login() {
    this.error.set('');
    this.loading.set(true);
    this.auth.login(this.username, this.password).subscribe({
      next: async () => {
        let apiUnavailable = false;

        try {
          await this.settingsService.loadFromApi();
        } catch {
          apiUnavailable = true;
        }

        if (!apiUnavailable && this.settingsService.dataSource() === 'remote') {
          try {
            await this.financeService.loadFromApi();
          } catch {
            apiUnavailable = true;
          }
        } else if (!apiUnavailable && this.settingsService.dataSource() === 'local') {
          this.financeService.loadFromLocal();
        }

        this.loading.set(false);
        this.router.navigate(['/']);

        if (apiUnavailable) {
          const goToSettings = await this.confirmationService.confirm({
            title: 'API Unavailable',
            message: 'The remote API is not available right now. You can switch to "Local" data source in App Settings to continue working offline.',
            confirmLabel: 'Open Settings',
            cancelLabel: 'Dismiss',
          });
          if (goToSettings) this.router.navigate(['/settings']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.status === 401
          ? 'Invalid username or password.'
          : 'Login failed. Please try again.');
      },
    });
  }
}
