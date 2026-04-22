

import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, NgIf, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  username = '';
  fullName = '';
  password = '';
  confirmPassword = '';
  readonly error = signal('');
  readonly loading = signal(false);

  constructor(private router: Router, private auth: AuthService) {}

  register() {
    this.error.set('');
    if (!this.username || !this.password || !this.confirmPassword) {
      this.error.set('All fields are required.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }
    this.loading.set(true);
    this.auth.register(this.username, this.password, this.fullName).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.status === 409
          ? 'Username already taken.'
          : 'Registration failed. Please try again.');
      },
    });
  }
}
