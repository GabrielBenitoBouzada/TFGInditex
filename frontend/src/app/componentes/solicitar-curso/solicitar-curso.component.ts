import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CursosService } from '../../servicios/cursos.service';
import { VideoService, StatusResp } from '../../servicios/video.service';
import { IdiomaService } from '../../servicios/idioma.service';
import { timer, of } from 'rxjs';
import { switchMap, filter, take, catchError } from 'rxjs/operators';

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
  audioBase64 = '';
  cursoGenerado = false;
  formatoSeleccionado = 'texto';
  videoId: string | null = null;
  videoUrl: string | null = null;
  loadingVideo = false;
  email = '';
  cursosRecomendados: any[] = [];
  tituloCursoGenerado = '';
  cursoGuardado = false;
  errorGuardar = false;
  cargandoGuardar = false;

  constructor(
    private fb: FormBuilder,
    private cursoSvc: CursosService,
    private videoSvc: VideoService,
    private idiomaService: IdiomaService,
    private translate: TranslateService,
    private router: Router
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
    this.fetchRecomendados();
  }

  private fetchRecomendados() {
    this.cursoSvc.obtenerCursosRecomendados(this.email)
      .subscribe({
        next: data => this.cursosRecomendados = data.cursos || [],
        error: () => this.cursosRecomendados = []
      });
  }

  verRecomendado(curso: any) {
    this.router.navigate(['/home/curso', curso._id], {
      state: { recomendado: true }
    });
  }

  generarCurso() {
    const d = this.formulario.value;
    this.formatoSeleccionado = d.formato;
    this.cursoContenido = '';
    this.audioBase64 = '';
    this.videoUrl = null;
    this.videoId = null;
    this.tituloCursoGenerado = '';
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
        this.tituloCursoGenerado = res.tituloCurso || 'Curso Formativo';

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
        this.cursoContenido = res.cursoTexto;
        this.videoId = res.videoId;
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
      if (st?.status === 'completed') {
        this.videoUrl = st.videoUrl || null;
      }
      this.loadingVideo = false;
      this.cursoGenerado = true;
    });
  }

  guardarCurso() {
    this.cargandoGuardar = true;
    const curso: any = {
      tema: this.formulario.value.tema,
      necesidades: this.formulario.value.necesidades,
      formato: this.formatoSeleccionado,
      contenido: this.cursoContenido,
      tituloCurso: this.tituloCursoGenerado
    };

    if (this.videoId) {
      curso.videoId = this.videoId;
    }

    this.cursoSvc.guardarCurso(this.email, curso).subscribe({
      next: () => {
        this.cursoGuardado = true;
        this.cargandoGuardar = false;
        setTimeout(() => this.cursoGuardado = false, 4000);
      },
      error: () => {
        this.errorGuardar = true;
        this.cargandoGuardar = false;
        setTimeout(() => this.errorGuardar = false, 4000);
      }
    });
  }
}
