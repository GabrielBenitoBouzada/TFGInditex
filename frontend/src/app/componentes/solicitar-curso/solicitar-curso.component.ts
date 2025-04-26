import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CursosService } from '../../servicios/cursos.service';
import { VideoService, StatusResp } from '../../servicios/video.service';
import { IdiomaService } from '../../servicios/idioma.service';
import { timer, of } from 'rxjs';
import { switchMap, filter, take, tap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-solicitar-curso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './solicitar-curso.component.html',
  styleUrls: ['./solicitar-curso.component.css']
})
export class SolicitarCursoComponent implements OnInit {
  formulario!: FormGroup;
  cursoContenido = '';
  audioBase64    = '';
  cursoGenerado  = false;
  formatoSeleccionado = 'texto';
  videoId: string| null = null;
  videoUrl: string| null = null;
  loadingVideo = false;
  email = '';

  constructor(
    private fb: FormBuilder,
    private cursoSvc: CursosService,
    private videoSvc: VideoService,
    private idiomaService: IdiomaService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.formulario = this.fb.group({
      tema: [''],
      necesidades: [''],
      formato: ['texto']
    });
    const usr = localStorage.getItem('usuario');
    if (usr) {
      try { this.email = JSON.parse(usr).email; }
      catch { console.warn('No se pudo parsear usuario'); }
    }
  }

  generarCurso() {
    const d = this.formulario.value;
    this.formatoSeleccionado = d.formato;
    this.cursoContenido = '';
    this.audioBase64 = '';
    this.videoUrl = null;
    this.videoId = null;
    this.cursoGenerado = false;
    this.loadingVideo = true;

    const payload = {
      tema: d.tema,
      necesidades: d.necesidades,
      formato: d.formato,
      email: this.email,
      idioma: this.idiomaService.getIdioma()
    };

    this.cursoSvc.generarCurso(payload).pipe(
      switchMap(res => {
        if (res.format === 'texto') {
          this.cursoContenido = res.curso;
          this.loadingVideo = false;
          this.cursoGenerado = true;
          return of(null);
        }
        if (res.format === 'audio') {
          this.cursoContenido = res.cursoTexto;
          this.audioBase64 = res.audio;
          this.loadingVideo = false;
          this.cursoGenerado = true;
          return of(null);
        }
        // vídeo
        this.cursoContenido = res.cursoTexto;
        this.videoId = res.videoId;
        // arrancamos polling cada 5s
        return timer(0, 5000).pipe(
          switchMap(() => this.videoSvc.status(this.videoId!)),
          filter((st: StatusResp) => st.status === 'completed' || st.status === 'failed'),
          take(1)
        );
      }),
      catchError(_ => {
        alert(this.translate.instant('SOLICITAR.ERROR_GENERAR'));
        this.loadingVideo = false;
        return of(null);
      })
    ).subscribe((st: StatusResp | null) => {
      if (st && st.status === 'completed') {
        this.videoUrl = st.videoUrl || null;
      }
      this.loadingVideo = false;
      this.cursoGenerado = true;
    });
  }

  guardarCurso() {
    const curso = {
      tema: this.formulario.value.tema,
      necesidades: this.formulario.value.necesidades,
      formato: this.formatoSeleccionado,
      contenido: this.cursoContenido
    };
    this.cursoSvc.guardarCurso(this.email, curso).subscribe({
      next: () => alert(this.translate.instant('SOLICITAR.GUARDAR_SUCCESS')),
      error: () => alert(this.translate.instant('SOLICITAR.ERROR_GUARDAR'))
    });
  }
}
