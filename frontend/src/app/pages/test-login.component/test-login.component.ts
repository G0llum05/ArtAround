import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-test-login',
  standalone: true,
  template: '<p style="text-align: center; padding: 2rem;">Reindirizzamento in corso alla pagina di login...</p>'
})
export class TestLoginComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.navigateByUrl('/login');
  }
}
