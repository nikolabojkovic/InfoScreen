import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { Navbar } from './components/navbar/navbar';
import { Sidebar } from './components/sidebar/sidebar';
import { ConfirmationModal } from './components/confirmation-modal/confirmation-modal';
import { SidebarService } from './services/sidebar.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgIf, Navbar, Sidebar, ConfirmationModal],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private router = inject(Router);
  private sidebarService = inject(SidebarService);
  readonly hideNav = computed(() => {
    const url = this.router.url;
    return url === '/login' || url === '/register';
  });
  readonly sidebarExpanded = this.sidebarService.isExpanded;
}
