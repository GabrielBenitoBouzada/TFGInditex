import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Curso {
  _id?: string;
  tema: string;
  formato: string;
  necesidades?: string;
  contenido?: string;
  videoId?: string;
  popularity?: number;
  tituloCurso?: string;
  likes?: string[];
}

@Injectable({ providedIn: 'root' })
export class CursosService {
  private apiUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  generarCurso(datos: {
    tema: string;
    necesidades: string;
    formato: string;
    email: string;
    idioma: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate-course`, datos);
  }

  guardarCurso(email: string, curso: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/guardar-curso`, { email, curso });
  }

  obtenerCursosDelUsuario(email: string): Observable<{ cursos: Curso[] }> {
    return this.http.get<{ cursos: Curso[] }>(
      `${this.apiUrl}/cursos/${encodeURIComponent(email)}`
    );
  }

  obtenerCurso(email: string, cursoId: string): Observable<Curso> {
    return this.http.get<Curso>(
      `${this.apiUrl}/cursos/${encodeURIComponent(email)}/${cursoId}`
    );
  }

  obtenerCursosRecomendados(email: string): Observable<{ cursos: Curso[] }> {
    return this.http.get<{ cursos: Curso[] }>(
      `${this.apiUrl}/recommended-courses?email=${encodeURIComponent(email)}`
    );
  }

  darLike(cursoId: string, email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/like-curso`, {
      curso_id: cursoId,
      email
    });
  }

  obtenerEstadoVideo(videoId: string) {
    return this.http.get<any>(`${this.apiUrl}/synthesia/status/${videoId}`);
  }
}
