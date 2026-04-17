import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { Navbar } from './components/navbar/navbar';
import { ConfirmationModal } from './components/confirmation-modal/confirmation-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgIf, Navbar, ConfirmationModal],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private router = inject(Router);
  readonly hideNav = computed(() => {
    const url = this.router.url;
    return url === '/login' || url === '/register';
  });
}
