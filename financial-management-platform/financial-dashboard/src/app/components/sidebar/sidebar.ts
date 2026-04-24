import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { NgIf } from '@angular/common';
import { SidebarService } from '../../services/sidebar.service';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgIf],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private router = inject(Router);
  private document = inject(DOCUMENT);
  readonly sidebar = inject(SidebarService);
  private auth = inject(AuthService);
  private settings = inject(SettingsService);
  readonly isExpanded = this.sidebar.isExpanded;
  readonly isLoggedIn = this.auth.isLoggedIn;

  constructor() {
    this.document.documentElement.setAttribute('data-theme', this.settings.theme());
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && window.innerWidth < 1024) {
        this.sidebar.collapse();
      }
    });
  }
}
