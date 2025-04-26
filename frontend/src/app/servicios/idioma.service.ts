import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IdiomaService {
  private idiomaActual: string = 'es';

  constructor() {
    const almacenado = localStorage.getItem('idioma');
    if (almacenado) {
      this.idiomaActual = almacenado;
    }
  }

  setIdioma(idioma: string): void {
    this.idiomaActual = idioma;
    localStorage.setItem('idioma', idioma);
  }

  getIdioma(): string {
    return this.idiomaActual;
  }
}
