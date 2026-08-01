import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css',
})
export class TestComponent {

  constructor(private router: Router) {}

  onTestUserSubmit(): void {
    this.router.navigate(['/userTest']);
  }

  onTestMuseumSubmit(): void {
    this.router.navigate(['/museumTest'])
  }

  onTestVisitSubmit(): void {
    this.router.navigate(['/visitTest'])
  }

  onUploadTestSubmit(): void {
    this.router.navigate(['/uploadDemo']);
  }
}

