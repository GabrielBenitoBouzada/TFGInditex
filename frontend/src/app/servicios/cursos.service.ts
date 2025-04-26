import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CursosService {
  private apiUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  generarCurso(datos: { tema: string, necesidades: string, formato: string, email: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate-course`, datos);
  }

  guardarCurso(email: string, curso: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/guardar-curso`, { email, curso });
  }

  obtenerCursosDelUsuario(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/cursos/${email}`);
  }

  obtenerCursoPorId(email: string, cursoId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/cursos/${email}/${cursoId}`);
  }
  generarAudio(texto: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/generar-audio`, { texto });
  }
  
  
}
