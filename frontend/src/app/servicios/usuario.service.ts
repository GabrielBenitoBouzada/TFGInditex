import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  actualizarPerfil(email: string, datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/actualizar-perfil`, {
      email,
      ...datos
    });
  }

  obtenerUsuario(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuarios/${encodeURIComponent(email)}`);

  }
}
