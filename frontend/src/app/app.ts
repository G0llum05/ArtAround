import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {RouterOutlet, RouterLink, RouterLinkActive} from '@angular/router';
import {ToolbarComponent} from './components/toolbar/toolbar';

export interface Art {
  title: string;
  description: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ToolbarComponent
  ],  // Importiamo RouterOutlet che serve a mostrare i componenti in base alla rotta, e RouterLink per i link di navigazione
  templateUrl: './app.html',
  styleUrl: './app.css',
})

export class App {

}
