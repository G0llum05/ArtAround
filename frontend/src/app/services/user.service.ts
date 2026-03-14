import { Component, Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserResponse, UserRequest, LoginRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly API_URL = "http://localhost:8000/api/user";

  constructor(private http: HttpClient){}

  // Observable: interfaccia che permette di gestire flussi di dati asincroni
  // Un metodo Observable notifica l'interessato (chiamante) quando i dati elaborati sono pronti
  // Il componente che utilizza il servizio chiama .subribe() e richiede l'accesso alla richiesta http
  // se non viene chiamato subscribe --> la chiamat http non partirebbe nemmeno.
  // this.service.getAllUsers().subscribe();

  getAllUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(this.API_URL);
  }

  getUserById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.API_URL}/${id}`);
  }

  createUser(userData: UserRequest): Observable<void> {
    return this.http.post<void>(this.API_URL, userData);
  }

  updateUserById(id: number, userData: UserRequest): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.API_URL}/${id}`, userData);
  }

  deleteUserById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
