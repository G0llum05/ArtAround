import { Component, signal, WritableSignal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserService } from '../../services/user.service';
import { UserRequest, UserResponse } from '../../models/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css',
})
export class TestComponent {

  onTestUserSubmit(): void {
    window.open('/userTest');
  }

  onTestMuseumSubmit(): void {
    window.open('/museumTest')
  }

  onTestLoginSubmit(): void {
    window.open('/loginTest')
  }
  
  onTestVisitSubmit(): void {
    window.open('/visitTest')
  }
}

