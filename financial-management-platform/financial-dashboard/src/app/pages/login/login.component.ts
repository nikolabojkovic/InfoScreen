

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(private router: Router) {}

  login() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      this.error = 'No account found. Please register.';
      return;
    }
    const user = JSON.parse(userStr);
    if (user.email === this.email && user.password === this.password) {
      localStorage.setItem('loggedIn', 'true');
      this.router.navigate(['/']);
    } else {
      this.error = 'Invalid email or password.';
    }
  }
}
