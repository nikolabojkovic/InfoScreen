

import { Component } from '@angular/core';
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
  error = '';
  loading = false;

  constructor(private router: Router, private auth: AuthService) {}

  register() {
    this.error = '';
    if (!this.username || !this.password || !this.confirmPassword) {
      this.error = 'All fields are required.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }
    this.loading = true;
    this.auth.register(this.username, this.password, this.fullName).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.status === 409
          ? 'Username already taken.'
          : 'Registration failed. Please try again.';
      },
    });
  }
}
