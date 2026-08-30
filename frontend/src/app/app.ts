import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { ToastNotification } from './components/toast-notification/toast-notification';
import { SingleArtworkModal } from './components/single-artwork-modal/single-artwork-modal';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Navbar,
    ToastNotification,
    SingleArtworkModal
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
