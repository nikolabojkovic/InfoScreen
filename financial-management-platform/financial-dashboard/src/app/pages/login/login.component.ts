

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(private router: Router, private auth: AuthService) {}

  login() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      this.error = 'No account found. Please register.';
      return;
    }
    const user = JSON.parse(userStr);
    if (user.email === this.email && user.password === this.password) {
      this.auth.login();
      this.router.navigate(['/']);
    } else {
      this.error = 'Invalid email or password.';
    }
  }
}
