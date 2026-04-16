import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { ConfirmationModal } from './components/confirmation-modal/confirmation-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, ConfirmationModal],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
