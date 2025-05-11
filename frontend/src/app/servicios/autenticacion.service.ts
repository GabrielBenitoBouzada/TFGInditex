import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaz para el tipo de respuesta que devuelve /login
export interface LoginResponse {
  message: string;
  email: string;
  nombre: string;
  rol: string;
  subrol: string;
  idioma?: string;
  idiomaPredeterminado?: string;
  preferenciasAccesibilidad?: {
    lenguajeSencillo?: boolean;
    altoContraste?: boolean;
    tamanoLetra?: string;
  };
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/login';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    // Indicamos al HttpClient que esperamos LoginResponse
    return this.http.post<LoginResponse>(this.apiUrl, { email, password });
  }
}
