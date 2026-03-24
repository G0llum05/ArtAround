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
  selector: 'app-test-user.component',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './test-user.component.html',
  styleUrl: './test-user.component.css',
})
export class TestUserComponent {
  userForm: FormGroup;
  users: WritableSignal<UserResponse[]> = signal([]);
  isLoading: WritableSignal<boolean> = signal(false);

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      surname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['', Validators.required],
    });
  }

  onCreateSubmit(): void {
    if (this.userForm.valid) {
      const userData: UserRequest = this.userForm.value;
      this.userService.createUser(userData).subscribe({
        next: () => {
          console.log('User created successfully!');
          this.userForm.reset();
          this.loadAllUsers(); // Reload users after creation
        },
        error: (err) => console.error('Error creating user:', err),
      });
    } else {
      console.error('Form is invalid');
    }
  }

  loadAllUsers(): void {
    this.isLoading.set(true);
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.isLoading.set(false);
      },
    });
  }
}
