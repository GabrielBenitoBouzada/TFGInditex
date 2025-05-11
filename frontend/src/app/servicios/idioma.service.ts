import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class IdiomaService {
  private idiomaActual: string = 'es';

  constructor(private translate: TranslateService) {
    // 1️⃣ Comprobar si hay un idioma guardado en localStorage
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      try {
        const usuario = JSON.parse(usuarioStr);
        this.idiomaActual = usuario.idioma || usuario.idiomaPredeterminado || 'es';
      } catch {
        this.idiomaActual = localStorage.getItem('idioma') || 'es';
      }
    } else {
      this.idiomaActual = localStorage.getItem('idioma') || 'es';
    }

    // 2️⃣ Establecer idioma por defecto
    this.translate.setDefaultLang(this.idiomaActual);
    this.translate.use(this.idiomaActual);
  }

  setIdioma(idioma: string): void {
    this.idiomaActual = idioma;
    localStorage.setItem('idioma', idioma);
    this.translate.use(idioma);
  }

  getIdioma(): string {
    return this.idiomaActual;
  }
}