import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CursosService, Curso } from '../../servicios/cursos.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-detalle-curso',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './detalle-curso.component.html',
  styleUrls: ['./detalle-curso.component.css']
})
export class DetalleCursoComponent implements OnInit {
  curso!: Curso;
  cursoSanitizado!: SafeHtml;
  error = '';
  isRecomendado = false;
  hablando = false;
  idioma = 'es';
  videoUrl: string | null = null;
  emailUsuario = '';
  yaLeDioLike = false;
  mostrarTranscripcion = false;
  cargando = false;
  cargandoGuardar = false;
  cursoGuardado = false; // ✅ Renombrado aquí

  constructor(
    private route: ActivatedRoute,
    private cursosService: CursosService,
    private translate: TranslateService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    const usr = localStorage.getItem('usuario');
    if (usr) {
      try {
        const usuario = JSON.parse(usr);
        this.emailUsuario = usuario.email || '';
        this.idioma = usuario.idioma || usuario.idiomaPredeterminado || 'es';
      } catch {
        console.warn('No se pudo cargar el usuario');
      }
    }

    const cursoId = this.route.snapshot.paramMap.get('id')!;
    this.isRecomendado = !!history.state.recomendado;

    this.cursosService.obtenerCurso(this.emailUsuario, cursoId).subscribe({
      next: c => {
        this.curso = c;
        this.cursoSanitizado = this.sanitizer.bypassSecurityTrustHtml(this.curso.contenido || '');
        this.yaLeDioLike = !!this.emailUsuario && Array.isArray(c.likes) && c.likes.includes(this.emailUsuario);

        if (this.curso.formato === 'video' && this.curso.videoId) {
          this.cursosService.obtenerEstadoVideo(this.curso.videoId).subscribe({
            next: resp => {
              if (resp.status === 'completed') {
                this.videoUrl = resp.videoUrl;
              }
            },
            error: () => console.warn('No se pudo recuperar el vídeo')
          });
        }
      },
      error: () => {
        this.error = this.translate.instant('DETALLE_CURSO.ERROR_CARGAR');
      }
    });
  }

  guardarCurso() {
    if (!this.curso) return;
    this.cargandoGuardar = true;
    this.cursoGuardado = false;

    const { _id, ...cursoParaGuardar } = this.curso;
    this.cursosService.guardarCurso(this.emailUsuario, cursoParaGuardar).subscribe({
      next: () => {
        this.cargandoGuardar = false;
        this.cursoGuardado = true;
      },
      error: () => {
        this.cargandoGuardar = false;
        alert(this.translate.instant('DETALLE_CURSO.GUARDAR_ERR'));
      }
    });
  }

  darLike() {
    if (!this.curso || !this.curso._id || this.yaLeDioLike) return;
    this.cursosService.darLike(this.curso._id, this.emailUsuario).subscribe({
      next: () => {
        if (this.curso) {
          this.curso.popularity = (this.curso.popularity || 0) + 1;
          this.yaLeDioLike = true;
        }
      },
      error: () => {
        alert(this.translate.instant('DETALLE_CURSO.ERROR_LIKE'));
      }
    });
  }

  toggleLectura() {
    if (!this.curso?.contenido) return;
    const textoPlano = this.convertirHtmlATexto(this.curso.contenido);

    if (!this.hablando) {
      const msg = new SpeechSynthesisUtterance(textoPlano);
      msg.lang = this.idioma;
      msg.rate = 1;
      msg.pitch = 1;
      msg.volume = 1;
      msg.onend = () => this.hablando = false;
      this.hablando = true;
      speechSynthesis.speak(msg);
    } else {
      speechSynthesis.cancel();
      this.hablando = false;
    }
  }

  convertirHtmlATexto(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.innerText || div.textContent || '';
  }

  regenerarCurso() {
    if (!this.curso) return;
    this.cargando = true;

    const datos = {
      tema: this.curso.tema,
      necesidades: this.curso.necesidades || '',
      formato: this.curso.formato,
      email: this.emailUsuario,
      idioma: this.idioma
    };

    this.cursosService.generarCurso(datos).pipe(
      catchError(err => {
        this.error = this.translate.instant('DETALLE_CURSO.ERROR_CARGAR');
        this.cargando = false;
        return of(null);
      })
    ).subscribe(res => {
      if (!res) return;

      const cursoGenerado: Curso = {
        _id: this.curso._id,
        tituloCurso: this.curso.tituloCurso || this.curso.tema,
        tema: this.curso.tema,
        formato: res.format || this.curso.formato,
        necesidades: res.necesidades || this.curso.necesidades || '',
        contenido: res.cursoTexto || res.curso || '',
        videoId: res.videoId || null,
        popularity: 0,
        likes: []
      };

      this.curso = cursoGenerado;
      this.cursoSanitizado = this.sanitizer.bypassSecurityTrustHtml(this.curso.contenido || '');
      this.videoUrl = null;
      this.yaLeDioLike = false;

      if (this.curso.formato === 'video' && this.curso.videoId) {
        this.cursosService.obtenerEstadoVideo(this.curso.videoId).subscribe({
          next: resp => {
            if (resp.status === 'completed') {
              this.videoUrl = resp.videoUrl;
            }
          },
          error: () => console.warn('No se pudo recuperar el vídeo')
        });
      }

      this.cargando = false;
    });
  }
}
