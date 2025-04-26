import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { VideoService, VideoReq } from '../../servicios/video.service';
import { IdiomaService }           from '../../servicios/idioma.service';

@Component({
  selector: 'app-video-presentacion',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, TranslateModule ],
  templateUrl: './video-presentacion.component.html',
  styleUrls: ['./video-presentacion.component.css']
})
export class VideoPresentacionComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  videoUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private videoService: VideoService,
    private idiomaService: IdiomaService
  ) {}

  ngOnInit() {
    // Creamos el formGroup y sus controles
    this.form = this.fb.group({
      avatar: ['grace'],
      script: ['']
    });

    // Opcional: precargar script si vienes de sesión
    const stored = sessionStorage.getItem('cursoGenerado');
    if (stored) {
      const c = JSON.parse(stored);
      this.form.patchValue({ script: c.contenido });
    }
  }

  generar() {
    const script = this.form.value.script?.trim();
    if (!script) return;
    this.loading = true;
    this.videoUrl = null;

    const lang = this.idiomaService.getIdioma() === 'es' ? 'es-ES' : 'en-US';
    const payload: VideoReq = {
      avatar_id: this.form.value.avatar,
      script,
      language: lang
    };

    this.videoService.generarVideo(payload).subscribe({
      next: res => {
        this.videoUrl = res.videoUrl;
        this.loading = false;
      },
      error: () => {
        alert('❌ Error generando vídeo');
        this.loading = false;
      }
    });
  }
}
